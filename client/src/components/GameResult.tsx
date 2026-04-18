import React from 'react';

interface Props {
  isWinner: boolean;
  balanceChange: number;
  newBalance: number;
  winnerName: string;
  loserName: string;
  onPlayAgain: () => void;
  onHome: () => void;
}

export function GameResult({ isWinner, balanceChange, newBalance, winnerName, loserName, onPlayAgain, onHome }: Props) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-felt-dark border border-gold/40 rounded-2xl p-6 max-w-xs w-full text-center animate-bounce-in shadow-2xl">
        <div className="text-6xl mb-3">{isWinner ? '🏆' : '😵'}</div>
        <h2 className="text-2xl font-bold text-white mb-1">
          {isWinner ? 'Победа!' : 'Дурак!'}
        </h2>
        <p className="text-white/60 text-sm mb-4">
          {isWinner ? `${winnerName} победил` : `${loserName} — дурак`}
        </p>

        <div className={`text-2xl font-bold mb-1 ${balanceChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {balanceChange > 0 ? '+' : ''}{balanceChange} монет
        </div>
        <div className="text-white/70 text-sm mb-6">
          Баланс: <span className="text-gold font-bold">{newBalance} 🪙</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onHome}
            className="flex-1 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 active:scale-95 transition-all"
          >
            🏠 Домой
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 rounded-xl bg-gold text-black font-bold hover:bg-yellow-400 active:scale-95 transition-all"
          >
            🎮 Ещё раз
          </button>
        </div>
      </div>
    </div>
  );
}
