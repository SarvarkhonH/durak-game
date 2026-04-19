import React, { useId } from 'react';
import { CardSize } from './CardFace';

const DIMS: Record<CardSize, { w: number; h: number }> = {
  hand:  { w: 68, h: 96  },
  table: { w: 62, h: 88  },
  mini:  { w: 42, h: 60  },
};

interface Props {
  size?: CardSize;
  className?: string;
  style?: React.CSSProperties;
}

export function CardBack({ size = 'hand', className = '', style }: Props) {
  const id = useId().replace(/:/g, '');
  const { w, h } = DIMS[size];
  const cell = 9;

  return (
    <div
      className={`card-base overflow-hidden ${className}`}
      style={{ width: w, height: h, flexShrink: 0, ...style }}
    >
      {/* Rich deep green gradient — casino back */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(145deg, #0a3d20 0%, #1a6b3a 45%, #0e4a26 100%)',
      }} />

      {/* Argyle diamond pattern */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Large diamonds */}
          <pattern id={`ld-${id}`} x="0" y="0" width={cell * 2} height={cell * 2} patternUnits="userSpaceOnUse">
            <path
              d={`M${cell} 0 L${cell * 2} ${cell} L${cell} ${cell * 2} L0 ${cell} Z`}
              fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.7"
            />
          </pattern>
          {/* Small inner diamonds */}
          <pattern id={`sd-${id}`} x={cell * 0.5} y={cell * 0.5} width={cell * 2} height={cell * 2} patternUnits="userSpaceOnUse">
            <path
              d={`M${cell} 0 L${cell * 2} ${cell} L${cell} ${cell * 2} L0 ${cell} Z`}
              fill="rgba(255,255,255,0.05)" stroke="none"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#sd-${id})`} />
        <rect width="100%" height="100%" fill={`url(#ld-${id})`} />
      </svg>

      {/* Diagonal cross lines inside diamonds */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.12 }}>
        <defs>
          <pattern id={`x-${id}`} x="0" y="0" width={cell * 2} height={cell * 2} patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2={cell * 2} y2={cell * 2} stroke="white" strokeWidth="0.5" />
            <line x1={cell * 2} y1="0" x2="0" y2={cell * 2} stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#x-${id})`} />
      </svg>

      {/* Gold inset border */}
      <div className="absolute pointer-events-none" style={{
        inset: 4,
        border: '1.5px solid rgba(245,200,66,0.5)',
        borderRadius: 6,
      }} />

      {/* Inner gold border (double border effect) */}
      <div className="absolute pointer-events-none" style={{
        inset: 7,
        border: '1px solid rgba(245,200,66,0.2)',
        borderRadius: 4,
      }} />

      {/* Centre spade in gold */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span style={{ fontSize: Math.round(w * 0.28), color: 'rgba(245,200,66,0.55)', lineHeight: 1 }}>♠</span>
      </div>
    </div>
  );
}
