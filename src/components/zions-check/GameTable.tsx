'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, GameState, Meld, MeldType } from '@/types/game';
import { cn } from '@/lib/utils';
import { CardTile } from './CardTile';
import { Hand } from './Hand';
import { MeldDisplay } from './MeldDisplay';
import { OpponentPanel } from './OpponentPanel';
import { RoundTracker } from './RoundTracker';
import { Scoreboard } from './Scoreboard';
import { getContract } from '@/lib/game/contracts';
import { canDiscard } from '@/lib/game/meldValidator';
import { totalScore } from '@/lib/game/gameEngine';

// ── Meld slot (staging area) type ────────────────────────────────────────────

interface MeldSlot {
  type: MeldType;
  minSize: number;
  cardIds: string[];
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface GameTableProps {
  state: GameState;
  myId: string;
  roomCode: string;
  buyWindowSecondsLeft: number;
  onDrawFromDeck: () => void;
  onTakeDiscard: () => void;
  onLayContract: (melds: { type: MeldType; cardIds: string[] }[]) => void;
  onLayToMeld: (meldId: string, cardId: string) => void;
  onDiscard: (cardId: string) => void;
  onBuy: () => void;
  error: string | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GameTable({
  state,
  myId,
  roomCode,
  buyWindowSecondsLeft,
  onDrawFromDeck,
  onTakeDiscard,
  onLayContract,
  onLayToMeld,
  onDiscard,
  onBuy,
  error,
}: GameTableProps) {

  const me            = state.players.find((p) => p.id === myId)!;
  const opponents     = state.players.filter((p) => p.id !== myId);
  const currentPlayer = state.players[state.currentPlayerIdx];
  const isMyTurn      = currentPlayer?.id === myId;
  const contract      = getContract(state.round);
  const allMelds: Meld[] = state.players.flatMap((p) => p.melds);
  const topDiscard    = state.discardPile[state.discardPile.length - 1];
  const canDraw       = isMyTurn && (state.phase === 'draw' || state.phase === 'buy_window');
  const canTakeDiscard = isMyTurn && state.phase === 'draw' && !!topDiscard;
  const canAct        = isMyTurn && state.phase === 'action';

  // ── UI state ─────────────────────────────────────────────────────────────────

  const [showScoreboard,    setShowScoreboard]    = useState(false);
  const [pendingMeldTarget, setPendingMeldTarget] = useState<{ meldId: string } | null>(null);
  const [selectedForDiscard,setSelectedForDiscard]= useState<string | null>(null);

  // ── Meld builder state (lifted from Hand) ─────────────────────────────────

  const [meldSlots,    setMeldSlots]    = useState<MeldSlot[]>(() =>
    contract.requirements.map((r) => ({ type: r.type, minSize: r.minSize, cardIds: [] })),
  );
  const [activeSlotIdx, setActiveSlotIdx] = useState<number | null>(null);

  // Reset when round changes or contract gets met
  useEffect(() => {
    setMeldSlots(contract.requirements.map((r) => ({ type: r.type, minSize: r.minSize, cardIds: [] })));
    setActiveSlotIdx(null);
    setSelectedForDiscard(null);
    setPendingMeldTarget(null);
  }, [state.round, me?.contractMet]); // eslint-disable-line react-hooks/exhaustive-deps

  const stagedIds = useMemo(() => new Set(meldSlots.flatMap((s) => s.cardIds)), [meldSlots]);

  // ── Card click (from Hand) ────────────────────────────────────────────────

  const handleCardClick = useCallback((cardId: string) => {
    if (!canAct) return;

    // Extend a table meld
    if (pendingMeldTarget) {
      onLayToMeld(pendingMeldTarget.meldId, cardId);
      setPendingMeldTarget(null);
      return;
    }

    // Assign to active meld slot
    if (activeSlotIdx !== null && !me.contractMet) {
      if (stagedIds.has(cardId)) {
        // Remove from whatever slot
        setMeldSlots((prev) =>
          prev.map((s) => ({ ...s, cardIds: s.cardIds.filter((id) => id !== cardId) })),
        );
      } else {
        // Add to active slot
        setMeldSlots((prev) =>
          prev.map((s, i) =>
            i === activeSlotIdx ? { ...s, cardIds: [...s.cardIds, cardId] } : s,
          ),
        );
      }
      setSelectedForDiscard(null);
      return;
    }

    // Select / deselect for discard
    setSelectedForDiscard((prev) => (prev === cardId ? null : cardId));
  }, [canAct, pendingMeldTarget, activeSlotIdx, me?.contractMet, stagedIds, onLayToMeld]);

  // ── Discard ───────────────────────────────────────────────────────────────

  const handleDiscard = useCallback(() => {
    if (!selectedForDiscard) return;
    const card = me.hand.find((c) => c.id === selectedForDiscard);
    if (!card) return;
    if (!canDiscard(card, allMelds)) {
      alert(card.isJoker
        ? 'You cannot discard a Joker.'
        : 'That card can replace a Joker on the table — you must use it.',
      );
      return;
    }
    onDiscard(selectedForDiscard);
    setSelectedForDiscard(null);
  }, [selectedForDiscard, me?.hand, allMelds, onDiscard]);

  // ── Lay contract ──────────────────────────────────────────────────────────

  const canLayContract = meldSlots.every((s) => s.cardIds.length >= s.minSize);

  const handleLayContract = useCallback(() => {
    if (!canLayContract) return;
    onLayContract(meldSlots.map((s) => ({ type: s.type, cardIds: s.cardIds })));
    setActiveSlotIdx(null);
  }, [canLayContract, meldSlots, onLayContract]);

  // ── Game Over ─────────────────────────────────────────────────────────────

  if (state.phase === 'game_over') {
    const sorted = [...state.players].sort((a, b) => totalScore(a) - totalScore(b));
    return (
      <div className="h-screen bg-[#0d3d1f] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <h1 className="text-3xl font-black mb-2">🏆 Game Over</h1>
          <p className="text-gray-500 mb-6">Final standings · lowest score wins</p>
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className={cn('flex justify-between py-2 px-4 rounded-lg mb-2',
                i === 0 ? 'bg-yellow-100' : 'bg-gray-50')}
            >
              <span>{i === 0 ? '👑 ' : `${i + 1}. `}{p.name}</span>
              <span className="font-bold">{totalScore(p)} pts</span>
            </div>
          ))}
          <p className="mt-4 text-gray-400 text-sm">Refresh to play again with the same room code.</p>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div
      className="h-screen flex flex-col overflow-hidden text-white"
      style={{
        background: 'radial-gradient(ellipse at 50% 40%, #166534 0%, #14532d 55%, #0d3d1f 100%)',
      }}
    >

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-4 py-2 bg-black/30 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="font-black text-base">🃏 Zion&apos;s Check</span>
          <span className="text-xs bg-white/10 px-2 py-0.5 rounded font-mono tracking-widest">
            {roomCode}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <span className="text-red-400 text-xs font-semibold">⚠ {error}</span>
          )}
          <button
            onClick={() => setShowScoreboard((v) => !v)}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors"
          >
            📊 Scores
          </button>
        </div>
      </header>

      {/* ── Opponent panels ──────────────────────────────────────────────────── */}
      {opponents.length > 0 && (
        <div className="shrink-0 flex gap-2 px-3 pt-2 pb-1 overflow-x-auto">
          {opponents.map((p) => (
            <OpponentPanel
              key={p.id}
              player={p}
              isCurrentPlayer={currentPlayer?.id === p.id}
              contractLabel={contract.label}
            />
          ))}
        </div>
      )}

      {/* ── Round tracker ────────────────────────────────────────────────────── */}
      <div className="shrink-0">
        <RoundTracker currentRound={state.round} contractLabel={contract.label} />
      </div>

      {/* ── Turn banner ──────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'shrink-0 mx-3 rounded-lg px-3 py-1.5 text-center text-xs font-bold mb-1',
          isMyTurn ? 'bg-yellow-500/90 text-black' : 'bg-black/30 text-gray-300',
        )}
      >
        {isMyTurn
          ? canDraw
            ? '🎴 Your turn — click the deck or discard pile to draw'
            : me.contractMet
              ? '✓ Contract down — add cards to melds or discard'
              : '📋 Your turn — fill your contract slots below, then lay them down'
          : `⏳ Waiting for ${currentPlayer?.name}…`}
      </div>

      {/* ── Centre: meld area + deck/discard ─────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 gap-3 px-3 pb-1">

        {/* LEFT: meld staging / table melds */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pr-1">

          {/* Buy window overlay */}
          {state.phase === 'buy_window' && (() => {
            const me2      = state.players.find((p) => p.id === myId);
            const isMeTurn = currentPlayer?.id === myId;
            const already  = state.pendingBuyRequests.includes(myId);
            const maxBuy   = state.round === 10 && (me2?.buysThisRound ?? 0) >= 1;
            return (
              <div className="bg-amber-900/80 border border-amber-500 rounded-xl p-3 flex items-center gap-3 shrink-0">
                <div className="flex flex-col items-center">
                  {topDiscard && <CardTile card={topDiscard} size="md" />}
                  <span className={cn('text-xs font-mono mt-1 font-bold',
                    buyWindowSecondsLeft <= 3 ? 'text-red-400' : 'text-yellow-300')}>
                    {buyWindowSecondsLeft}s
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-300 mb-1">Buy Window</p>
                  {isMeTurn ? (
                    <p className="text-xs text-gray-300">Others may buy the discard.</p>
                  ) : already ? (
                    <p className="text-xs text-yellow-300">Buy request sent — waiting…</p>
                  ) : maxBuy ? (
                    <p className="text-xs text-gray-400">Already used your 1 buy for round 10.</p>
                  ) : (
                    <button
                      onClick={onBuy}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg"
                    >
                      Buy! (+1 penalty card)
                    </button>
                  )}
                  {state.pendingBuyRequests.length > 0 && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      Buying: {state.pendingBuyRequests
                        .map((id) => state.players.find((p) => p.id === id)?.name ?? id)
                        .join(', ')}
                    </p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Meld slot builder (action phase, contract not yet met) */}
          {canAct && !me.contractMet && (
            <div className="bg-black/30 border border-white/10 rounded-xl p-3 shrink-0">
              <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-2">
                Stage your contract
              </p>
              <div className="flex flex-wrap gap-2">
                {meldSlots.map((slot, idx) => {
                  const isActive  = activeSlotIdx === idx;
                  const isFull    = slot.cardIds.length >= slot.minSize;
                  const slotCards = slot.cardIds
                    .map((id) => me.hand.find((c) => c.id === id))
                    .filter((c): c is Card => !!c);

                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveSlotIdx(isActive ? null : idx)}
                      className={cn(
                        'flex flex-col gap-1.5 p-2 rounded-xl border-2 cursor-pointer',
                        'transition-all min-w-[120px] flex-1',
                        isActive  && 'border-yellow-400 bg-yellow-900/30 shadow-lg shadow-yellow-900/30',
                        !isActive && isFull  && 'border-green-500 bg-green-900/30',
                        !isActive && !isFull && 'border-white/10 bg-black/20 hover:border-white/30',
                      )}
                    >
                      {/* Slot label */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-300">
                          {slot.type === 'set' ? '📋 Set' : '➡️ Run'} {slot.minSize}+
                        </span>
                        <span className="text-[10px]">
                          {isFull
                            ? <span className="text-green-400">✓</span>
                            : isActive
                              ? <span className="text-yellow-300">active</span>
                              : <span className="text-gray-500">{slot.minSize - slotCards.length} left</span>}
                        </span>
                      </div>

                      {/* Cards in slot + placeholders */}
                      <div className="flex flex-wrap gap-1 min-h-[84px] items-start content-start">
                        {slotCards.map((card) => (
                          <div
                            key={card.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setMeldSlots((prev) =>
                                prev.map((s) => ({
                                  ...s, cardIds: s.cardIds.filter((id) => id !== card.id),
                                })),
                              );
                            }}
                            title="Click to remove"
                            className="cursor-pointer hover:opacity-70 transition-opacity"
                          >
                            <CardTile card={card} size="md" />
                          </div>
                        ))}
                        {Array.from({ length: Math.max(0, slot.minSize - slotCards.length) }).map((_, i) => (
                          <div
                            key={`ph-${i}`}
                            className={cn(
                              'w-14 h-20 rounded-lg border-2 border-dashed flex items-center justify-center',
                              isActive ? 'border-yellow-400/60 bg-yellow-900/10' : 'border-white/10',
                            )}
                          >
                            {isActive && i === 0 && (
                              <span className="text-yellow-400 text-[9px] text-center leading-tight px-1">
                                tap<br />card
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Lay button */}
              <button
                onClick={handleLayContract}
                disabled={!canLayContract}
                className={cn(
                  'mt-2 w-full py-2 text-sm font-bold rounded-lg transition-colors',
                  canLayContract
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-900/50'
                    : 'bg-white/5 text-gray-600 cursor-default',
                )}
              >
                {canLayContract ? '✓ Lay Contract Down' : `Fill all ${meldSlots.length} slots first`}
              </button>
            </div>
          )}

          {/* Table melds */}
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">
              Table Melds {allMelds.length === 0 && '— none yet'}
            </p>
            {allMelds.length > 0 && (
              <div className="flex flex-col gap-3">
                {state.players.map((player) =>
                  player.melds.map((meld) => (
                    <MeldDisplay
                      key={meld.id}
                      meld={meld}
                      ownerName={player.name}
                      canExtend={canAct && me.contractMet}
                      onExtend={
                        canAct && me.contractMet
                          ? (meldId) => {
                              setPendingMeldTarget({ meldId });
                              setSelectedForDiscard(null);
                            }
                          : undefined
                      }
                    />
                  )),
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Deck + Discard (vertical stack) */}
        <div className="shrink-0 flex flex-col items-center justify-center gap-4 w-24">

          {/* Deck */}
          <div className="flex flex-col items-center gap-1">
            <CardTile
              card={{ id: 'back', suit: 'spades', rank: '2', isJoker: false }}
              faceDown
              size="lg"
              onClick={canDraw ? onDrawFromDeck : undefined}
              className={cn(
                canDraw && 'ring-4 ring-blue-400 ring-offset-2 ring-offset-transparent hover:scale-105 active:scale-95',
              )}
            />
            <span className={cn('text-xs font-bold', canDraw ? 'text-blue-300' : 'text-gray-500')}>
              {canDraw ? 'DRAW' : 'DECK'}
            </span>
            <span className="text-[10px] text-gray-500">{state.deck.length} left</span>
          </div>

          {/* Discard */}
          <div className="flex flex-col items-center gap-1">
            {topDiscard ? (
              <CardTile
                card={topDiscard}
                size="lg"
                onClick={canTakeDiscard ? onTakeDiscard : undefined}
                className={cn(
                  canTakeDiscard && 'ring-4 ring-amber-400 ring-offset-2 ring-offset-transparent hover:scale-105 active:scale-95',
                )}
              />
            ) : (
              <div className="w-16 h-24 rounded-xl border-2 border-dashed border-gray-700 flex items-center justify-center">
                <span className="text-gray-700 text-xs">empty</span>
              </div>
            )}
            <span className={cn('text-xs font-bold', canTakeDiscard ? 'text-amber-300' : 'text-gray-500')}>
              {canTakeDiscard ? 'TAKE' : 'DISCARD'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Player hand ───────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 border-t border-white/10 bg-black/30 pt-2 pb-3"
        style={{ minHeight: '175px' }}
      >
        <Hand
          cards={me.hand}
          canAct={canAct}
          stagedIds={stagedIds}
          selectedForDiscard={selectedForDiscard}
          activeSlotIdx={activeSlotIdx}
          pendingMeldTarget={!!pendingMeldTarget}
          onCardClick={handleCardClick}
          onDiscard={handleDiscard}
          onClearDiscard={() => setSelectedForDiscard(null)}
        />
      </div>

      {/* ── Scoreboard overlay ────────────────────────────────────────────────── */}
      {showScoreboard && (
        <div
          className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-6"
          onClick={() => setShowScoreboard(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
            <Scoreboard state={state} />
            <button
              onClick={() => setShowScoreboard(false)}
              className="mt-3 w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
