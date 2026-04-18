import { Server, Socket } from 'socket.io';
import { DurakGame } from '../game/DurakGame';
import { AIPlayer } from '../game/AIPlayer';
import { Player } from '../models/Player';
import { GameRecord } from '../models/GameRecord';

interface AuthSocket extends Socket {
  playerId?: string;
  telegramId?: number;
  playerName?: string;
}

interface ActiveRoom {
  game: DurakGame;
  sockets: Map<string, AuthSocket>;
  names: Map<string, string>;
  ai?: AIPlayer;
  aiDifficulty?: number;
}

const rooms = new Map<string, ActiveRoom>();
const pvpQueue: { socket: AuthSocket; bet: number }[] = [];

const GLOBAL_AI_DIFFICULTY = { value: 65 };
export function setGlobalDifficulty(v: number) { GLOBAL_AI_DIFFICULTY.value = v; }
export function getGlobalDifficulty() { return GLOBAL_AI_DIFFICULTY.value; }

async function getEffectiveDifficulty(telegramId: number, streak: { losses: number; wins: number }): Promise<number> {
  let base = GLOBAL_AI_DIFFICULTY.value;

  const player = await Player.findOne({ telegramId });
  if (!player) return base;

  if (player.aiDifficultyOverride != null) {
    base = player.aiDifficultyOverride;
  }

  // Addiction algorithm: soften AI after consecutive losses
  if (streak.losses >= (player.protectedStreak || 3)) {
    base = Math.max(10, base - 30);
  }
  // Tighten AI after consecutive wins (house edge)
  if (streak.wins >= 4) {
    base = Math.min(95, base + 20);
  }
  // Low balance boost (keep them playing)
  if (player.balance <= 20) {
    base = Math.max(15, base - 15);
  }

  return Math.max(0, Math.min(100, base));
}

async function runAITurn(roomId: string) {
  const room = rooms.get(roomId);
  if (!room || !room.ai) return;
  const game = room.game;

  await delay(700 + Math.random() * 800);

  const phase = game.getPhase();
  if (phase === 'finished') return;

  if (phase === 'attack' && game.getAttackerId() === 'ai') {
    // Check if should pass first
    if (game.canAddMore('ai')) {
      const card = room.ai.chooseAttackCard(
        game.getHand('ai'), game.getStateFor('ai', room.names).table, game.getStateFor('ai', room.names).trumpSuit
      );
      if (!card || room.ai.shouldPassAttack(game.getHand('ai'), game.getStateFor('ai', room.names).table, game.getHand(game.getDefenderId()).length)) {
        game.passAttack('ai');
        broadcastState(roomId);
        if (game.getPhase() === 'finished') { await endGame(roomId); return; }
        // Now player attacks — wait
        return;
      }
      game.attack('ai', card.id);
      broadcastState(roomId);
      await delay(300);
    } else if (game.getStateFor('ai', room.names).table.length === 0) {
      const card = room.ai.chooseAttackCard(game.getHand('ai'), [], game.getStateFor('ai', room.names).trumpSuit);
      if (card) {
        game.attack('ai', card.id);
        broadcastState(roomId);
      }
    } else {
      game.passAttack('ai');
      broadcastState(roomId);
      if (game.getPhase() === 'finished') { await endGame(roomId); return; }
    }
  } else if (phase === 'defend' && game.getDefenderId() === 'ai') {
    const state = game.getStateFor('ai', room.names);
    const undefended = state.table.filter(p => !p.defense);

    if (room.ai.shouldTake(game.getHand('ai'), state.table, state.trumpSuit)) {
      game.takeCards('ai');
      broadcastState(roomId);
      if (game.getPhase() === 'finished') { await endGame(roomId); return; }
      await delay(500);
      await runAITurn(roomId);
      return;
    }

    // Defend each unbeaten card
    for (const pair of undefended) {
      const defCard = room.ai.chooseDefenseCard(game.getHand('ai'), pair.attack, state.trumpSuit);
      if (!defCard) {
        // Can't beat — take all
        game.takeCards('ai');
        broadcastState(roomId);
        if (game.getPhase() === 'finished') { await endGame(roomId); return; }
        await delay(400);
        await runAITurn(roomId);
        return;
      }
      game.defend('ai', defCard.id, pair.attack.id);
      broadcastState(roomId);
      await delay(400);
    }

    // All defended — AI should pass attack now
    if (game.getPhase() === 'attack' && game.getAttackerId() === 'ai') {
      await delay(400);
      await runAITurn(roomId);
    }
  } else if (phase === 'attack' && game.getAttackerId() === 'ai' && game.canAddMore('ai')) {
    await runAITurn(roomId);
  }
}

