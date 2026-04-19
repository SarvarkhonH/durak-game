import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../lib/socket';
import { GameState, Card as CardType } from '../types';
import { OpponentArea } from '../components/OpponentArea';
import { TableArea } from '../components/TableArea';
import { TrumpDeck } from '../components/TrumpDeck';
import { PlayerHand } from '../components/PlayerHand';
import { GameResult } from '../components/GameResult';
import { useTelegram } from '../hooks/useTelegram';
import { sfx, voice, speakCard, startAmbience, stopAmbience } from '../lib/sounds';

interface GameOverData {
  winner: string;
  loser: string;
  balanceChange: number;
  newBalance: number;
  winnerName: string;
  loserName: string;
}

const SUIT_LABEL: Record<string, string> = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };
const SUIT_COLOR: Record<string, string> = { spades: '#f5c842', hearts: '#f5c842', diamonds: '#f5c842', clubs: '#f5c842' };

export function GamePage() {
  const navigate = useNavigate();
  const { haptic } = useTelegram();

  const [game, setGame] = useState<GameState | null>(null);
  const [result, setResult] = useState<GameOverData | null>(null);
  const [waiting, setWaiting] = useState(true);
  const [defenseTarget, setDefenseTarget] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [voiceOn, setVoiceOn] = useState(true);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPhaseRef = useRef<string>('');
  const prevAttackerRef = useRef<string>('');

  function flash(msg: string, ms = 2000) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), ms);
  }

  // ── Socket events ──────────────────────────────────────────────────────────
  useEffect(() => {
    socket.on('game_start', (state: GameState) => {
      setGame(state);
      setWaiting(false);
      setDefenseTarget(null);
      sfx.deal();
      startAmbience(); // 🎵 casino music starts with game
      const me = state.players.find(p => p.id === state.myId);
      if (me?.isAttacker) voice.yourAttack();
      else voice.defend();
    });

    socket.on('game_update', (state: GameState) => {
      const prevPhase = prevPhaseRef.current;
      const prevAttacker = prevAttackerRef.current;
      const me = state.players.find(p => p.id === state.myId);

      setGame(prev => {
        // Play card sound + voice when table grows (bot played a card)
        if (prev && state.table.length > prev.table.length) {
          sfx.card();
          // Announce the new card the bot just played (last on table)
          const newPairs = state.table.slice(prev.table.length);
          newPairs.forEach(pair => {
            if (pair.defense && !prev.table.find(p => p.defense?.id === pair.defense!.id)) {
              if (voiceOn) speakCard(pair.defense);
            } else if (!prev.table.find(p => p.attack.id === pair.attack.id)) {
              if (voiceOn) speakCard(pair.attack);
            }
          });
        }
        return state;
      });

      setDefenseTarget(null);

      // Voice on phase/role change
      const isMyAttack = state.phase === 'attack' && me?.isAttacker;
      const isMyDefend = state.phase === 'defend' && me?.isDefender;
      const attackerChanged = state.players.find(p => p.isAttacker)?.id !== prevAttacker;

      if (voiceOn) {
        if (state.phase === 'attack' && prevPhase !== 'attack' && isMyAttack) {
          voice.yourAttack();
        } else if (state.phase === 'defend' && prevPhase !== 'defend' && isMyDefend) {
          voice.defend();
        } else if (state.phase === 'attack' && attackerChanged) {
          // new round started - bito
          if (prevPhase === 'attack') voice.bito();
        }
      }

      prevPhaseRef.current = state.phase;
      prevAttackerRef.current = state.players.find(p => p.isAttacker)?.id ?? '';
    });

    socket.on('game_over', (data: GameOverData) => {
      const won = data.balanceChange > 0;
      haptic[won ? 'success' : 'error']();
      stopAmbience(); // 🎵 stop music on game end
      if (won) { sfx.win(); voice.win(); }
      else     { sfx.lose(); voice.lose(); }
      setGame(null);
      setResult(data);
    });

    socket.on('waiting', () => setWaiting(true));
    socket.on('error', ({ message: m }: { message: string }) => flash(m));

    return () => {
      socket.off('game_start');
      socket.off('game_update');
      socket.off('game_over');
      socket.off('waiting');
      socket.off('error');
      stopAmbience(); // stop music when leaving game page
    };
  }, [voiceOn]);

  // ── Derived turn state ─────────────────────────────────────────────────────
  const me = game?.players.find(p => p.id === game.myId);
  const opponent = game?.players.find(p => p.id !== game.myId);
  const isMyAttack = !!(game && game.phase === 'attack' && me?.isAttacker);
  const isMyDefend = !!(game && game.phase === 'defend' && me?.isDefender);
  const canPlay = isMyAttack || isMyDefend;

  // ── Card interactions ──────────────────────────────────────────────────────
  const handleCardClick = useCallback((card: CardType) => {
    if (!game) return;

    if (isMyAttack) {
      socket.emit('attack', { gameId: game.id, cardId: card.id });
      haptic.impact('light');
      sfx.card();
      if (voiceOn) speakCard(card);
      return;
    }

    if (isMyDefend) {
      const undefended = game.table.filter(p => !p.defense);
      if (undefended.length === 0) return;

      if (undefended.length === 1) {
        socket.emit('defend', { gameId: game.id, cardId: card.id, targetId: undefended[0].attack.id });
        haptic.impact('light');
        sfx.card();
        if (voiceOn) speakCard(card);
        setDefenseTarget(null);
      } else if (defenseTarget) {
        socket.emit('defend', { gameId: game.id, cardId: card.id, targetId: defenseTarget });
        haptic.impact('light');
        sfx.card();
        if (voiceOn) speakCard(card);
        setDefenseTarget(null);
      } else {
        flash('Нажми на карту противника сначала');
        haptic.impact('light');
      }
    }
  }, [game, isMyAttack, isMyDefend, defenseTarget, haptic]);

  const handleTableCardClick = useCallback((attackCardId: string) => {
    if (!isMyDefend) return;
    setDefenseTarget(attackCardId);
    haptic.impact('light');
    sfx.card();
    flash('Теперь выбери карту для защиты ↓', 1500);
  }, [isMyDefend, haptic]);

  function handleTransfer(card: CardType) {
    if (!game) return;
    socket.emit('transfer', { gameId: game.id, cardId: card.id });
    haptic.impact('medium');
    sfx.transfer();
    voice.transfer();
    setDefenseTarget(null);
  }

  function handleSurrender() {
    if (!game) return;
    if (window.confirm('Сдаться? Ты потеряешь ставку.')) {
      socket.emit('surrender', { gameId: game.id });
    }
  }

  function handleTake() {
    if (!game) return;
    socket.emit('take', { gameId: game.id });
    haptic.impact('medium');
    sfx.take();
    if (voiceOn) voice.take();
  }

  function handlePass() {
    if (!game) return;
    socket.emit('pass', { gameId: game.id });
    haptic.impact('medium');
    sfx.pass();
    if (voiceOn) voice.bito();
  }

  // ── Turn status bar ────────────────────────────────────────────────────────
  const turnConfig = (() => {
    if (!game) return { text: '...', bg: 'rgba(100,116,139,0.7)' };
    if (isMyAttack) return { text: '⚔️ Атака', bg: 'rgba(21,128,61,0.9)' };
    if (isMyDefend) return { text: '🛡️ Защита!', bg: 'rgba(185,28,28,0.9)' };
    return { text: '⏳ Ход бота...', bg: 'rgba(120,73,0,0.85)' };
  })();

  // ── Transfer mode: show transfer button when applicable ────────────────────
  const showTransfer = isMyDefend && game?.canTransfer;

  // ── Result screen ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <GameResult
        isWinner={result.balanceChange > 0}
        balanceChange={result.balanceChange}
        newBalance={result.newBalance}
        winnerName={result.winnerName}
        loserName={result.loserName}
        onPlayAgain={() => { setResult(null); navigate('/'); }}
        onHome={() => { setResult(null); navigate('/'); }}
      />
    );
  }

  // ── Waiting screen ─────────────────────────────────────────────────────────
  if (waiting || !game) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full gap-4"
        style={{ background: 'linear-gradient(180deg, #060f06, #0d220d)' }}
      >
        {/* Animated card */}
        <div style={{ position: 'relative', width: 72, height: 100 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: 'absolute',
              width: 56, height: 80,
              background: 'linear-gradient(145deg, #fefcf3, #f0ecd8)',
              borderRadius: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              left: i * 8,
              top: i * 4,
              animation: `card-deal 0.6s ${i * 0.15}s ease-out both`,
            }} />
          ))}
          <div style={{
            position: 'absolute', bottom: -16, left: '50%', transform: 'translateX(-50%)',
            fontSize: 28, animation: 'spin 1.5s linear infinite',
          }}>🃏</div>
        </div>
        <div style={{ marginTop: 28, color: 'rgba(255,255,255,0.75)', fontWeight: 600, fontSize: 17 }}>
          Раздаём карты...
        </div>
        <button
          onClick={() => navigate('/')}
          style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, background: 'none', border: 'none', marginTop: 8, cursor: 'pointer' }}
        >
          Отмена
        </button>
      </div>
    );
  }

  // ── Game screen ────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col h-full overflow-hidden select-none"
      style={{
        background: 'linear-gradient(180deg, #0a1f0a 0%, #1a3a1a 40%, #163016 100%)',
        touchAction: 'none',
      }}
    >
      {/* ── Opponent area ── */}
      {opponent && <OpponentArea opponent={opponent} />}

      {/* ── Trump card (absolute top-right) ── */}
      <div className="absolute top-[80px] right-3 z-20">
        <TrumpDeck trumpCard={game.trumpCard} deckCount={game.deckCount} />
      </div>

      {/* ── Bito pile (absolute top-left, below opponent bar) ── */}
      {game.bitoCount > 0 && (
        <div
          className="absolute z-20 flex flex-col items-center"
          style={{ top: 84, left: 10 }}
        >
          <div style={{
            width: 30, height: 42, borderRadius: 5,
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 14 }}>🚫</span>
          </div>
          <div style={{
            marginTop: 2, fontSize: 10, fontWeight: 700,
            color: 'rgba(255,255,255,0.5)',
          }}>
            {game.bitoCount}
          </div>
        </div>
      )}

      {/* ── Table area ── */}
      <TableArea
        table={game.table}
        defenseTarget={defenseTarget}
        isDefend={isMyDefend}
        isAttack={isMyAttack}
        canPass={game.canPass}
        onTableCardClick={handleTableCardClick}
      />

      {/* ── Turn status bar ── */}
      <div
        className="flex items-center justify-between px-4 flex-shrink-0"
        style={{ height: 44, background: turnConfig.bg, transition: 'background 300ms ease' }}
      >
        <span className="text-white font-bold text-sm">{turnConfig.text}</span>
        {/* Game mode badge */}
        <span style={{
          background: 'rgba(0,0,0,0.3)',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 9,
          fontWeight: 700,
          padding: '2px 6px',
          borderRadius: 8,
          letterSpacing: 1,
        }}>
          {game.gameMode === 'transfer' ? 'ПЕРЕВОДНОЙ' : 'ПОДКИДНОЙ'}
        </span>
        <div className="flex items-center gap-2">
          {defenseTarget && (
            <span className="text-yellow-300 text-[11px] font-medium animate-pulse">
              Выбери ↓
            </span>
          )}
          <span style={{ color: '#f5c842', fontWeight: 700, fontSize: 15 }}>
            {SUIT_LABEL[game.trumpSuit]}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>
            {game.bet}🪙
          </span>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className="flex-shrink-0 text-center text-sm py-2 px-4 animate-slide-up"
             style={{ background: 'rgba(0,0,0,0.8)', color: '#fff' }}>
          {toast}
        </div>
      )}

      {/* ── Action buttons ── */}
      {(isMyDefend || (isMyAttack && game.canPass) || isMyAttack) && (
        <div className="flex gap-2 px-3 py-2 flex-shrink-0" style={{ background: 'rgba(0,0,0,0.3)' }}>
          {/* Take cards */}
          {isMyDefend && (
            <button
              onPointerDown={handleTake}
              className="flex-1 py-3 rounded-2xl font-bold text-sm text-white active:scale-95 transition-transform"
              style={{ background: 'rgba(185,28,28,0.92)' }}
            >
              📥 Взять
            </button>
          )}

          {/* Transfer (Переводной mode only) */}
          {showTransfer && (
            <TransferPicker
              hand={game.myCards}
              table={game.table}
              trumpSuit={game.trumpSuit}
              onTransfer={handleTransfer}
              haptic={haptic}
            />
          )}

          {/* Bito / Pass */}
          {isMyAttack && game.canPass && (
            <button
              onPointerDown={handlePass}
              className="flex-1 py-3 rounded-2xl font-bold text-sm text-white active:scale-95 transition-transform"
              style={{ background: 'rgba(21,128,61,0.92)' }}
            >
              ✅ Бито!
            </button>
          )}

          {/* Surrender */}
          <button
            onPointerDown={handleSurrender}
            className="px-3 py-3 rounded-2xl text-white/35 text-sm active:scale-95 transition-transform"
            style={{ background: 'rgba(0,0,0,0.3)' }}
            title="Сдаться"
          >
            🏳️
          </button>
        </div>
      )}

      {/* ── Player hand ── */}
      <div className="flex-shrink-0 pb-2" style={{ background: 'rgba(0,0,0,0.22)' }}>
        <div className="text-center text-white/30 text-[11px] pt-1">
          {isMyAttack ? 'Нажми карту — атака' : isMyDefend ? 'Нажми карту — защита' : 'Ход соперника'}
        </div>
        <PlayerHand
          cards={game.myCards}
          canPlay={canPlay}
          defenseTarget={defenseTarget}
          onCardClick={handleCardClick}
        />
      </div>
    </div>
  );
}

