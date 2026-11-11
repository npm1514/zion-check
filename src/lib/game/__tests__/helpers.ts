import type { Card, GameState, Meld, MeldSlot, PlayerState, Rank, Suit } from '@/types/game';

const SUIT_BY_LETTER: Record<string, Suit> = { h: 'hearts', d: 'diamonds', c: 'clubs', s: 'spades' };

let uid = 0;

/**
 * Card shorthand: c('5h'), c('10s'), c('Ad'). Pass `id` to pin a stable id;
 * otherwise each call gets a unique one (two c('5h') are different physical cards).
 */
export function c(code: string, id?: string): Card {
  const suit = SUIT_BY_LETTER[code.slice(-1)];
  const rank = code.slice(0, -1) as Rank;
  if (!suit) throw new Error(`bad card code ${code}`);
  return { id: id ?? `${code}#${++uid}`, suit, rank, isJoker: false };
}

/** A joker. */
export function jk(id?: string): Card {
  return { id: id ?? `joker#${++uid}`, suit: 'joker', rank: 'joker', isJoker: true };
}

/** Several cards at once: cs('5h 6h 7h 8h'). */
export function cs(codes: string): Card[] {
  return codes.trim().split(/\s+/).map((code) => (code === 'JK' ? jk() : c(code)));
}

/** Run slots shorthand: describe a run like '5h 6h JK:7h 8h' (JK:7h = joker standing for 7♥). */
export function runMeld(spec: string, id = 'run1', ownerId = 'p1'): Meld {
  const slots: MeldSlot[] = spec.trim().split(/\s+/).map((tok) => {
    if (tok.startsWith('JK:')) {
      const sub = c(tok.slice(3));
      return { card: jk(), substituting: { suit: sub.suit as Suit, rank: sub.rank as Rank } };
    }
    return { card: c(tok) };
  });
  return { id, ownerId, type: 'run', slots };
}

export function setMeld(spec: string, id = 'set1', ownerId = 'p1'): Meld {
  return { id, ownerId, type: 'set', slots: cs(spec).map((card) => ({ card })) };
}

/** Human-readable view of a meld: '5 6 [7] 8' where [x] is a joker standing for x. */
export function show(meld: Meld | null): string | null {
  if (!meld) return null;
  return meld.slots
    .map((s) => (s.card.isJoker ? `[${s.substituting?.rank ?? '*'}]` : s.card.rank))
    .join(' ');
}

export function player(id: string, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id,
    name: id.toUpperCase(),
    seatIndex: 0,
    hand: [],
    melds: [],
    contractMet: false,
    justLaidContract: false,
    buysThisRound: 0,
    roundScores: [],
    isConnected: true,
    isReady: true,
    ...overrides,
  };
}

/** A mid-round game state. Players get seatIndex from their position. */
export function game(players: PlayerState[], overrides: Partial<GameState> = {}): GameState {
  return {
    phase: 'action',
    round: 1,
    currentPlayerIdx: 0,
    deck: cs('2c 3c 4c 5c 6c 7c 8c 9c'),
    discardPile: [],
    players: players.map((p, i) => ({ ...p, seatIndex: i })),
    pendingBuyRequests: [],
    buyWindowOpenAt: null,
    hostId: players[0]?.id ?? 'p1',
    version: 1,
    lastDrawnId: null,
    lastDiscardedById: null,
    lastBuyerId: null,
    perfectCutDealerIdx: null,
    perfectCutBonusRounds: [],
    lastCutResult: null,
    ...overrides,
  };
}

export function hand(state: GameState, playerId: string): Card[] {
  return state.players.find((p) => p.id === playerId)!.hand;
}

export function totalCards(state: GameState): number {
  return (
    state.deck.length +
    state.discardPile.length +
    state.players.reduce((n, p) => n + p.hand.length + p.melds.reduce((m, md) => m + md.slots.length, 0), 0)
  );
}
