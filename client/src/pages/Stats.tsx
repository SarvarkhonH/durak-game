import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerData } from '../types';
import { fetchLeaderboard, fetchHistory } from '../lib/api';

interface Props {
  player: PlayerData | null;
}

interface LeaderEntry {
  id: number;
  name: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  balance: number;
  winRate: number;
}

interface GameHistoryEntry {
  _id: string;
  winnerId: number;
  loserId: number;
  winnerName: string;
  loserName: string;
  bet: number;
  durationSeconds: number;
  createdAt: string;
}

export function Stats({ player }: Props) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'personal' | 'leaderboard'>('personal');
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);

  useEffect(() => {
    fetchLeaderboard().then(setLeaderboard).catch(() => {});
    if (player) fetchHistory(Number(player.id.replace('tg_', ''))).then(setHistory).catch(() => {});
  }, [player]);

  return (
    <div className="flex flex-col h-full bg-felt overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-felt-dark/50 border-b border-white/10">
        <button onClick={() => navigate('/')} className="text-white/70 text-xl">←</button>
        <h1 className="text-white font-bold text-lg">Статистика</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setTab('personal')}
          className={`flex-1 py-3 text-sm font-medium transition-all ${tab === 'personal' ? 'text-gold border-b-2 border-gold' : 'text-white/50'}`}
        >
          Мои игры
        </button>
        <button
          onClick={() => setTab('leaderboard')}
          className={`flex-1 py-3 text-sm font-medium transition-all ${tab === 'leaderboard' ? 'text-gold border-b-2 border-gold' : 'text-white/50'}`}
        >
          🏆 Рейтинг
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'personal' && player && (
          <div className="p-4 space-y-4">
            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Баланс', value: `${player.balance} 🪙`, color: 'text-gold' },
                { label: 'Побед', value: player.wins, color: 'text-green-400' },
                { label: 'Поражений', value: player.losses, color: 'text-red-400' },
                { label: 'Всего игр', value: player.gamesPlayed, color: 'text-white' },
              ].map(s => (
                <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-white/50 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            {player.gamesPlayed > 0 && (
              <div className="bg-white/10 rounded-xl p-3">
                <div className="text-white/60 text-xs mb-1">Процент побед</div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-gold rounded-full transition-all"
                    style={{ width: `${Math.round((player.wins / player.gamesPlayed) * 100)}%` }}
                  />
                </div>
                <div className="text-right text-white/60 text-xs mt-1">
                  {Math.round((player.wins / player.gamesPlayed) * 100)}%
                </div>
              </div>
            )}

            {/* History */}
            <div>
              <div className="text-white/60 text-xs font-semibold mb-2">ИСТОРИЯ ИГР</div>
              {history.length === 0 ? (
                <div className="text-white/30 text-sm text-center py-4">Игр пока нет</div>
              ) : (
                <div className="space-y-2">
                  {history.map(g => {
                    const myId = Number(player.id.replace('tg_', ''));
                    const won = g.winnerId === myId;
                    return (
                      <div key={g._id} className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <div className={`font-semibold text-sm ${won ? 'text-green-400' : 'text-red-400'}`}>
                            {won ? '🏆 Победа' : '😵 Поражение'}
                          </div>
                          <div className="text-white/40 text-xs">
                            vs {won ? g.loserName : g.winnerName} · {Math.round(g.durationSeconds / 60)}мин
                          </div>
                        </div>
                        <div className={`font-bold ${won ? 'text-green-400' : 'text-red-400'}`}>
                          {won ? '+' : '-'}{g.bet}🪙
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'leaderboard' && (
          <div className="p-4">
            {leaderboard.length === 0 ? (
              <div className="text-white/30 text-sm text-center py-8">Пусто</div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((p, i) => (
                  <div key={p.id} className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
                    <div className={`text-lg font-bold w-7 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-white/40'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold text-sm">{p.name}</div>
                      <div className="text-white/40 text-xs">{p.wins}П / {p.losses}П · {p.winRate}%</div>
                    </div>
                    <div className="text-gold font-bold">{p.balance}🪙</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
