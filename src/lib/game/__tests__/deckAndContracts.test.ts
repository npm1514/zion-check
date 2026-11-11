import { describe, expect, it } from 'vitest';
import { cardsForRound, createShuffledDeck, drawCards, shuffleArray } from '../deck';
import { CONTRACTS, getContract } from '../contracts';
import { cardPoints } from '@/types/game';
import { c, jk } from './helpers';

describe('createShuffledDeck', () => {
  it('uses 2 decks + 4 jokers for 2–4 players', () => {
    for (const n of [2, 3, 4]) {
      const deck = createShuffledDeck(n);
      expect(deck).toHaveLength(108);
      expect(deck.filter((x) => x.isJoker)).toHaveLength(4);
    }
  });

  it('uses 3 decks + 6 jokers for 5–8 players', () => {
    for (const n of [5, 8]) {
      const deck = createShuffledDeck(n);
      expect(deck).toHaveLength(162);
      expect(deck.filter((x) => x.isJoker)).toHaveLength(6);
    }
  });

  it('gives every card a unique id', () => {
    const deck = createShuffledDeck(6);
    expect(new Set(deck.map((x) => x.id)).size).toBe(deck.length);
  });

  it('has each suit/rank once per deck copy', () => {
    const deck = createShuffledDeck(3);
    const sevensOfHearts = deck.filter((x) => x.suit === 'hearts' && x.rank === '7');
    expect(sevensOfHearts).toHaveLength(2);
  });
});

describe('shuffleArray', () => {
  it('returns a permutation and leaves the input alone', () => {
    const input = Array.from({ length: 50 }, (_, i) => i);
    const copy = [...input];
    const out = shuffleArray(input);
    expect(input).toEqual(copy);
    expect([...out].sort((a, b) => a - b)).toEqual(copy);
  });
});

describe('drawCards', () => {
  it('splits off the top cards', () => {
    const deck = [c('2h'), c('3h'), c('4h')];
    const [drawn, rest] = drawCards(deck, 2);
    expect(drawn).toEqual(deck.slice(0, 2));
    expect(rest).toEqual(deck.slice(2));
  });

  it('returns what is left when asking for too many', () => {
    const [drawn, rest] = drawCards([c('2h')], 5);
    expect(drawn).toHaveLength(1);
    expect(rest).toHaveLength(0);
  });
});

describe('cardsForRound', () => {
  it('deals 6 cards in round 1 (shown as Round 6) up to 12 in round 7', () => {
    expect(cardsForRound(1)).toBe(6);
    expect(cardsForRound(7)).toBe(12);
  });
});

describe('contracts', () => {
  it('defines rounds 1–7 in order', () => {
    expect(CONTRACTS.map((x) => x.round)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('throws for a round with no contract', () => {
    expect(() => getContract(0)).toThrow();
    expect(() => getContract(8)).toThrow();
  });

  it('has labels that match the requirements', () => {
    for (const contract of CONTRACTS) {
      const sets = contract.requirements.filter((r) => r.type === 'set');
      const runs = contract.requirements.filter((r) => r.type === 'run');
      expect(sets.every((r) => r.minSize === 3)).toBe(true);
      expect(runs.every((r) => r.minSize === 4)).toBe(true);
      const label = contract.label.toLowerCase();
      if (sets.length) expect(label).toContain(`${sets.length === 1 ? '1 set' : `${sets.length} sets`}`);
      if (runs.length) expect(label).toContain(`${runs.length === 1 ? '1 run' : `${runs.length} runs`}`);
    }
  });

  it('never asks for more cards than are dealt', () => {
    for (const contract of CONTRACTS) {
      const needed = contract.requirements.reduce((n, r) => n + r.minSize, 0);
      expect(needed).toBeLessThanOrEqual(cardsForRound(contract.round));
    }
  });
});

describe('cardPoints', () => {
  it('scores 2–9 at 5, 10–K at 10, aces at 15, jokers at 50', () => {
    expect(cardPoints(c('2h'))).toBe(5);
    expect(cardPoints(c('9s'))).toBe(5);
    expect(cardPoints(c('10d'))).toBe(10);
    expect(cardPoints(c('Kc'))).toBe(10);
    expect(cardPoints(c('Ah'))).toBe(15);
    expect(cardPoints(jk())).toBe(50);
  });
});
