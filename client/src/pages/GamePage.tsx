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

interface GameOverData {
  winner: string;
  loser: string;
  balanceChange: number;
  newBalance: number;
  winnerName: string;
  loserName: string;
}

const SUIT_LABEL: Record<string, string> = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };

export function GamePage() {
  const navigate = useNavigate();
  const { haptic } = useTelegram();

  const [game, setGame] = useState<GameState | null>(null);
  const [result, setResult] = useState<GameOverData | null>(null);
  const [waiting, setWaiting] = useState(true);
  const [defenseTarget, setDefenseTarget] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    });
    socket.on('game_update', (state: GameState) => {
      setGame(state);
      setDefenseTarget(null);
    });
    socket.on('game_over', (data: GameOverData) => {
      data.balanceChange > 0 ? haptic.success() : haptic.error();
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
    };
  }, []);

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
      return;
    }

    if (isMyDefend) {
      const undefended = game.table.filter(p => !p.defense);
      if (undefended.length === 0) return;

      if (undefended.length === 1) {
        socket.emit('defend', { gameId: game.id, cardId: card.id, targetId: undefended[0].attack.id });
        haptic.impact('light');
        setDefenseTarget(null);
      } else if (defenseTarget) {
        socket.emit('defend', { gameId: game.id, cardId: card.id, targetId: defenseTarget });
        haptic.impact('light');
        setDefenseTarget(null);
      } else {
        flash('Нажми на карту противника сначала');
      }
    }
  }, [game, isMyAttack, isMyDefend, defenseTarget, haptic]);

  const handleTableCardClick = useCallback((attackCardId: string) => {
    if (!isMyDefend) return;
    setDefenseTarget(attackCardId);
    haptic.impact('light');
    flash('Теперь выбери карту для защиты', 1500);
  }, [isMyDefend, haptic]);

  function handleSurrender() {
    if (!game) return;
    if (window.confirm('Сдаться? Ты потеряешь ставку.')) {
      socket.emit('surrender', { gameId: game.id });
    }
  }

  // ── Turn status ────────────────────────────────────────────────────────────
  const turnConfig = (() => {
    if (!game) return { text: '...', bg: 'rgba(100,116,139,0.7)' };
    if (isMyAttack) return { text: '⚔️ Твоя атака', bg: 'rgba(22,163,74,0.88)' };
    if (isMyDefend) return { text: '🛡️ Защищайся!', bg: 'rgba(220,38,38,0.88)' };
    return { text: '⏳ Ход бота...', bg: 'rgba(161,98,7,0.82)' };
  })();

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
      <div className="flex flex-col items-center justify-center h-full gap-4"
           style={{ background: '#1a3a1a' }}>
        <div className="text-5xl animate-spin">🃏</div>
        <div className="text-white/80 font-semibold text-lg">Ищем противника...</div>
        <button
          onClick={() => navigate('/')}
          className="text-white/40 text-sm underline mt-4"
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
      style={{ background: '#1a3a1a', touchAction: 'none' }}
    >
      {/* ── Opponent area ── */}
      {opponent && <OpponentArea opponent={opponent} />}

      {/* ── Trump card (absolute top-right) ── */}
      <div className="absolute top-[80px] right-3 z-20">
        <TrumpDeck trumpCard={game.trumpCard} deckCount={game.deckCount} />
      </div>

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
        <span className="text-white font-semibold text-sm">{turnConfig.text}</span>
        {defenseTarget && (
          <span className="text-yellow-300 text-xs font-medium animate-pulse">
            Выбери карту для защиты ↓
          </span>
        )}
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 font-bold text-sm">
            {SUIT_LABEL[game.trumpSuit]}
          </span>
          <span className="text-white/60 text-xs">{game.bet}🪙</span>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className="flex-shrink-0 bg-black/75 text-white text-center text-sm py-2 px-4 animate-slide-up">
          {toast}
        </div>
      )}

      {/* ── Action buttons ── */}
      {(isMyDefend || (isMyAttack && game.canPass) || game.phase !== 'finished') && (
        <div className="flex gap-2 px-3 py-2 flex-shrink-0" style={{ background: 'rgba(0,0,0,0.25)' }}>
          {isMyDefend && (
            <button
              onPointerDown={() => { socket.emit('take', { gameId: game.id }); haptic.impact('medium'); }}
              className="flex-1 py-3 rounded-2xl font-bold text-sm text-white active:scale-95 transition-transform"
              style={{ background: 'rgba(185,28,28,0.92)' }}
            >
              📥 Взять карты
            </button>
          )}
          {isMyAttack && game.canPass && (
            <button
              onPointerDown={() => { socket.emit('pass', { gameId: game.id }); haptic.impact('medium'); }}
              className="flex-1 py-3 rounded-2xl font-bold text-sm text-white active:scale-95 transition-transform"
              style={{ background: 'rgba(21,128,61,0.92)' }}
            >
              ✅ Бито!
            </button>
          )}
          {/* Surrender — always visible during active game */}
          <button
            onPointerDown={handleSurrender}
            className="px-3 py-3 rounded-2xl text-white/40 text-sm hover:text-white/70 transition-colors active:scale-95"
            style={{ background: 'rgba(0,0,0,0.3)' }}
            title="Сдаться"
          >
            🏳️
          </button>
        </div>
      )}

      {/* ── Player hand ── */}
      <div className="flex-shrink-0 pb-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
        <div className="text-center text-white/35 text-[11px] pt-1 pb-0">
          {isMyAttack ? 'Нажми карту — атака' : isMyDefend ? 'Нажми карту — защита' : 'Жди своего хода'}
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
