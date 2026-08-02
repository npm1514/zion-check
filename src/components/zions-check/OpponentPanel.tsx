'use client';

import { PlayerState } from '@/types/game';
import { cn } from '@/lib/utils';

interface OpponentPanelProps {
  player: PlayerState;
  isCurrentPlayer: boolean;
  isDealer: boolean;
  contractLabel: string;
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

export const AVATARS = ['🧑', '👩', '👴', '👵', '🧔', '👱', '🧕'];

export function OpponentPanel({ player, isCurrentPlayer, isDealer, contractLabel }: OpponentPanelProps) {
  const colorIdx = player.seatIndex % PLAYER_COLORS.length;
  const avatar   = AVATARS[player.seatIndex % AVATARS.length];

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
        <span className="text-sm leading-none">{avatar}</span>
        <span className="text-xs font-bold text-white truncate flex-1">{player.name}</span>
        {isDealer && <span className="text-[8px] font-bold text-white/70 shrink-0">🃏</span>}
        {isCurrentPlayer && (
          <span className="text-yellow-300 text-[9px] font-bold animate-pulse shrink-0">▶</span>
        )}
        <span className="text-[10px] text-gray-300 shrink-0">🃏{player.hand.length}</span>
      </div>

      {/* Contract status — text only, cards shown below panel */}
      <div className="px-2 py-1 min-h-[20px]">
        {player.contractMet ? (
          <span className="text-[10px] text-green-400 font-bold">✓ Down</span>
        ) : (
          <span className="text-[10px] text-gray-400 italic leading-tight">
            {contractLabel}
            {player.buysThisRound > 0 && (
              <span className="text-amber-400 not-italic"> · {player.buysThisRound}B</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
