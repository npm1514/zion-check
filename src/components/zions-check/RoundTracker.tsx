'use client';

import { cn } from '@/lib/utils';

interface RoundTrackerProps {
  currentRound: number;
  contractLabel: string;
}

export function RoundTracker({ currentRound, contractLabel }: RoundTrackerProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-2">
      {/* Round pills */}
      <div className="flex items-center gap-1">
        {Array.from({ length: 10 }, (_, i) => {
          const round    = i + 1;
          const isCurrent = round === currentRound;
          const isPast   = round < currentRound;

          return (
            <div
              key={round}
              className={cn(
                'flex items-center justify-center rounded font-black text-xs transition-all',
                isCurrent
                  ? 'w-8 h-8 bg-yellow-400 text-black shadow-lg shadow-yellow-900/50 ring-2 ring-yellow-200'
                  : isPast
                    ? 'w-6 h-6 bg-green-700 text-green-300'
                    : 'w-6 h-6 bg-gray-800 text-gray-500',
              )}
            >
              {round}
            </div>
          );
        })}
      </div>

      {/* Contract label */}
      <p className="text-[11px] text-yellow-300 font-semibold tracking-wide uppercase">
        {contractLabel}
      </p>
    </div>
  );
}
