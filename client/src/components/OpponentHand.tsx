import React from 'react';
import { CardBack } from './Card';

interface Props {
  cardCount: number;
  name: string;
  isAttacker: boolean;
  isDefender: boolean;
}

export function OpponentHand({ cardCount, name, isAttacker, isDefender }: Props) {
  const role = isAttacker ? '⚔️ Атакует' : isDefender ? '🛡️ Защищается' : '';

  return (
    <div className="flex flex-col items-center gap-1 py-2">
      <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
        <span>🤖 {name}</span>
        {role && <span className="text-yellow-300 text-xs">{role}</span>}
        <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{cardCount} карт</span>
      </div>
      <div className="flex gap-1 flex-wrap justify-center max-w-xs">
        {Array.from({ length: Math.min(cardCount, 8) }).map((_, i) => (
          <CardBack key={i} small />
        ))}
        {cardCount > 8 && <span className="text-white/60 text-xs self-center">+{cardCount - 8}</span>}
      </div>
    </div>
  );
}
