'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateRoomCode } from '@/lib/supabase/gameService';
import { nanoid } from 'nanoid';

const PLAYER_ID_KEY   = 'zc_player_id';
const PLAYER_NAME_KEY = 'zc_player_name';
const HOST_KEY_PREFIX = 'zc_host_';

function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return nanoid();
  const stored = localStorage.getItem(PLAYER_ID_KEY);
  if (stored) return stored;
  const id = nanoid();
  localStorage.setItem(PLAYER_ID_KEY, id);
  return id;
}

export default function GameLandingPage() {
  const router = useRouter();
  const [name, setName] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(PLAYER_NAME_KEY) ?? '';
  });
  const [joinCode, setJoinCode] = useState('');
  const [error,    setError]    = useState('');

  function saveName(n: string) {
    setName(n);
    if (typeof window !== 'undefined') localStorage.setItem(PLAYER_NAME_KEY, n);
  }

  /** Create a room: generate code locally, mark as host, navigate instantly. */
  function handleCreate() {
    if (!name.trim()) { setError('Enter your name first'); return; }
    setError('');
    getOrCreatePlayerId(); // ensure a stable ID exists
    const code = generateRoomCode();
    localStorage.setItem(HOST_KEY_PREFIX + code, '1');
    router.push(`/game/${code}`);
  }

  /** Join a room: just navigate — the game page will verify via broadcast. */
  function handleJoin() {
    if (!name.trim()) { setError('Enter your name first'); return; }
    if (!joinCode.trim()) { setError('Enter a room code'); return; }
    setError('');
    router.push(`/game/${joinCode.trim().toUpperCase()}`);
  }

  return (
    <div className="min-h-screen bg-green-900 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-1">🃏</h1>
          <h1 className="text-3xl font-black">Zions Check</h1>
        </div>

        {/* Name input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => saveName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. Grandma Ruth"
            maxLength={20}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Create */}
        <button
          onClick={handleCreate}
          className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 transition-colors"
        >
          + Create New Game
        </button>

        <div className="flex items-center gap-3 text-gray-400 text-xs">
          <div className="flex-1 h-px bg-gray-200" />
          <span>or join existing</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Join */}
        <div className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="Room code"
            maxLength={4}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleJoin}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors"
          >
            Join
          </button>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {/* Rules link */}
        <div className="border-t border-gray-100 pt-4 text-center">
          <Link
            href="/rules"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-700 hover:text-green-600 font-medium underline underline-offset-2"
          >
            📖 How to play ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
