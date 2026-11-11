import { describe, expect, it } from 'vitest';
import {
  advanceToNextRound,
  createInitialState,
  currentPlayer,
  discard,
  drawFromDeck,
  layContract,
  layToMeld,
  requestBuy,
  resolveBuyWindow,
  startRound,
  submitCut,
  swapJoker,
  takeDiscard,
  totalScore,
} from '../gameEngine';
import { cardsForRound } from '../deck';
import { c, cs, game, hand, jk, player, runMeld, setMeld, show, totalCards } from './helpers';

const three = () => [player('p1'), player('p2'), player('p3')];

// ─── Setup ────────────────────────────────────────────────────────────────────

describe('createInitialState', () => {
  it('starts in the lobby with empty hands and seats in join order', () => {
    const s = createInitialState('p1', [{ id: 'p1', name: 'Nick' }, { id: 'p2', name: 'Ben' }]);
    expect(s.phase).toBe('lobby');
    expect(s.round).toBe(1);
    expect(s.hostId).toBe('p1');
    expect(s.players.map((p) => [p.name, p.seatIndex, p.hand.length, p.isReady])).toEqual([
      ['Nick', 0, 0, false],
      ['Ben', 1, 0, false],
    ]);
  });
});

describe('startRound', () => {
  it('deals the right number of cards and starts left of the dealer', () => {
    const s = startRound(game(three(), { phase: 'lobby', round: 2 }));
    expect(s.phase).toBe('draw');
    for (const p of s.players) expect(p.hand).toHaveLength(cardsForRound(2));
    expect(s.currentPlayerIdx).toBe(2 % 3);
    expect(s.discardPile).toEqual([]);
    expect(totalCards(s)).toBe(108);
  });

  it('clears melds and per-round flags', () => {
    const before = game([
      player('p1', { melds: [setMeld('7h 7c 7s')], contractMet: true, buysThisRound: 2 }),
      player('p2'),
    ]);
    const s = startRound(before);
    expect(s.players[0].melds).toEqual([]);
    expect(s.players[0].contractMet).toBe(false);
    expect(s.players[0].buysThisRound).toBe(0);
  });
});

// ─── Cutting the deck ─────────────────────────────────────────────────────────

describe('submitCut', () => {
  const cutting = (round = 1) => game(three(), { phase: 'cutting', round });

  it('only works in the cutting phase', () => {
    expect(submitCut(game(three(), { phase: 'draw' }), 'p1', 18).error).toMatch(/cutting/);
  });

  it('only the dealer can cut', () => {
    // round 1 → dealer is seat 0
    expect(submitCut(cutting(1), 'p2', 18).error).toMatch(/dealer/);
    // round 2 → dealer is seat 1
    expect(submitCut(cutting(2), 'p2', 21).error).toBeUndefined();
  });

  it('deals every player a full hand and keeps every card in play', () => {
    const { state } = submitCut(cutting(1), 'p1', 40);
    expect(state.phase).toBe('draw');
    for (const p of state.players) expect(p.hand).toHaveLength(6);
    expect(totalCards(state)).toBe(108);
    expect(state.currentPlayerIdx).toBe(1);
  });

  it('detects a perfect cut (exactly enough cards for every hand)', () => {
    const { state } = submitCut(cutting(1), 'p1', 18); // 6 cards × 3 players
    expect(state.perfectCutDealerIdx).toBe(0);
    expect(state.lastCutResult).toEqual({ cutPos: 18, target: 18, dealerName: 'P1' });
  });

  it('a near miss is not perfect', () => {
    expect(submitCut(cutting(1), 'p1', 19).state.perfectCutDealerIdx).toBeNull();
  });

  it('still deals full hands when the cut is too small', () => {
    const { state } = submitCut(cutting(1), 'p1', 3);
    for (const p of state.players) expect(p.hand).toHaveLength(6);
    expect(totalCards(state)).toBe(108);
  });
});

// ─── Drawing ──────────────────────────────────────────────────────────────────

