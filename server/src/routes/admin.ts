import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Player } from '../models/Player';
import { GameRecord } from '../models/GameRecord';
import { getRoomCount, getQueueCount, setGlobalDifficulty, getGlobalDifficulty, getActiveRooms } from '../socket/handler';
import { broadcastToAll, sendReEngagementMessages } from '../bot';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

router.post('/login', (req: Request, res: Response) => {
  if (req.body.password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Wrong password' });
  }
  const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  try {
    jwt.verify(header.replace('Bearer ', ''), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

router.get('/dashboard', auth, async (_req, res) => {
  const totalPlayers = await Player.countDocuments();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const newToday = await Player.countDocuments({ createdAt: { $gte: today } });
  const gamesToday = await GameRecord.countDocuments({ createdAt: { $gte: today } });
  const totalGames = await GameRecord.countDocuments();
  const totalWagered = await GameRecord.aggregate([{ $group: { _id: null, total: { $sum: '$bet' } } }]);

  res.json({
    totalPlayers,
    newToday,
    gamesToday,
    totalGames,
    totalWagered: totalWagered[0]?.total ?? 0,
    activeGames: getRoomCount(),
    inQueue: getQueueCount(),
    aiDifficulty: getGlobalDifficulty(),
  });
});

router.get('/players', auth, async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = 50;
  const players = await Player.find()
    .sort({ lastActive: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  const total = await Player.countDocuments();
  res.json({ players, total, page });
});

router.patch('/player/:telegramId', auth, async (req, res) => {
  const { aiDifficultyOverride, forcedWinRate, protectedStreak, isBanned, balance } = req.body;
  const update: Record<string, unknown> = {};
  if (aiDifficultyOverride !== undefined) update.aiDifficultyOverride = aiDifficultyOverride === null ? undefined : Number(aiDifficultyOverride);
  if (forcedWinRate !== undefined) update.forcedWinRate = forcedWinRate === null ? undefined : Number(forcedWinRate);
  if (protectedStreak !== undefined) update.protectedStreak = Number(protectedStreak);
  if (isBanned !== undefined) update.isBanned = Boolean(isBanned);
  if (balance !== undefined) update.balance = Number(balance);

  const player = await Player.findOneAndUpdate(
    { telegramId: Number(req.params.telegramId) },
    { $set: update },
    { new: true }
  );
  if (!player) return res.status(404).json({ error: 'Not found' });
  res.json(player);
});

router.patch('/settings', auth, (req, res) => {
  const { aiDifficulty } = req.body;
  if (aiDifficulty !== undefined) setGlobalDifficulty(Number(aiDifficulty));
  res.json({ aiDifficulty: getGlobalDifficulty() });
});

router.get('/games', auth, async (req, res) => {
  const page = Number(req.query.page) || 1;
  const games = await GameRecord.find().sort({ createdAt: -1 }).skip((page - 1) * 50).limit(50);
  const total = await GameRecord.countDocuments();
  res.json({ games, total });
});

// Live active rooms — polled by admin panel every 5s
router.get('/active-games', auth, (_req, res) => {
  res.json({ rooms: getActiveRooms(), queue: getQueueCount() });
});

// ── Revenue analytics ─────────────────────────────────────────────────────
router.get('/revenue', auth, async (_req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const week = new Date(Date.now() - 7 * 24 * 3600 * 1000); week.setHours(0, 0, 0, 0);

  // AI game: winnerId=0 → AI won (house wins), loserId=0 → player won (house pays)
  const [houseWinsAgg, playerWinsAgg, todayHouseAgg, dailyAgg, modeAgg, avgDurAgg, topPlayersAgg] =
    await Promise.all([
      GameRecord.aggregate([{ $match: { winnerId: 0 } }, { $group: { _id: null, total: { $sum: '$bet' }, count: { $sum: 1 } } }]),
      GameRecord.aggregate([{ $match: { loserId: 0 } }, { $group: { _id: null, total: { $sum: '$bet' }, count: { $sum: 1 } } }]),
      GameRecord.aggregate([{ $match: { winnerId: 0, createdAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$bet' } } }]),
      GameRecord.aggregate([
        { $match: { winnerId: 0, createdAt: { $gte: week } } },
        { $group: { _id: { $dateToString: { format: '%d.%m', date: '$createdAt' } }, total: { $sum: '$bet' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      GameRecord.aggregate([{ $group: { _id: '$gameMode', count: { $sum: 1 } } }]),
      GameRecord.aggregate([{ $group: { _id: null, avgDuration: { $avg: '$durationSeconds' }, avgMoves: { $avg: '$totalMoves' } } }]),
      Player.find({ gamesPlayed: { $gte: 5 } }).sort({ totalWagered: -1 }).limit(5).select('firstName username totalWagered wins losses gamesPlayed'),
    ]);

  const houseTotal = houseWinsAgg[0]?.total ?? 0;
  const houseCount = houseWinsAgg[0]?.count ?? 0;
  const playerTotal = playerWinsAgg[0]?.total ?? 0;
  const playerCount = playerWinsAgg[0]?.count ?? 0;
  const totalGames = houseCount + playerCount;

  res.json({
    houseTotal,
    playerTotal,
    netRevenue: houseTotal - playerTotal,
    houseWinRate: totalGames > 0 ? Math.round((houseCount / totalGames) * 100) : 0,
    avgBet: totalGames > 0 ? Math.round((houseTotal + playerTotal) / totalGames) : 0,
    todayRevenue: todayHouseAgg[0]?.total ?? 0,
    daily: dailyAgg,
    gameModes: modeAgg,
    avgDuration: Math.round(avgDurAgg[0]?.avgDuration ?? 0),
    avgMoves: Math.round(avgDurAgg[0]?.avgMoves ?? 0),
    topPlayers: topPlayersAgg,
    totalAIGames: totalGames,
  });
});

// ── Bot broadcast ──────────────────────────────────────────────────────────
router.post('/broadcast', auth, async (req, res) => {
  const { message, activeDays } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Empty message' });

  // Count targets first (quick)
  const cutoff = new Date(Date.now() - (activeDays ?? 30) * 24 * 3600 * 1000);
  const total = await Player.countDocuments({ lastActive: { $gte: cutoff }, isBanned: { $ne: true } });

  // Fire-and-forget background send
  broadcastToAll(message, activeDays ?? 30).catch(console.error);

  res.json({ ok: true, total, message: `Рассылка ${total} игрокам запущена` });
});

// ── Re-engagement trigger ──────────────────────────────────────────────────
router.post('/re-engage', auth, async (_req, res) => {
  const count = await sendReEngagementMessages().catch(() => 0);
  res.json({ ok: true, sent: count });
});

export default router;
