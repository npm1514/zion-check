'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GameState, MeldType, PlayerState } from '@/types/game';
import {
  advanceToNextRound,
  createInitialState,
  discard,
  drawFromDeck,
  layContract,
  layToMeld,
  requestBuy,
  startRound,
  takeDiscard,
} from '@/lib/game/gameEngine';

const HELLO_TIMEOUT = 8_000;

export interface UseGameReturn {
  state:        GameState | null;
  loading:      boolean;
  error:        string | null;
  myId:         string;
  startGame:    () => Promise<void>;
  setReady:     () => Promise<void>;
  nextRound:    () => Promise<void>;
  requestBuy:   () => Promise<void>;
  drawFromDeck: () => Promise<void>;
  takeDiscard:  () => Promise<void>;
  layContract:  (melds: { type: MeldType; cardIds: string[] }[]) => Promise<void>;
  layToMeld:    (meldId: string, cardId: string) => Promise<void>;
  discard:      (cardId: string) => Promise<void>;
}

export function useGame(
  roomCode: string,
  myId:     string,
  myName:   string,
  isHost:   boolean,
): UseGameReturn {
  const [state,   setState]   = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const stateRef = useRef<GameState | null>(null);
  const sendRef  = useRef<((msg: object) => void) | null>(null);

  const syncState = useCallback((s: GameState) => {
    stateRef.current = s;
    setState(s);
  }, []);

  // ── WebSocket setup ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!myId || !myName) return;

    // Host creates initial state immediately — no network needed
    if (isHost) {
      const initial = createInitialState(myId, [{ id: myId, name: myName }]);
      syncState(initial);
      setLoading(false);
    }

    // Connect to the WebSocket relay.
    // In prod (Vercel) set NEXT_PUBLIC_WS_URL=wss://your-relay.railway.app
    // In dev falls back to ws://localhost:3001
    const wsBase = process.env.NEXT_PUBLIC_WS_URL ?? (() => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsPort   = process.env.NEXT_PUBLIC_WS_PORT ?? '3001';
      return `${protocol}//${window.location.hostname}:${wsPort}`;
    })();
    const ws = new WebSocket(`${wsBase}?room=${roomCode}`);

    function send(msg: object) {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
    }
    sendRef.current = send;

    ws.onopen = () => {
      if (isHost) {
        // Push the seed state to the server (so late joiners get it)
        const s = stateRef.current;
        if (s) send({ type: 'state', state: s });
      } else {
        // Ask to join — host will respond with current state
        send({ type: 'hello', playerId: myId, name: myName });

        // Show an error if nobody responds in time
        setTimeout(() => {
          if (!stateRef.current) {
            setError('Room not found — check the code and try again');
            setLoading(false);
          }
        }, HELLO_TIMEOUT);
      }
    };

    ws.onmessage = (event) => {
      let msg: { type: string; [key: string]: unknown };
      try { msg = JSON.parse(event.data as string); }
      catch { return; }

      // ── Receive state from server ────────────────────────────────────────
      if (msg.type === 'state') {
        const incoming = msg.state as GameState;
        if (!stateRef.current || incoming.version >= stateRef.current.version) {
          syncState(incoming);
          setLoading(false);
        }
      }

      // ── New player hello (host only) ─────────────────────────────────────
      if (msg.type === 'hello' && isHost) {
        const { playerId, name } = msg as { type: string; playerId: string; name: string };
        const s = stateRef.current;
        if (!s) return;

        // Already in game — re-send state so they're synced
        if (s.players.find((p) => p.id === playerId)) {
          send({ type: 'state', state: s });
          return;
        }
        // Game in progress — let them observe but don't add them
        if (s.phase !== 'lobby') {
          send({ type: 'state', state: s });
          return;
        }

        const newPlayer: PlayerState = {
          id:            playerId,
          name,
          seatIndex:     s.players.length,
          hand:          [],
          melds:         [],
          contractMet:      false,
          justLaidContract: false,
          buysThisRound:    0,
          roundScores:   [],
          isConnected:   true,
          isReady:       false,
        };

        const newState: GameState = {
          ...s,
          players: [...s.players, newPlayer],
          version: s.version + 1,
        };

        syncState(newState);
        send({ type: 'state', state: newState });
      }
    };

    ws.onerror = () => {
      setError('Could not connect to game server — check that the relay is running');
      setLoading(false);
    };

    return () => {
      ws.close();
      sendRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, myId, myName, isHost]);

  // ── Action helper ─────────────────────────────────────────────────────────

  const apply = useCallback(
    async (fn: (s: GameState) => { state: GameState; error?: string }) => {
      const s = stateRef.current;
      if (!s) return;
      try {
        setError(null);
        const { state: newState, error: err } = fn(s);
        if (err) { setError(err); return; }
        syncState(newState);
        sendRef.current?.({ type: 'state', state: newState });
      } catch (e: unknown) {
        setError((e as Error).message);
      }
    },
    [syncState],
  );

  // ── Actions ───────────────────────────────────────────────────────────────

  const startGame = useCallback(
    () => apply((s) => {
      if (s.players.length < 2) return { state: s, error: 'Need at least 2 players to start' };
      return { state: startRound({ ...s, phase: 'lobby' }) };
    }),
    [apply],
  );

  const setReady = useCallback(
    () => apply((s) => ({
      state: {
        ...s,
        players: s.players.map((p) => p.id === myId ? { ...p, isReady: true } : p),
        version: s.version + 1,
      },
    })),
    [apply, myId],
  );

  const reqBuy = useCallback(
    () => apply((s) => {
      const newS = requestBuy(s, myId);
      if (newS === s) return { state: s, error: 'Cannot buy right now' };
      return { state: newS };
    }),
    [apply, myId],
  );

  const drawDeck = useCallback(
    () => apply((s) => {
      const newS = drawFromDeck(s, myId);
      if (newS === s) return { state: s, error: 'Cannot draw right now' };
      return { state: newS };
    }),
    [apply, myId],
  );

  const takeDisc = useCallback(
    () => apply((s) => {
      const newS = takeDiscard(s, myId);
      if (newS === s) return { state: s, error: 'Cannot take discard right now' };
      return { state: newS };
    }),
    [apply, myId],
  );

  const layContr = useCallback(
    (melds: { type: MeldType; cardIds: string[] }[]) =>
      apply((s) => layContract(s, myId, melds)),
    [apply, myId],
  );

  const layMeld = useCallback(
    (meldId: string, cardId: string) =>
      apply((s) => layToMeld(s, myId, meldId, cardId)),
    [apply, myId],
  );

  const discardCard = useCallback(
    (cardId: string) => apply((s) => discard(s, myId, cardId)),
    [apply, myId],
  );

  const nextRound = useCallback(
    () => apply((s) => ({ state: advanceToNextRound(s) })),
    [apply],
  );

  return {
    state,
    loading,
    error,
    myId,
    startGame,
    setReady,
    nextRound,
    requestBuy:   reqBuy,
    drawFromDeck: drawDeck,
    takeDiscard:  takeDisc,
    layContract:  layContr,
    layToMeld:    layMeld,
    discard:      discardCard,
  };
}
