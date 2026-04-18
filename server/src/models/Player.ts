import { Schema, model, Document } from 'mongoose';

export interface IPlayer extends Document {
  telegramId: number;
  username: string;
  firstName: string;
  balance: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  consecutiveLosses: number;
  consecutiveWins: number;
  totalWagered: number;
  lastActive: Date;
  // Admin controls
  aiDifficultyOverride?: number;
  forcedWinRate?: number;
  protectedStreak: number;
  isBanned: boolean;
}

const PlayerSchema = new Schema<IPlayer>({
  telegramId: { type: Number, required: true, unique: true },
  username: { type: String, default: '' },
  firstName: { type: String, required: true },
  balance: { type: Number, default: 100 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  gamesPlayed: { type: Number, default: 0 },
  consecutiveLosses: { type: Number, default: 0 },
  consecutiveWins: { type: Number, default: 0 },
  totalWagered: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  aiDifficultyOverride: { type: Number },
  forcedWinRate: { type: Number },
  protectedStreak: { type: Number, default: 3 },
  isBanned: { type: Boolean, default: false },
}, { timestamps: true });

export const Player = model<IPlayer>('Player', PlayerSchema);
