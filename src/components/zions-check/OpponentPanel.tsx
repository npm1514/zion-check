'use client';

import { PlayerState } from '@/types/game';
import { CardTile } from './CardTile';
import { cn } from '@/lib/utils';

interface OpponentPanelProps {
  player: PlayerState;
  isCurrentPlayer: boolean;
  contractLabel: string;
}

const PLAYER_COLORS = [
  'from-blue-900 to-blue-800',
  'from-purple-900 to-purple-800',
  'from-rose-900 to-rose-800',
  'from-orange-900 to-orange-800',
  'from-teal-900 to-teal-800',
  'from-indigo-900 to-indigo-800',
  'from-pink-900 to-pink-800',
];

const AVATARS = ['🧑', '👩', '👴', '👵', '🧔', '👱', '🧕'];

export function OpponentPanel({ player, isCurrentPlayer, contractLabel }: OpponentPanelProps) {
  const colorIdx = player.seatIndex % PLAYER_COLORS.length;
  const avatar   = AVATARS[player.seatIndex % AVATARS.length];

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border-2 overflow-hidden min-w-[140px] flex-1 max-w-[220px]',
        'bg-gradient-to-b',
        PLAYER_COLORS[colorIdx],
        isCurrentPlayer
          ? 'border-yellow-400 shadow-lg shadow-yellow-900/50'
          : 'border-white/10',
      )}
    >
      {/* Name bar */}
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1.5',
          isCurrentPlayer ? 'bg-yellow-500/20' : 'bg-black/20',
        )}
      >
        <span className="text-base">{avatar}</span>
        <span className="text-xs font-bold text-white truncate flex-1">{player.name}</span>
        {isCurrentPlayer && (
          <span className="text-yellow-300 text-[10px] font-bold animate-pulse">TURN</span>
        )}
        <span className="text-[10px] text-gray-300 shrink-0">
          🃏 {player.hand.length}
        </span>
      </div>

      {/* Melds area */}
      <div className="p-2 flex flex-col gap-1.5 flex-1">
        {player.contractMet ? (
          /* Show their melds */
          <div className="flex flex-col gap-1">
            {player.melds.map((meld) => (
              <div key={meld.id} className="flex gap-0.5 flex-wrap">
                {meld.slots.map((slot, i) => (
                  <div key={i} className="relative">
                    <CardTile card={slot.card} size="sm" />
                    {slot.substituting && (
                      <span className="absolute -bottom-0.5 left-0 right-0 text-center text-[7px] bg-purple-700 text-white rounded leading-none">
                        {slot.substituting.rank}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
            <span className="text-[10px] text-green-400 font-bold mt-auto">✓ Contract down</span>
          </div>
        ) : (
          /* Show contract placeholders */
          <div className="flex flex-col gap-1 flex-1">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Needs:</p>
            <p className="text-xs text-gray-300 italic leading-tight">{contractLabel}</p>
            {player.buysThisRound > 0 && (
              <p className="text-[10px] text-amber-400 mt-auto">
                {player.buysThisRound} {player.buysThisRound === 1 ? 'buy' : 'buys'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
