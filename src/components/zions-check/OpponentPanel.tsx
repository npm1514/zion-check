'use client';

import { ContractRequirement, PlayerState } from '@/types/game';
import { cn } from '@/lib/utils';

interface OpponentPanelProps {
  player: PlayerState;
  isCurrentPlayer: boolean;
  isDealer: boolean;
  contractRequirements: ContractRequirement[];
  isMe?: boolean;
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

export function OpponentPanel({ player, isCurrentPlayer, isDealer, contractRequirements, isMe }: OpponentPanelProps) {
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
        <span className="text-xs font-bold text-white truncate flex-1">
          {player.name}
          {isMe && <span className="text-[9px] text-white/50 font-normal ml-1">(you)</span>}
        </span>
        {isDealer && <span className="text-[8px] font-bold text-white/70 shrink-0">🃏</span>}
        {isCurrentPlayer && (
          <span className="text-yellow-300 text-[9px] font-bold animate-pulse shrink-0">▶</span>
        )}
        <span className="text-[10px] text-gray-300 shrink-0">🃏{player.hand.length}</span>
      </div>

      {/* Contract status — mini visual slots */}
      <div className="px-2 py-1.5 flex items-center gap-1 flex-wrap min-h-[24px]">
        {player.contractMet ? (
          <span className="text-[10px] text-green-400 font-bold">✓ Down</span>
        ) : (
          <>
            {contractRequirements.map((req, i) => (
              <div key={i} className="flex items-center gap-0.5">
                {i > 0 && <span className="text-[8px] text-gray-500 mx-0.5">+</span>}
                <span className="text-[8px] leading-none mr-0.5">
                  {req.type === 'set' ? '📋' : '➡️'}
                </span>
                {Array.from({ length: req.minSize }).map((_, j) => (
                  <div
                    key={j}
                    className="w-3 h-4 rounded-sm"
                    style={{ border: '1px dashed rgba(156,163,175,0.4)' }}
                  />
                ))}
              </div>
            ))}
            {player.buysThisRound > 0 && (
              <span className="text-[9px] text-amber-400 ml-1">{player.buysThisRound}B</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
