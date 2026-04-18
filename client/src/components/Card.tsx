import React from 'react';
import { Card as CardType, SUIT_SYMBOL, SUIT_COLOR } from '../types';

interface Props {
  card: CardType;
  selected?: boolean;
  onClick?: () => void;
  small?: boolean;
  disabled?: boolean;
  glow?: boolean;
}

export function Card({ card, selected, onClick, small, disabled, glow }: Props) {
  const isRed = SUIT_COLOR[card.suit] === 'red';
  const sym = SUIT_SYMBOL[card.suit];
  const sizeClass = small ? 'w-10 h-14 text-xs' : 'w-14 h-20 text-sm';

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={[
        sizeClass,
        'relative rounded-lg border select-none flex-shrink-0',
        'flex flex-col justify-between p-1',
        'transition-all duration-200',
        isRed ? 'text-red-600' : 'text-gray-900',
        selected
          ? 'bg-yellow-50 border-yellow-400 -translate-y-3 shadow-lg shadow-yellow-400/50'
          : 'bg-white border-gray-300 shadow-md',
        glow ? 'animate-pulse-glow' : '',
        onClick && !disabled ? 'cursor-pointer hover:-translate-y-1 active:scale-95' : 'cursor-default',
        disabled ? 'opacity-60' : '',
      ].join(' ')}
    >
      <div className="font-bold leading-none">{card.rank}</div>
      <div className="text-center text-lg leading-none">{sym}</div>
      <div className="font-bold leading-none self-end rotate-180">{card.rank}</div>
    </div>
  );
}

export function CardBack({ small }: { small?: boolean }) {
  const sizeClass = small ? 'w-10 h-14' : 'w-14 h-20';
  return (
    <div className={`${sizeClass} rounded-lg border border-blue-700 bg-blue-800 shadow-md flex-shrink-0 flex items-center justify-center`}>
      <div className="w-3/4 h-3/4 rounded border border-blue-600 bg-gradient-to-br from-blue-700 to-blue-900" />
    </div>
  );
}
