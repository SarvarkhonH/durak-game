import React, { useEffect, useState, useRef } from 'react';
import {
  adminLogin, adminDashboard, adminPlayers, adminPatchPlayer,
  adminPatchSettings, adminActiveGames, adminRevenue, adminBroadcast, adminReEngage,
  ActiveRoom,
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

interface Revenue {
  houseTotal: number;
  playerTotal: number;
  netRevenue: number;
  houseWinRate: number;
  avgBet: number;
  todayRevenue: number;
  daily: { _id: string; total: number; count: number }[];
  gameModes: { _id: string; count: number }[];
  avgDuration: number;
  avgMoves: number;
  topPlayers: { firstName: string; username: string; totalWagered: number; wins: number; losses: number; gamesPlayed: number }[];
  totalAIGames: number;
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
  referralCount?: number;
}

type Tab = 'dashboard' | 'revenue' | 'live' | 'players' | 'broadcast' | 'settings';

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function num(n: number) {
  return n.toLocaleString('ru-RU');
}

// Mini bar chart
function MiniBar({ data }: { data: { label: string; value: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 48, marginTop: 8 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{
            width: '100%',
            height: `${Math.max(4, (d.value / max) * 44)}px`,
            background: 'linear-gradient(180deg, #f5c842, #e8a000)',
            borderRadius: 3,
            minHeight: 4,
          }} />
          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || '');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState<Tab>('dashboard');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<PlayerRow | null>(null);
  const [globalDiff, setGlobalDiff] = useState(65);
  const [saveMsg, setSaveMsg] = useState('');
  const [liveRooms, setLiveRooms] = useState<ActiveRoom[]>([]);
  const [liveQueue, setLiveQueue] = useState(0);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastDays, setBroadcastDays] = useState(30);
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState('');
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

  useEffect(() => {
    if (!token || tab !== 'revenue') return;
    adminRevenue(token).then(setRevenue).catch(() => {});
  }, [token, tab]);

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
    flash('Сохранено!');
  }

  async function saveDifficulty() {
    if (!token) return;
    await adminPatchSettings(token, { aiDifficulty: globalDiff });
    flash('Сложность обновлена!');
  }

  async function sendBroadcast() {
    if (!broadcastMsg.trim() || broadcastSending) return;
    setBroadcastSending(true);
    try {
      const result = await adminBroadcast(token, broadcastMsg, broadcastDays);
      setBroadcastResult(`✅ ${result.message}`);
      setBroadcastMsg('');
    } catch {
      setBroadcastResult('❌ Ошибка отправки');
    }
    setBroadcastSending(false);
    setTimeout(() => setBroadcastResult(''), 5000);
  }

  async function triggerReEngage() {
    const result = await adminReEngage(token).catch(() => ({ sent: 0 }));
    flash(`Re-engage отправлен ${result.sent} игрокам`);
  }

  function flash(msg: string) {
    setSaveMsg(msg);
    setTimeout(() => setSaveMsg(''), 3000);
  }

  const filteredPlayers = players.filter(p =>
    !search ||
    p.firstName.toLowerCase().includes(search.toLowerCase()) ||
    (p.username && p.username.toLowerCase().includes(search.toLowerCase())) ||
    String(p.telegramId).includes(search)
  );

  // ── Login ─────────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full gap-4 p-8"
        style={{ background: 'linear-gradient(180deg, #060f06, #0d220d)' }}
      >
        <div style={{ fontSize: 48 }}>🔐</div>
        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>Козырь — Админ</h1>
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          style={{
            width: '100%', maxWidth: 280, padding: '12px 16px', borderRadius: 14,
            background: 'rgba(255,255,255,0.08)', color: '#fff',
            border: '2px solid rgba(245,200,66,0.3)', outline: 'none', fontSize: 16,
          }}
        />
        {loginError && <div style={{ color: '#f87171', fontSize: 13 }}>{loginError}</div>}
        <button
          onClick={login}
          style={{
            width: '100%', maxWidth: 280, padding: '14px 0',
            background: 'linear-gradient(135deg, #f5c842, #e8a000)',
            color: '#000', fontWeight: 800, fontSize: 16, borderRadius: 14,
            border: 'none', cursor: 'pointer',
          }}
        >
          Войти
        </button>
      </div>
    );
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: '📊' },
    { id: 'revenue',   label: '💰' },
    { id: 'live',      label: '🔴' },
    { id: 'players',   label: '👥' },
    { id: 'broadcast', label: '📢' },
    { id: 'settings',  label: '⚙️' },
  ];

  const S = {
    card: {
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 16,
      padding: '12px',
    } as React.CSSProperties,
    label: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 2 } as React.CSSProperties,
    value: { color: '#fff', fontWeight: 700, fontSize: 18 } as React.CSSProperties,
    goldValue: { color: '#f5c842', fontWeight: 800, fontSize: 18 } as React.CSSProperties,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d1a0d', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', background: 'rgba(0,0,0,0.4)',
        borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0,
      }}>
        <span style={{ color: '#f5c842', fontWeight: 800, fontSize: 14 }}>🃏 Козырь Admin</span>
        {saveMsg && <span style={{ color: '#4ade80', fontSize: 12 }} className="animate-slide-up">{saveMsg}</span>}
        <button
          onClick={() => { setToken(''); localStorage.removeItem('admin_token'); }}
          style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Выйти
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 600,
              background: 'none', border: 'none', cursor: 'pointer',
              color: tab === t.id ? '#f5c842' : 'rgba(255,255,255,0.35)',
              borderBottom: tab === t.id ? '2px solid #f5c842' : '2px solid transparent',
              transition: 'all 150ms',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* ── Dashboard ── */}
        {tab === 'dashboard' && dashboard && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Игроков', value: num(dashboard.totalPlayers), icon: '👤' },
                { label: 'Новых сегодня', value: `+${dashboard.newToday}`, icon: '✨' },
                { label: 'Игр сегодня', value: num(dashboard.gamesToday), icon: '🎮' },
                { label: 'Всего игр', value: num(dashboard.totalGames), icon: '📋' },
                { label: 'Активных', value: dashboard.activeGames, icon: '🟢' },
                { label: 'В очереди', value: dashboard.inQueue, icon: '⏳' },
                { label: 'Ставки всего', value: `${num(dashboard.totalWagered)}🪙`, icon: '💰' },
                { label: 'Сложность ИИ', value: `${dashboard.aiDifficulty}%`, icon: '🤖' },
              ].map(s => (
                <div key={s.label} style={{ ...S.card, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 2 }}>{s.icon}</div>
                  <div style={S.goldValue}>{s.value}</div>
                  <div style={S.label}>{s.label}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Revenue / Analytics ── */}
        {tab === 'revenue' && (
          <>
            {!revenue ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', paddingTop: 40 }}>Загрузка...</div>
            ) : (
              <>
                {/* KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Доход дома', value: `${num(revenue.houseTotal)}🪙`, good: true },
                    { label: 'Выплачено', value: `${num(revenue.playerTotal)}🪙`, good: false },
                    { label: 'Чистая прибыль', value: `${revenue.netRevenue >= 0 ? '+' : ''}${num(revenue.netRevenue)}🪙`, good: revenue.netRevenue >= 0 },
                    { label: 'Сегодня', value: `${num(revenue.todayRevenue)}🪙`, good: true },
                    { label: 'Побед дома', value: `${revenue.houseWinRate}%`, good: true },
                    { label: 'Средняя ставка', value: `${revenue.avgBet}🪙`, good: null },
                    { label: 'Ср. длина', value: fmt(revenue.avgDuration), good: null },
                    { label: 'Ср. ходов', value: String(revenue.avgMoves), good: null },
                  ].map(s => (
                    <div key={s.label} style={{ ...S.card, textAlign: 'center' }}>
                      <div style={{
                        ...S.goldValue,
                        color: s.good === true ? '#4ade80' : s.good === false ? '#f87171' : '#f5c842',
                      }}>
                        {s.value}
                      </div>
                      <div style={S.label}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Daily chart */}
                {revenue.daily.length > 0 && (
                  <div style={S.card}>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      📈 Доход (последние 7 дней)
                    </div>
                    <MiniBar data={revenue.daily.map(d => ({ label: d._id, value: d.total }))} />
                  </div>
                )}

                {/* Game modes */}
                <div style={S.card}>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                    🎮 Режимы игры
                  </div>
                  {revenue.gameModes.map(m => (
                    <div key={m._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                        {m._id === 'transfer' ? '🔄 Переводной' : '🃏 Подкидной'}
                      </span>
                      <span style={{ color: '#f5c842', fontWeight: 700, fontSize: 13 }}>{m.count} игр</span>
                    </div>
                  ))}
                </div>

                {/* Top wagerers */}
                {revenue.topPlayers.length > 0 && (
                  <div style={S.card}>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                      🔥 Топ по ставкам
                    </div>
                    {revenue.topPlayers.map((p, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div>
                          <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{p.firstName}</span>
                          {p.username && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}> @{p.username}</span>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: '#f5c842', fontWeight: 700, fontSize: 12 }}>{num(p.totalWagered)}🪙</div>
                          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{p.wins}W/{p.losses}L</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Live Games ── */}
        {tab === 'live' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Обновление каждые 5с</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', animation: 'pulse 1.5s infinite' }} />
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
                  {liveRooms.length} игр · {liveQueue} в очереди
                </span>
              </div>
            </div>
            {liveRooms.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 40, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                Активных игр нет
              </div>
            ) : (
              liveRooms.map(room => {
                const [p1, p2] = room.players;
                const phaseLabel = room.phase === 'attack' ? '⚔️' : room.phase === 'defend' ? '🛡️' : '✅';
                return (
                  <div key={room.roomId} style={S.card}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{p1?.name ?? '?'}</span>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>vs</span>
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{p2?.name ?? '?'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ color: '#f5c842', fontWeight: 700, fontSize: 12 }}>{room.bet}🪙</span>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{phaseLabel}</span>
                      <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>⏱ {fmt(room.duration)}</span>
                      <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{room.moves} ходов</span>
                      {room.isAI && room.aiDifficulty != null && (
                        <span style={{ color: '#93c5fd', fontSize: 11, background: 'rgba(59,130,246,0.2)', padding: '1px 6px', borderRadius: 6 }}>
                          ИИ {room.aiDifficulty}%
                        </span>
                      )}
                    </div>
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
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 12,
                background: 'rgba(255,255,255,0.08)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.12)', outline: 'none', fontSize: 13,
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredPlayers.map(p => (
                <div
                  key={p.telegramId}
                  onClick={() => setEditing({ ...p })}
                  style={{ ...S.card, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {p.isBanned && <span style={{ color: '#f87171', fontSize: 11 }}>🚫</span>}
                        {p.firstName}
                        {p.username && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>@{p.username}</span>}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>
                        {p.wins}W · {p.losses}L · {p.gamesPlayed} игр
                        {p.consecutiveLosses > 0 && <span style={{ color: '#fb923c', marginLeft: 4 }}>↓{p.consecutiveLosses}</span>}
                        {p.consecutiveWins > 0 && <span style={{ color: '#4ade80', marginLeft: 4 }}>↑{p.consecutiveWins}</span>}
                        {(p.referralCount ?? 0) > 0 && <span style={{ color: '#a78bfa', marginLeft: 4 }}>👥{p.referralCount}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                      <div style={{ color: '#f5c842', fontWeight: 700, fontSize: 13 }}>{p.balance}🪙</div>
                      {p.aiDifficultyOverride != null && (
                        <div style={{ color: '#93c5fd', fontSize: 11 }}>ИИ {p.aiDifficultyOverride}%</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredPlayers.length === 0 && (
                <div style={{ textAlign: 'center', paddingTop: 32, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                  Нет игроков
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Broadcast ── */}
        {tab === 'broadcast' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={S.card}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                📢 Рассылка сообщений
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 8 }}>
                Поддерживает *жирный* и _курсив_ (Markdown Telegram)
              </div>
              <textarea
                value={broadcastMsg}
                onChange={e => setBroadcastMsg(e.target.value)}
                placeholder="Текст сообщения для всех игроков..."
                rows={5}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.07)', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.12)', outline: 'none',
                  fontSize: 13, resize: 'vertical', fontFamily: 'inherit',
                }}
              />
              <div style={{ marginTop: 10, marginBottom: 4 }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 6 }}>
                  Отправить игрокам активным за последние:
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[7, 14, 30, 90].map(d => (
                    <button
                      key={d}
                      onClick={() => setBroadcastDays(d)}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 600,
                        background: broadcastDays === d ? 'rgba(245,200,66,0.2)' : 'rgba(255,255,255,0.05)',
                        border: broadcastDays === d ? '1px solid #f5c842' : '1px solid rgba(255,255,255,0.1)',
                        color: broadcastDays === d ? '#f5c842' : 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                      }}
                    >
                      {d}д
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={sendBroadcast}
                disabled={!broadcastMsg.trim() || broadcastSending}
                style={{
                  marginTop: 10, width: '100%', padding: '13px 0', borderRadius: 14,
                  background: broadcastMsg.trim() && !broadcastSending
                    ? 'linear-gradient(135deg, #f5c842, #e8a000)'
                    : 'rgba(255,255,255,0.1)',
                  color: broadcastMsg.trim() ? '#000' : 'rgba(255,255,255,0.3)',
                  fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer',
                }}
              >
                {broadcastSending ? '⏳ Отправляем...' : '📤 Отправить рассылку'}
              </button>
              {broadcastResult && (
                <div style={{
                  marginTop: 8, padding: '8px 12px', borderRadius: 10,
                  background: 'rgba(74,222,128,0.1)',
                  color: '#4ade80', fontSize: 13, textAlign: 'center',
                }}>
                  {broadcastResult}
                </div>
              )}
            </div>

            {/* Re-engagement */}
            <div style={S.card}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                🔔 Авто-напоминание
              </div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginBottom: 10 }}>
                Отправить случайное мотивирующее сообщение игрокам, не заходившим 3-7 дней
              </div>
              <button
                onClick={triggerReEngage}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 14,
                  background: 'rgba(139,92,246,0.2)',
                  border: '1px solid rgba(139,92,246,0.4)',
                  color: '#a78bfa', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}
              >
                🚀 Запустить re-engagement
              </button>
            </div>
          </div>
        )}

        {/* ── Settings ── */}
        {tab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={S.card}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                🤖 Глобальная сложность ИИ
              </div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginBottom: 12 }}>
                0% = всегда проигрывает · 100% = непобедим
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="range" min="0" max="100" value={globalDiff}
                  onChange={e => setGlobalDiff(Number(e.target.value))}
                  style={{ flex: 1, accentColor: '#f5c842' }}
                />
                <span style={{ color: '#f5c842', fontWeight: 800, fontSize: 18, minWidth: 44, textAlign: 'right' }}>
                  {globalDiff}%
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                {[20, 40, 65, 80, 95].map(v => (
                  <button
                    key={v}
                    onClick={() => setGlobalDiff(v)}
                    style={{
                      flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 11, fontWeight: 700,
                      background: globalDiff === v ? 'rgba(245,200,66,0.2)' : 'rgba(255,255,255,0.05)',
                      border: globalDiff === v ? '1px solid #f5c842' : '1px solid rgba(255,255,255,0.08)',
                      color: globalDiff === v ? '#f5c842' : 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                    }}
                  >
                    {v}%
                  </button>
                ))}
              </div>
              <button
                onClick={saveDifficulty}
                style={{
                  marginTop: 12, width: '100%', padding: '12px 0', borderRadius: 14,
                  background: 'linear-gradient(135deg, #f5c842, #e8a000)',
                  color: '#000', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer',
                }}
              >
                Сохранить
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Edit player modal ── */}
      {editing && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', zIndex: 50 }}
          onClick={() => setEditing(null)}
        >
          <div
            style={{
              width: '100%', background: '#111a11',
              borderRadius: '24px 24px 0 0', padding: '20px 20px 32px',
              maxHeight: '85vh', overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>{editing.firstName}</span>
              {editing.username && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>@{editing.username}</span>}
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginLeft: 'auto' }}>#{editing.telegramId}</span>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12,
              color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.05)',
              borderRadius: 12, padding: 12,
            }}>
              <span>{editing.wins}W / {editing.losses}L</span>
              <span>{editing.gamesPlayed} игр</span>
              <span>↓{editing.consecutiveLosses} серия потерь</span>
              <span>↑{editing.consecutiveWins} серия побед</span>
              {(editing.referralCount ?? 0) > 0 && <span>👥 рефералов: {editing.referralCount}</span>}
            </div>

            {[
              { label: 'Баланс монет', key: 'balance', type: 'number', min: 0, max: 99999 },
              { label: 'ИИ сложность (0-100, пусто = глобальная)', key: 'aiDifficultyOverride', type: 'number', min: 0, max: 100, placeholder: 'Глобальная' },
              { label: 'Защита от серии поражений (ходов)', key: 'protectedStreak', type: 'number', min: 1, max: 20 },
            ].map(f => (
              <div key={f.key}>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{f.label}</label>
                <input
                  type={f.type}
                  min={f.min} max={f.max}
                  placeholder={(f as Record<string,unknown>).placeholder as string}
                  value={(editing as unknown as Record<string,unknown>)[f.key] as string ?? ''}
                  onChange={e => setEditing({
                    ...editing,
                    [f.key]: e.target.value === '' ? undefined : Number(e.target.value),
                  } as PlayerRow)}
                  style={{
                    width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.08)', color: '#fff',
                    border: '1px solid rgba(255,255,255,0.15)', outline: 'none', fontSize: 14,
                  }}
                />
              </div>
            ))}

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox" checked={editing.isBanned}
                onChange={e => setEditing({ ...editing, isBanned: e.target.checked })}
                style={{ width: 20, height: 20, accentColor: '#ef4444' }}
              />
              <span style={{ color: '#fff', fontSize: 14 }}>🚫 Заблокировать игрока</span>
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setEditing(null)}
                style={{
                  flex: 1, padding: '13px 0', borderRadius: 14,
                  background: 'rgba(255,255,255,0.08)', color: '#fff',
                  fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer',
                }}
              >
                Отмена
              </button>
              <button
                onClick={savePlayer}
                style={{
                  flex: 1, padding: '13px 0', borderRadius: 14,
                  background: 'linear-gradient(135deg, #f5c842, #e8a000)',
                  color: '#000', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer',
                }}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