describe('drawFromDeck', () => {
  it('moves the top card to the current player and enters the action phase', () => {
    const s0 = game(three(), { phase: 'draw' });
    const top = s0.deck[0];
    const s = drawFromDeck(s0, 'p1');
    expect(hand(s, 'p1')).toEqual([top]);
    expect(s.deck).toHaveLength(s0.deck.length - 1);
    expect(s.phase).toBe('action');
    expect(s.lastDrawnId).toBe(top.id);
  });

  it('ignores players whose turn it is not', () => {
    const s0 = game(three(), { phase: 'draw' });
    expect(drawFromDeck(s0, 'p2')).toBe(s0);
  });

  it('ignores draws outside the draw phases', () => {
    const s0 = game(three(), { phase: 'action' });
    expect(drawFromDeck(s0, 'p1')).toBe(s0);
  });

  it('reshuffles the discard pile (minus its top card) when the deck runs out', () => {
    const pile = cs('2d 3d 4d 5d');
    const s = drawFromDeck(game(three(), { phase: 'draw', deck: [], discardPile: pile }), 'p1');
    expect(hand(s, 'p1')).toHaveLength(1);
    expect(s.discardPile).toEqual([pile[3]]);
    expect(s.deck).toHaveLength(2);
  });

  it('clears justLaidContract so melds can be extended this turn', () => {
    const s = drawFromDeck(game([player('p1', { contractMet: true, justLaidContract: true }), player('p2')], { phase: 'draw' }), 'p1');
    expect(s.players[0].justLaidContract).toBe(false);
  });

  it('does not mutate the previous state', () => {
    const s0 = game(three(), { phase: 'draw' });
    const snapshot = JSON.stringify(s0);
    drawFromDeck(s0, 'p1');
    expect(JSON.stringify(s0)).toBe(snapshot);
  });
});

describe('takeDiscard', () => {
  const withDiscard = (overrides = {}) =>
    game(three(), { phase: 'buy_window', discardPile: cs('9h Kd'), ...overrides });

  it('takes the top discard and closes the buy window', () => {
    const s0 = withDiscard({ pendingBuyRequests: ['p2'] });
    const s = takeDiscard(s0, 'p1');
    expect(hand(s, 'p1')).toEqual([s0.discardPile[1]]);
    expect(s.discardPile).toEqual([s0.discardPile[0]]);
    expect(s.phase).toBe('action');
    expect(s.pendingBuyRequests).toEqual([]);
  });

  it('cannot take back the card you just discarded', () => {
    const s0 = withDiscard({ lastDiscardedById: 'p1' });
    expect(takeDiscard(s0, 'p1')).toBe(s0);
  });

  it('is not allowed once your contract is down', () => {
    const s0 = game([player('p1', { contractMet: true }), player('p2')], { phase: 'draw', discardPile: cs('9h') });
    expect(takeDiscard(s0, 'p1')).toBe(s0);
  });

  it('does nothing when the pile is empty or it is not your turn', () => {
    const empty = withDiscard({ discardPile: [] });
    expect(takeDiscard(empty, 'p1')).toBe(empty);
    const s0 = withDiscard();
    expect(takeDiscard(s0, 'p2')).toBe(s0);
  });
});

// ─── Buying ───────────────────────────────────────────────────────────────────

