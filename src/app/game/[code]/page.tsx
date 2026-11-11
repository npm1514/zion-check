'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { nanoid } from 'nanoid';
import { useGame } from '@/hooks/useGame';
import { Lobby } from '@/components/zions-check/Lobby';
import { GameTable } from '@/components/zions-check/GameTable';

const PLAYER_ID_KEY   = 'zc_player_id';
const PLAYER_NAME_KEY = 'zc_player_name';
const HOST_KEY_PREFIX = 'zc_host_';

function getOrCreatePlayerId(): string {
  const stored = localStorage.getItem(PLAYER_ID_KEY);
  if (stored) return stored;
  const id = nanoid();
  localStorage.setItem(PLAYER_ID_KEY, id);
  return id;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GameRoomPage() {
  const params = useParams();
  const code   = (params.code as string).toUpperCase();

  const [myId,     setMyId]     = useState('');
  const [myName,   setMyName]   = useState('');
  const [isHost,   setIsHost]   = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameSet,  setNameSet]  = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem(PLAYER_NAME_KEY) ?? '';
    const hostFlag   = localStorage.getItem(HOST_KEY_PREFIX + code) === '1';
    setIsHost(hostFlag);
    if (storedName) {
      setMyName(storedName);
      setMyId(getOrCreatePlayerId());
      setNameSet(true);
    }
  }, [code]);

  function confirmName() {
    if (!nameInput.trim()) return;
    const name = nameInput.trim();
    localStorage.setItem(PLAYER_NAME_KEY, name);
    setMyName(name);
    setMyId(getOrCreatePlayerId());
    setNameSet(true);
  }

  // ── Name gate (shown when arriving via direct link without a stored name) ──

  if (!nameSet) {
    return (
      <div className="min-h-screen bg-green-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm flex flex-col gap-4 text-center">
          <h1 className="text-2xl font-black">🃏 Zion&apos;s Check</h1>
          <p className="text-gray-500 text-sm">
            Joining room <span className="font-mono font-bold">{code}</span>
          </p>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirmName()}
            placeholder="Your name"
            maxLength={20}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            autoFocus
          />
          <button
            onClick={confirmName}
            className="py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500"
          >
            Enter Room →
          </button>
        </div>
      </div>
    );
  }

  return <GameRoom code={code} myId={myId} myName={myName} isHost={isHost} />;
}

// ─── Inner component (only rendered once myId / myName are known) ─────────────

interface GameRoomProps {
  code:   string;
  myId:   string;
  myName: string;
  isHost: boolean;
}

function GameRoom({ code, myId, myName, isHost }: GameRoomProps) {
  const game = useGame(code, myId, myName, isHost);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (game.loading) {
    return (
      <div className="min-h-screen bg-green-900 flex flex-col items-center justify-center gap-3 text-white">
        <p className="text-xl">
          {isHost ? 'Setting up room…' : 'Connecting to room…'}
        </p>
        {!isHost && (
          <p className="text-sm text-gray-400">
            Room <span className="font-mono font-bold">{code}</span>
          </p>
        )}
      </div>
    );
  }

  // ── Room not found / error ────────────────────────────────────────────────

  if (!game.state) {
    return (
      <div className="min-h-screen bg-green-900 flex items-center justify-center text-white text-center">
        <div>
          <p className="text-xl font-bold text-red-400 mb-2">
            {game.error ?? 'Room not found'}
          </p>
          <p className="text-gray-300 mb-4">Check the code and try again.</p>
          <Link
            href="/game"
            className="inline-block px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
          >
            ← Back to lobby
          </Link>
        </div>
      </div>
    );
  }

  // ── Lobby ─────────────────────────────────────────────────────────────────

  if (game.state.phase === 'lobby') {
    return (
      <Lobby
        roomCode={code}
        state={game.state}
        myId={myId}
        onReady={game.setReady}
        onStart={game.startGame}
      />
    );
  }

  // ── Game table ────────────────────────────────────────────────────────────

  return (
    <GameTable
      state={game.state}
      myId={myId}
      isHost={isHost}
      roomCode={code}
      onDrawFromDeck={game.drawFromDeck}
      onTakeDiscard={game.takeDiscard}
      onLayContract={game.layContract}
      onLayToMeld={game.layToMeld}
      onSwapJoker={game.swapJoker}
      onDiscard={game.discard}
      onBuy={game.requestBuy}
      onNextRound={game.nextRound}
      onSubmitCut={game.submitCut}
      error={game.error}
    />
  );
}
