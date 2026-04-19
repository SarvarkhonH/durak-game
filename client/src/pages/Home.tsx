import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerData, GameMode } from '../types';
import { socket } from '../lib/socket';
import { fetchBonus, claimBonus } from '../lib/api';
import { sfx, voice } from '../lib/sounds';
import { useTelegram } from '../hooks/useTelegram';

interface Props {
  player: PlayerData | null;
}

// Decorative card fan shown in the header (static, visual only)
const HERO_CARDS = [
  { rank: '3', suit: '♠', red: false },
  { rank: 'A', suit: '♦', red: true },
  { rank: '10', suit: '♦', red: true },
  { rank: '8', suit: '♠', red: false },
  { rank: 'J', suit: '♥', red: true },
  { rank: 'J', suit: '♠', red: false },
];

function HeroCardFan() {
  const n = HERO_CARDS.length;
  const totalAngle = 50;
  return (
    <div className="relative flex justify-center" style={{ height: 88, width: '100%' }}>
      {HERO_CARDS.map((c, i) => {
        const angle = -totalAngle / 2 + (totalAngle / (n - 1)) * i;
        const scale = i === n - 1 ? 1.18 : 0.92 + i * 0.04;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              width: 48,
              height: 68,
              marginLeft: -24,
              background: 'linear-gradient(145deg, #fefcf3, #f0ecd8)',
              borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.12)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.55)',
              transform: `rotate(${angle}deg) scale(${scale}) translateX(${(i - n / 2 + 0.5) * 18}px)`,
              transformOrigin: 'bottom center',
              display: 'flex',
              flexDirection: 'column',
              zIndex: i,
            }}
          >
            {/* Top-left */}
            <div style={{ position: 'absolute', top: 3, left: 4, lineHeight: 1, color: c.red ? '#c0392b' : '#111' }}>
              <div style={{ fontSize: 11, fontWeight: 900 }}>{c.rank}</div>
              <div style={{ fontSize: 9 }}>{c.suit}</div>
            </div>
            {/* Centre */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: c.red ? '#c0392b' : '#111',
            }}>
              {c.suit}
            </div>
            {/* Bottom-right rotated */}
            <div style={{
              position: 'absolute', bottom: 3, right: 4, lineHeight: 1,
              color: c.red ? '#c0392b' : '#111', transform: 'rotate(180deg)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 900 }}>{c.rank}</div>
              <div style={{ fontSize: 9 }}>{c.suit}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Home({ player }: Props) {
  const navigate = useNavigate();
  const { haptic, user } = useTelegram();

  const [bet, setBet] = useState('10');
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [error, setError] = useState('');
  const [bonus, setBonus] = useState<{ available: boolean; nextAt: number | null; amount: number } | null>(null);
  const [bonusLoading, setBonusLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(player?.balance ?? 0);

  // Load bonus status
  useEffect(() => {
    if (!user?.id) return;
    fetchBonus(user.id).then(setBonus).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    setCurrentBalance(player?.balance ?? 0);
  }, [player?.balance]);

  async function handleClaimBonus() {
    if (!user?.id || !bonus?.available || bonusLoading) return;
    setBonusLoading(true);
    haptic.success();
    try {
      const result = await claimBonus(user.id);
      sfx.bonus();
      voice.bonus();
      setCurrentBalance(result.newBalance);
      setBonus({ available: false, nextAt: Date.now() + 24 * 3600 * 1000, amount: 50 });
    } catch { /* already claimed */ }
    setBonusLoading(false);
  }

  function startGame() {
    if (!player) return;
    const amount = parseInt(bet) || 0;
    if (amount < 1) { setError('Минимальная ставка 1 монета'); return; }
    if (amount > currentBalance) { setError('Недостаточно монет!'); return; }
    setError('');
    haptic.impact('medium');
    sfx.deal();
    socket.emit('join_ai_game', { bet: amount, gameMode });
    navigate('/game');
  }

  function setBetPreset(v: number) {
    setBet(String(v));
    setError('');
    haptic.impact('light');
    sfx.card();
  }

  const BET_PRESETS = [10, 25, 50, 100, 200];
  const currentBet = parseInt(bet) || 0;

  return (
    <div
      className="flex flex-col overflow-y-auto"
      style={{
        minHeight: '100%',
        background: 'linear-gradient(180deg, #060f06 0%, #0d220d 35%, #112811 70%, #0a1a0a 100%)',
      }}
    >
      {/* Vignette overlay */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 50% 0%, transparent 50%, rgba(0,0,0,0.65) 100%)',
      }} />

      <div className="relative z-10">
        {/* ── Hero section ───────────────────────────────────────────────── */}
        <div className="text-center pt-7 pb-3 px-4">
          <HeroCardFan />

          {/* Jester hat */}
          <div style={{
            fontSize: 52, lineHeight: 1, marginTop: -4, marginBottom: 6,
            filter: 'drop-shadow(0 4px 12px rgba(245,200,66,0.5))',
          }}>
            🃏
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 44,
            fontWeight: 900,
            letterSpacing: 4,
            color: '#ffffff',
            textShadow: '0 2px 24px rgba(245,200,66,0.45), 0 0 60px rgba(245,200,66,0.15)',
            margin: 0,
            lineHeight: 1,
          }}>
            КОЗЫРЬ
          </h1>
          <div style={{
            color: '#f5c842',
            fontSize: 10,
            letterSpacing: 5,
            fontWeight: 700,
            marginTop: 6,
            textShadow: '0 1px 8px rgba(245,200,66,0.4)',
          }}>
            КАРТОЧНАЯ ИГРА
          </div>

          {/* Decorative line */}
          <div style={{
            margin: '10px auto 0',
            width: 120,
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(245,200,66,0.5), transparent)',
          }} />
        </div>

        {/* ── Player info + bonus ─────────────────────────────────────────── */}
        {player && (
          <div className="mx-3 mb-4">
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(245,200,66,0.22)',
              borderRadius: 16,
              padding: '12px 16px',
            }}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 2 }}>
                    Привет, {player.name}!
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#f5c842' }}>
                      {currentBalance.toLocaleString()}
                    </span>
                    <span style={{ fontSize: 18 }}>🪙</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 2 }}>
                    Победы
                  </div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>
                    {player.wins}
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>
                      /{player.gamesPlayed}
                    </span>
                  </div>
                  {player.gamesPlayed > 0 && (
                    <div style={{ color: '#4ade80', fontSize: 11, fontWeight: 600 }}>
                      {Math.round((player.wins / player.gamesPlayed) * 100)}% побед
                    </div>
                  )}
                </div>
              </div>

              {/* Daily bonus button */}
              {bonus?.available && (
                <button
                  onClick={handleClaimBonus}
                  disabled={bonusLoading}
                  className="w-full mt-2 py-2 rounded-xl font-bold text-sm active:scale-95 transition-transform animate-bounce-in"
                  style={{
                    background: 'linear-gradient(135deg, #f5c842, #e8a000)',
                    color: '#000',
                    border: 'none',
                    boxShadow: '0 2px 12px rgba(245,200,66,0.4)',
                  }}
                >
                  🎁 Забрать бонус +50 монет
                </button>
              )}
              {bonus && !bonus.available && bonus.nextAt && (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, textAlign: 'center', marginTop: 6 }}>
                  Следующий бонус через {formatCountdown(bonus.nextAt)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Game mode toggle ────────────────────────────────────────────── */}
        <div className="mx-3 mb-4">
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, letterSpacing: 2, marginBottom: 6, textAlign: 'center' }}>
            РЕЖИМ ИГРЫ
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['classic', 'transfer'] as GameMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => { setGameMode(mode); haptic.impact('light'); sfx.card(); }}
                style={{
                  flex: 1,
                  padding: '10px 6px',
                  borderRadius: 14,
                  border: gameMode === mode
                    ? '2px solid #f5c842'
                    : '2px solid rgba(255,255,255,0.1)',
                  background: gameMode === mode
                    ? 'rgba(245,200,66,0.15)'
                    : 'rgba(255,255,255,0.04)',
                  color: gameMode === mode ? '#f5c842' : 'rgba(255,255,255,0.5)',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 150ms',
                }}
              >
                {mode === 'classic' ? '🃏 Подкидной' : '🔄 Переводной'}
              </button>
            ))}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, textAlign: 'center', marginTop: 5 }}>
            {gameMode === 'classic'
              ? 'Классический дурак — атакуй и защищайся'
              : 'Переводной — можно перевести атаку на соперника'}
          </div>
        </div>

        {/* ── Bet selector ────────────────────────────────────────────────── */}
        <div className="mx-3 mb-4">
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, letterSpacing: 2, marginBottom: 6, textAlign: 'center' }}>
            СТАВКА
          </div>
          {/* Preset pills */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {BET_PRESETS.map(v => (
              <button
                key={v}
                onClick={() => setBetPreset(v)}
                style={{
                  flex: 1,
                  padding: '8px 2px',
                  borderRadius: 10,
                  border: currentBet === v
                    ? '2px solid #f5c842'
                    : '2px solid rgba(255,255,255,0.1)',
                  background: currentBet === v
                    ? 'rgba(245,200,66,0.15)'
                    : 'rgba(255,255,255,0.04)',
                  color: currentBet === v ? '#f5c842' : 'rgba(255,255,255,0.6)',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {v}
              </button>
            ))}
          </div>
          {/* Custom input */}
          <input
            type="number"
            min="1"
            max={currentBalance}
            value={bet}
            onChange={e => { setBet(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && startGame()}
            className="w-full text-center font-bold focus:outline-none"
            style={{
              padding: '12px 16px',
              fontSize: 22,
              background: 'rgba(255,255,255,0.07)',
              border: '2px solid rgba(245,200,66,0.3)',
              borderRadius: 14,
              color: '#f5c842',
            }}
            placeholder="Своя ставка"
          />
          {error && (
            <div className="text-red-400 text-sm text-center mt-2 animate-slide-up">{error}</div>
          )}
        </div>

        {/* ── Play button ─────────────────────────────────────────────────── */}
        <div className="mx-3 mb-4">
          <button
            onClick={startGame}
            disabled={!player}
            style={{
              width: '100%',
              padding: '17px 0',
              borderRadius: 18,
              background: player
                ? 'linear-gradient(135deg, #f5c842 0%, #e8a000 50%, #d4890a 100%)'
                : 'rgba(255,255,255,0.1)',
              color: '#000',
              fontWeight: 900,
              fontSize: 20,
              letterSpacing: 1,
              border: 'none',
              boxShadow: player ? '0 4px 20px rgba(245,200,66,0.4), 0 2px 6px rgba(0,0,0,0.4)' : 'none',
              cursor: player ? 'pointer' : 'default',
              transition: 'all 150ms',
            }}
            className="active:scale-95"
          >
            ▶ ИГРАТЬ
          </button>
        </div>

        {/* ── Navigation ──────────────────────────────────────────────────── */}
        <div className="flex gap-3 mx-3 mb-6">
          <button
            onClick={() => { navigate('/stats'); haptic.impact('light'); }}
            style={{
              flex: 1, padding: '12px 0',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14, color: 'rgba(255,255,255,0.75)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >
            📊 Статистика
          </button>
          <button
            onClick={() => { navigate('/leaderboard'); haptic.impact('light'); }}
            style={{
              flex: 1, padding: '12px 0',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14, color: 'rgba(255,255,255,0.75)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >
            🏆 Рейтинг
          </button>
        </div>

        {/* Version tag */}
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.12)', fontSize: 10, paddingBottom: 16 }}>
          Козырь v2.0 · Переводной & Подкидной
        </div>
      </div>
    </div>
  );
}

function formatCountdown(nextAt: number): string {
  const ms = nextAt - Date.now();
  if (ms <= 0) return 'скоро';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}ч ${m}м`;
  return `${m} мин`;
}
