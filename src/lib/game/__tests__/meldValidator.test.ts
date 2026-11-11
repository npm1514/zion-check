import { describe, expect, it } from 'vitest';
import {
  buildMeld,
  canDiscard,
  canReplaceJoker,
  extendMeld,
  isValidRun,
  isValidSet,
  rankIndex,
  runEndOptions,
  runEndTargets,
  satisfiesContract,
} from '../meldValidator';
import { getContract } from '../contracts';
import { c, cs, jk, runMeld, setMeld, show } from './helpers';

// ─── Sets ─────────────────────────────────────────────────────────────────────

describe('isValidSet', () => {
  it('accepts three of a kind', () => {
    expect(isValidSet(cs('7h 7c 7s'))).toBe(true);
  });

  it('accepts duplicate suits (multiple decks)', () => {
    expect(isValidSet(cs('7h 7h 7h'))).toBe(true);
  });

  it('accepts more than three', () => {
    expect(isValidSet(cs('Kh Kc Ks Kd Kh'))).toBe(true);
  });

  it('rejects fewer than three cards', () => {
    expect(isValidSet(cs('7h 7c'))).toBe(false);
    expect(isValidSet([])).toBe(false);
  });

  it('rejects mixed ranks', () => {
    expect(isValidSet(cs('7h 7c 8s'))).toBe(false);
  });

  it('accepts jokers as wild', () => {
    expect(isValidSet(cs('7h 7c JK'))).toBe(true);
    expect(isValidSet(cs('7h JK JK'))).toBe(true);
  });

  it('rejects a set made only of jokers', () => {
    expect(isValidSet(cs('JK JK JK'))).toBe(false);
  });
});

// ─── Runs ─────────────────────────────────────────────────────────────────────

describe('isValidRun', () => {
  it('accepts four consecutive cards of one suit', () => {
    expect(isValidRun(cs('5h 6h 7h 8h')).valid).toBe(true);
  });

  it('accepts cards given out of order', () => {
    const r = isValidRun(cs('8h 5h 7h 6h'));
    expect(r.valid).toBe(true);
    expect(r.slots.map((s) => s.card.rank)).toEqual(['5', '6', '7', '8']);
  });

  it('rejects fewer than four cards', () => {
    expect(isValidRun(cs('5h 6h 7h')).valid).toBe(false);
  });

  it('rejects mixed suits', () => {
    expect(isValidRun(cs('5h 6h 7s 8h')).valid).toBe(false);
  });

  it('rejects a gap with no joker to fill it', () => {
    expect(isValidRun(cs('5h 6h 8h 9h')).valid).toBe(false);
  });

  it('rejects duplicate ranks', () => {
    expect(isValidRun(cs('5h 6h 6h 7h')).valid).toBe(false);
  });

  it('fills a gap with a joker and records what it stands for', () => {
    const r = isValidRun(cs('5h 6h JK 8h'));
    expect(r.valid).toBe(true);
    expect(r.slots[2].card.isJoker).toBe(true);
    expect(r.slots[2].substituting).toEqual({ suit: 'hearts', rank: '7' });
  });

  it('accepts ace high (J Q K A)', () => {
    const r = isValidRun(cs('Js Qs Ks As'));
    expect(r.valid).toBe(true);
    expect(r.slots.map((s) => s.card.rank)).toEqual(['J', 'Q', 'K', 'A']);
  });

  it('accepts ace low (A 2 3 4)', () => {
    const r = isValidRun(cs('As 2s 3s 4s'));
    expect(r.valid).toBe(true);
    expect(r.slots.map((s) => s.card.rank)).toEqual(['A', '2', '3', '4']);
  });

  it('rejects wrap-around (Q K A 2)', () => {
    expect(isValidRun(cs('Qs Ks As 2s')).valid).toBe(false);
  });

  it('rejects a run made only of jokers', () => {
    expect(isValidRun(cs('JK JK JK JK')).valid).toBe(false);
  });

  it('can use several jokers', () => {
    const r = isValidRun(cs('5d JK JK 8d'));
    expect(r.valid).toBe(true);
    expect(r.slots.map((s) => s.substituting?.rank ?? s.card.rank)).toEqual(['5', '6', '7', '8']);
  });
});

describe('rankIndex', () => {
  it('orders 2 lowest and A highest', () => {
    expect(rankIndex('2')).toBe(0);
    expect(rankIndex('10')).toBe(8);
    expect(rankIndex('A')).toBe(12);
  });
});

// ─── buildMeld ────────────────────────────────────────────────────────────────

