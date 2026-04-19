import React, { useState } from 'react';
import { Card } from '../types';
import { CardFace } from './CardFace';

interface Props {
  cards: Card[];
  canPlay: boolean;
  defenseTarget: string | null;
  onCardClick: (card: Card) => void;
}

export function PlayerHand({ cards, canPlay, defenseTarget, onCardClick }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const n = cards.length;
  if (n === 0) return <div style={{ height: 130 }} />;

  const maxHalfAngle = Math.min(n * 4, 22);
  const step = n > 1 ? (maxHalfAngle * 2) / (n - 1) : 0;
  // wider spread on wider screens, tighter when lots of cards
  const xStep = Math.min(56, 320 / Math.max(n, 1));

  return (
    <div
      className="relative flex justify-center items-end"
      style={{ height: 130, flexShrink: 0 }}
    >
      {cards.map((card, i) => {
        const angle = n > 1 ? -maxHalfAngle + i * step : 0;
        const xOffset = (i - (n - 1) / 2) * xStep;
        const yDip = Math.abs(angle) * 0.6;
        const isActive = activeId === card.id;
        const hasTarget = defenseTarget !== null;

        const transform = isActive && canPlay
          ? `translateX(${xOffset}px) translateY(${yDip - 18}px) rotate(${angle}deg) scale(1.12)`
          : `translateX(${xOffset}px) translateY(${yDip}px) rotate(${angle}deg)`;

        return (
          <div
            key={card.id}
            style={{
              position: 'absolute',
              bottom: 4,
              zIndex: isActive ? 50 : i,
              transform,
              transformOrigin: 'bottom center',
              transition: 'transform 120ms ease',
            }}
            onPointerDown={() => canPlay && setActiveId(card.id)}
            onPointerUp={() => {
              if (canPlay && activeId === card.id) onCardClick(card);
              setActiveId(null);
            }}
            onPointerLeave={() => setActiveId(null)}
          >
            <CardFace
              card={card}
              size="hand"
              lifted={isActive && canPlay}
              highlighted={hasTarget && canPlay}
              disabled={!canPlay}
            />
          </div>
        );
      })}
    </div>
  );
}
