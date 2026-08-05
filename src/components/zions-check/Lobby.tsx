'use client';

import Link from 'next/link';
import { GameState } from '@/types/game';

interface LobbyProps {
  roomCode: string;
  state: GameState;
  myId: string;
  onReady: () => void;
  onStart: () => void;
}

export function Lobby({ roomCode, state, myId, onReady, onStart }: LobbyProps) {
  const me = state.players.find((p) => p.id === myId);
  const isHost = state.hostId === myId;
  return (
    <div className="min-h-screen bg-green-900 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-black text-center mb-1">🃏 Zions Check</h1>

        {/* Room code */}
        <div className="bg-gray-100 rounded-xl p-4 text-center mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Room Code</p>
          <p className="text-4xl font-mono font-black tracking-widest text-green-700">{roomCode}</p>
          <p className="text-xs text-gray-400 mt-1">Share this code with your family</p>
        </div>

        {/* Player list */}
        <div className="flex flex-col gap-2 mb-6">
          {state.players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{player.id === state.hostId ? '👑' : '👤'}</span>
                <span className="font-medium">{player.name}</span>
                {player.id === myId && (
                  <span className="text-xs text-blue-500">(you)</span>
                )}
              </div>
              <span className={player.isReady ? 'text-green-600 font-bold' : 'text-gray-400'}>
                {player.isReady ? '✓ Ready' : 'Waiting…'}
              </span>
            </div>
          ))}
        </div>

        <div className="text-center mb-2">
          <Link
            href="/rules"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-700 hover:text-green-600 font-medium underline underline-offset-2"
          >
            📖 How to play ↗
          </Link>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {!me?.isReady && (
            <button
              onClick={onReady}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors"
            >
              I&apos;m Ready
            </button>
          )}

          {isHost && (
            <button
              onClick={onStart}
              disabled={state.players.length < 2}
              className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 transition-colors disabled:opacity-40"
            >
              {state.players.length < 2
                ? 'Waiting for more players…'
                : 'Start Game →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
