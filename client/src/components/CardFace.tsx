import React from 'react';
import { Card, Suit } from '../types';

export type CardSize = 'hand' | 'table' | 'mini';

const DIMS: Record<CardSize, { w: number; h: number; rank: string; center: string; corner: string }> = {
  hand:  { w: 56,  h: 80,  rank: 'text-[18px]', center: 'text-[34px]', corner: 'text-[11px]' },
  table: { w: 48,  h: 68,  rank: 'text-[15px]', center: 'text-[28px]', corner: 'text-[10px]' },
  mini:  { w: 36,  h: 52,  rank: 'text-[12px]', center: 'text-[20px]', corner: 'text-[9px]'  },
};

const SYM: Record<Suit, string> = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };
const isRed = (s: Suit) => s === 'hearts' || s === 'diamonds';

interface Props {
  card: Card;
  size?: CardSize;
  highlighted?: boolean;
  lifted?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function CardFace({
  card, size = 'hand', highlighted, lifted, disabled, onClick, className = '', style,
}: Props) {
  const d = DIMS[size];
  const red = isRed(card.suit);
  const color = red ? '#c0392b' : '#1a1a1a';
  const sym = SYM[card.suit];

  const shadow = lifted
    ? '0 10px 24px rgba(0,0,0,0.38), 0 2px 6px rgba(0,0,0,0.2)'
    : highlighted
    ? '0 0 0 2px #f5c842, 0 0 10px rgba(245,200,66,0.45), 0 2px 8px rgba(0,0,0,0.28)'
    : '0 2px 8px rgba(0,0,0,0.28), 0 1px 2px rgba(0,0,0,0.1)';

  return (
    <div
      onClick={onClick}
      className={`card-base select-none ${disabled ? 'opacity-50' : ''} ${onClick && !disabled ? 'cursor-pointer' : ''} ${className}`}
      style={{
        width: d.w,
        height: d.h,
        boxShadow: shadow,
        transform: lifted ? 'translateY(-10px) scale(1.07)' : undefined,
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Top-left corner */}
      <div className="absolute top-[3px] left-[4px] flex flex-col items-center leading-none" style={{ color }}>
        <span className={`${d.rank} font-bold leading-none`}>{card.rank}</span>
        <span className={`${d.corner} leading-none mt-[1px]`}>{sym}</span>
      </div>

      {/* Centre suit */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className={`${d.center} leading-none`} style={{ color }}>{sym}</span>
      </div>

      {/* Bottom-right corner (rotated 180°) */}
      <div
        className="absolute bottom-[3px] right-[4px] flex flex-col items-center leading-none rotate-180"
        style={{ color }}
      >
        <span className={`${d.rank} font-bold leading-none`}>{card.rank}</span>
        <span className={`${d.corner} leading-none mt-[1px]`}>{sym}</span>
      </div>
    </div>
  );
}
