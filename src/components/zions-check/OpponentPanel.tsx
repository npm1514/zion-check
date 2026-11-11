'use client';

import { ContractRequirement, Meld, PlayerState } from '@/types/game';
import { cn } from '@/lib/utils';
import { CardTile } from './CardTile';

interface OpponentPanelProps {
  player: PlayerState;
  isCurrentPlayer: boolean;
  isDealer?: boolean;
  contractRequirements: ContractRequirement[];
  isMe?: boolean;
  swappableByMeld?: Map<string, Set<number>>;
  canAddToMeld?: boolean;
  pendingMeldId?: string | null;
  onSelectMeld?: (meldId: string) => void;
  onSwapJoker?: (meldId: string, slotIndex: number) => void;
}

export const PLAYER_COLORS = [
  'from-blue-900 to-blue-800',
  'from-purple-900 to-purple-800',
  'from-rose-900 to-rose-800',
  'from-orange-900 to-orange-800',
  'from-teal-900 to-teal-800',
  'from-indigo-900 to-indigo-800',
  'from-pink-900 to-pink-800',
];


export function OpponentPanel({
  player,
  isCurrentPlayer,
  isDealer,
  contractRequirements,
  isMe,
  swappableByMeld,
  canAddToMeld,
  pendingMeldId,
  onSelectMeld,
  onSwapJoker,
}: OpponentPanelProps) {
  const colorIdx = player.seatIndex % PLAYER_COLORS.length;

  return (
    <div
      className={cn(
        'rounded-xl border-2 overflow-hidden bg-gradient-to-b',
        PLAYER_COLORS[colorIdx],
        isCurrentPlayer
          ? 'border-yellow-400 shadow-md shadow-yellow-900/50'
          : 'border-white/10',
      )}
    >
      {/* Name bar */}
      <div className={cn(
        'flex items-center gap-1.5 px-2 py-1.5',
        isCurrentPlayer ? 'bg-yellow-500/20' : 'bg-black/20',
      )}>
        <span className="text-xs font-bold text-white truncate min-w-0">
          {player.name}
          {isMe && <span className="text-[9px] text-white/50 font-normal ml-1">(you)</span>}
        </span>
        {isDealer && (
          <span className="text-[9px] font-bold bg-white/20 px-1.5 py-0.5 rounded text-white shrink-0">🃏 DEALER</span>
        )}
        <span className="text-[10px] text-gray-300 shrink-0 ml-auto">🃏{player.hand.length}</span>
      </div>

      {/* Contract status — shadow melds laid out like real melds (one per row, card-sized slots) */}
      {!player.contractMet && (
        <div className="px-2 py-1.5 flex flex-col gap-1">
          {contractRequirements.map((req, i) => (
            <div key={i} className="flex flex-nowrap gap-0.5">
              {Array.from({ length: req.minSize }).map((_, j) => (
                <div
                  key={j}
                  className="w-10 h-14 rounded-lg border-2 border-dashed border-white/25"
                />
              ))}
            </div>
          ))}
          {player.buysThisRound > 0 && (
            <span className="text-[9px] text-amber-400">{player.buysThisRound}B</span>
          )}
        </div>
      )}

      {/* Laid-down melds — inside the box */}
      {player.melds.length > 0 && (
        <div className="px-2 py-1.5 flex flex-col gap-1">
          {player.melds.map((meld: Meld) => {
            const swappable = swappableByMeld?.get(meld.id);
            return (
              <div key={meld.id} className="flex items-start gap-1 flex-nowrap">
                <div className="flex flex-nowrap gap-0.5">
                  {meld.slots.map((slot, i) => {
                    const canSwap = swappable?.has(i);
                    return (
                      <div key={i} className="relative">
                        <CardTile
                          card={slot.card}
                          size="sm"
                          className={cn(canSwap && 'ring-2 ring-green-400 cursor-pointer hover:scale-110 transition-transform')}
                          onClick={canSwap && onSwapJoker ? () => onSwapJoker(meld.id, i) : undefined}
                        />
                        {slot.substituting && (
                          <span className="absolute -bottom-0.5 left-0 right-0 text-center text-[7px] bg-purple-700 text-white rounded leading-none">
                            {slot.substituting.rank}
                          </span>
                        )}
                        {canSwap && (
                          <span className="absolute -top-0.5 -right-0.5 bg-green-500 text-white text-[6px] px-0.5 rounded-full pointer-events-none font-bold">⇄</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {canAddToMeld && onSelectMeld && (
                  <button
                    onClick={() => onSelectMeld(meld.id)}
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 mt-0.5',
                      pendingMeldId === meld.id
                        ? 'bg-yellow-400 text-black'
                        : 'bg-white/20 hover:bg-white/30 text-white',
                    )}
                  >
                    + Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