// ── TransferPicker: shows transfer-eligible cards in a mini popup ─────────────
interface TransferPickerProps {
  hand: import('../types').Card[];
  table: import('../types').AttackPair[];
  trumpSuit: import('../types').Suit;
  onTransfer: (card: import('../types').Card) => void;
  haptic: { impact: (style?: 'light' | 'medium' | 'heavy') => void };
}

function TransferPicker({ hand, table, onTransfer, haptic }: TransferPickerProps) {
  const [open, setOpen] = useState(false);
  const tableRanks = new Set(table.map(p => p.attack.rank));
  const eligible = hand.filter(c => tableRanks.has(c.rank));

  if (eligible.length === 0) return null;

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <button
        onPointerDown={() => { setOpen(o => !o); haptic.impact('light'); sfx.card(); }}
        className="w-full py-3 rounded-2xl font-bold text-sm active:scale-95 transition-transform"
        style={{ background: 'rgba(100, 50, 180, 0.92)', color: '#fff' }}
      >
        🔄 Перевести
      </button>
      {open && (
        <div style={{
          position: 'absolute', bottom: '110%', left: 0, right: 0,
          background: 'rgba(20,20,40,0.97)',
          border: '1px solid rgba(245,200,66,0.3)',
          borderRadius: 14,
          padding: '10px',
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          zIndex: 50,
          boxShadow: '0 -4px 24px rgba(0,0,0,0.6)',
        }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, position: 'absolute', top: 6, left: 0, right: 0, textAlign: 'center' }}>
            Выбери карту для перевода
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            {eligible.map(card => {
              const red = card.suit === 'hearts' || card.suit === 'diamonds';
              const sym = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }[card.suit];
              return (
                <button
                  key={card.id}
                  onPointerDown={() => { setOpen(false); onTransfer(card); }}
                  style={{
                    width: 48, height: 68,
                    background: 'linear-gradient(145deg, #fefcf3, #f0ecd8)',
                    borderRadius: 8,
                    border: '2px solid #f5c842',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 900, color: red ? '#c0392b' : '#111' }}>
                    {card.rank}
                  </span>
                  <span style={{ fontSize: 18, color: red ? '#c0392b' : '#111' }}>{sym}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
