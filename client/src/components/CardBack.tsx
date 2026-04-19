import React, { useId } from 'react';
import { CardSize } from './CardFace';

const DIMS: Record<CardSize, { w: number; h: number }> = {
  hand:  { w: 56, h: 80  },
  table: { w: 48, h: 68  },
  mini:  { w: 36, h: 52  },
};

interface Props {
  size?: CardSize;
  className?: string;
  style?: React.CSSProperties;
}

export function CardBack({ size = 'hand', className = '', style }: Props) {
  const id = useId().replace(/:/g, '');  // make valid SVG id
  const { w, h } = DIMS[size];

  return (
    <div
      className={`card-base overflow-hidden ${className}`}
      style={{ width: w, height: h, flexShrink: 0, ...style }}
    >
      {/* Deep blue gradient background */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #0f2d5a 0%, #1a4a8a 45%, #0f2d5a 100%)' }}
      />

      {/* Diamond crosshatch SVG pattern */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.18 }}
      >
        <defs>
          <pattern id={`cbp-${id}`} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M5 0 L10 5 L5 10 L0 5 Z" fill="none" stroke="white" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#cbp-${id})`} />
      </svg>

      {/* Gold inset border */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: 4,
          border: '1px solid rgba(245,200,66,0.42)',
          borderRadius: 6,
        }}
      />

      {/* Tiny centre spade */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span style={{ fontSize: Math.round(w * 0.38), color: 'rgba(245,200,66,0.38)', lineHeight: 1 }}>
          ♠
        </span>
      </div>
    </div>
  );
}
