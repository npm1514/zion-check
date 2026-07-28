'use client';

import { Card, GameState } from '@/types/game';
import { CardTile } from './CardTile';

interface BuyPanelProps {
  state: GameState;
  myId: string;
  secondsLeft: number;
  onBuy: () => void;
}

export function BuyPanel({ state, myId, secondsLeft, onBuy }: BuyPanelProps) {
  const topDiscard: Card | undefined = state.discardPile[state.discardPile.length - 1];
  const me = state.players.find((p) => p.id === myId);
  const currentPlayer = state.players[state.currentPlayerIdx];
  const isMyTurn = currentPlayer.id === myId;

  if (!topDiscard || state.phase !== 'buy_window') return null;

  const alreadyRequested = state.pendingBuyRequests.includes(myId);
  const maxBuysReached = state.round === 10 && (me?.buysThisRound ?? 0) >= 1;
  return (
    <div className="bg-amber-900 border border-amber-600 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-sm">Buy Window</h3>
        <span className={`text-sm font-mono ${secondsLeft <= 3 ? 'text-red-400' : 'text-yellow-300'}`}>
          {secondsLeft}s
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-gray-300">Top discard</span>
          <CardTile card={topDiscard} />
        </div>

        <div className="flex flex-col gap-2 flex-1">
          {isMyTurn ? (
            <p className="text-gray-300 text-sm">Other players may buy the discard.</p>
          ) : alreadyRequested ? (
            <p className="text-yellow-300 text-sm">Buy request submitted — waiting…</p>
          ) : maxBuysReached ? (
            <p className="text-gray-400 text-sm">You&apos;ve used your 1 buy for round 10.</p>
          ) : (
            <button
              onClick={onBuy}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors"
            >
              Buy (+1 penalty card)
            </button>
          )}

          {state.pendingBuyRequests.length > 0 && (
            <p className="text-xs text-gray-300">
              Requested: {state.pendingBuyRequests
                .map(id => state.players.find(p => p.id === id)?.name ?? id)
                .join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
