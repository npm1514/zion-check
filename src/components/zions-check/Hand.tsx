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
  onClearDiscard: () => void;
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
  onClearDiscard,
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
    <div className="flex flex-col gap-2 select-none">

      {/* Status hints */}
      <div className="flex items-center justify-between px-1 h-5">
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
        {selectedForDiscard && (
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onDiscard}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg"
            >
              Discard
            </button>
            <button
              onClick={onClearDiscard}
              className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-lg"
            >
              ✕
            </button>
          </div>
        )}
        {canAct && activeSlotIdx === null && !pendingMeldTarget && !selectedForDiscard && (
          <p className="text-gray-500 text-xs">
            Click card to select · Drag to rearrange
          </p>
        )}
      </div>

      {/* Fan */}
      <div
        className={cn(
          'flex items-end justify-center px-8 pb-2',
          'min-h-[130px]',
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
              draggable={canAct}
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

      {/* Card count */}
      <p className="text-center text-gray-500 text-[11px]">
        {total} card{total !== 1 ? 's' : ''} in hand
        {stagedIds.size > 0 && ` · ${stagedIds.size} staged`}
      </p>
    </div>
  );
}
