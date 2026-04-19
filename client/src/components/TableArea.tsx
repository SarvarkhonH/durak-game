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
          <div style={{
            color: 'rgba(255,255,255,0.22)',
            fontSize: 14,
            textAlign: 'center',
            padding: '0 32px',
            lineHeight: 1.5,
          }}>
            ⚔️ Твой ход — выбери карту внизу
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-2">
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
        alignItems: 'center',
        maxWidth: '100%',
      }}>
        {table.map((pair, i) => {
          const isTarget = pair.attack.id === defenseTarget;
          const canTarget = isDefend && !pair.defense;

          return (
            <div
              key={`pair-${i}`}
              className="relative animate-card-deal"
              style={{
                animationDelay: `${i * 60}ms`,
                width: 62,
                height: 88,
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

              {/* Defense card overlaid */}
              {pair.defense && (
                <div
                  className="absolute animate-card-deal"
                  style={{ top: 9, left: 11, zIndex: 2, transform: 'rotate(9deg)' }}
                >
                  <CardFace card={pair.defense} size="table" />
                </div>
              )}

              {/* Empty defense slot */}
              {!pair.defense && isDefend && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: 9, left: 11, width: 62, height: 88,
                    border: `2px dashed ${isTarget ? 'rgba(245,200,66,0.8)' : 'rgba(255,255,255,0.25)'}`,
                    borderRadius: 10,
                    background: isTarget ? 'rgba(245,200,66,0.06)' : 'transparent',
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
