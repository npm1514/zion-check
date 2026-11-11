import { Card, Meld, MeldSlot, MeldType, Rank, Suit } from '@/types/game';

// ─── Rank ordering ────────────────────────────────────────────────────────────

const RANK_ORDER: Rank[] = [
  '2','3','4','5','6','7','8','9','10','J','Q','K','A',
];

// Ace-low ordering: A 2 3 4 5 6 7 8 9 10 J Q K
const RANK_ORDER_ACE_LOW: Rank[] = [
  'A','2','3','4','5','6','7','8','9','10','J','Q','K',
];

export function rankIndex(rank: Rank): number {
  return RANK_ORDER.indexOf(rank);
}

// ─── Set validation ───────────────────────────────────────────────────────────

/**
 * A valid SET has:
 * - All non-joker cards sharing the same rank
 * - Minimum 3 cards total (including jokers)
 * - Suits do NOT need to be unique — two 6♠ from different decks is fine
 */
export function isValidSet(cards: Card[]): boolean {
  if (cards.length < 3) return false;

  const naturals = cards.filter((c) => !c.isJoker);
  if (naturals.length === 0) return false; // need at least one real card

  const rank = naturals[0].rank as Rank;

  for (const c of naturals) {
    if (c.rank !== rank) return false; // mismatched rank
  }

  return true;
}

/**
 * Core run validator for a given rank ordering.
 * Ace-high: RANK_ORDER (default). Ace-low: RANK_ORDER_ACE_LOW.
 */
function tryRunWithOrder(
  cards: Card[],
  rankOrder: Rank[],
): { valid: boolean; slots: MeldSlot[] } {
  const naturals   = cards.filter((c) => !c.isJoker);
  const jokerCount = cards.filter((c) => c.isJoker).length;

  const suit = naturals[0].suit as Suit;
  if (naturals.some((c) => c.suit !== suit)) return { valid: false, slots: [] };

  const idxOf = (rank: Rank) => rankOrder.indexOf(rank);
  const indices = naturals.map((c) => idxOf(c.rank as Rank));

  // Rank must exist in this ordering (e.g. Ace must be present in ace-low order)
  if (indices.some((i) => i === -1)) return { valid: false, slots: [] };

  // Duplicate ranks not allowed in a run
  if (new Set(indices).size < naturals.length) return { valid: false, slots: [] };

  const minIdx = Math.min(...indices);
  const maxIdx = Math.max(...indices);
  const span   = maxIdx - minIdx + 1;

  if (span > cards.length) return { valid: false, slots: [] };
  if (cards.length - span > jokerCount) return { valid: false, slots: [] };

  const naturalMap = new Map(naturals.map((c) => [idxOf(c.rank as Rank), c]));
  const jokers     = cards.filter((c) => c.isJoker);

  const minStart = Math.max(0, maxIdx - cards.length + 1);
  const maxStart = Math.min(minIdx, rankOrder.length - cards.length);

  for (let startIdx = minStart; startIdx <= maxStart; startIdx++) {
    let jokerIdx = 0;
    const slots: MeldSlot[] = [];
    let ok = true;

    for (let i = 0; i < cards.length; i++) {
      const ri   = startIdx + i;
      const rank = rankOrder[ri];
      if (naturalMap.has(ri)) {
        slots.push({ card: naturalMap.get(ri)! });
      } else {
        if (jokerIdx >= jokers.length) { ok = false; break; }
        slots.push({ card: jokers[jokerIdx++], substituting: { suit, rank } });
      }
    }

    if (ok && jokerIdx === jokers.length) {
      return { valid: true, slots };
    }
  }

  return { valid: false, slots: [] };
}

/**
 * A valid RUN has:
 * - All non-joker cards sharing the same suit
 * - Consecutive ranks with jokers filling any gaps
 * - Minimum 4 cards total
 * - Ace may be high (…Q K A) OR low (A 2 3 4…), but not both ends (no wrap-around)
 */
