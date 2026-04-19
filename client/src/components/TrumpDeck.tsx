import React from 'react';
import { Card } from '../types';
import { CardFace } from './CardFace';

interface Props {
  trumpCard: Card;
  deckCount: number;
}

export function TrumpDeck({ trumpCard, deckCount }: Props) {
  return (
    <div className="flex flex-col items-center gap-1">
      {/* Trump card rotated 90° — lying sideways (Durak convention) */}
      <div style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
        <CardFace card={trumpCard} size="mini" />
      </div>

      {/* Deck count badge */}
      <div className="bg-black/65 text-white font-bold rounded-full px-2 py-0.5 text-[11px] leading-none">
        {deckCount > 0 ? deckCount : '—'}
      </div>
    </div>
  );
}
