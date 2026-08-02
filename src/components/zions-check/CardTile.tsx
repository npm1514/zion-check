'use client';

import { Card } from '@/types/game';
import { cn } from '@/lib/utils';

export type CardSize = 'sm' | 'md' | 'lg';

interface CardTileProps {
  card: Card;
  selected?: boolean;
  disabled?: boolean;
  faceDown?: boolean;
  size?: CardSize;
  onClick?: () => void;
  className?: string;
}

const SIZE: Record<CardSize, { card: string; rank: string; symbol: string }> = {
  sm: { card: 'w-10 h-14', rank: 'text-[9px]',  symbol: 'text-base' },
  md: { card: 'w-14 h-20', rank: 'text-xs',     symbol: 'text-2xl'  },
  lg: { card: 'w-16 h-24', rank: 'text-sm',     symbol: 'text-3xl'  },
};
 
const SUIT_SYMBOLS: Record<string, string> = {
  hearts:   '♥',
  diamonds: '♦',
  clubs:    '♣',
  spades:   '♠',
  joker:    '★',
};

const SUIT_COLORS: Record<string, string> = {
  hearts:   'text-red-600',
  diamonds: 'text-blue-600',
  clubs:    'text-emerald-700',
  spades:   'text-gray-900',
  joker:    'text-purple-600',
};

export function CardTile({
  card,
  selected  = false,
  disabled  = false,
  faceDown  = false,
  size      = 'md',
  onClick,
  className,
}: CardTileProps) {
  const sz         = SIZE[size];
  const suitColor  = faceDown ? '' : (SUIT_COLORS[card.suit] ?? 'text-gray-900');
  const suitSymbol = faceDown ? '' : (SUIT_SYMBOLS[card.suit] ?? '');
  const rankLabel  = faceDown ? '' : card.isJoker ? 'JKR' : card.rank;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-start justify-between',
        sz.card,
        'rounded-lg border-2 shadow-md select-none transition-all duration-150',
        'bg-white font-bold leading-none',
        faceDown  && 'bg-blue-700 border-blue-900',
        !faceDown && selected  && 'border-yellow-400 shadow-yellow-300 shadow-lg -translate-y-3',
        !faceDown && !selected && 'border-gray-300',
        !disabled && onClick   && 'cursor-pointer hover:border-blue-400 hover:shadow-lg',
        disabled               && 'opacity-50 cursor-default',
        !disabled && !onClick  && 'cursor-default',
        className,
      )}
    >
      {faceDown ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white text-2xl select-none">🂠</span>
        </div>
      ) : (
        <>
          {/* Top-left */}
          <div className={cn('p-1 leading-tight', sz.rank, suitColor)}>
            <div>{rankLabel}</div>
            <div>{suitSymbol}</div>
          </div>

          {/* Center */}
          <div className={cn('absolute inset-0 flex items-center justify-center', sz.symbol, suitColor)}>
            {card.isJoker ? '★' : suitSymbol}
          </div>

          {/* Bottom-right (rotated) */}
          <div className={cn('p-1 rotate-180 self-end leading-tight', sz.rank, suitColor)}>
            <div>{rankLabel}</div>
            <div>{suitSymbol}</div>
          </div>
        </>
      )}

      {/* Joker badge */}
      {!faceDown && card.isJoker && (
        <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[8px] px-1 rounded-full pointer-events-none">
          WILD
        </span>
      )}

      {/* Selected check */}
      {selected && (
        <span className="absolute -top-1 -left-1 bg-yellow-400 text-black text-[8px] px-1 rounded-full pointer-events-none">
          ✓
        </span>
      )}
    </button>
  );
}
