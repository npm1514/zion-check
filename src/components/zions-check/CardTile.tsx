'use client';

import { Card } from '@/types/game';
import { cn } from '@/lib/utils';
import { useJesterImage } from './jesterImage';
import { CardBack } from './CardBack';

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

// `corner` keeps both corner indices (rank + suit, top-left and rotated
// bottom-right) inside the card: with normal line spacing they're taller than
// a small card and the bottom one spills past the edge.
const SIZE: Record<CardSize, { card: string; rank: string; symbol: string; corner: string }> = {
  sm: { card: 'w-10 h-14', rank: 'text-[9px]',  symbol: 'text-base', corner: 'p-[3px] leading-none' },
  md: { card: 'w-14 h-20', rank: 'text-xs',     symbol: 'text-2xl',  corner: 'p-1 leading-none'     },
  lg: { card: 'w-16 h-24', rank: 'text-sm',     symbol: 'text-3xl',  corner: 'p-1 leading-none'     },
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
  diamonds: 'text-red-600',
  clubs:    'text-gray-900',
  spades:   'text-gray-900',
  joker:    'text-gray-900',
};

// Width of the jester art in the middle of a joker card — narrow enough to
// leave a clear column on each side for the vertical JOKER corners.
const JESTER_WIDTH: Record<CardSize, string> = {
  sm: 'w-[18px]',
  md: 'w-7',
  lg: 'w-9',
};

// Letter size for the vertical JOKER. Smaller than a normal rank so five
// letters fit; the two corners sit in opposite edge columns, so each may run
// past the middle without meeting the other.
const JOKER_LETTERS: Record<CardSize, string> = {
  sm: 'text-[7px]',
  md: 'text-[9px]',
  lg: 'text-[10px]',
};

function JokerCorner({ size, className }: { size: CardSize; className?: string }) {
  return (
    <div className={cn(SIZE[size].corner, 'flex flex-col items-center leading-[0.9] text-gray-900', JOKER_LETTERS[size], className)}>
      {'JOKER'.split('').map((ch, i) => <span key={i}>{ch}</span>)}
    </div>
  );
}

// White card with JOKER written down the corners like a real deck, and the
// jester cut out of the 🃏 emoji in the middle (see jesterImage.ts).
function JokerFace({ size }: { size: CardSize }) {
  const jester = useJesterImage();
  return (
    <>
      {/* Top-left — pinned to its corner (not stacked like normal ranks),
          since two five-letter columns are taller than the card together */}
      <JokerCorner size={size} className="absolute top-0 left-0" />

      {/* Center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {jester && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={jester} alt="" draggable={false} className={cn('h-auto', JESTER_WIDTH[size])} />
        )}
      </div>

      {/* Bottom-right (rotated) */}
      <JokerCorner size={size} className="absolute bottom-0 right-0 rotate-180" />
    </>
  );
}

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
  const rankLabel  = faceDown ? '' : card.isJoker ? 'J' : card.rank;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-start justify-between',
        sz.card,
        'rounded-lg border-2 shadow-md select-none transition-all duration-150',
        'font-bold leading-none',
        faceDown ? 'bg-[#efe6d2]' : 'bg-white',
        faceDown  && 'border-gray-300',
        !faceDown && selected  && 'border-yellow-400 shadow-yellow-300 shadow-lg -translate-y-3',
        !faceDown && !selected && 'border-gray-300',
        !disabled && onClick   && 'cursor-pointer hover:border-blue-400 hover:shadow-lg',
        disabled               && 'opacity-50 cursor-default',
        !disabled && !onClick  && 'cursor-default',
        className,
      )}
    >
      {faceDown ? (
        <div className="absolute inset-0 rounded-[6px] overflow-hidden">
          <CardBack />
        </div>
      ) : card.isJoker ? (
        <JokerFace size={size} />
      ) : (
        <>
          {/* Top-left */}
          <div className={cn(sz.corner, sz.rank, suitColor)}>
            <div>{rankLabel}</div>
            <div>{suitSymbol}</div>
          </div>

          {/* Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(sz.symbol, suitColor)}>{suitSymbol}</span>
          </div>

          {/* Bottom-right (rotated) */}
          <div className={cn(sz.corner, 'rotate-180 self-end', sz.rank, suitColor)}>
            <div>{rankLabel}</div>
            <div>{suitSymbol}</div>
          </div>
        </>
      )}

      {/* Selected check */}
      {selected && (
        <span className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-yellow-400 shadow flex items-center justify-center pointer-events-none">
          <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
      )}
    </button>
  );
}
