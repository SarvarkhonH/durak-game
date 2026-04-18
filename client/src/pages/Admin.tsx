import React, { useEffect, useState } from 'react';
import { adminLogin, adminDashboard, adminPlayers, adminPatchPlayer, adminPatchSettings } from '../lib/api';

interface Dashboard {
  totalPlayers: number;
  newToday: number;
  gamesToday: number;
  totalGames: number;
  totalWagered: number;
  activeGames: number;
  inQueue: number;
  aiDifficulty: number;
}

interface PlayerRow {
  telegramId: number;
  firstName: string;
  username: string;
  balance: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  consecutiveLosses: number;
  isBanned: boolean;
  aiDifficultyOverride?: number;
  forcedWinRate?: number;
  protectedStreak: number;
  lastActive: string;
}

export function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || '');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState<'dashboard' | 'players' | 'settings'>('dashboard');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [editing, setEditing] = useState<PlayerRow | null>(null);
  const [globalDiff, setGlobalDiff] = useState(65);
  const [saveMsg, setSaveMsg] = useState('');

  async function login() {
    try {
      const t = await adminLogin(password);
      setToken(t);
      localStorage.setItem('admin_token', t);
      setLoginError('');
    } catch {
      setLoginError('Неверный пароль');
    }
  }

  useEffect(() => {
    if (!token) return;
    adminDashboard(token).then(d => { setDashboard(d); setGlobalDiff(d.aiDifficulty); }).catch(() => setToken(''));
    adminPlayers(token).then(d => setPlayers(d.players)).catch(() => {});
  }, [token]);

  async function savePlayer() {
    if (!editing || !token) return;
    await adminPatchPlayer(token, editing.telegramId, {
      aiDifficultyOverride: editing.aiDifficultyOverride ?? null,
      forcedWinRate: editing.forcedWinRate ?? null,
      protectedStreak: editing.protectedStreak,
      isBanned: editing.isBanned,
      balance: editing.balance,
    });
    setPlayers(prev => prev.map(p => p.telegramId === editing.telegramId ? editing : p));
    setEditing(null);
    setSaveMsg('Сохранено!');
    setTimeout(() => setSaveMsg(''), 2000);
  }

  async function saveDifficulty() {
    if (!token) return;
    await adminPatchSettings(token, { aiDifficulty: globalDiff });
    setSaveMsg('Сложность обновлена!');
    setTimeout(() => setSaveMsg(''), 2000);
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-felt gap-4 p-8">
        <div className="text-4xl">🔐</div>
        <h1 className="text-white text-xl font-bold">Админ панель</h1>
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          className="w-full max-w-xs px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:border-gold"
        />
        {loginError && <div className="text-red-400 text-sm">{loginError}</div>}
        <button onClick={login} className="w-full max-w-xs py-3 bg-gold text-black font-bold rounded-xl">
          Войти
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-felt overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-felt-dark/80 border-b border-white/10">
        <h1 className="text-white font-bold">🎰 Админ</h1>
        {saveMsg && <span className="text-green-400 text-xs">{saveMsg}</span>}
        <button onClick={() => { setToken(''); localStorage.removeItem('admin_token'); }} className="text-white/40 text-xs">
          Выйти
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {(['dashboard', 'players', 'settings'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium transition-all ${tab === t ? 'text-gold border-b-2 border-gold' : 'text-white/50'}`}
          >
            {t === 'dashboard' ? '📊 Дашборд' : t === 'players' ? '👥 Игроки' : '⚙️ Настройки'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'dashboard' && dashboard && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Всего игроков', value: dashboard.totalPlayers },
                { label: 'Новых сегодня', value: dashboard.newToday },
                { label: 'Игр сегодня', value: dashboard.gamesToday },
                { label: 'Всего игр', value: dashboard.totalGames },
                { label: 'Активных игр', value: dashboard.activeGames },
                { label: 'В очереди', value: dashboard.inQueue },
                { label: 'Всего ставок', value: `${dashboard.totalWagered}🪙` },
                { label: 'Сложность ИИ', value: `${dashboard.aiDifficulty}%` },
              ].map(s => (
                <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
                  <div className="text-white font-bold text-xl">{s.value}</div>
                  <div className="text-white/50 text-xs">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'players' && (
          <div className="space-y-2">
            {players.map(p => (
              <div
                key={p.telegramId}
                onClick={() => setEditing({ ...p })}
                className="bg-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/10 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium text-sm flex items-center gap-1">
                      {p.isBanned && <span className="text-red-400">🚫</span>}
                      {p.firstName} {p.username ? `@${p.username}` : ''}
                    </div>
                    <div className="text-white/40 text-xs">
                      {p.wins}W / {p.losses}L · {p.consecutiveLosses} проигрышей подряд
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-gold font-bold text-sm">{p.balance}🪙</div>
                    {p.aiDifficultyOverride != null && (
                      <div className="text-blue-300 text-xs">ИИ: {p.aiDifficultyOverride}%</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-white font-semibold mb-3">🤖 Сложность ИИ (глобально)</div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={globalDiff}
                  onChange={e => setGlobalDiff(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-gold font-bold w-10 text-right">{globalDiff}%</span>
              </div>
              <div className="text-white/40 text-xs mt-1">
                0% = бот всегда проигрывает · 100% = бот непобедим
              </div>
              <button onClick={saveDifficulty} className="mt-3 w-full py-2 bg-gold text-black font-bold rounded-xl text-sm">
                Сохранить
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit player modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/80 flex items-end z-50" onClick={() => setEditing(null)}>
          <div className="w-full bg-felt-dark rounded-t-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="text-white font-bold text-lg">{editing.firstName}</div>

            <div>
              <label className="text-white/60 text-xs">Баланс монет</label>
              <input
                type="number"
                value={editing.balance}
                onChange={e => setEditing({ ...editing, balance: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-white/10 text-white rounded-xl border border-white/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-white/60 text-xs">Сложность ИИ для этого игрока (пусто = глобальная)</label>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Глобальная"
                value={editing.aiDifficultyOverride ?? ''}
                onChange={e => setEditing({ ...editing, aiDifficultyOverride: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full mt-1 px-3 py-2 bg-white/10 text-white rounded-xl border border-white/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-white/60 text-xs">Защита от серии потерь (N проигрышей → помощь)</label>
              <input
                type="number"
                min="1"
                max="20"
                value={editing.protectedStreak}
                onChange={e => setEditing({ ...editing, protectedStreak: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-white/10 text-white rounded-xl border border-white/20 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={editing.isBanned}
                onChange={e => setEditing({ ...editing, isBanned: e.target.checked })}
                id="ban"
                className="w-5 h-5"
              />
              <label htmlFor="ban" className="text-white text-sm">Заблокировать игрока</label>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setEditing(null)} className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold">
                Отмена
              </button>
              <button onClick={savePlayer} className="flex-1 py-3 bg-gold text-black rounded-xl font-bold">
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
