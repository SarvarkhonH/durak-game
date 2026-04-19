import React from 'react';
import { PlayerState } from '../types';
import { CardBack } from './CardBack';

// Generate a consistent avatar color from a name
function avatarColor(name: string) {
  const colors = ['#7c3aed','#0369a1','#0f766e','#b45309','#be123c','#15803d','#1d4ed8'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length;
  return colors[h];
}

interface Props {
  opponent: PlayerState;
}

export function OpponentArea({ opponent }: Props) {
  const count = opponent.cardCount;
  const role = opponent.isAttacker ? '⚔️' : opponent.isDefender ? '🛡️' : '';
  const shown = Math.min(count, 6);
  const STEP = 22;
  const initials = opponent.name.slice(0, 2).toUpperCase();
  const bgColor = avatarColor(opponent.name);

  return (
    <div
      className="flex items-center justify-between px-3 flex-shrink-0"
      style={{ height: 72, background: 'rgba(0,0,0,0.28)' }}
    >
      {/* Left: avatar + name + role */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Avatar circle with initials */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: bgColor }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-white font-semibold text-sm leading-tight truncate max-w-[130px]">
            {opponent.name}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {role && <span className="text-xs">{role}</span>}
            <span className="bg-white/15 text-white/75 text-[11px] font-semibold px-1.5 py-0.5 rounded-full">
              {count} карт
            </span>
          </div>
        </div>
      </div>

      {/* Right: face-down card fan */}
      <div
        className="relative flex-shrink-0"
        style={{ width: shown > 0 ? 36 + (shown - 1) * STEP : 36, height: 52 }}
      >
        {Array.from({ length: shown }, (_, i) => (
          <CardBack
            key={i}
            size="mini"
            style={{
              position: 'absolute',
              left: i * STEP,
              top: 0,
              zIndex: i,
              transform: `rotate(${(i - (shown - 1) / 2) * 4}deg)`,
              transformOrigin: 'bottom center',
            }}
          />
        ))}
      </div>
    </div>
  );
}