describe('buildMeld', () => {
  it('builds a set with jokers last and no substitution', () => {
    const m = buildMeld('m', 'p1', 'set', cs('JK 9h 9c'))!;
    expect(m.type).toBe('set');
    expect(m.slots.map((s) => s.card.isJoker)).toEqual([false, false, true]);
    expect(m.slots[2].substituting).toBeUndefined();
  });

  it('builds a sorted run', () => {
    expect(show(buildMeld('m', 'p1', 'run', cs('9c 7c 8c 10c')))).toBe('7 8 9 10');
  });

  it('returns null for invalid cards', () => {
    expect(buildMeld('m', 'p1', 'set', cs('9h 8h 7h'))).toBeNull();
    expect(buildMeld('m', 'p1', 'run', cs('9h 9c 9s 9d'))).toBeNull();
  });

  it('keeps the given id and owner', () => {
    const m = buildMeld('abc', 'owner', 'set', cs('2h 2c 2s'))!;
    expect(m.id).toBe('abc');
    expect(m.ownerId).toBe('owner');
  });
});

// ─── Extending melds ──────────────────────────────────────────────────────────

describe('extendMeld — sets', () => {
  it('adds a matching card', () => {
    const m = extendMeld(setMeld('7h 7c 7s'), c('7d'));
    expect(m?.slots).toHaveLength(4);
  });

  it('rejects a card of another rank', () => {
    expect(extendMeld(setMeld('7h 7c 7s'), c('8d'))).toBeNull();
  });

  it('adds a joker', () => {
    const m = extendMeld(setMeld('7h 7c 7s'), jk());
    expect(m?.slots).toHaveLength(4);
  });

  it('works when the set already contains a joker', () => {
    const base = buildMeld('s', 'p1', 'set', cs('7h 7c JK'))!;
    expect(extendMeld(base, c('7s'))?.slots).toHaveLength(4);
    expect(extendMeld(base, c('8s'))).toBeNull();
  });
});

describe('extendMeld — runs', () => {
  it('adds the next natural card on the high end', () => {
    expect(show(extendMeld(runMeld('5h 6h 7h 8h'), c('9h')))).toBe('5 6 7 8 9');
  });

  it('adds the previous natural card on the low end', () => {
    expect(show(extendMeld(runMeld('5h 6h 7h 8h'), c('4h')))).toBe('4 5 6 7 8');
  });

  it('rejects wrong suit or non-adjacent rank', () => {
    expect(extendMeld(runMeld('5h 6h 7h 8h'), c('9s'))).toBeNull();
    expect(extendMeld(runMeld('5h 6h 7h 8h'), c('10h'))).toBeNull();
    expect(extendMeld(runMeld('5h 6h 7h 8h'), c('6h'))).toBeNull();
  });

  it('rejects a natural card forced onto the wrong end', () => {
    expect(extendMeld(runMeld('5h 6h 7h 8h'), c('9h'), 'low')).toBeNull();
    expect(extendMeld(runMeld('5h 6h 7h 8h'), c('4h'), 'high')).toBeNull();
  });

  it('places a joker on the chosen end with the right substitution', () => {
    expect(show(extendMeld(runMeld('5h 6h 7h 8h'), jk(), 'low'))).toBe('[4] 5 6 7 8');
    expect(show(extendMeld(runMeld('5h 6h 7h 8h'), jk(), 'high'))).toBe('5 6 7 8 [9]');
  });

  it('defaults a joker to the low end when no end is given', () => {
    expect(show(extendMeld(runMeld('5h 6h 7h 8h'), jk()))).toBe('[4] 5 6 7 8');
  });

  it('falls back to the high end when the low end is closed', () => {
    expect(show(extendMeld(runMeld('As 2s 3s 4s'), jk()))).toBe('A 2 3 4 [5]');
  });

  it('never moves jokers already in the run', () => {
    expect(show(extendMeld(runMeld('5h JK:6h 7h 8h'), jk(), 'high'))).toBe('5 [6] 7 8 [9]');
    expect(show(extendMeld(runMeld('JK:4h 5h 6h 7h'), jk(), 'low'))).toBe('[3] [4] 5 6 7');
  });

  it('extends past a joker at the end', () => {
    expect(show(extendMeld(runMeld('JK:4h 5h 6h 7h'), c('3h')))).toBe('3 [4] 5 6 7');
  });

  it('treats an ace as low below a 2 and high above a king', () => {
    expect(show(extendMeld(runMeld('2s 3s 4s 5s'), c('As')))).toBe('A 2 3 4 5');
    expect(show(extendMeld(runMeld('10s Js Qs Ks'), c('As')))).toBe('10 J Q K A');
  });

  it('cannot extend past an ace in either direction', () => {
    expect(extendMeld(runMeld('As 2s 3s 4s'), jk(), 'low')).toBeNull();
    expect(extendMeld(runMeld('Js Qs Ks As'), jk(), 'high')).toBeNull();
  });

  it('keeps the meld id and owner', () => {
    const m = extendMeld(runMeld('5h 6h 7h 8h', 'r9', 'owner'), c('9h'))!;
    expect(m.id).toBe('r9');
    expect(m.ownerId).toBe('owner');
  });

  it('does not mutate the original meld', () => {
    const base = runMeld('5h 6h 7h 8h');
    extendMeld(base, jk(), 'high');
    expect(show(base)).toBe('5 6 7 8');
  });
});

