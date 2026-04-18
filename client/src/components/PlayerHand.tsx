import React from 'react';
import { Card as CardType } from '../types';
import { Card } from './Card';

interface Props {
  cards: CardType[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  disabled?: boolean;
  label?: string;
}

export function PlayerHand({ cards, selectedIds, onSelect, disabled, label }: Props) {
  return (
    <div className="flex flex-col items-center gap-1 pb-2">
      {label && <div className="text-white/70 text-xs">{label}</div>}
      <div className="flex flex-wrap justify-center gap-1 max-w-sm px-2">
        {cards.map(card => (
          <Card
            key={card.id}
            card={card}
            selected={selectedIds.includes(card.id)}
            onClick={() => onSelect(card.id)}
            disabled={disabled}
          />
        ))}
        {cards.length === 0 && (
          <div className="text-white/40 text-sm py-4">Нет карт</div>
        )}
      </div>
    </div>
  );
}
