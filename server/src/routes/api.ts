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

const BONUS_AMOUNT = 50;
const BONUS_INTERVAL_MS = 24 * 3600 * 1000; // 24 hours

router.get('/bonus/:telegramId', async (req, res) => {
  const player = await Player.findOne({ telegramId: Number(req.params.telegramId) });
  if (!player) return res.status(404).json({ error: 'Not found' });
  const now = Date.now();
  const lastClaim = player.lastBonusClaim?.getTime() ?? 0;
  const elapsed = now - lastClaim;
  const available = elapsed >= BONUS_INTERVAL_MS;
  res.json({ available, nextAt: available ? null : lastClaim + BONUS_INTERVAL_MS, amount: BONUS_AMOUNT });
});

router.post('/bonus/:telegramId', async (req, res) => {
  const player = await Player.findOne({ telegramId: Number(req.params.telegramId) });
  if (!player) return res.status(404).json({ error: 'Not found' });
  const now = Date.now();
  const lastClaim = player.lastBonusClaim?.getTime() ?? 0;
  if (now - lastClaim < BONUS_INTERVAL_MS) {
    return res.status(400).json({ error: 'Bonus not ready', nextAt: lastClaim + BONUS_INTERVAL_MS });
  }
  player.balance += BONUS_AMOUNT;
  player.lastBonusClaim = new Date();
  await player.save();
  res.json({ success: true, newBalance: player.balance, amount: BONUS_AMOUNT });
});

export default router;
