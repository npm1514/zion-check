import { Card, Meld, MeldSlot, MeldType, Rank, Suit } from '@/types/game';

// ─── Rank ordering ────────────────────────────────────────────────────────────

const RANK_ORDER: Rank[] = [
  '2','3','4','5','6','7','8','9','10','J','Q','K','A',
];

export function rankIndex(rank: Rank): number {
  return RANK_ORDER.indexOf(rank);
}

// ─── Set validation ───────────────────────────────────────────────────────────

/**
 * A valid SET has:
 * - All non-joker cards sharing the same rank
 * - No duplicate suits among non-jokers
 * - Minimum 3 cards total (including jokers)
 */
export function isValidSet(cards: Card[]): boolean {
  if (cards.length < 3) return false;

  const naturals = cards.filter((c) => !c.isJoker);
  if (naturals.length === 0) return false; // need at least one real card

  const rank = naturals[0].rank as Rank;
  const suits = new Set<string>();

  for (const c of naturals) {
    if (c.rank !== rank) return false;           // mismatched rank
    if (suits.has(c.suit)) return false;         // duplicate suit
    suits.add(c.suit);
  }

  return true;
}

/**
 * A valid RUN has:
 * - All non-joker cards sharing the same suit
 * - Consecutive ranks with jokers filling any gaps
 * - Minimum 4 cards total
 * - No wrap-around (Ace is only high: …Q K A, never A 2 3…)
 */
export function isValidRun(cards: Card[]): { valid: boolean; slots: MeldSlot[] } {
  if (cards.length < 4) return { valid: false, slots: [] };

  const naturals = cards.filter((c) => !c.isJoker);
  if (naturals.length === 0) return { valid: false, slots: [] };

  const jokerCount = cards.filter((c) => c.isJoker).length;

  // All naturals must share the same suit
  const suit = naturals[0].suit as Suit;
  if (naturals.some((c) => c.suit !== suit)) return { valid: false, slots: [] };

  // Determine the range of ranks spanned
  const indices = naturals.map((c) => rankIndex(c.rank as Rank));
  const minIdx = Math.min(...indices);
  const maxIdx = Math.max(...indices);

  // The run must fit within cards.length positions
  const span = maxIdx - minIdx + 1;
  if (span > cards.length) return { valid: false, slots: [] };
  if (cards.length - span > jokerCount) return { valid: false, slots: [] };

  // Build slots left-to-right, filling gaps with joker substitutions
  const naturalMap = new Map(naturals.map((c) => [rankIndex(c.rank as Rank), c]));
  const jokers = cards.filter((c) => c.isJoker);
  let jokerIdx = 0;

  // Decide the starting rank of the run
  // The run occupies positions [startIdx, startIdx + cards.length - 1]
  // We pick the minimum natural minus however many jokers are to its left
  const startIdx = minIdx; // simplest: naturals anchor the run's start
  const slots: MeldSlot[] = [];

  for (let i = 0; i < cards.length; i++) {
    const ri = startIdx + i;
    if (ri < 0 || ri >= RANK_ORDER.length) return { valid: false, slots: [] };

    const rank = RANK_ORDER[ri];
    if (naturalMap.has(ri)) {
      slots.push({ card: naturalMap.get(ri)! });
    } else {
      // Fill with a joker
      if (jokerIdx >= jokers.length) return { valid: false, slots: [] };
      slots.push({
        card: jokers[jokerIdx++],
        substituting: { suit, rank },
      });
    }
  }

  return { valid: true, slots };
}

// ─── Build a Meld from raw cards ──────────────────────────────────────────────

export function buildMeld(
  id: string,
  ownerId: string,
  type: MeldType,
  cards: Card[],
): Meld | null {
  if (type === 'set') {
    if (!isValidSet(cards)) return null;
    const jokers = cards.filter((c) => c.isJoker);
    const naturals = cards.filter((c) => !c.isJoker);
    const rank = (naturals[0].rank as Rank);
    // Jokers in a set substitute any suit of the set's rank
    const usedSuits = new Set(naturals.map((c) => c.suit as Suit));
    const allSuits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const availSuits = allSuits.filter((s) => !usedSuits.has(s));

    const slots: MeldSlot[] = [
      ...naturals.map((c): MeldSlot => ({ card: c })),
      ...jokers.map((c, i): MeldSlot => ({
        card: c,
        substituting: { suit: availSuits[i] ?? 'hearts', rank },
      })),
    ];

    return { id, ownerId, type, slots };
  }

  if (type === 'run') {
    const { valid, slots } = isValidRun(cards);
    if (!valid) return null;
    return { id, ownerId, type, slots };
  }

  return null;
}

// ─── Can a card extend an existing meld? ─────────────────────────────────────

/**
 * Returns the updated meld if `card` can legally extend it, otherwise null.
 */
export function extendMeld(meld: Meld, card: Card): Meld | null {
  const cards = meld.slots.map((s) => s.card);

  if (meld.type === 'set') {
    if (!card.isJoker) {
      // Must match the set's rank and not duplicate a suit
      const naturals = meld.slots.filter((s) => !s.card.isJoker);
      const setRank = (naturals[0].card.rank as Rank);
      if (card.rank !== setRank) return null;
      const existingSuits = new Set(naturals.map((s) => s.card.suit));
      if (existingSuits.has(card.suit)) return null;
    }
    // For joker extending a set, determine next available suit
    const newCards = [...cards, card];
    const updated = buildMeld(meld.id, meld.ownerId, 'set', newCards);
    return updated;
  }

  if (meld.type === 'run') {
    // Try adding to either end of the run
    const tryLeft = buildMeld(meld.id, meld.ownerId, 'run', [card, ...cards]);
    if (tryLeft) return tryLeft;
    const tryRight = buildMeld(meld.id, meld.ownerId, 'run', [...cards, card]);
    if (tryRight) return tryRight;
    return null;
  }

  return null;
}

// ─── Joker-replacement check ──────────────────────────────────────────────────

/**
 * Returns true if `card` can replace a joker in any of the provided melds.
 * Used to enforce the rule: you cannot discard a card that can replace a joker.
 */
export function canReplaceJoker(card: Card, allMelds: Meld[]): boolean {
  if (card.isJoker) return false; // jokers cannot replace jokers

  for (const meld of allMelds) {
    for (const slot of meld.slots) {
      if (!slot.card.isJoker || !slot.substituting) continue;
      if (
        slot.substituting.rank === card.rank &&
        slot.substituting.suit === card.suit
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Returns true if the given card is legal to discard.
 * Rules:
 *   1. Cannot discard a joker.
 *   2. Cannot discard a card that can replace a joker on the table.
 */
export function canDiscard(card: Card, allMeldsOnTable: Meld[]): boolean {
  if (card.isJoker) return false;
  if (canReplaceJoker(card, allMeldsOnTable)) return false;
  return true;
}

// ─── Contract satisfaction check ─────────────────────────────────────────────

import { Contract } from '@/types/game';

/**
 * Check whether a proposed set of melds satisfies the round contract.
 * Each requirement must be matched by exactly one meld (one-to-one).
 */
export function satisfiesContract(contract: Contract, melds: Meld[]): boolean {
  if (melds.length < contract.requirements.length) return false;

  const used = new Array(melds.length).fill(false);

  for (const req of contract.requirements) {
    const idx = melds.findIndex(
      (m, i) => !used[i] && m.type === req.type && m.slots.length >= req.minSize,
    );
    if (idx === -1) return false;
    used[idx] = true;
  }

  return true;
}
