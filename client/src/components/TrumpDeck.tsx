import React from 'react';
import { Card } from '../types';
import { CardFace } from './CardFace';

interface Props {
  trumpCard: Card;
  deckCount: number;
}

export function TrumpDeck({ trumpCard, deckCount }: Props) {
  if (deckCount === 0) return null;

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Trump card lying sideways (Durak tradition) */}
      <div style={{
        transform: 'rotate(90deg)',
        transformOrigin: 'center',
        filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.5))',
      }}>
        <CardFace card={trumpCard} size="mini" />
      </div>

      {/* Deck count */}
      <div style={{
        background: 'rgba(0,0,0,0.75)',
        color: '#fff',
        fontWeight: 800,
        borderRadius: 20,
        padding: '2px 8px',
        fontSize: 12,
        lineHeight: 1.4,
        border: '1px solid rgba(255,255,255,0.15)',
      }}>
        {deckCount}
      </div>
    </div>
  );
}