describe('buying', () => {
  const buyWindow = (overrides = {}) =>
    game(three(), { phase: 'buy_window', discardPile: cs('9h'), ...overrides });

  it('records a buy request from another player', () => {
    expect(requestBuy(buyWindow(), 'p2').pendingBuyRequests).toEqual(['p2']);
  });

  it('rejects requests from the current player, a second buyer, or after the window', () => {
    const s0 = buyWindow();
    expect(requestBuy(s0, 'p1')).toBe(s0);
    const pending = requestBuy(s0, 'p2');
    expect(requestBuy(pending, 'p3')).toBe(pending);
    const closed = buyWindow({ phase: 'action' });
    expect(requestBuy(closed, 'p2')).toBe(closed);
  });

  it('rejects buyers whose contract is down', () => {
    const s0 = game([player('p1'), player('p2', { contractMet: true })], { phase: 'buy_window', discardPile: cs('9h') });
    expect(requestBuy(s0, 'p2')).toBe(s0);
  });

  it('allows only one buy per player in the last round', () => {
    const s0 = game([player('p1'), player('p2', { buysThisRound: 1 })], { phase: 'buy_window', round: 7, discardPile: cs('9h') });
    expect(requestBuy(s0, 'p2')).toBe(s0);
    const earlier = { ...s0, round: 6 };
    expect(requestBuy(earlier, 'p2').pendingBuyRequests).toEqual(['p2']);
  });

  it('when the current player draws from the deck, the buyer gets the discard plus a penalty card', () => {
    const s0 = requestBuy(buyWindow(), 'p2');
    const discarded = s0.discardPile[0];
    const s = drawFromDeck(s0, 'p1');
    expect(hand(s, 'p2')).toHaveLength(2);
    expect(hand(s, 'p2')[0]).toEqual(discarded);
    expect(s.players[1].buysThisRound).toBe(1);
    expect(hand(s, 'p1')).toHaveLength(1);
    expect(s.discardPile).toEqual([]);
    expect(totalCards(s)).toBe(totalCards(s0));
  });

  it('when the current player takes the discard instead, the buy is denied', () => {
    const s = takeDiscard(requestBuy(buyWindow(), 'p2'), 'p1');
    expect(hand(s, 'p2')).toHaveLength(0);
    expect(hand(s, 'p1')).toHaveLength(1);
  });

  it('resolveBuyWindow hands the card to the first buyer', () => {
    const s = resolveBuyWindow(requestBuy(buyWindow(), 'p3'));
    expect(hand(s, 'p3')).toHaveLength(2);
    expect(s.phase).toBe('draw');
    expect(s.pendingBuyRequests).toEqual([]);
  });
});

// ─── Laying down the contract ─────────────────────────────────────────────────

describe('layContract', () => {
  // Round 1: two sets of 3
  const ready = () => {
    const h = cs('7h 7c 7s 9h 9c 9s Kd');
    return { s: game([player('p1', { hand: h }), player('p2')]), h };
  };
  const ids = (cards: { id: string }[]) => cards.map((x) => x.id);

  it('lays valid melds, removes them from the hand and marks the contract met', () => {
    const { s, h } = ready();
    const r = layContract(s, 'p1', [
      { type: 'set', cardIds: ids(h.slice(0, 3)) },
      { type: 'set', cardIds: ids(h.slice(3, 6)) },
    ]);
    expect(r.error).toBeUndefined();
    const p1 = r.state.players[0];
    expect(p1.melds).toHaveLength(2);
    expect(p1.hand).toEqual([h[6]]);
    expect(p1.contractMet).toBe(true);
    expect(p1.justLaidContract).toBe(true);
  });

  it('rejects melds that do not meet the round contract', () => {
    const { s, h } = ready();
    const r = layContract(s, 'p1', [{ type: 'set', cardIds: ids(h.slice(0, 3)) }]);
    expect(r.error).toMatch(/contract/);
    expect(r.state).toBe(s);
  });

  it('explains why a set is invalid', () => {
    const { s, h } = ready();
    const r = layContract(s, 'p1', [
      { type: 'set', cardIds: [h[0].id, h[1].id, h[3].id] },
      { type: 'set', cardIds: ids(h.slice(4, 6)) },
    ]);
    expect(r.error).toMatch(/same number\/rank/);
  });

  it('explains a too-short meld', () => {
    const { s, h } = ready();
    const r = layContract(s, 'p1', [
      { type: 'set', cardIds: ids(h.slice(0, 2)) },
      { type: 'set', cardIds: ids(h.slice(3, 6)) },
    ]);
    expect(r.error).toMatch(/at least 3/);
  });

  it('rejects the same card used twice and cards not in hand', () => {
    const { s, h } = ready();
    expect(layContract(s, 'p1', [
      { type: 'set', cardIds: [h[0].id, h[1].id, h[2].id] },
      { type: 'set', cardIds: [h[0].id, h[3].id, h[4].id] },
    ]).error).toMatch(/twice/);
    expect(layContract(s, 'p1', [{ type: 'set', cardIds: ['nope', h[1].id, h[2].id] }]).error).toMatch(/not found/);
  });

  it('rejects a second lay-down and lay-downs outside the action phase', () => {
    const { s, h } = ready();
    const melds = [
      { type: 'set' as const, cardIds: ids(h.slice(0, 3)) },
      { type: 'set' as const, cardIds: ids(h.slice(3, 6)) },
    ];
    const once = layContract(s, 'p1', melds).state;
    expect(layContract(once, 'p1', melds).error).toMatch(/already/);
    expect(layContract({ ...s, phase: 'draw' }, 'p1', melds).error).toMatch(/action/);
  });

  it('builds runs with jokers for run contracts', () => {
    const h = cs('7h 7c 7s 5d 6d JK 8d');
    const s = game([player('p1', { hand: h }), player('p2')], { round: 2 }); // set of 3 + run of 4
    const r = layContract(s, 'p1', [
      { type: 'set', cardIds: ids(h.slice(0, 3)) },
      { type: 'run', cardIds: ids(h.slice(3, 7)) },
    ]);
    expect(r.error).toBeUndefined();
    expect(show(r.state.players[0].melds[1])).toBe('5 6 [7] 8');
  });
});

