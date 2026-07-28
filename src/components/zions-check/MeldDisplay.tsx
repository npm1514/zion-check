'use client';

import { Meld } from '@/types/game';
import { CardTile } from './CardTile';

interface MeldDisplayProps {
  meld: Meld;
  ownerName: string;
  canExtend: boolean;   // true when the active player has met their contract
  onExtend?: (meldId: string) => void;
}

export function MeldDisplay({ meld, ownerName, canExtend, onExtend }: MeldDisplayProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 uppercase tracking-wide">
          {ownerName} · {meld.type}
        </span>
        {canExtend && onExtend && (
          <button
            onClick={() => onExtend(meld.id)}
            className="text-xs px-2 py-0.5 bg-yellow-500 text-black rounded hover:bg-yellow-400"
          >
            + Add card
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {meld.slots.map((slot, i) => (
          <div key={i} className="relative">
            <CardTile card={slot.card} />
            {slot.substituting && (
              <span className="absolute -bottom-1 left-0 right-0 text-center text-[8px] bg-purple-700 text-white rounded">
                {slot.substituting.rank}{slot.substituting.suit[0].toUpperCase()}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
