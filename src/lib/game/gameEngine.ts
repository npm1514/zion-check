/**
 * Pure game-state reducer.
 * All mutations return a NEW GameState — nothing is mutated in place.
 */

import { Card, GameState, Meld, MeldType, PlayerState, cardPoints } from '@/types/game';
import { buildMeld, canDiscard, extendMeld, satisfiesContract } from './meldValidator';
import { cardsForRound, createShuffledDeck, drawCards } from './deck';
import { getContract } from './contracts';
import { nanoid } from 'nanoid';

const MAX_ROUNDS = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function updatePlayer(
  state: GameState,
  playerId: string,
  updater: (p: PlayerState) => PlayerState,
): GameState {
  return {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? updater(clone(p)) : p)),
  };
}

function allMeldsOnTable(state: GameState): Meld[] {
  return state.players.flatMap((p) => p.melds);
}

// ─── Initial state ────────────────────────────────────────────────────────────

export function createInitialState(
  hostId: string,
  players: { id: string; name: string }[],
): GameState {
  return {
    phase: 'lobby',
    round: 1,
    currentPlayerIdx: 0,
    deck: [],
    discardPile: [],
    players: players.map((p, i) => ({
      id: p.id,
      name: p.name,
      seatIndex: i,
      hand: [],
      melds: [],
      contractMet: false,
      buysThisRound: 0,
      roundScores: [],
      isConnected: true,
      isReady: false,
    })),
    pendingBuyRequests: [],
    buyWindowOpenAt: null,
    hostId,
    version: 0,
  };
}

// ─── Start game / deal round ──────────────────────────────────────────────────

export function startRound(state: GameState): GameState {
  const s = clone(state) as GameState;
  const cardCount = cardsForRound(s.round);
  let deck = createShuffledDeck(s.players.length);

  // Deal cards
  for (const player of s.players) {
    const [hand, remaining] = drawCards(deck, cardCount);
    player.hand = hand;
    player.melds = [];
    player.contractMet = false;
    player.buysThisRound = 0;
    deck = remaining;
  }

  // Flip first discard
  const [firstDiscard, remaining] = drawCards(deck, 1);

  return {
    ...s,
    phase: 'buy_window',
    deck: remaining,
    discardPile: firstDiscard,
    pendingBuyRequests: [],
    buyWindowOpenAt: Date.now(),
    currentPlayerIdx: 0,
    version: s.version + 1,
  };
}

// ─── Buy window resolution ────────────────────────────────────────────────────

/**
 * Called when the buy window closes (either time-expired or player drew from deck).
 * The first player in pendingBuyRequests wins the buy.
 */
export function resolveBuyWindow(state: GameState): GameState {
  let s = clone(state) as GameState;

  if (s.pendingBuyRequests.length > 0 && s.discardPile.length > 0) {
    const buyerId = s.pendingBuyRequests[0];
    const buyer = s.players.find((p) => p.id === buyerId);
    if (buyer) {
      // Enforce round-10 single-buy rule
      const canBuy =
        s.round < 10 || buyer.buysThisRound === 0;

      if (canBuy) {
        const topDiscard = s.discardPile[s.discardPile.length - 1];
        s.discardPile = s.discardPile.slice(0, -1);

        const [penalty, remaining] = drawCards(s.deck, 1);
        s.deck = remaining;

        s = updatePlayer(s, buyerId, (p) => ({
          ...p,
          hand: [...p.hand, topDiscard, ...penalty],
          buysThisRound: p.buysThisRound + 1,
        })) as GameState;
      }
    }
  }

  return {
    ...s,
    phase: 'draw',
    pendingBuyRequests: [],
    buyWindowOpenAt: null,
    version: s.version + 1,
  };
}

// ─── Player requests to buy ───────────────────────────────────────────────────

export function requestBuy(state: GameState, playerId: string): GameState {
  const currentPlayer = state.players[state.currentPlayerIdx];
  if (playerId === currentPlayer.id) return state; // current player can't buy
  if (state.phase !== 'buy_window') return state;

  const player = state.players.find((p) => p.id === playerId);
  if (!player) return state;

  // Enforce round-10 single-buy rule
  if (state.round === 10 && player.buysThisRound >= 1) return state;

  if (state.pendingBuyRequests.includes(playerId)) return state;

  return {
    ...state,
    pendingBuyRequests: [...state.pendingBuyRequests, playerId],
    version: state.version + 1,
  };
}

