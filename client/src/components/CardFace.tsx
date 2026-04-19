import React from 'react';
import { Card, Suit } from '../types';

export type CardSize = 'hand' | 'table' | 'mini';

const DIMS: Record<CardSize, {
  w: number; h: number;
  rankPx: number; cornerPx: number; centerPx: number; facePx: number;
}> = {
  hand:  { w: 56, h: 80,  rankPx: 17, cornerPx: 10, centerPx: 30, facePx: 26 },
  table: { w: 48, h: 68,  rankPx: 14, cornerPx: 9,  centerPx: 24, facePx: 21 },
  mini:  { w: 36, h: 52,  rankPx: 11, cornerPx: 8,  centerPx: 18, facePx: 16 },
};

const SYM: Record<Suit, string> = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };
const isRed = (s: Suit) => s === 'hearts' || s === 'diamonds';

// Face card center symbols (chess unicode — universal support)
const FACE_SYM: Record<string, { black: string; red: string }> = {
  K: { black: '♚', red: '♛' },
  Q: { black: '♛', red: '♛' },
  J: { black: '♞', red: '♞' },
};

// Background tints for face cards vs plain cards
function cardBg(rank: string, red: boolean): string {
  if (['J', 'Q', 'K'].includes(rank)) {
    return red
      ? 'linear-gradient(160deg, #fff8f8 0%, #ffeded 50%, #fff5f5 100%)'
      : 'linear-gradient(160deg, #f8f8ff 0%, #edeeff 50%, #f5f5ff 100%)';
  }
  if (rank === 'A') {
    return red
      ? 'linear-gradient(145deg, #fffcf8, #fdf0e0)'
      : 'linear-gradient(145deg, #fefcf3, #f0ecd8)';
  }
  return 'linear-gradient(145deg, #fefcf3, #f0ecd8)';
}

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
  const isFace = ['J', 'Q', 'K'].includes(card.rank);
  const isAce = card.rank === 'A';

  const shadow = lifted
    ? '0 12px 28px rgba(0,0,0,0.42), 0 2px 6px rgba(0,0,0,0.2)'
    : highlighted
    ? '0 0 0 2.5px #f5c842, 0 0 12px rgba(245,200,66,0.55), 0 2px 8px rgba(0,0,0,0.28)'
    : '0 2px 8px rgba(0,0,0,0.28), 0 1px 2px rgba(0,0,0,0.1)';

  return (
    <div
      onClick={onClick}
      className={`card-base select-none ${disabled ? 'opacity-50' : ''} ${onClick && !disabled ? 'cursor-pointer' : ''} ${className}`}
      style={{
        width: d.w,
        height: d.h,
        boxShadow: shadow,
        background: cardBg(card.rank, red),
        transform: lifted ? 'translateY(-12px) scale(1.08)' : undefined,
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Face card: coloured top strip */}
      {isFace && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: Math.round(d.h * 0.28),
          background: red
            ? 'linear-gradient(135deg, rgba(192,57,43,0.13), rgba(192,57,43,0.07))'
            : 'linear-gradient(135deg, rgba(26,26,120,0.10), rgba(26,26,120,0.04))',
          borderRadius: '10px 10px 0 0',
          borderBottom: `1px solid ${red ? 'rgba(192,57,43,0.12)' : 'rgba(26,26,26,0.09)'}`,
        }} />
      )}

      {/* Top-left corner */}
      <div className="absolute top-[3px] left-[4px] flex flex-col items-center leading-none" style={{ color }}>
        <span style={{ fontSize: d.rankPx, fontWeight: 900, lineHeight: 1 }}>{card.rank}</span>
        <span style={{ fontSize: d.cornerPx, lineHeight: 1, marginTop: 1 }}>{sym}</span>
      </div>

      {/* Centre — face cards get chess symbol, aces get big suit, numbers get suit */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {isFace ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <span style={{ fontSize: d.facePx, color, lineHeight: 1, fontWeight: 400 }}>
              {FACE_SYM[card.rank][red ? 'red' : 'black']}
            </span>
            <span style={{ fontSize: d.cornerPx + 1, color, opacity: 0.55, lineHeight: 1 }}>{sym}</span>
          </div>
        ) : isAce ? (
          <span style={{ fontSize: d.centerPx + 4, color, lineHeight: 1, fontWeight: 900 }}>{sym}</span>
        ) : (
          <span style={{ fontSize: d.centerPx, color, lineHeight: 1 }}>{sym}</span>
        )}
      </div>

      {/* Bottom-right corner (rotated 180°) */}
      <div
        className="absolute bottom-[3px] right-[4px] flex flex-col items-center leading-none"
        style={{ color, transform: 'rotate(180deg)' }}
      >
        <span style={{ fontSize: d.rankPx, fontWeight: 900, lineHeight: 1 }}>{card.rank}</span>
        <span style={{ fontSize: d.cornerPx, lineHeight: 1, marginTop: 1 }}>{sym}</span>
      </div>
    </div>
  );
}
