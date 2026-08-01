'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, GameState, Meld, MeldType } from '@/types/game';
import { cn } from '@/lib/utils';
import { CardTile } from './CardTile';
import { Hand } from './Hand';
import { MeldDisplay } from './MeldDisplay';
import { OpponentPanel, AVATARS } from './OpponentPanel';
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
  isHost: boolean;
  roomCode: string;
  onDrawFromDeck: () => void;
  onTakeDiscard: () => void;
  onLayContract: (melds: { type: MeldType; cardIds: string[] }[]) => void;
  onLayToMeld: (meldId: string, cardId: string) => void;
  onDiscard: (cardId: string) => void;
  onBuy: () => void;
  onNextRound: () => void;
  error: string | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GameTable({
  state,
  myId,
  isHost,
  roomCode,
  onDrawFromDeck,
  onTakeDiscard,
  onLayContract,
  onLayToMeld,
  onDiscard,
  onBuy,
  onNextRound,
  error,
}: GameTableProps) {

  const me            = state.players.find((p) => p.id === myId)!;
  const opponents     = state.players.filter((p) => p.id !== myId);
  const currentPlayer = state.players[state.currentPlayerIdx];
  const isMyTurn      = currentPlayer?.id === myId;
  const contract      = getContract(state.round);
  const allMelds: Meld[] = state.players.flatMap((p) => p.melds);
  const topDiscard    = state.discardPile[state.discardPile.length - 1];
  const canDraw        = isMyTurn && (state.phase === 'draw' || state.phase === 'buy_window');
  const canTakeDiscard = isMyTurn && (state.phase === 'draw' || state.phase === 'buy_window') && !!topDiscard && state.lastDiscardedById !== myId && !me.contractMet;
  const canAct        = isMyTurn && state.phase === 'action';

  // ── UI state ─────────────────────────────────────────────────────────────────

  const [showScoreboard,    setShowScoreboard]    = useState(false);
  const [pendingMeldTarget, setPendingMeldTarget] = useState<{ meldId: string } | null>(null);
  const [selectedForDiscard,setSelectedForDiscard]= useState<string | null>(null);

  // ── Buy announcement — shown while lastBuyerId is set, cleared when buy resolves ──
  const buyAnnouncement = state.lastBuyerId
    ? { playerId: state.lastBuyerId, name: state.players.find((p) => p.id === state.lastBuyerId)?.name ?? '' }
    : null;

  // ── Meld builder state ────────────────────────────────────────────────────

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

    if (pendingMeldTarget) {
      onLayToMeld(pendingMeldTarget.meldId, cardId);
      setPendingMeldTarget(null);
      return;
    }

    if (activeSlotIdx !== null && !me.contractMet) {
      if (stagedIds.has(cardId)) {
        setMeldSlots((prev) =>
          prev.map((s) => ({ ...s, cardIds: s.cardIds.filter((id) => id !== cardId) })),
        );
      } else {
        setMeldSlots((prev) =>
          prev.map((s, i) =>
            i === activeSlotIdx ? { ...s, cardIds: [...s.cardIds, cardId] } : s,
          ),
        );
      }
      setSelectedForDiscard(null);
      return;
    }

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

  // ── Round Over screen ─────────────────────────────────────────────────────

  if (state.phase === 'round_end') {
    const sorted = [...state.players].sort((a, b) => totalScore(a) - totalScore(b));
    const roundJustPlayed = state.round + 5;   // display label (6–12)
    const nextRoundNum    = state.round + 1 + 5;

    return (
      <div className="h-screen bg-[#0d3d1f] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h1 className="text-2xl font-black mb-1">Round {roundJustPlayed} Complete!</h1>
          <p className="text-gray-500 text-sm mb-6">Scores so far · lowest wins</p>

          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="text-gray-400 text-xs uppercase border-b border-gray-200">
                <th className="text-left pb-2">Player</th>
                {Array.from({ length: state.round }, (_, i) => (
                  <th key={i} className="text-center pb-2 w-10">{i + 6}</th>
                ))}
                <th className="text-right pb-2 pr-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((player, rank) => (
                <tr
                  key={player.id}
                  className={cn(
                    'border-b border-gray-100',
                    rank === 0 ? 'text-yellow-700 font-semibold' : 'text-gray-700',
                  )}
                >
                  <td className="py-2 text-left">
                    {rank === 0 && <span>👑 </span>}
                    {player.name}
                    {player.id === myId && (
                      <span className="text-[10px] text-gray-400 ml-1">(you)</span>
                    )}
                  </td>
                  {player.roundScores.map((score, ri) => (
                    <td
                      key={ri}
                      className={cn(
                        'text-center py-2 text-xs',
                        ri === state.round - 1 ? 'font-bold text-gray-900' : 'text-gray-400',
                      )}
                    >
                      {score}
                    </td>
                  ))}
                  <td className="text-right py-2 pr-1 font-bold">{totalScore(player)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {isHost ? (
            <button
              onClick={onNextRound}
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold text-lg rounded-xl shadow-lg transition-colors"
            >
              Deal Round {nextRoundNum} →
            </button>
          ) : (
            <p className="text-gray-400 text-sm animate-pulse">
              Waiting for the host to deal round {nextRoundNum}…
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Game Over screen ──────────────────────────────────────────────────────

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

  // Turn banner text
  const firstDrawPending   = canAct && state.lastDrawnId !== null && state.discardPile.length <= 1;
  const isFirstDrawReject  = canDraw && state.lastDiscardedById === myId;
  const turnText = isMyTurn
    ? isFirstDrawReject
      ? '🎴 Your turn — Pick up a card from the draw pile'
      : canDraw
        ? state.discardPile.length === 0
          ? '🎴 Draw from the deck to start the round'
          : '🎴 Your turn — click the deck or take the discard'
        : firstDrawPending
          ? '👀 Keep your draw or discard it to let others buy — then draw again'
          : me.contractMet
            ? '✓ Contract down — add cards to melds or discard'
            : '📋 Your turn — fill your contract slots then lay them down'
    : `⏳ Waiting for ${currentPlayer?.name}…`;

  return (
    <div
      className="h-screen flex flex-col overflow-hidden text-white"
      style={{
        background: 'radial-gradient(ellipse at 50% 40%, #166534 0%, #14532d 55%, #0d3d1f 100%)',
      }}
    >

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      {/* 3-column grid so the round tracker is always perfectly centred */}
      <header className="shrink-0 bg-black/30 border-b border-white/10">
        <div className="grid grid-cols-3 items-center px-4 py-1.5">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm">🃏 Zion&apos;s Check</span>
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded font-mono tracking-widest">
              {roomCode}
            </span>
          </div>

          {/* Round tracker — guaranteed centre column */}
          <div className="flex justify-center">
            <RoundTracker currentRound={state.round} contractLabel={contract.label} />
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={() => setShowScoreboard((v) => !v)}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors"
            >
              📊 Scores
            </button>
          </div>
        </div>

        {/* Error row — only rendered when there's an error */}
        {error && (
          <div className="px-4 pb-1.5 text-center">
            <span className="text-red-400 text-xs font-semibold">⚠ {error}</span>
          </div>
        )}
      </header>

      {/* ── Opponents Row (with their melds below) ──── */}
      <div className="shrink-0 flex gap-2 px-2 pt-2 pb-1 overflow-x-auto">

        {/* Opponents */}
        {opponents.map((player) => (
          <div key={player.id} className="flex flex-col gap-1 min-w-[120px] flex-1 max-w-[200px]">
            <OpponentPanel
              player={player}
              isCurrentPlayer={currentPlayer?.id === player.id}
              contractLabel={contract.label}
            />

            {/* Their melds below the panel */}
            {player.melds.length > 0 && (
              <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                {player.melds.map((meld) => (
                  <div key={meld.id} className="flex items-start gap-1 flex-wrap">
                    <div className="flex flex-wrap gap-0.5">
                      {meld.slots.map((slot, i) => (
                        <div key={i} className="relative">
                          <CardTile card={slot.card} size="sm" />
                          {slot.substituting && (
                            <span className="absolute -bottom-0.5 left-0 right-0 text-center text-[7px] bg-purple-700 text-white rounded leading-none">
                              {slot.substituting.rank}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {canAct && me.contractMet && !me.justLaidContract && (
                      <button
                        onClick={() => { setPendingMeldTarget({ meldId: meld.id }); setSelectedForDiscard(null); }}
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 mt-0.5',
                          pendingMeldTarget?.meldId === meld.id
                            ? 'bg-yellow-400 text-black'
                            : 'bg-white/20 hover:bg-white/30 text-white',
                        )}
                      >
                        + Add
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Turn banner ──────────────────────────────────────────────────────── */}
      <div className={cn(
        'shrink-0 mx-3 rounded-lg px-3 py-1.5 text-center text-xs font-bold mb-1',
        isMyTurn ? 'bg-yellow-500/90 text-black' : 'bg-black/30 text-gray-300',
      )}>
        {turnText}
      </div>

      {/* ── Scrollable center ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 px-3 pb-2">


        {/* Meld staging (action phase, contract not yet met) */}
        {canAct && !me.contractMet && (
          <div className="shrink-0 bg-black/30 border border-white/10 rounded-xl p-3">
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

        {/* ── Deck + Discard centered ──────────────────────────────────────── */}
        <div className="flex justify-center items-start gap-8 py-2">

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
          <div className="flex items-center gap-3">
            {/* Card + label column */}
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
                  <span className="text-gray-600 text-[10px] text-center leading-tight px-1">
                    Draw<br />to start
                  </span>
                </div>
              )}
              <span className={cn('text-xs font-bold', canTakeDiscard ? 'text-amber-300' : 'text-gray-500')}>
                {canTakeDiscard ? 'TAKE' : 'DISCARD'}
              </span>

              {/* Buy button — shown to non-active players during buy window (not if contract already met or someone already bought) */}
              {state.phase === 'buy_window' && !isMyTurn && topDiscard && state.lastDiscardedById !== myId && !me.contractMet && state.pendingBuyRequests.length === 0 && (() => {
                const maxBuy = state.round === 7 && (me?.buysThisRound ?? 0) >= 1;
                return maxBuy ? (
                  <span className="text-[10px] text-gray-500 mt-1">Max buys used</span>
                ) : (
                  <button
                    onClick={onBuy}
                    className="mt-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg"
                  >
                    Buy!
                  </button>
                );
              })()}
            </div>

            {/* BUY! announcement — beside the card */}
            {buyAnnouncement && (
              <div className="flex flex-col items-center gap-1 animate-pulse">
                <span className="text-2xl font-black text-red-400 drop-shadow-lg">BUY!</span>
                <span className="text-xs text-red-300 font-bold">{buyAnnouncement.name}</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Your melds above hand ─────────────────────────────────────────────── */}
      {me.contractMet && me.melds.length > 0 && (
        <div className="shrink-0 border-t border-white/10 bg-black/20 px-3 py-2">
          <p className="text-[10px] text-green-400 font-bold uppercase tracking-wide mb-1.5">
            Your Melds
          </p>
          <div className="flex gap-3 flex-wrap">
            {me.melds.map((meld) => (
              <MeldDisplay
                key={meld.id}
                meld={meld}
                ownerName="You"
                canExtend={canAct && !me.justLaidContract}
                onExtend={
                  canAct && !me.justLaidContract
                    ? (meldId) => { setPendingMeldTarget({ meldId }); setSelectedForDiscard(null); }
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Player hand ───────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'shrink-0 border-t pb-3',
          isMyTurn
            ? 'border-yellow-400/60 bg-yellow-500/10 pt-0'
            : 'border-white/10 bg-black/30 pt-2',
        )}
        style={{ minHeight: '175px' }}
      >
        {/* Name bar */}
        <div className={cn(
          'flex items-center justify-center gap-2 px-3 py-1.5',
          isMyTurn ? 'bg-yellow-500/20' : 'bg-black/20',
        )}>
          <span className="text-sm leading-none">{AVATARS[me.seatIndex % AVATARS.length]}</span>
          <span className="text-xs font-bold text-white">{me.name} <span className="text-gray-400 font-normal">(you)</span></span>
          {isMyTurn && <span className="text-yellow-300 text-[9px] font-bold animate-pulse">YOUR TURN</span>}
          <span className="text-[10px] text-gray-300">🃏{me.hand.length}</span>
        </div>
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