// ─── Extending melds ──────────────────────────────────────────────────────────

describe('layToMeld', () => {
  const table = (meOverrides = {}) => {
    const nine = c('9h');
    const joker = jk();
    const s = game([
      player('p1', { hand: [nine, joker, c('2c')], contractMet: true, ...meOverrides }),
      player('p2', { melds: [runMeld('5h 6h 7h 8h', 'r', 'p2')], contractMet: true }),
    ]);
    return { s, nine, joker };
  };

  it("adds a card to another player's meld", () => {
    const { s, nine } = table();
    const r = layToMeld(s, 'p1', 'r', nine.id);
    expect(r.error).toBeUndefined();
    expect(show(r.state.players[1].melds[0])).toBe('5 6 7 8 9');
    expect(hand(r.state, 'p1').map((x) => x.id)).not.toContain(nine.id);
  });

  it('places a joker on the chosen end', () => {
    const { s, joker } = table();
    expect(show(layToMeld(s, 'p1', 'r', joker.id, 'high').state.players[1].melds[0])).toBe('5 6 7 8 [9]');
    expect(show(layToMeld(s, 'p1', 'r', joker.id, 'low').state.players[1].melds[0])).toBe('[4] 5 6 7 8');
  });

  it('requires your own contract to be down', () => {
    const { s, nine } = table({ contractMet: false });
    expect(layToMeld(s, 'p1', 'r', nine.id).error).toMatch(/contract/);
  });

  it('is blocked on the same turn you laid your contract', () => {
    const { s, nine } = table({ justLaidContract: true });
    expect(layToMeld(s, 'p1', 'r', nine.id).error).toMatch(/next turn/);
  });

  it('rejects a card that does not fit, an unknown meld, or a card not in hand', () => {
    const { s } = table();
    const two = hand(s, 'p1')[2];
    expect(layToMeld(s, 'p1', 'r', two.id).error).toMatch(/cannot extend/);
    expect(layToMeld(s, 'p1', 'nope', two.id).error).toMatch(/Meld not found/);
    expect(layToMeld(s, 'p1', 'r', 'nope').error).toMatch(/not in hand/);
  });

  it('keeps every card accounted for', () => {
    const { s, joker } = table();
    expect(totalCards(layToMeld(s, 'p1', 'r', joker.id, 'high').state)).toBe(totalCards(s));
  });
});

// ─── Joker swaps ──────────────────────────────────────────────────────────────