function broadcastState(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  for (const [pid, sock] of room.sockets) {
    sock.emit('game_update', room.game.getStateFor(pid, room.names));
  }
}

async function endGame(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const game = room.game;
  const winner = game.getWinner();
  const loser = game.getLoser();
  const bet = game.getBet();

  // Update human player stats
  for (const [pid, sock] of room.sockets) {
    if (!sock.telegramId) continue;
    const isWinner = pid === winner;
    const balanceChange = isWinner ? bet : -bet;

    const player = await Player.findOneAndUpdate(
      { telegramId: sock.telegramId },
      {
        $inc: {
          balance: balanceChange,
          wins: isWinner ? 1 : 0,
          losses: isWinner ? 0 : 1,
          gamesPlayed: 1,
          totalWagered: bet,
          consecutiveLosses: isWinner ? 0 : 1,
          consecutiveWins: isWinner ? 1 : 0,
        },
        $set: {
          lastActive: new Date(),
          ...(isWinner ? { consecutiveLosses: 0 } : { consecutiveWins: 0 }),
        }
      },
      { new: true }
    );

    const safeBalance = (player?.balance ?? 0) < 10
      ? await Player.findOneAndUpdate({ telegramId: sock.telegramId }, { $inc: { balance: 10 } }, { new: true }).then(p => p?.balance ?? 10)
      : player?.balance ?? 0;

    sock.emit('game_over', {
      winner,
      loser,
      balanceChange,
      newBalance: Math.max(0, safeBalance),
      winnerName: room.names.get(winner ?? '') ?? 'Unknown',
      loserName: room.names.get(loser ?? '') ?? 'Unknown',
    });
  }

  // Save game record
  if (winner && loser) {
    const winnerTid = [...room.sockets.entries()].find(([id]) => id === winner)?.[1].telegramId ?? 0;
    const loserTid = [...room.sockets.entries()].find(([id]) => id === loser)?.[1].telegramId ?? 0;
    await GameRecord.create({
      gameId: game.getId(),
      winnerId: winnerTid,
      loserId: loserTid,
      winnerName: room.names.get(winner) ?? 'AI',
      loserName: room.names.get(loser) ?? 'AI',
      bet,
      durationSeconds: game.getDuration(),
      totalMoves: game.getMoves(),
      aiDifficulty: room.aiDifficulty,
      forcedOutcome: false,
    });
  }

  rooms.delete(roomId);
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function setupSocket(io: Server) {
  io.on('connection', (socket: AuthSocket) => {
    socket.on('auth', async (data: { telegramId: number; firstName: string; username: string }) => {
      if (!data.telegramId) { socket.emit('error', { message: 'Invalid auth' }); return; }

      let player = await Player.findOne({ telegramId: data.telegramId });
      if (!player) {
        player = await Player.create({
          telegramId: data.telegramId,
          firstName: data.firstName,
          username: data.username ?? '',
        });
      } else {
        player.lastActive = new Date();
        if (data.firstName) player.firstName = data.firstName;
        await player.save();
      }

      if (player.isBanned) { socket.emit('error', { message: 'You are banned' }); return; }

      socket.playerId = `tg_${data.telegramId}`;
      socket.telegramId = data.telegramId;
      socket.playerName = data.firstName;

      socket.emit('authenticated', {
        player: {
          id: socket.playerId,
          name: player.firstName,
          balance: player.balance,
          wins: player.wins,
          losses: player.losses,
          gamesPlayed: player.gamesPlayed,
        }
      });
    });

    socket.on('join_ai_game', async (data: { bet: number }) => {
      if (!socket.playerId || !socket.telegramId) { socket.emit('error', { message: 'Not authenticated' }); return; }

      const bet = Math.max(10, Math.min(data.bet ?? 10, 500));
      const player = await Player.findOne({ telegramId: socket.telegramId });
      if (!player || player.balance < bet) {
        socket.emit('error', { message: 'Insufficient balance' }); return;
      }

      const difficulty = await getEffectiveDifficulty(socket.telegramId, {
        losses: player.consecutiveLosses,
        wins: player.consecutiveWins,
      });

      const playerId = socket.playerId;
      const game = new DurakGame([playerId, 'ai'], bet);
      const ai = new AIPlayer(difficulty);

      const names = new Map<string, string>([
        [playerId, player.firstName],
        ['ai', '🤖 Bot'],
      ]);

      const roomId = game.getId();
      rooms.set(roomId, { game, sockets: new Map([[playerId, socket]]), names, ai, aiDifficulty: difficulty });

      socket.join(roomId);
      socket.emit('game_start', game.getStateFor(playerId, names));

      // If AI attacks first, run AI turn
      if (game.getAttackerId() === 'ai') {
        await runAITurn(roomId);
      }
    });

    socket.on('join_pvp_lobby', (data: { bet: number }) => {
      if (!socket.playerId) { socket.emit('error', { message: 'Not authenticated' }); return; }
      const bet = Math.max(10, Math.min(data.bet ?? 10, 500));

      const existingIdx = pvpQueue.findIndex(q => q.bet === bet);
      if (existingIdx !== -1) {
        const opponent = pvpQueue.splice(existingIdx, 1)[0];
        if (opponent.socket.id === socket.id) { pvpQueue.push({ socket, bet }); return; }

        const p1id = opponent.socket.playerId!;
        const p2id = socket.playerId!;
        const game = new DurakGame([p1id, p2id], bet);
        const names = new Map<string, string>([
          [p1id, opponent.socket.playerName ?? 'Player 1'],
          [p2id, socket.playerName ?? 'Player 2'],
        ]);

        const roomId = game.getId();
        rooms.set(roomId, { game, sockets: new Map([[p1id, opponent.socket], [p2id, socket]]), names });

        opponent.socket.join(roomId);
        socket.join(roomId);

        opponent.socket.emit('game_start', game.getStateFor(p1id, names));
        socket.emit('game_start', game.getStateFor(p2id, names));
      } else {
        pvpQueue.push({ socket, bet });
        socket.emit('waiting', { message: 'Waiting for opponent...' });
      }
    });

    socket.on('attack', async (data: { gameId: string; cardId: string }) => {
      const room = rooms.get(data.gameId);
      if (!room || !socket.playerId) return;
      const result = room.game.attack(socket.playerId, data.cardId);
      if (!result.ok) { socket.emit('error', { message: result.error }); return; }
      broadcastState(data.gameId);
      if (room.game.getPhase() === 'finished') { await endGame(data.gameId); return; }
      if (room.ai && room.game.getDefenderId() === 'ai') await runAITurn(data.gameId);
    });

    socket.on('defend', async (data: { gameId: string; cardId: string; targetId: string }) => {
      const room = rooms.get(data.gameId);
      if (!room || !socket.playerId) return;
      const result = room.game.defend(socket.playerId, data.cardId, data.targetId);
      if (!result.ok) { socket.emit('error', { message: result.error }); return; }
      broadcastState(data.gameId);
      if (room.game.getPhase() === 'finished') { await endGame(data.gameId); return; }
      // After all defended, check if attacker is AI
      if (room.ai && room.game.getAttackerId() === 'ai') await runAITurn(data.gameId);
    });

    socket.on('take', async (data: { gameId: string }) => {
      const room = rooms.get(data.gameId);
      if (!room || !socket.playerId) return;
      const result = room.game.takeCards(socket.playerId);
      if (!result.ok) { socket.emit('error', { message: result.error }); return; }
      broadcastState(data.gameId);
      if (room.game.getPhase() === 'finished') { await endGame(data.gameId); return; }
      if (room.ai && room.game.getAttackerId() === 'ai') await runAITurn(data.gameId);
    });

    socket.on('pass', async (data: { gameId: string }) => {
      const room = rooms.get(data.gameId);
      if (!room || !socket.playerId) return;
      const result = room.game.passAttack(socket.playerId);
      if (!result.ok) { socket.emit('error', { message: result.error }); return; }
      broadcastState(data.gameId);
      if (room.game.getPhase() === 'finished') { await endGame(data.gameId); return; }
      if (room.ai && room.game.getAttackerId() === 'ai') await runAITurn(data.gameId);
    });

    socket.on('disconnect', () => {
      const idx = pvpQueue.findIndex(q => q.socket.id === socket.id);
      if (idx !== -1) pvpQueue.splice(idx, 1);
    });
  });
}

export function getRoomCount() { return rooms.size; }
export function getQueueCount() { return pvpQueue.length; }
