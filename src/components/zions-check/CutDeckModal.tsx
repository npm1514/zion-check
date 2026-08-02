'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { cardsForRound } from '@/lib/game/deck';

interface CutDeckModalProps {
  round: number;
  numPlayers: number;
  dealerName: string;
  isDealer: boolean;
  onSubmit: (cutPosition: number) => void;
}

export function CutDeckModal({ round, numPlayers, dealerName, isDealer, onSubmit }: CutDeckModalProps) {
  const totalDeck    = numPlayers <= 4 ? 108 : 162;
  const cardsNeeded  = cardsForRound(round) * numPlayers;
  const displayRound = round + 5;

  const [cutPos, setCutPos] = useState(Math.floor(totalDeck / 2));
  const deckRef = useRef<HTMLDivElement>(null);

  const isPerfect   = cutPos === cardsNeeded;
  const cutFraction = cutPos / totalDeck; // 0 = top, 1 = bottom

  const deckLines = useMemo(() => Array.from({ length: 40 }), []);

  // Convert a pointer Y position within the deck element to a cut position
  const posFromEvent = useCallback((clientY: number) => {
    const el = deckRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    setCutPos(Math.max(1, Math.round(frac * totalDeck)));
  }, [totalDeck]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    posFromEvent(e.clientY);
  }, [posFromEvent]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (e.buttons === 0) return;
    posFromEvent(e.clientY);
  }, [posFromEvent]);

  if (!isDealer) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
        <div
          className="rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center"
          style={{ background: 'linear-gradient(160deg, #1a4d2e 0%, #0d3d1f 100%)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <div className="text-4xl mb-3">🃏</div>
          <h2 className="text-xl font-black text-white mb-2">
            {dealerName} is cutting the deck…
          </h2>
          <p className="text-gray-400 text-sm">Hang tight while the dealer prepares the cards.</p>
          <div className="mt-6 flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-white/40 animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div
        className="rounded-2xl shadow-2xl p-6 max-w-sm w-full"
        style={{ background: 'linear-gradient(160deg, #1a4d2e 0%, #0d3d1f 100%)', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        {/* Header */}
        <div className="text-center mb-5">
          <div className="text-3xl mb-1">🃏</div>
          <h2 className="text-xl font-black text-white">Cut the Deck</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Round {displayRound} · {numPlayers} players · {cardsForRound(round)} cards each
          </p>
        </div>

        {/* Deck visual — click or drag to cut */}
        <div className="flex justify-center mb-5">
          <div className="flex flex-col items-center gap-1">
            <div
              ref={deckRef}
              className="relative overflow-hidden rounded cursor-pointer select-none"
              style={{
                width: 140,
                height: 260,
                background: '#1a2e1a',
                border: `1px solid ${isPerfect ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`,
                touchAction: 'none',
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
            >
              {/* Top (cut) portion highlight */}
              <div
                className="absolute top-0 left-0 right-0"
                style={{
                  height: `${cutFraction * 100}%`,
                  background: isPerfect
                    ? 'linear-gradient(180deg, rgba(34,197,94,0.35) 0%, rgba(34,197,94,0.15) 100%)'
                    : 'linear-gradient(180deg, rgba(96,165,250,0.3) 0%, rgba(96,165,250,0.12) 100%)',
                  transition: 'height 0ms',
                }}
              />

              {/* Card lines */}
              {deckLines.map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0"
                  style={{
                    top: `${((i + 0.5) / deckLines.length) * 100}%`,
                    height: 1,
                    background: (i + 0.5) / deckLines.length < cutFraction
                      ? (isPerfect ? 'rgba(134,239,172,0.55)' : 'rgba(147,197,253,0.45)')
                      : 'rgba(255,255,255,0.1)',
                  }}
                />
              ))}

              {/* Cut line */}
              <div
                className="absolute left-0 right-0 z-10"
                style={{
                  top: `${cutFraction * 100}%`,
                  height: 2,
                  background: isPerfect ? '#22c55e' : '#60a5fa',
                  boxShadow: isPerfect ? '0 0 8px #22c55e' : '0 0 5px #60a5fa',
                  transform: 'translateY(-1px)',
                }}
              />

              {/* Drag hint — fades after first interaction */}
              {cutPos === Math.floor(totalDeck / 2) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-white/30 text-xs">drag to cut</span>
                </div>
              )}
            </div>

            <div className="text-[10px] text-gray-500">{totalDeck} cards total</div>
          </div>
        </div>

        {/* Perfect cut celebration */}
        {isPerfect && (
          <div className="text-center mb-4">
            <div className="text-green-400 font-black text-lg">✨ Perfect Cut!</div>
            <div className="text-green-300 text-xs mt-0.5 font-bold">−25 pts bonus!</div>
          </div>
        )}

        {/* Deal button */}
        <button
          onClick={() => onSubmit(cutPos)}
          className="w-full py-3 font-black text-base rounded-xl shadow-lg transition-colors"
          style={{
            background: isPerfect ? '#16a34a' : '#1d4ed8',
            color: 'white',
          }}
        >
          {isPerfect ? '✨ Deal with Perfect Cut!' : '🃏 Cut & Deal'}
        </button>
      </div>
    </div>
  );
}