describe('swapJoker', () => {
  const setup = () => {
    const six = c('6h');
    const meld = runMeld('5h JK:6h 7h 8h', 'r', 'p2');
    const joker = meld.slots[1].card;
    const s = game([player('p1', { hand: [six, c('Kd')] }), player('p2', { melds: [meld] })]);
    return { s, six, joker };
  };

  it('swaps the matching real card for the joker', () => {
    const { s, six, joker } = setup();
    const r = swapJoker(s, 'p1', 'r', 1, six.id);
    expect(r.error).toBeUndefined();
    expect(show(r.state.players[1].melds[0])).toBe('5 6 7 8');
    expect(hand(r.state, 'p1').map((x) => x.id)).toContain(joker.id);
    expect(hand(r.state, 'p1').map((x) => x.id)).not.toContain(six.id);
    expect(totalCards(r.state)).toBe(totalCards(s));
  });

  it('works on your own meld', () => {
    const six = c('6h');
    const meld = runMeld('5h JK:6h 7h 8h', 'r', 'p1');
    const s = game([player('p1', { hand: [six], melds: [meld] }), player('p2')]);
    const r = swapJoker(s, 'p1', 'r', 1, six.id);
    expect(show(r.state.players[0].melds[0])).toBe('5 6 7 8');
    expect(hand(r.state, 'p1')[0].isJoker).toBe(true);
  });

  it('works when it is not your turn', () => {
    const { s, six } = setup();
    expect(swapJoker({ ...s, currentPlayerIdx: 1, phase: 'draw' }, 'p1', 'r', 1, six.id).error).toBeUndefined();
  });

  it('rejects the wrong card, a slot without a joker, or a closed phase', () => {
    const { s, six } = setup();
    const king = hand(s, 'p1')[1];
    expect(swapJoker(s, 'p1', 'r', 1, king.id).error).toMatch(/does not match/);
    expect(swapJoker(s, 'p1', 'r', 0, six.id).error).toMatch(/No swappable joker/);
    expect(swapJoker({ ...s, phase: 'round_end' }, 'p1', 'r', 1, six.id).error).toMatch(/phase/);
  });
});

// ─── Discarding ───────────────────────────────────────────────────────────────

describe('discard', () => {
  it('ends the turn, opens the buy window for the next player', () => {
    const k = c('Kd');
    const s = game([player('p1', { hand: [k, c('2c')] }), player('p2')], { discardPile: cs('3s') });
    const r = discard(s, 'p1', k.id);
    expect(r.error).toBeUndefined();
    expect(r.state.discardPile.at(-1)).toEqual(k);
    expect(r.state.phase).toBe('buy_window');
    expect(r.state.currentPlayerIdx).toBe(1);
    expect(r.state.lastDiscardedById).toBe('p1');
  });

  it('wraps around to the first player', () => {
    const k = c('Kd');
    const s = game([player('p1'), player('p2', { hand: [k, c('2c')] })], { currentPlayerIdx: 1, discardPile: cs('3s') });
    expect(discard(s, 'p2', k.id).state.currentPlayerIdx).toBe(0);
  });

  it('cannot discard a joker', () => {
    const j = jk();
    const s = game([player('p1', { hand: [j, c('2c')] }), player('p2')]);
    expect(discard(s, 'p1', j.id).error).toMatch(/Joker/);
  });

  it('cannot discard a card that could replace a joker on the table', () => {
    const six = c('6h');
    const s = game([
      player('p1', { hand: [six, c('2c')] }),
      player('p2', { melds: [runMeld('5h JK:6h 7h 8h')] }),
    ]);
    expect(discard(s, 'p1', six.id).error).toMatch(/replace a Joker/);
  });

  it('only the current player may discard, and only in the action phase', () => {
    const k = c('Kd');
    const s = game([player('p1'), player('p2', { hand: [k] })]);
    expect(discard(s, 'p2', k.id).error).toMatch(/turn/);
    expect(discard({ ...s, phase: 'draw', currentPlayerIdx: 1 }, 'p2', k.id).error).toMatch(/action/);
  });

  it('first-draw reject: discarding the card you just drew onto an empty pile keeps your turn', () => {
    const drawn = c('Kd');
    const s = game([player('p1', { hand: [c('2c'), drawn] }), player('p2')], { discardPile: [], lastDrawnId: drawn.id });
    const r = discard(s, 'p1', drawn.id);
    expect(r.state.phase).toBe('buy_window');
    expect(r.state.currentPlayerIdx).toBe(0);
  });

  it('going out scores the round and moves to round_end', () => {
    const last = c('Kd');
    const s = game([
      player('p1', { hand: [last], contractMet: true }),
      player('p2', { hand: cs('Ah 5c 10s') }),   // 15 + 5 + 10
      player('p3', { hand: [jk()] }),            // 50
    ]);
    const r = discard(s, 'p1', last.id);
    expect(r.state.phase).toBe('round_end');
    expect(r.state.players.map((p) => p.roundScores)).toEqual([[0], [30], [50]]);
    expect(r.state.currentPlayerIdx).toBe(1);
  });

  it('an empty hand without the contract down does not end the round', () => {
    const last = c('Kd');
    const s = game([player('p1', { hand: [last] }), player('p2')], { discardPile: cs('2s') });
    expect(discard(s, 'p1', last.id).state.phase).toBe('buy_window');
  });

  it('a perfect cut gives the dealer -25 for the round', () => {
    const last = c('Kd');
    const s = game([player('p1', { hand: [last], contractMet: true }), player('p2', { hand: cs('2c') })], {
      perfectCutDealerIdx: 1,
    });
    const r = discard(s, 'p1', last.id);
    expect(r.state.players[1].roundScores).toEqual([5 - 25]);
    expect(r.state.perfectCutBonusRounds).toEqual([{ round: 1, playerIdx: 1 }]);
    expect(r.state.perfectCutDealerIdx).toBeNull();
  });

  it('going out in the last round ends the game', () => {
    const last = c('Kd');
    const s = game([player('p1', { hand: [last], contractMet: true }), player('p2')], { round: 7 });
    expect(discard(s, 'p1', last.id).state.phase).toBe('game_over');
  });
});

