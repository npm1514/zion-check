import { Card, Rank, Suit } from '@/types/game';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

/** Build one standard 52-card deck (no jokers). Prefix distinguishes copies. */
function buildDeck(copyIndex: number): Card[] {
  const cards: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({
        id: `${suit}_${rank}_${copyIndex}`,
        suit,
        rank,
        isJoker: false,
      });
    }
  }
  return cards;
}

/** Build jokers for a given deck copy. */
function buildJokers(copyIndex: number, count: number): Card[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `joker_${copyIndex}_${i}`,
    suit: 'joker' as const,
    rank: 'joker' as const,
    isJoker: true,
  }));
}

/**
 * Create and shuffle a full game deck.
 * 2–4 players → 2 standard decks + 4 jokers
 * 5–8 players → 3 standard decks + 6 jokers
 */
export function createShuffledDeck(playerCount: number): Card[] {
  const deckCount = playerCount <= 4 ? 2 : 3;
  const jokerCount = deckCount * 2;

  let cards: Card[] = [];
  for (let i = 0; i < deckCount; i++) {
    cards = cards.concat(buildDeck(i));
  }
  cards = cards.concat(buildJokers(0, jokerCount));

  return shuffleArray(cards);
}

/** Fisher-Yates shuffle (returns a new array). */
export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Draw `count` cards from the top of the deck. Returns [drawn, remaining]. */
export function drawCards(deck: Card[], count: number): [Card[], Card[]] {
  const drawn = deck.slice(0, count);
  const remaining = deck.slice(count);
  return [drawn, remaining];
}

/** Number of cards dealt per round (round 1 → 6, round 2 → 7, … round 10 → 15). */
export function cardsForRound(round: number): number {
  return round + 5;
}
