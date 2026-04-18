import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerData } from '../types';
import { socket } from '../lib/socket';

interface Props {
  player: PlayerData | null;
}

const BET_OPTIONS = [10, 25, 50, 100];

export function Home({ player }: Props) {
  const navigate = useNavigate();
  const [bet, setBet] = useState(10);
  const [mode, setMode] = useState<'ai' | 'pvp'>('ai');

  function startGame() {
    if (!player) return;
    if (player.balance < bet) {
      alert('Недостаточно монет!');
      return;
    }
    if (mode === 'ai') {
      socket.emit('join_ai_game', { bet });
    } else {
      socket.emit('join_pvp_lobby', { bet });
    }
    navigate('/game');
  }

  return (
    <div className="flex flex-col h-full bg-felt overflow-y-auto">
      {/* Header */}
      <div className="text-center pt-8 pb-4 px-4">
        <div className="text-5xl mb-2">🃏</div>
        <h1 className="text-3xl font-bold text-gold">ДУРАК</h1>
        <p className="text-white/60 text-sm mt-1">Онлайн карточная игра</p>
      </div>

      {/* Balance */}
      {player && (
        <div className="mx-4 mb-4 bg-white/10 backdrop-blur rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-white/60 text-xs">Привет, {player.name}!</div>
            <div className="text-gold font-bold text-xl">{player.balance} 🪙</div>
          </div>
          <div className="text-right">
            <div className="text-white/60 text-xs">Побед / Игр</div>
            <div className="text-white font-semibold">{player.wins} / {player.gamesPlayed}</div>
          </div>
        </div>
      )}

      {/* Mode */}
      <div className="mx-4 mb-4">
        <div className="text-white/70 text-xs mb-2 text-center">Режим игры</div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('ai')}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
              mode === 'ai' ? 'bg-gold text-black' : 'bg-white/10 text-white'
            }`}
          >
            🤖 Против бота
          </button>
          <button
            onClick={() => setMode('pvp')}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
              mode === 'pvp' ? 'bg-gold text-black' : 'bg-white/10 text-white'
            }`}
          >
            👥 Мультиплеер
          </button>
        </div>
      </div>

      {/* Bet */}
      <div className="mx-4 mb-6">
        <div className="text-white/70 text-xs mb-2 text-center">Ставка</div>
        <div className="grid grid-cols-4 gap-2">
          {BET_OPTIONS.map(b => (
            <button
              key={b}
              onClick={() => setBet(b)}
              disabled={player ? player.balance < b : false}
              className={`py-3 rounded-xl font-bold text-sm transition-all ${
                bet === b ? 'bg-gold text-black' : 'bg-white/10 text-white'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {b}🪙
            </button>
          ))}
        </div>
      </div>

      {/* Play button */}
      <div className="mx-4 mb-4">
        <button
          onClick={startGame}
          disabled={!player}
          className="w-full py-4 bg-gold text-black font-bold text-lg rounded-2xl shadow-lg hover:bg-yellow-400 active:scale-95 transition-all disabled:opacity-50"
        >
          🎮 Играть — ставка {bet}🪙
        </button>
      </div>

      {/* Nav */}
      <div className="flex gap-2 mx-4 mb-4">
        <button onClick={() => navigate('/stats')} className="flex-1 py-3 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 transition-all">
          📊 Статистика
        </button>
        <button onClick={() => navigate('/leaderboard')} className="flex-1 py-3 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 transition-all">
          🏆 Рейтинг
        </button>
      </div>

      {/* Rules */}
      <div className="mx-4 mb-6 bg-white/5 rounded-xl p-4">
        <div className="text-white/70 text-xs font-semibold mb-2">КАК ИГРАТЬ</div>
        <div className="text-white/50 text-xs space-y-1">
          <p>🃏 36 карт, козырная масть — особая</p>
          <p>⚔️ Атакующий бьёт карты на стол</p>
          <p>🛡️ Защитник бьёт картами той же масти или козырем</p>
          <p>😵 Кто не смог — берёт карты. Остался с картами — Дурак!</p>
          <p>🏆 Победитель забирает ставку</p>
        </div>
      </div>
    </div>
  );
}
