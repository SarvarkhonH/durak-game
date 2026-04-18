import { Router } from 'express';
import { Player } from '../models/Player';
import { GameRecord } from '../models/GameRecord';

const router = Router();

router.get('/player/:telegramId', async (req, res) => {
  const player = await Player.findOne({ telegramId: Number(req.params.telegramId) });
  if (!player) return res.status(404).json({ error: 'Not found' });
  res.json({
    id: player.telegramId,
    name: player.firstName,
    balance: player.balance,
    wins: player.wins,
    losses: player.losses,
    gamesPlayed: player.gamesPlayed,
    totalWagered: player.totalWagered,
    winRate: player.gamesPlayed > 0 ? Math.round((player.wins / player.gamesPlayed) * 100) : 0,
  });
});

router.get('/leaderboard', async (_req, res) => {
  const players = await Player.find({ gamesPlayed: { $gte: 1 } })
    .sort({ wins: -1 })
    .limit(20)
    .select('telegramId firstName username wins losses gamesPlayed balance');
  res.json(players.map(p => ({
    id: p.telegramId,
    name: p.firstName,
    wins: p.wins,
    losses: p.losses,
    gamesPlayed: p.gamesPlayed,
    balance: p.balance,
    winRate: p.gamesPlayed > 0 ? Math.round((p.wins / p.gamesPlayed) * 100) : 0,
  })));
});

router.get('/history/:telegramId', async (req, res) => {
  const tid = Number(req.params.telegramId);
  const games = await GameRecord.find({ $or: [{ winnerId: tid }, { loserId: tid }] })
    .sort({ createdAt: -1 })
    .limit(20);
  res.json(games);
});

export default router;