describe('runEndOptions / runEndTargets', () => {
  it('offers both ends for a joker in the middle of the ranks', () => {
    expect(runEndOptions(runMeld('5h 6h 7h 8h'), jk())).toEqual(['low', 'high']);
    expect(runEndTargets(runMeld('5h 6h 7h 8h'), jk())).toEqual({
      low: { suit: 'hearts', rank: '4' },
      high: { suit: 'hearts', rank: '9' },
    });
  });

  it('offers only the one end a natural card fits', () => {
    expect(runEndOptions(runMeld('5h 6h 7h 8h'), c('9h'))).toEqual(['high']);
    expect(runEndOptions(runMeld('5h 6h 7h 8h'), c('4h'))).toEqual(['low']);
    expect(runEndOptions(runMeld('5h 6h 7h 8h'), c('4s'))).toEqual([]);
  });

  it('closes the end past an ace', () => {
    expect(runEndOptions(runMeld('As 2s 3s 4s'), jk())).toEqual(['high']);
    expect(runEndOptions(runMeld('Js Qs Ks As'), jk())).toEqual(['low']);
  });

  it('is empty for sets', () => {
    expect(runEndOptions(setMeld('7h 7c 7s'), jk())).toEqual([]);
  });
});

// ─── Discard rules ────────────────────────────────────────────────────────────

describe('canReplaceJoker / canDiscard', () => {
  const table = [runMeld('5h JK:6h 7h 8h')];

  it('spots a card that matches a joker on the table', () => {
    expect(canReplaceJoker(c('6h'), table)).toBe(true);
    expect(canReplaceJoker(c('6s'), table)).toBe(false);
    expect(canReplaceJoker(c('7h'), table)).toBe(false);
  });

  it('ignores jokers in sets (they stand for nothing specific)', () => {
    const setWithJoker = buildMeld('s', 'p1', 'set', cs('9h 9c JK'))!;
    expect(canReplaceJoker(c('9s'), [setWithJoker])).toBe(false);
  });

  it('a joker can never replace a joker', () => {
    expect(canReplaceJoker(jk(), table)).toBe(false);
  });

  it('forbids discarding a joker', () => {
    expect(canDiscard(jk(), [])).toBe(false);
  });

  it('forbids discarding a card that could replace a joker', () => {
    expect(canDiscard(c('6h'), table)).toBe(false);
  });

  it('allows ordinary discards', () => {
    expect(canDiscard(c('Kd'), table)).toBe(true);
    expect(canDiscard(c('6h'), [])).toBe(true);
  });
});

// ─── Contracts ────────────────────────────────────────────────────────────────

describe('satisfiesContract', () => {
  const twoSets = getContract(1);      // 2 sets of 3
  const setAndRun = getContract(2);    // set of 3 + run of 4

  it('accepts exactly the required melds', () => {
    expect(satisfiesContract(twoSets, [setMeld('7h 7c 7s', 'a'), setMeld('9h 9c 9s', 'b')])).toBe(true);
    expect(satisfiesContract(setAndRun, [setMeld('7h 7c 7s'), runMeld('5h 6h 7h 8h')])).toBe(true);
  });

  it('accepts the melds in any order', () => {
    expect(satisfiesContract(setAndRun, [runMeld('5h 6h 7h 8h'), setMeld('7h 7c 7s')])).toBe(true);
  });

  it('rejects too few melds', () => {
    expect(satisfiesContract(twoSets, [setMeld('7h 7c 7s')])).toBe(false);
  });

  it('rejects the wrong meld types', () => {
    expect(satisfiesContract(setAndRun, [setMeld('7h 7c 7s', 'a'), setMeld('9h 9c 9s', 'b')])).toBe(false);
  });

  it('does not let one meld count twice', () => {
    expect(satisfiesContract(twoSets, [setMeld('7h 7c 7s 7d 7h 7c')])).toBe(false);
  });

  it('allows bigger melds than the minimum', () => {
    expect(satisfiesContract(setAndRun, [setMeld('7h 7c 7s 7d'), runMeld('5h 6h 7h 8h 9h')])).toBe(true);
  });
});
