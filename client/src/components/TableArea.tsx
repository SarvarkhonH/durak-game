import React from 'react';
import { AttackPair } from '../types';
import { CardFace } from './CardFace';

interface Props {
  table: AttackPair[];
  defenseTarget: string | null;
  isDefend: boolean;
  isAttack: boolean;
  canPass: boolean;
  onTableCardClick: (attackCardId: string) => void;
}

export function TableArea({
  table, defenseTarget, isDefend, isAttack, canPass, onTableCardClick,
}: Props) {
  if (table.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        {isAttack && (
          <div className="text-white/30 text-sm text-center px-6">
            Нажми карту снизу — атака
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-3">
      <div className="flex flex-wrap gap-3 justify-center items-center">
        {table.map((pair, i) => {
          const isTarget = pair.attack.id === defenseTarget;
          const canTarget = isDefend && !pair.defense;

          return (
            <div
              key={`pair-${i}`}
              className="relative animate-card-deal"
              style={{
                animationDelay: `${i * 60}ms`,
                // pair wrapper size = attack card size, defense offsets absolutely
                width: 48,
                height: 68,
              }}
            >
              {/* Attack card */}
              <CardFace
                card={pair.attack}
                size="table"
                highlighted={isTarget}
                onClick={canTarget ? () => onTableCardClick(pair.attack.id) : undefined}
                className={isTarget ? 'animate-pulse-ring' : ''}
                style={canTarget ? { cursor: 'pointer' } : undefined}
              />

              {/* Defense card — overlaps diagonally */}
              {pair.defense && (
                <div
                  className="absolute animate-card-deal"
                  style={{ top: 8, left: 10, zIndex: 2, transform: 'rotate(8deg)' }}
                >
                  <CardFace card={pair.defense} size="table" />
                </div>
              )}

              {/* Empty defense slot hint */}
              {!pair.defense && isDefend && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: 8, left: 10, width: 48, height: 68,
                    border: `2px dashed ${isTarget ? 'rgba(245,200,66,0.7)' : 'rgba(255,255,255,0.2)'}`,
                    borderRadius: 8,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
