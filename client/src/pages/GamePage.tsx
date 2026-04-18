import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../lib/socket';
import { GameState } from '../types';
import { OpponentHand } from '../components/OpponentHand';
import { TableCards } from '../components/TableCards';
import { PlayerHand } from '../components/PlayerHand';
import { TrumpCard } from '../components/TrumpCard';
import { GameResult } from '../components/GameResult';
import { useTelegram } from '../hooks/useTelegram';

interface GameOverData {
  winner: string;
  loser: string;
  balanceChange: number;
  newBalance: number;
  winnerName: string;
  loserName: string;
}

export function GamePage() {
  const navigate = useNavigate();
  const { haptic } = useTelegram();
  const [game, setGame] = useState<GameState | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [defenseTarget, setDefenseTarget] = useState<string | null>(null);
  const [result, setResult] = useState<GameOverData | null>(null);
  const [message, setMessage] = useState('');
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    socket.on('game_start', (state: GameState) => {
      setGame(state);
      setWaiting(false);
      setMessage('');
    });

    socket.on('game_update', (state: GameState) => {
      setGame(state);
      setSelectedCard(null);
      setDefenseTarget(null);
    });

    socket.on('game_over', (data: GameOverData) => {
      setGame(null);
      setResult(data);
      if (data.balanceChange > 0) haptic.success();
      else haptic.error();
    });

    socket.on('waiting', ({ message: msg }: { message: string }) => {
      setWaiting(true);
      setMessage(msg);
    });

    socket.on('error', ({ message: msg }: { message: string }) => {
      setMessage(msg);
      setTimeout(() => setMessage(''), 2000);
    });

    return () => {
      socket.off('game_start');
      socket.off('game_update');
      socket.off('game_over');
      socket.off('waiting');
      socket.off('error');
    };
  }, []);

  const handleCardSelect = useCallback((cardId: string) => {
    if (!game) return;
    const isMyAttack = game.phase === 'attack' && game.myId === game.players.find(p => p.isAttacker)?.id;
    const isMyDefend = game.phase === 'defend' && game.myId === game.players.find(p => p.isDefender)?.id;

    if (isMyAttack) {
      if (selectedCard === cardId) {
        // Play the card
        socket.emit('attack', { gameId: game.id, cardId });
        setSelectedCard(null);
      } else {
        setSelectedCard(cardId);
        haptic.impact('light');
      }
    } else if (isMyDefend) {
      if (!defenseTarget) {
        setMessage('Сначала выбери карту противника');
        setTimeout(() => setMessage(''), 1500);
        return;
      }
      // Defend selected target with this card
      socket.emit('defend', { gameId: game.id, cardId, targetId: defenseTarget });
      setSelectedCard(null);
      setDefenseTarget(null);
    }
  }, [game, selectedCard, defenseTarget, haptic]);

  const handleTargetSelect = useCallback((targetId: string) => {
    setDefenseTarget(targetId);
    haptic.impact('light');
    setMessage('Теперь выбери карту для защиты');
    setTimeout(() => setMessage(''), 1500);
  }, [haptic]);

  const handleTake = () => {
    if (!game) return;
    socket.emit('take', { gameId: game.id });
  };

  const handlePass = () => {
    if (!game) return;
    socket.emit('pass', { gameId: game.id });
  };

  if (result) {
    const isWinner = result.balanceChange > 0;
    return (
      <GameResult
        isWinner={isWinner}
        balanceChange={result.balanceChange}
        newBalance={result.newBalance}
        winnerName={result.winnerName}
        loserName={result.loserName}
        onPlayAgain={() => { setResult(null); navigate('/'); }}
        onHome={() => { setResult(null); navigate('/'); }}
      />
    );
  }

  if (waiting || !game) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-felt gap-4">
        <div className="text-5xl animate-spin">🃏</div>
        <div className="text-white font-semibold text-lg">{message || 'Загрузка...'}</div>
        <button onClick={() => navigate('/')} className="text-white/50 text-sm underline mt-4">
          Отмена
        </button>
      </div>
    );
  }

  const opponent = game.players.find(p => p.id !== game.myId);
  const me = game.players.find(p => p.id === game.myId);
  const isMyTurn =
    (game.phase === 'attack' && me?.isAttacker) ||
    (game.phase === 'defend' && me?.isDefender);
  const isMyAttack = game.phase === 'attack' && me?.isAttacker;
  const isMyDefend = game.phase === 'defend' && me?.isDefender;

  return (
    <div className="flex flex-col h-full bg-felt overflow-hidden select-none">
      {/* Opponent */}
      <div className="bg-felt-dark/50 border-b border-white/10 px-2">
        {opponent && (
          <OpponentHand
            cardCount={opponent.cardCount}
            name={opponent.name}
            isAttacker={opponent.isAttacker}
            isDefender={opponent.isDefender}
          />
        )}
      </div>

      {/* Game info bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-black/20">
        <TrumpCard trumpCard={game.trumpCard} deckCount={game.deckCount} />
        <div className="flex flex-col items-center">
          <div className="text-white/60 text-xs">Ставка</div>
          <div className="text-gold font-bold">{game.bet}🪙</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-white/60 text-xs">
            {isMyTurn ? '🟢 Ваш ход' : '⏳ Ждём...'}
          </div>
          <div className="text-white text-xs">
            {isMyAttack ? 'Атакуйте' : isMyDefend ? 'Защищайтесь' : me?.isAttacker ? 'Можно добить' : ''}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 border-y border-white/10 bg-felt-dark/30">
        <TableCards
          table={game.table}
          selectedDefenseTarget={defenseTarget ?? undefined}
          onSelectTarget={isMyDefend ? handleTargetSelect : undefined}
          isDefender={isMyDefend}
        />
      </div>

      {/* Error/hint message */}
      {message && (
        <div className="bg-red-900/80 text-white text-center text-sm py-1 px-4">
          {message}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 px-3 py-2 bg-black/20 border-t border-white/10">
        {isMyDefend && (
          <button
            onClick={handleTake}
            className="flex-1 py-3 bg-red-700 text-white font-bold rounded-xl text-sm active:scale-95 transition-all"
          >
            📥 Взять карты
          </button>
        )}
        {isMyAttack && game.canPass && (
          <button
            onClick={handlePass}
            className="flex-1 py-3 bg-green-700 text-white font-bold rounded-xl text-sm active:scale-95 transition-all"
          >
            ✅ Бито
          </button>
        )}
        {!isMyTurn && (
          <div className="flex-1 py-3 text-center text-white/40 text-sm">
            Ожидаем ход противника...
          </div>
        )}
      </div>

      {/* Player hand */}
      <div className="bg-felt-dark/50 border-t border-white/10">
        <div className="text-center text-white/60 text-xs pt-1">
          {me?.isAttacker ? '⚔️ Вы атакуете' : me?.isDefender ? '🛡️ Вы защищаетесь' : ''}
          {' '}· {me?.cardCount ?? 0} карт
        </div>
        <PlayerHand
          cards={game.myCards}
          selectedIds={selectedCard ? [selectedCard] : []}
          onSelect={handleCardSelect}
          disabled={!isMyTurn}
        />
      </div>
    </div>
  );
}
