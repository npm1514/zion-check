'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card } from '@/types/game';
import { CardTile } from './CardTile';
import { cn } from '@/lib/utils';

interface HandProps {
  cards: Card[];
  canAct: boolean;                        // my turn + action phase
  stagedIds: Set<string>;                 // cards already in meld slots
  selectedForDiscard: string | null;
  activeSlotIdx: number | null;           // a meld slot is waiting for a card
  pendingMeldTarget: boolean;             // waiting to extend a table meld
  onCardClick: (cardId: string) => void;
  onDiscard: () => void;
}

// ── Fan style per card ────────────────────────────────────────────────────────

function getCardStyle(
  idx: number,
  total: number,
  selected: boolean,
): React.CSSProperties {
  const center   = (total - 1) / 2;
  const offset   = idx - center;
  const maxAngle = Math.min(15, total * 1.8);
  const rotation = total <= 1 ? 0 : (offset / Math.max(1, total / 2)) * maxAngle;
  const yLift    = selected ? -28 : 0;

  return {
    transform:       `rotate(${rotation}deg) translateY(${yLift}px)`,
    transformOrigin: 'bottom center',
    zIndex:          selected ? 99 : idx + 1,
    marginLeft:      idx === 0 ? 0 : -22,
    transition:      'transform 0.15s ease, z-index 0s',
    position:        'relative',
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Hand({
  cards,
  canAct,
  stagedIds,
  selectedForDiscard,
  activeSlotIdx,
  pendingMeldTarget,
  onCardClick,
  onDiscard,
}: HandProps) {

  // ── Card order ──────────────────────────────────────────────────────────────

  const [cardOrder, setCardOrder] = useState<string[]>(() => cards.map((c) => c.id));

  useEffect(() => {
    setCardOrder((prev) => {
      const existing = new Set(prev);
      const newIds   = cards.map((c) => c.id).filter((id) => !existing.has(id));
      const valid    = prev.filter((id) => cards.some((c) => c.id === id));
      return [...valid, ...newIds];
    });
  }, [cards]);

  // ── Drag to reorder ─────────────────────────────────────────────────────────

  const dragSrcId  = useRef<string | null>(null);
  const didDrag    = useRef(false);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const onDragStart = useCallback((id: string) => {
    dragSrcId.current = id;
    didDrag.current   = false;
  }, []);

  const onDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOver(id);
  }, []);

  const onDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    didDrag.current = true;
    const src = dragSrcId.current;
    if (!src || src === targetId) { setDragOver(null); return; }
    setCardOrder((prev) => {
      const a = [...prev];
      const si = a.indexOf(src);
      const ti = a.indexOf(targetId);
      if (si === -1 || ti === -1) return prev;
      a.splice(si, 1);
      a.splice(ti, 0, src);
      return a;
    });
    dragSrcId.current = null;
    setDragOver(null);
  }, []);

  const onDragEnd = useCallback(() => {
    dragSrcId.current = null;
    setDragOver(null);
    setTimeout(() => { didDrag.current = false; }, 60);
  }, []);

  const handleClick = useCallback((id: string) => {
    if (didDrag.current) return;
    onCardClick(id);
  }, [onCardClick]);

  // ── Ordered cards ───────────────────────────────────────────────────────────

  const ordered = cardOrder
    .map((id) => cards.find((c) => c.id === id))
    .filter((c): c is Card => !!c);

  const total = ordered.length;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="relative select-none">

      {/* Hints and the Discard button float over the hand area so showing
          them never pushes the layout around. Tap the selected card again to
          unselect it. */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 px-4 pt-1 pointer-events-none">
        <div>
          {activeSlotIdx !== null && (
            <p className="text-yellow-300 text-xs font-semibold animate-pulse">
              ← Tap a card to add it to the highlighted slot
            </p>
          )}
          {pendingMeldTarget && (
            <p className="text-orange-300 text-xs font-semibold">
              ← Tap a card to add it to the table meld
            </p>
          )}
        </div>
        {selectedForDiscard && (
          <button
            onClick={onDiscard}
            className="pointer-events-auto px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg shrink-0"
          >
            Discard
          </button>
        )}
      </div>

      {/* Fan */}
      <div
        className={cn(
          // pt-12 reserves room above the cards for everything that can rise:
          // a selected card's lift (28px here + 12px in CardTile) plus the fan
          // tilt on the outer cards (~5px), and the floating Discard button.
          // Padding, not min-height, so cards can never start at the top edge
          // and spill into the section above.
          'flex items-end justify-center px-8 pt-12 pb-2',
          // glow the whole hand area when a slot is active
          activeSlotIdx !== null && 'drop-shadow-[0_0_12px_rgba(250,204,21,0.3)]',
          pendingMeldTarget       && 'drop-shadow-[0_0_12px_rgba(249,115,22,0.3)]',
        )}
      >
        {ordered.map((card, idx) => {
          const isStaged   = stagedIds.has(card.id);
          const isSelected = selectedForDiscard === card.id;
          const isDragOver = dragOver === card.id && dragSrcId.current !== card.id;

          return (
            <div
              key={card.id}
              style={getCardStyle(idx, total, isSelected)}
              draggable
              onDragStart={() => onDragStart(card.id)}
              onDragOver={(e) => onDragOver(e, card.id)}
              onDrop={(e) => onDrop(e, card.id)}
              onDragEnd={onDragEnd}
              className={cn(
                isDragOver && 'scale-110',
              )}
            >
              <CardTile
                card={card}
                size="lg"
                selected={isSelected}
                onClick={canAct ? () => handleClick(card.id) : undefined}
                className={cn(
                  'transition-opacity',
                  isStaged && 'opacity-35 ring-2 ring-blue-400',
                  !isStaged && activeSlotIdx !== null && 'ring-2 ring-yellow-400/70',
                  !isStaged && pendingMeldTarget && 'ring-2 ring-orange-400/70',
                )}
              />
            </div>
          );
        })}

        {total === 0 && (
          <p className="text-gray-600 text-sm self-center">No cards in hand</p>
        )}
      </div>
    </div>
  );
}
