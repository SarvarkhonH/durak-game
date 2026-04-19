import React, { useEffect, useState, useRef } from 'react';
import {
  adminLogin, adminDashboard, adminPlayers, adminPatchPlayer,
  adminPatchSettings, adminActiveGames, ActiveRoom,
} from '../lib/api';

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
  consecutiveWins: number;
  isBanned: boolean;
  aiDifficultyOverride?: number;
  protectedStreak: number;
  lastActive: string;
}

type Tab = 'dashboard' | 'live' | 'players' | 'settings';

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || '');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState<Tab>('dashboard');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<PlayerRow | null>(null);
  const [globalDiff, setGlobalDiff] = useState(65);
  const [saveMsg, setSaveMsg] = useState('');
  const [liveRooms, setLiveRooms] = useState<ActiveRoom[]>([]);
  const [liveQueue, setLiveQueue] = useState(0);
  const liveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  async function login() {
    try {
      const t = await adminLogin(password);
      setToken(t);
      localStorage.setItem('admin_token', t);
    } catch {
      setLoginError('Неверный пароль');
    }
  }

  useEffect(() => {
    if (!token) return;
    adminDashboard(token)
      .then(d => { setDashboard(d); setGlobalDiff(d.aiDifficulty); })
      .catch(() => { setToken(''); localStorage.removeItem('admin_token'); });
    adminPlayers(token).then(d => setPlayers(d.players)).catch(() => {});
  }, [token]);

  // Live games polling — every 5s when on live tab
  useEffect(() => {
    if (!token || tab !== 'live') return;
    function refresh() {
      adminActiveGames(token).then(d => { setLiveRooms(d.rooms); setLiveQueue(d.queue); }).catch(() => {});
    }
    refresh();
    liveTimer.current = setInterval(refresh, 5000);
    return () => { if (liveTimer.current) clearInterval(liveTimer.current); };
  }, [token, tab]);

  async function savePlayer() {
    if (!editing || !token) return;
    await adminPatchPlayer(token, editing.telegramId, {
      aiDifficultyOverride: editing.aiDifficultyOverride ?? null,
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

  const filteredPlayers = players.filter(p =>
    !search ||
    p.firstName.toLowerCase().includes(search.toLowerCase()) ||
    (p.username && p.username.toLowerCase().includes(search.toLowerCase())) ||
    String(p.telegramId).includes(search)
  );

  // ── Login screen ──────────────────────────────────────────────────────────
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

  const TABS: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: '📊' },
    { id: 'live',      label: '🔴 Live' },
    { id: 'players',   label: '👥' },
    { id: 'settings',  label: '⚙️' },
  ];

  return (
    <div className="flex flex-col h-full bg-felt overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/30 border-b border-white/10 flex-shrink-0">
        <h1 className="text-white font-bold text-sm">🎰 Дурак — Админ</h1>
        {saveMsg && <span className="text-green-400 text-xs animate-slide-up">{saveMsg}</span>}
        <button
          onClick={() => { setToken(''); localStorage.removeItem('admin_token'); }}
          className="text-white/40 text-xs hover:text-white/70"
        >
          Выйти
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 flex-shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-all ${
              tab === t.id ? 'text-gold border-b-2 border-gold bg-white/5' : 'text-white/45'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">

        {/* ── Dashboard ── */}
        {tab === 'dashboard' && dashboard && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Всего игроков', value: dashboard.totalPlayers, icon: '👤' },
                { label: 'Новых сегодня', value: dashboard.newToday, icon: '✨' },
                { label: 'Игр сегодня',  value: dashboard.gamesToday,  icon: '🎮' },
                { label: 'Всего игр',    value: dashboard.totalGames,   icon: '📋' },
                { label: 'Активных',     value: dashboard.activeGames,  icon: '🟢' },
                { label: 'В очереди',    value: dashboard.inQueue,      icon: '⏳' },
                { label: 'Ставки всего', value: `${dashboard.totalWagered}🪙`, icon: '💰' },
                { label: 'Сложность ИИ', value: `${dashboard.aiDifficulty}%`, icon: '🤖' },
              ].map(s => (
                <div key={s.label} className="bg-white/8 rounded-2xl p-3 text-center">
                  <div className="text-lg mb-0.5">{s.icon}</div>
                  <div className="text-white font-bold text-lg leading-tight">{s.value}</div>
                  <div className="text-white/40 text-[11px] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Live Games ── */}
        {tab === 'live' && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-xs">Обновление каждые 5с</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
                <span className="text-white text-xs font-semibold">{liveRooms.length} игр · {liveQueue} в очереди</span>
              </div>
            </div>

            {liveRooms.length === 0 ? (
              <div className="text-center py-12 text-white/30 text-sm">
                Активных игр нет
              </div>
            ) : (
              liveRooms.map(room => {
                const [p1, p2] = room.players;
                const phaseLabel = room.phase === 'attack' ? '⚔️ Атака' : room.phase === 'defend' ? '🛡️ Защита' : '✅ Завершена';
                return (
                  <div key={room.roomId} className="bg-white/8 rounded-2xl p-3 space-y-2">
                    {/* Players */}
                    <div className="flex items-center justify-between">
                      <div className="text-white font-semibold text-sm">{p1?.name ?? '?'}</div>
                      <div className="text-white/40 text-xs">vs</div>
                      <div className="text-white font-semibold text-sm">{p2?.name ?? '?'}</div>
                    </div>
                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-yellow-400 font-bold">{room.bet}🪙</span>
                      <span className="text-white/60">{phaseLabel}</span>
                      <span className="text-white/50">⏱ {fmt(room.duration)}</span>
                      <span className="text-white/50">{room.moves} ходов</span>
                    </div>
                    {/* AI badge */}
                    {room.isAI && room.aiDifficulty != null && (
                      <div className="text-[11px] text-blue-300 bg-blue-900/30 rounded-lg px-2 py-0.5 inline-block">
                        ИИ сложность: {room.aiDifficulty}%
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}

        {/* ── Players ── */}
        {tab === 'players' && (
          <>
            <input
              type="text"
              placeholder="Поиск по имени / @username / ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 text-white rounded-xl border border-white/15 text-sm focus:outline-none focus:border-gold"
            />
            <div className="space-y-1.5">
              {filteredPlayers.map(p => (
                <div
                  key={p.telegramId}
                  onClick={() => setEditing({ ...p })}
                  className="bg-white/6 rounded-xl p-3 cursor-pointer active:bg-white/12 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-white font-medium text-sm flex items-center gap-1.5 truncate">
                        {p.isBanned && <span className="text-red-400 text-xs">🚫</span>}
                        {p.firstName}
                        {p.username ? <span className="text-white/40 text-xs">@{p.username}</span> : null}
                      </div>
                      <div className="text-white/40 text-[11px] mt-0.5">
                        {p.wins}W · {p.losses}L · {p.gamesPlayed} игр
                        {p.consecutiveLosses > 0 && <span className="text-orange-400 ml-1">↓{p.consecutiveLosses}</span>}
                        {p.consecutiveWins > 0 && <span className="text-green-400 ml-1">↑{p.consecutiveWins}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-gold font-bold text-sm">{p.balance}🪙</div>
                      {p.aiDifficultyOverride != null && (
                        <div className="text-blue-300 text-[11px]">ИИ {p.aiDifficultyOverride}%</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredPlayers.length === 0 && (
                <div className="text-center py-8 text-white/30 text-sm">Нет игроков</div>
              )}
            </div>
          </>
        )}

        {/* ── Settings ── */}
        {tab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-white/8 rounded-2xl p-4">
              <div className="text-white font-semibold mb-1 text-sm">Глобальная сложность ИИ</div>
              <div className="text-white/40 text-xs mb-3">
                0% = бот всегда проигрывает · 100% = непобедим
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range" min="0" max="100" value={globalDiff}
                  onChange={e => setGlobalDiff(Number(e.target.value))}
                  className="flex-1 accent-yellow-400"
                />
                <span className="text-gold font-bold w-10 text-right">{globalDiff}%</span>
              </div>
              <button
                onClick={saveDifficulty}
                className="mt-3 w-full py-2.5 bg-gold text-black font-bold rounded-xl text-sm"
              >
                Сохранить
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Edit player modal ── */}
      {editing && (
        <div className="fixed inset-0 bg-black/80 flex items-end z-50" onClick={() => setEditing(null)}>
          <div
            className="w-full bg-felt-dark rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <div className="text-white font-bold text-lg">{editing.firstName}</div>
              {editing.username && <div className="text-white/40 text-sm">@{editing.username}</div>}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-white/50 bg-white/5 rounded-xl p-3">
              <span>{editing.wins}W / {editing.losses}L</span>
              <span>{editing.gamesPlayed} игр</span>
              <span>↓{editing.consecutiveLosses} подряд</span>
              <span>↑{editing.consecutiveWins} подряд</span>
            </div>

            <div>
              <label className="text-white/60 text-xs">Баланс монет</label>
              <input type="number" value={editing.balance}
                onChange={e => setEditing({ ...editing, balance: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-white/10 text-white rounded-xl border border-white/20 text-sm focus:outline-none" />
            </div>

            <div>
              <label className="text-white/60 text-xs">Сложность ИИ для игрока (пусто = глобальная)</label>
              <input type="number" min="0" max="100" placeholder="Глобальная"
                value={editing.aiDifficultyOverride ?? ''}
                onChange={e => setEditing({ ...editing, aiDifficultyOverride: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full mt-1 px-3 py-2 bg-white/10 text-white rounded-xl border border-white/20 text-sm focus:outline-none" />
            </div>

            <div>
              <label className="text-white/60 text-xs">Защита от серии поражений (через сколько ходов помочь)</label>
              <input type="number" min="1" max="20" value={editing.protectedStreak}
                onChange={e => setEditing({ ...editing, protectedStreak: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-white/10 text-white rounded-xl border border-white/20 text-sm focus:outline-none" />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={editing.isBanned}
                onChange={e => setEditing({ ...editing, isBanned: e.target.checked })}
                className="w-5 h-5 accent-red-500" />
              <span className="text-white text-sm">Заблокировать игрока</span>
            </label>

            <div className="flex gap-3 pb-2">
              <button onClick={() => setEditing(null)}
                className="flex-1 py-3 bg-white/10 text-white rounded-2xl font-semibold text-sm">
                Отмена
              </button>
              <button onClick={savePlayer}
                className="flex-1 py-3 bg-gold text-black rounded-2xl font-bold text-sm">
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
