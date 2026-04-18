import { Schema, model, Document } from 'mongoose';

export interface IGameRecord extends Document {
  gameId: string;
  winnerId: number;
  loserId: number;
  winnerName: string;
  loserName: string;
  bet: number;
  durationSeconds: number;
  totalMoves: number;
  aiDifficulty?: number;
  forcedOutcome: boolean;
  createdAt: Date;
}

const GameRecordSchema = new Schema<IGameRecord>({
  gameId: { type: String, required: true },
  winnerId: { type: Number, required: true },
  loserId: { type: Number, required: true },
  winnerName: { type: String, required: true },
  loserName: { type: String, required: true },
  bet: { type: Number, required: true },
  durationSeconds: { type: Number, default: 0 },
  totalMoves: { type: Number, default: 0 },
  aiDifficulty: { type: Number },
  forcedOutcome: { type: Boolean, default: false },
}, { timestamps: true });

export const GameRecord = model<IGameRecord>('GameRecord', GameRecordSchema);