// ─── Round flow and scoring ───────────────────────────────────────────────────

describe('advanceToNextRound', () => {
  it('moves from round_end to the next round’s cut', () => {
    const s = advanceToNextRound(game(three(), { phase: 'round_end', round: 3 }));
    expect(s.round).toBe(4);
    expect(s.phase).toBe('cutting');
  });

  it('does nothing outside round_end or after the last round', () => {
    const mid = game(three(), { phase: 'action' });
    expect(advanceToNextRound(mid)).toBe(mid);
    const last = game(three(), { phase: 'round_end', round: 7 });
    expect(advanceToNextRound(last)).toBe(last);
  });
});

describe('totalScore / currentPlayer', () => {
  it('sums round scores, including negative perfect-cut rounds', () => {
    expect(totalScore(player('p1', { roundScores: [30, -20, 15] }))).toBe(25);
    expect(totalScore(player('p1'))).toBe(0);
  });

  it('returns the player whose turn it is', () => {
    expect(currentPlayer(game(three(), { currentPlayerIdx: 2 })).id).toBe('p3');
  });
});

// ─── A whole turn cycle ───────────────────────────────────────────────────────

describe('full turn cycle', () => {
  it('draw → lay down → discard → next player, keeping every card', () => {
    const h = cs('7h 7c 7s 9h 9c 9s Kd');
    let s = game([player('p1', { hand: h }), player('p2', { hand: cs('2d 3d') })], { phase: 'draw' });
    const start = totalCards(s);

    s = drawFromDeck(s, 'p1');
    expect(s.phase).toBe('action');

    s = layContract(s, 'p1', [
      { type: 'set', cardIds: h.slice(0, 3).map((x) => x.id) },
      { type: 'set', cardIds: h.slice(3, 6).map((x) => x.id) },
    ]).state;
    expect(s.players[0].contractMet).toBe(true);

    s = discard(s, 'p1', h[6].id).state;
    expect(s.phase).toBe('buy_window');
    expect(currentPlayer(s).id).toBe('p2');
    expect(totalCards(s)).toBe(start);
  });
});
