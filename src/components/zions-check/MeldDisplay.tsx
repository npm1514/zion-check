'use client';

import { Meld } from '@/types/game';
import { CardTile } from './CardTile';
import { cn } from '@/lib/utils';

interface MeldDisplayProps {
  meld: Meld;
  canExtend: boolean;
  onExtend?: (meldId: string) => void;
  /** Slot indices where the current player can swap their card for the joker */
  swappableSlots?: Set<number>;
  onSwap?: (meldId: string, slotIndex: number) => void;
}

export function MeldDisplay({
  meld,
  canExtend,
  onExtend,
  swappableSlots,
  onSwap,
}: MeldDisplayProps) {
  return (
    <div className="flex items-start gap-1">
      <div className="flex flex-wrap gap-0.5">
        {meld.slots.map((slot, i) => {
          const canSwap = swappableSlots?.has(i) && !!onSwap;
          return (
            <div key={i} className="relative">
              <CardTile
                card={slot.card}
                size="sm"
                className={cn(
                  canSwap && 'ring-2 ring-green-400 ring-offset-1 ring-offset-transparent cursor-pointer hover:scale-110 transition-transform',
                )}
                onClick={canSwap ? () => onSwap!(meld.id, i) : undefined}
              />
              {slot.substituting && (
                <span className="absolute -bottom-1 left-0 right-0 text-center text-[8px] bg-purple-700 text-white rounded">
                  {slot.substituting.rank}{slot.substituting.suit[0].toUpperCase()}
                </span>
              )}
              {canSwap && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[8px] px-1 rounded-full pointer-events-none font-bold">
                  ⇄
                </span>
              )}
            </div>
          );
        })}
      </div>
      {canExtend && onExtend && (
        <button
          onClick={() => onExtend(meld.id)}
          className="text-xs px-2 py-0.5 bg-yellow-500 text-black rounded hover:bg-yellow-400 shrink-0 mt-0.5"
        >
          + Add card
        </button>
      )}
    </div>
  );
}
