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
  const deckCount    = numPlayers <= 4 ? 2 : 3;
  const totalDeck    = deckCount === 2 ? 108 : 162; // 54 cards per deck (52 + 2 jokers)
  const displayRound = round + 5;
  const deckHeight   = deckCount * 60; // 120px for 2 decks, 180px for 3 decks

  const [cutPos, setCutPos] = useState(Math.floor(totalDeck / 2));
  const deckRef = useRef<HTMLDivElement>(null);

  // Vertical cut: top = card 0 (lift nothing), bottom = card totalDeck (lift everything)
  const cutFraction = cutPos / totalDeck; // 0 = top, 1 = bottom

  // More lines = harder to judge exact position
  const deckLines = useMemo(() => Array.from({ length: 54 }), []);

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
        className="rounded-2xl shadow-2xl p-6 w-full max-w-md"
        style={{ background: 'linear-gradient(160deg, #1a4d2e 0%, #0d3d1f 100%)', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-3xl mb-1">🃏</div>
          <h2 className="text-xl font-black text-white">Cut the Deck</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Round {displayRound} · {numPlayers} players · {cardsForRound(round)} cards each
          </p>
        </div>

        {/* Deck visual — drag up/down to cut */}
        <div className="flex flex-col items-center gap-2 mb-6">

          {/* Combined deck: height scales with number of decks */}
          <div
            ref={deckRef}
            className="relative overflow-hidden cursor-row-resize select-none"
            style={{
              width: '100%',
              height: deckHeight,
              background: '#1a2e1a',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.12)',
              touchAction: 'none',
              boxShadow: '4px 4px 0 #0a1f0a, 8px 8px 0 #071507',
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
          >
            {/* Top (lifted) portion highlight */}
            <div
              className="absolute top-0 left-0 right-0"
              style={{
                height: `${cutFraction * 100}%`,
                background: 'linear-gradient(180deg, rgba(96,165,250,0.3) 0%, rgba(96,165,250,0.1) 100%)',
              }}
            />

            {/* Horizontal card-edge lines */}
            {deckLines.map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0"
                style={{
                  top: `${((i + 0.5) / deckLines.length) * 100}%`,
                  height: 1,
                  background: (i + 0.5) / deckLines.length < cutFraction
                    ? 'rgba(147,197,253,0.45)'
                    : 'rgba(255,255,255,0.07)',
                }}
              />
            ))}


            {/* Horizontal cut line */}
            <div
              className="absolute left-0 right-0 z-20"
              style={{
                top: `${cutFraction * 100}%`,
                height: 2,
                background: '#60a5fa',
                boxShadow: '0 0 8px #60a5fa, 0 0 2px #fff',
                transform: 'translateY(-1px)',
              }}
            />

            {/* Top/bottom sheen */}
            <div className="absolute top-0 left-0 right-0 h-3 rounded-t"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)' }} />
            <div className="absolute bottom-0 left-0 right-0 h-3 rounded-b"
              style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.3) 0%, transparent 100%)' }} />

            {/* Drag hint */}
            {cutPos === Math.floor(totalDeck / 2) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-white/25 text-xs tracking-wide">↑ drag to cut ↓</span>
              </div>
            )}
          </div>

          <div className="text-[10px] text-gray-500">
            {deckCount} decks · {totalDeck} cards total
          </div>
        </div>

        {/* Deal button */}
        <button
          onClick={() => onSubmit(cutPos)}
          className="w-full py-3 font-black text-base rounded-xl shadow-lg transition-colors"
          style={{ background: '#1d4ed8', color: 'white' }}
        >
          🃏 Cut &amp; Deal
        </button>
      </div>
    </div>
  );
}