export function isValidRun(cards: Card[]): { valid: boolean; slots: MeldSlot[] } {
  if (cards.length < 4) return { valid: false, slots: [] };

  const naturals = cards.filter((c) => !c.isJoker);
  if (naturals.length === 0) return { valid: false, slots: [] };

  // Try ace-high first (standard)
  const high = tryRunWithOrder(cards, RANK_ORDER);
  if (high.valid) return high;

  // If an ace is present, also try ace-low (A 2 3 4…)
  if (naturals.some((c) => c.rank === 'A')) {
    return tryRunWithOrder(cards, RANK_ORDER_ACE_LOW);
  }

  return { valid: false, slots: [] };
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

    // Sets require only matching rank — suits are unrestricted.
    // Jokers in a set are pure wildcards with no specific substitution target.
    const slots: MeldSlot[] = [
      ...naturals.map((c): MeldSlot => ({ card: c })),
      ...jokers.map((c): MeldSlot => ({ card: c })),
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

export type RunEnd = 'low' | 'high';

/** The rank a run slot stands for (a joker's substituted rank, or the card's own). */
function slotRank(slot: MeldSlot): Rank | null {
  if (slot.card.isJoker) return slot.substituting?.rank ?? null;
  return slot.card.rank as Rank;
}

function runSuit(meld: Meld): Suit | null {
  for (const s of meld.slots) {
    if (!s.card.isJoker) return s.card.suit as Suit;
    if (s.substituting) return s.substituting.suit;
  }
  return null;
}

/** Rank just below `r` in a run (2 → A for ace-low); null if nothing fits. */
function rankBelow(r: Rank): Rank | null {
  if (r === 'A') return null;
  if (r === '2') return 'A';
  return RANK_ORDER[rankIndex(r) - 1];
}

/** Rank just above `r` in a run (K → A for ace-high); null if nothing fits. */
function rankAbove(r: Rank): Rank | null {
  if (r === 'A') return null;
  return RANK_ORDER[rankIndex(r) + 1];
}

/**
 * For each end of a run, the rank a card placed there would stand for —
 * or null if that end is closed (past an ace) or the card doesn't fit there.
 */
export function runEndTargets(meld: Meld, card: Card): Record<RunEnd, { suit: Suit; rank: Rank } | null> {
  const none = { low: null, high: null };
  if (meld.type !== 'run' || meld.slots.length === 0) return none;

  const suit  = runSuit(meld);
  const first = slotRank(meld.slots[0]);
  const last  = slotRank(meld.slots[meld.slots.length - 1]);
  if (!suit || !first || !last) return none;

  const used = new Set(meld.slots.map(slotRank));
  const fits = (rank: Rank | null) => {
    if (!rank || used.has(rank)) return null; // closed end, or would repeat a rank (A at both ends)
    if (!card.isJoker && (card.suit !== suit || card.rank !== rank)) return null;
    return { suit, rank };
  };

  return { low: fits(rankBelow(first)), high: fits(rankAbove(last)) };
}

/** Which ends of a run `card` could be added to (empty for sets). */
export function runEndOptions(meld: Meld, card: Card): RunEnd[] {
  const t = runEndTargets(meld, card);
  return (['low', 'high'] as RunEnd[]).filter((e) => t[e]);
}

/**
 * Returns the updated meld if `card` can legally extend it, otherwise null.
 * For runs, `end` picks which end the card goes on (needed for jokers, which
 * can fit either end); existing slots are kept exactly as they are.
 */
export function extendMeld(meld: Meld, card: Card, end?: RunEnd): Meld | null {
  const cards = meld.slots.map((s) => s.card);

  if (meld.type === 'set') {
    if (!card.isJoker) {
      // Card must match the set's rank (suits are unrestricted in this game)
      const naturals = meld.slots.filter((s) => !s.card.isJoker);
      const setRank = (naturals[0].card.rank as Rank);
      if (card.rank !== setRank) return null;
    }
    const newCards = [...cards, card];
    const updated = buildMeld(meld.id, meld.ownerId, 'set', newCards);
    return updated;
  }

  if (meld.type === 'run') {
    const targets = runEndTargets(meld, card);
    const chosen  = end ?? (targets.low ? 'low' : 'high');
    const target  = targets[chosen];
    if (!target) return null;

    const slot: MeldSlot = card.isJoker ? { card, substituting: target } : { card };
    return {
      ...meld,
      slots: chosen === 'low' ? [slot, ...meld.slots] : [...meld.slots, slot],
    };
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
