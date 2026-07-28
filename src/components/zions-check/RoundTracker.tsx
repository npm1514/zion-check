'use client';

import { cn } from '@/lib/utils';

interface RoundTrackerProps {
  currentRound: number;   // internal 1–7
  contractLabel: string;
}

const DISPLAY_OFFSET = 5; // internal round + 5 = displayed round (6–12)

export function RoundTracker({ currentRound, contractLabel }: RoundTrackerProps) {
  return (
    <div className="flex flex-col items-center gap-1 py-1">
      {/* Round pills */}
      <div className="flex items-center gap-1">
        {Array.from({ length: 7 }, (_, i) => {
          const round     = i + 1;
          const displayed = round + DISPLAY_OFFSET;
          const isCurrent = round === currentRound;
          const isPast    = round < currentRound;

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
              {displayed}
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