// ─── Draw from deck ───────────────────────────────────────────────────────────

export function drawFromDeck(state: GameState, playerId: string): GameState {
  if (state.phase !== 'draw' && state.phase !== 'buy_window') return state;
  const currentPlayer = state.players[state.currentPlayerIdx];
  if (currentPlayer.id !== playerId) return state;

  // Resolve any pending buys first
  let s = state.phase === 'buy_window' ? resolveBuyWindow(state) : clone(state);

  if (s.deck.length === 0) return s; // safety check

  const [drawn, remaining] = drawCards(s.deck, 1);

  s = updatePlayer(s, playerId, (p) => ({
    ...p,
    hand: [...p.hand, ...drawn],
  })) as GameState;

  // Open a new buy window for the discard pile top AFTER the draw
  return {
    ...s,
    deck: remaining,
    phase: 'action',
    version: s.version + 1,
  };
}

// ─── Take top of discard pile ─────────────────────────────────────────────────

export function takeDiscard(state: GameState, playerId: string): GameState {
  if (state.phase !== 'draw' && state.phase !== 'buy_window') return state;
  const currentPlayer = state.players[state.currentPlayerIdx];
  if (currentPlayer.id !== playerId) return state;
  if (state.discardPile.length === 0) return state;

  // Close buy window (active player taking discard cancels it)
  const topCard = state.discardPile[state.discardPile.length - 1];
  const newDiscardPile = state.discardPile.slice(0, -1);

  let s = {
    ...clone(state),
    discardPile: newDiscardPile,
    phase: 'action' as const,
    pendingBuyRequests: [],
    buyWindowOpenAt: null,
  } as GameState;

  s = updatePlayer(s, playerId, (p) => ({
    ...p,
    hand: [...p.hand, topCard],
  })) as GameState;

  return { ...s, version: s.version + 1 };
}

// ─── Lay down contract melds ──────────────────────────────────────────────────

/**
 * Player lays their contract melds for the first time this round.
 * `proposedMelds` is an array of arrays of card IDs grouped by meld.
 */
export function layContract(
  state: GameState,
  playerId: string,
  proposedMelds: { type: MeldType; cardIds: string[] }[],
): { state: GameState; error?: string } {
  if (state.phase !== 'action') return { state, error: 'Not in action phase' };

  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { state, error: 'Player not found' };
  if (player.contractMet) return { state, error: 'Contract already met' };

  const contract = getContract(state.round);

  // Build melds from proposed card IDs
  const handMap = new Map(player.hand.map((c) => [c.id, c]));
  const builtMelds: Meld[] = [];
  const usedIds = new Set<string>();

  for (const pm of proposedMelds) {
    const cards: Card[] = [];
    for (const id of pm.cardIds) {
      if (!handMap.has(id)) return { state, error: `Card ${id} not in hand` };
      if (usedIds.has(id)) return { state, error: 'Duplicate card in melds' };
      cards.push(handMap.get(id)!);
      usedIds.add(id);
    }
    const meld = buildMeld(nanoid(), playerId, pm.type, cards);
    if (!meld) return { state, error: `Invalid ${pm.type} meld` };
    builtMelds.push(meld);
  }

  if (!satisfiesContract(contract, builtMelds)) {
    return { state, error: `Melds do not satisfy round ${state.round} contract` };
  }

  // Remove used cards from hand
  const newHand = player.hand.filter((c) => !usedIds.has(c.id));

  const s = updatePlayer(state, playerId, (p) => ({
    ...p,
    hand: newHand,
    melds: builtMelds,
    contractMet: true,
  })) as GameState;

  return { state: { ...s, version: s.version + 1 } };
}

// ─── Extend an existing meld ──────────────────────────────────────────────────

