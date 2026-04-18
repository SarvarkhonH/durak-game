import React from 'react';
import { Card as CardType, SUIT_SYMBOL } from '../types';
import { Card } from './Card';

interface Props {
  trumpCard: CardType;
  deckCount: number;
}

export function TrumpCard({ trumpCard, deckCount }: Props) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-white/60 text-xs">Козырь</div>
      <div className="relative">
        <Card card={trumpCard} small />
        <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
          {SUIT_SYMBOL[trumpCard.suit]}
        </div>
      </div>
      <div className="text-white/60 text-xs">{deckCount} карт</div>
    </div>
  );
}
