import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerData } from '../types';
import { socket } from '../lib/socket';

interface Props {
  player: PlayerData | null;
}

export function Home({ player }: Props) {
  const navigate = useNavigate();
  const [bet, setBet] = useState('10');
  const [error, setError] = useState('');

  function startGame() {
    if (!player) return;
    const amount = parseInt(bet) || 0;
    if (amount < 1) { setError('Минимальная ставка 1 монета'); return; }
    if (amount > player.balance) { setError('Недостаточно монет!'); return; }
    setError('');
    socket.emit('join_ai_game', { bet: amount });
    navigate('/game');
  }

  return (
    <div className="flex flex-col h-full bg-felt overflow-y-auto">
      {/* Header */}
      <div className="text-center pt-10 pb-6 px-4">
        <div className="text-6xl mb-3">🃏</div>
        <h1 className="text-4xl font-bold text-gold">ДУРАК</h1>
        <p className="text-white/50 text-sm mt-1">Карточная игра</p>
      </div>

      {/* Balance */}
      {player && (
        <div className="mx-4 mb-6 bg-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-white/50 text-xs mb-1">Привет, {player.name}!</div>
            <div className="text-gold font-bold text-2xl">{player.balance} 🪙</div>
          </div>
          <div className="text-right">
            <div className="text-white/50 text-xs mb-1">Победы</div>
            <div className="text-white font-bold text-lg">{player.wins} / {player.gamesPlayed}</div>
          </div>
        </div>
      )}

      {/* Bet input */}
      <div className="mx-4 mb-6">
        <div className="text-white/60 text-sm mb-2 text-center">Ставка (монеты)</div>
        <input
          type="number"
          min="1"
          max={player?.balance ?? 9999}
          value={bet}
          onChange={e => { setBet(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && startGame()}
          className="w-full px-4 py-4 text-center text-2xl font-bold bg-white/10 text-gold border-2 border-gold/40 rounded-2xl focus:outline-none focus:border-gold"
          placeholder="10"
        />
        {error && <div className="text-red-400 text-sm text-center mt-2">{error}</div>}
      </div>

      {/* Play button */}
      <div className="mx-4 mb-4">
        <button
          onClick={startGame}
          disabled={!player}
          className="w-full py-5 bg-gold text-black font-bold text-xl rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-50"
        >
          🎮 Играть
        </button>
      </div>

      {/* Nav */}
      <div className="flex gap-2 mx-4 mb-6">
        <button onClick={() => navigate('/stats')} className="flex-1 py-3 bg-white/10 text-white rounded-xl text-sm font-medium">
          📊 Статистика
        </button>
        <button onClick={() => navigate('/leaderboard')} className="flex-1 py-3 bg-white/10 text-white rounded-xl text-sm font-medium">
          🏆 Рейтинг
        </button>
      </div>
    </div>
  );
}
