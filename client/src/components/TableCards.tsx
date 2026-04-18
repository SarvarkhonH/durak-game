import React from 'react';
import { AttackPair } from '../types';
import { Card } from './Card';

interface Props {
  table: AttackPair[];
  selectedDefenseTarget?: string;
  onSelectTarget?: (id: string) => void;
  isDefender?: boolean;
}

export function TableCards({ table, selectedDefenseTarget, onSelectTarget, isDefender }: Props) {
  if (table.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white/30 text-sm">
        Стол пуст — ваш ход
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 items-center justify-center p-2 overflow-auto">
      {table.map((pair, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <Card
            card={pair.attack}
            glow={isDefender && !pair.defense && selectedDefenseTarget === pair.attack.id}
            onClick={
              isDefender && !pair.defense && onSelectTarget
                ? () => onSelectTarget(pair.attack.id)
                : undefined
            }
          />
          {pair.defense ? (
            <div className="-mt-10 ml-4">
              <Card card={pair.defense} />
            </div>
          ) : isDefender ? (
            <div className="h-6 w-14 border-2 border-dashed border-white/30 rounded-lg mt-1 flex items-center justify-center">
              <span className="text-white/30 text-xs">бей</span>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
