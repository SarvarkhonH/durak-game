import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../lib/socket';
import { GameState, Card as CardType } from '../types';
import { OpponentHand } from '../components/OpponentHand';
import { TableCards } from '../components/TableCards';
import { TrumpCard } from '../components/TrumpCard';
import { GameResult } from '../components/GameResult';
import { Card } from '../components/Card';
import { SUIT_SYMBOL, SUIT_COLOR } from '../types';
import { useTelegram } from '../hooks/useTelegram';

interface GameOverData {
  winner: string;
  loser: string;
  balanceChange: number;
  newBalance: number;
  winnerName: string;
  loserName: string;
}

export function GamePage() {
  const navigate = useNavigate();
  const { haptic } = useTelegram();
  const [game, setGame] = useState<GameState | null>(null);
  const [result, setResult] = useState<GameOverData | null>(null);
  const [message, setMessage] = useState('');
  const [waiting, setWaiting] = useState(true);
  // For defense: which attack card is being targeted
  const [defenseTarget, setDefenseTarget] = useState<string | null>(null);

  useEffect(() => {
    socket.on('game_start', (state: GameState) => { setGame(state); setWaiting(false); });
    socket.on('game_update', (state: GameState) => { setGame(state); setDefenseTarget(null); });
    socket.on('game_over', (data: GameOverData) => {
      setGame(null);
      setResult(data);
      data.balanceChange > 0 ? haptic.success() : haptic.error();
    });
    socket.on('waiting', () => setWaiting(true));
    socket.on('error', ({ message: m }: { message: string }) => {
      setMessage(m);
      setTimeout(() => setMessage(''), 2000);
    });
    return () => { socket.off('game_start'); socket.off('game_update'); socket.off('game_over'); socket.off('waiting'); socket.off('error'); };
  }, []);

  const me = game?.players.find(p => p.id === game.myId);
  const isMyAttack = game ? game.phase === 'attack' && me?.isAttacker : false;
  const isMyDefend = game ? game.phase === 'defend' && me?.isDefender : false;

  const handleCardClick = useCallback((card: CardType) => {
    if (!game) return;

    if (isMyAttack) {
      // One click = attack with that card
      socket.emit('attack', { gameId: game.id, cardId: card.id });
      haptic.impact('light');
      return;
    }

    if (isMyDefend) {
      const undefended = game.table.filter(p => !p.defense);

      if (undefended.length === 1) {
        // Only one attack card — auto-target it
        socket.emit('defend', { gameId: game.id, cardId: card.id, targetId: undefended[0].attack.id });
        haptic.impact('light');
        setDefenseTarget(null);
      } else if (defenseTarget) {
        // Target already chosen — defend it
        socket.emit('defend', { gameId: game.id, cardId: card.id, targetId: defenseTarget });
        haptic.impact('light');
        setDefenseTarget(null);
      } else {
        // Multiple attacks, no target chosen yet
        setMessage('Выбери карту противника на столе');
        setTimeout(() => setMessage(''), 1500);
      }
    }
  }, [game, isMyAttack, isMyDefend, defenseTarget, haptic]);

  const handleTableCardClick = useCallback((targetId: string) => {
    if (!isMyDefend) return;
    setDefenseTarget(targetId);
    haptic.impact('light');
    setMessage('Теперь выбери свою карту');
    setTimeout(() => setMessage(''), 1500);
  }, [isMyDefend, haptic]);

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

  function handleSurrender() {
    if (!game) return;
    if (window.confirm('Сдаться? Ты потеряешь ставку.')) {
      socket.emit('surrender', { gameId: game.id });
    }
  }

  if (waiting || !game) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-felt gap-4">
        <div className="text-5xl animate-spin">🃏</div>
        <div className="text-white font-semibold text-lg">Ищем противника...</div>
        <button onClick={() => navigate('/')} className="text-white/40 text-sm underline mt-4">Отмена</button>
      </div>
    );
  }

  const opponent = game.players.find(p => p.id !== game.myId);

  return (
    <div className="flex flex-col h-full bg-felt overflow-hidden select-none">

      {/* Opponent */}
      <div className="bg-black/20 px-3 pt-2 pb-1">
        {opponent && (
          <OpponentHand
            cardCount={opponent.cardCount}
            name={opponent.name}
            isAttacker={opponent.isAttacker}
            isDefender={opponent.isDefender}
          />
        )}
      </div>

      {/* Info bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-black/30 text-xs">
        <TrumpCard trumpCard={game.trumpCard} deckCount={game.deckCount} />
        <div className="text-center">
          <div className={`font-bold text-sm ${isMyAttack || isMyDefend ? 'text-green-400' : 'text-white/50'}`}>
            {isMyAttack ? '⚔️ Ваш ход — атака' : isMyDefend ? '🛡️ Ваш ход — защита' : '⏳ Ход бота...'}
          </div>
          {defenseTarget && <div className="text-yellow-300 text-xs">Выбери карту для защиты</div>}
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <div className="text-gold font-bold">{game.bet}🪙</div>
          <button
            onClick={handleSurrender}
            className="text-white/30 text-xs hover:text-white/60 transition-all"
            title="Сдаться"
          >
            🏳️ Сдаться
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 bg-felt-dark/40 border-y border-white/10">
        <TableCards
          table={game.table}
          selectedDefenseTarget={defenseTarget ?? undefined}
          onSelectTarget={isMyDefend ? handleTableCardClick : undefined}
          isDefender={isMyDefend}
        />
        {game.table.length === 0 && isMyAttack && (
          <div className="flex items-center justify-center h-full text-white/30 text-sm">
            Нажми на карту снизу чтобы атаковать
          </div>
        )}
      </div>

      {/* Toast message */}
      {message && (
        <div className="bg-black/80 text-white text-center text-sm py-2 px-4">
          {message}
        </div>
      )}

      {/* Action buttons */}
      {(isMyDefend || (isMyAttack && game.canPass)) && (
        <div className="flex gap-2 px-3 py-2 bg-black/20">
          {isMyDefend && (
            <button
              onClick={() => socket.emit('take', { gameId: game.id })}
              className="flex-1 py-3 bg-red-700 text-white font-bold rounded-xl text-sm active:scale-95 transition-all"
            >
              📥 Взять карты
            </button>
          )}
          {isMyAttack && game.canPass && (
            <button
              onClick={() => socket.emit('pass', { gameId: game.id })}
              className="flex-1 py-3 bg-green-700 text-white font-bold rounded-xl text-sm active:scale-95 transition-all"
            >
              ✅ Бито
            </button>
          )}
        </div>
      )}

      {/* Player hand */}
      <div className="bg-black/20 pb-3 pt-1">
        <div className="text-center text-white/40 text-xs mb-1">
          {me?.isAttacker ? 'Нажми карту чтобы атаковать' : me?.isDefender ? 'Нажми карту чтобы отбить' : 'Жди свой ход'}
        </div>
        <div className="flex flex-wrap justify-center gap-1 px-2">
          {game.myCards.map(card => {
            const isRed = SUIT_COLOR[card.suit] === 'red';
            const canPlay = isMyAttack || isMyDefend;
            return (
              <div
                key={card.id}
                onClick={() => canPlay && handleCardClick(card)}
                className={[
                  'w-14 h-20 rounded-lg border flex flex-col justify-between p-1 flex-shrink-0 transition-all duration-150',
                  isRed ? 'text-red-600' : 'text-gray-900',
                  'bg-white border-gray-300 shadow-md',
                  canPlay ? 'cursor-pointer active:scale-90 active:-translate-y-2' : 'opacity-60 cursor-default',
                  defenseTarget && isMyDefend ? 'hover:-translate-y-3 hover:shadow-xl' : canPlay ? 'hover:-translate-y-1' : '',
                ].join(' ')}
              >
                <div className="font-bold text-sm leading-none">{card.rank}</div>
                <div className="text-center text-xl leading-none">{SUIT_SYMBOL[card.suit]}</div>
                <div className="font-bold text-sm leading-none self-end rotate-180">{card.rank}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
