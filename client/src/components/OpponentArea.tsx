import React from 'react';
import { PlayerState } from '../types';
import { CardBack } from './CardBack';

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
  const shown = Math.min(count, 7);
  const STEP = 20;
  const initials = opponent.name.slice(0, 2).toUpperCase();
  const bgColor = avatarColor(opponent.name);

  return (
    <div
      className="flex items-center justify-between px-3 flex-shrink-0"
      style={{
        height: 72,
        background: 'rgba(0,0,0,0.35)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Left: avatar + name + role + card count */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{
            background: bgColor,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            border: '2px solid rgba(255,255,255,0.15)',
          }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-white font-bold text-[15px] leading-tight truncate max-w-[120px]">
            {opponent.name}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {role && <span className="text-xs">{role}</span>}
            {/* Card count badge */}
            <span style={{
              background: count <= 2 ? 'rgba(220,38,38,0.7)' : 'rgba(255,255,255,0.15)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 20,
            }}>
              {count} {count === 1 ? 'карта' : count < 5 ? 'карты' : 'карт'}
            </span>
          </div>
        </div>
      </div>

      {/* Right: face-down card fan */}
      {shown > 0 && (
        <div
          className="relative flex-shrink-0"
          style={{ width: 36 + (shown - 1) * STEP, height: 52 }}
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
                transform: `rotate(${(i - (shown - 1) / 2) * 3.5}deg)`,
                transformOrigin: 'bottom center',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
