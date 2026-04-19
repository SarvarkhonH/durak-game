import React from 'react';
import { Card, Suit } from '../types';

export type CardSize = 'hand' | 'table' | 'mini';

const DIMS: Record<CardSize, {
  w: number; h: number;
  rankPx: number; cornerPx: number; centerPx: number; facePx: number;
}> = {
  hand:  { w: 68,  h: 96,  rankPx: 20, cornerPx: 12, centerPx: 36, facePx: 30 },
  table: { w: 62,  h: 88,  rankPx: 17, cornerPx: 11, centerPx: 30, facePx: 25 },
  mini:  { w: 42,  h: 60,  rankPx: 13, cornerPx: 9,  centerPx: 20, facePx: 17 },
};

const SYM: Record<Suit, string> = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };
const isRed = (s: Suit) => s === 'hearts' || s === 'diamonds';

const FACE_SYM: Record<string, string> = { K: '♚', Q: '♛', J: '♞' };

function cardBg(rank: string, red: boolean): string {
  if (['J', 'Q', 'K'].includes(rank)) {
    return red
      ? 'linear-gradient(160deg, #fff9f9 0%, #ffecec 55%, #fff6f6 100%)'
      : 'linear-gradient(160deg, #f8f8ff 0%, #edeeff 55%, #f5f5ff 100%)';
  }
  return 'linear-gradient(145deg, #fefdf8, #f4edd8)';
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
  const color = red ? '#c0392b' : '#111';
  const sym = SYM[card.suit];
  const isFace = ['J', 'Q', 'K'].includes(card.rank);
  const isAce = card.rank === 'A';

  const shadow = lifted
    ? '0 14px 32px rgba(0,0,0,0.45), 0 3px 8px rgba(0,0,0,0.2)'
    : highlighted
    ? '0 0 0 3px #f5c842, 0 0 14px rgba(245,200,66,0.6), 0 2px 8px rgba(0,0,0,0.28)'
    : '0 3px 10px rgba(0,0,0,0.32), 0 1px 3px rgba(0,0,0,0.12)';

  return (
    <div
      onClick={onClick}
      className={`card-base select-none ${disabled ? 'opacity-50' : ''} ${onClick && !disabled ? 'cursor-pointer' : ''} ${className}`}
      style={{
        width: d.w,
        height: d.h,
        boxShadow: shadow,
        background: cardBg(card.rank, red),
        transform: lifted ? 'translateY(-14px) scale(1.09)' : undefined,
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Face card top tint strip */}
      {isFace && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: Math.round(d.h * 0.27),
          background: red
            ? 'linear-gradient(135deg, rgba(192,57,43,0.12), rgba(192,57,43,0.05))'
            : 'linear-gradient(135deg, rgba(26,26,140,0.09), rgba(26,26,140,0.03))',
          borderRadius: '10px 10px 0 0',
          borderBottom: `1px solid ${red ? 'rgba(192,57,43,0.1)' : 'rgba(26,26,26,0.07)'}`,
        }} />
      )}

      {/* Top-left corner */}
      <div style={{
        position: 'absolute', top: 3, left: 4,
        display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1, color,
      }}>
        <span style={{ fontSize: d.rankPx, fontWeight: 900, lineHeight: 1 }}>{card.rank}</span>
        <span style={{ fontSize: d.cornerPx, lineHeight: 1, marginTop: 1 }}>{sym}</span>
      </div>

      {/* Centre */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        {isFace ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: d.facePx, color, lineHeight: 1 }}>{FACE_SYM[card.rank]}</span>
            <span style={{ fontSize: d.cornerPx + 1, color, opacity: 0.5, lineHeight: 1 }}>{sym}</span>
          </div>
        ) : isAce ? (
          <span style={{ fontSize: d.centerPx + 6, color, lineHeight: 1, fontWeight: 900 }}>{sym}</span>
        ) : (
          <span style={{ fontSize: d.centerPx, color, lineHeight: 1 }}>{sym}</span>
        )}
      </div>

      {/* Bottom-right corner rotated */}
      <div style={{
        position: 'absolute', bottom: 3, right: 4,
        display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1,
        color, transform: 'rotate(180deg)',
      }}>
        <span style={{ fontSize: d.rankPx, fontWeight: 900, lineHeight: 1 }}>{card.rank}</span>
        <span style={{ fontSize: d.cornerPx, lineHeight: 1, marginTop: 1 }}>{sym}</span>
      </div>
    </div>
  );
}