export function layToMeld(
  state: GameState,
  playerId: string,
  meldId: string,
  cardId: string,
): { state: GameState; error?: string } {
  if (state.phase !== 'action') return { state, error: 'Not in action phase' };

  const actingPlayer = state.players.find((p) => p.id === playerId);
  if (!actingPlayer) return { state, error: 'Player not found' };
  if (!actingPlayer.contractMet) {
    return { state, error: 'Must meet your contract before extending melds' };
  }

  // Find the meld (could belong to any player)
  let meldOwnerIdx = -1;
  let meldIdx = -1;
  for (let pi = 0; pi < state.players.length; pi++) {
    const mi = state.players[pi].melds.findIndex((m) => m.id === meldId);
    if (mi !== -1) { meldOwnerIdx = pi; meldIdx = mi; break; }
  }
  if (meldOwnerIdx === -1) return { state, error: 'Meld not found' };

  const card = actingPlayer.hand.find((c) => c.id === cardId);
  if (!card) return { state, error: 'Card not in hand' };

  const targetMeld = state.players[meldOwnerIdx].melds[meldIdx];
  const updated = extendMeld(targetMeld, card);
  if (!updated) return { state, error: 'Card cannot extend that meld' };

  // Remove card from hand, update meld
  const s = updatePlayer(state, playerId, (p) => ({
    ...p,
    hand: p.hand.filter((c) => c.id !== cardId),
  })) as GameState;

  const newPlayers = s.players.map((p, pi) => {
    if (pi !== meldOwnerIdx) return p;
    return {
      ...p,
      melds: p.melds.map((m, mi) => (mi === meldIdx ? updated : m)),
    };
  });

  return {
    state: { ...s, players: newPlayers, version: s.version + 1 },
  };
}

// ─── Discard ──────────────────────────────────────────────────────────────────

export function discard(
  state: GameState,
  playerId: string,
  cardId: string,
): { state: GameState; error?: string } {
  if (state.phase !== 'action') return { state, error: 'Not in action phase' };

  const currentPlayer = state.players[state.currentPlayerIdx];
  if (currentPlayer.id !== playerId) return { state, error: 'Not your turn' };

  const card = currentPlayer.hand.find((c) => c.id === cardId);
  if (!card) return { state, error: 'Card not in hand' };

  if (!canDiscard(card, allMeldsOnTable(state))) {
    if (card.isJoker) return { state, error: 'You cannot discard a Joker' };
    return { state, error: 'That card can replace a Joker on the table — you must use it' };
  }

  const newHand = currentPlayer.hand.filter((c) => c.id !== cardId);
  let s = updatePlayer(state, playerId, (p) => ({ ...p, hand: newHand })) as GameState;

  // Check if this player went out (empty hand)
  const wentOut = newHand.length === 0;

  const newDiscardPile = [...s.discardPile, card];

  if (wentOut) {
    // Score the round
    s = scoreRound({ ...s, discardPile: newDiscardPile });

    if (s.round >= MAX_ROUNDS) {
      return { state: { ...s, phase: 'game_over', version: s.version + 1 } };
    }

    // Advance to next round
    const nextRound = s.round + 1;
    return {
      state: startRound({
        ...s,
        round: nextRound,
        phase: 'round_end',
        currentPlayerIdx: (state.currentPlayerIdx + 1) % s.players.length,
      }),
    };
  }

  // Advance turn — open buy window for next player's draw
  const nextIdx = (state.currentPlayerIdx + 1) % s.players.length;

  return {
    state: {
      ...s,
      discardPile: newDiscardPile,
      phase: 'buy_window',
      currentPlayerIdx: nextIdx,
      pendingBuyRequests: [],
      buyWindowOpenAt: Date.now(),
      version: s.version + 1,
    },
  };
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function scoreRound(state: GameState): GameState {
  const players = state.players.map((p) => {
    const penalty = p.hand.reduce((sum, c) => sum + cardPoints(c), 0);
    return {
      ...p,
      roundScores: [...p.roundScores, penalty],
    };
  });
  return { ...state, players, phase: 'round_end' };
}

// ─── Read-only helpers ────────────────────────────────────────────────────────

export function totalScore(player: PlayerState): number {
  return player.roundScores.reduce((a, b) => a + b, 0);
}

export function currentPlayer(state: GameState): PlayerState {
  return state.players[state.currentPlayerIdx];
}
