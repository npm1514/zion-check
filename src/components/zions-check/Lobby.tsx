'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GameState } from '@/types/game';
import { cn } from '@/lib/utils';

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

  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
    } catch {
      // Clipboard API is blocked on plain-http pages (e.g. joining over the home network) — fall back.
      const ta = document.createElement('textarea');
      ta.value = roomCode;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
  };

  return (
    <div className="min-h-screen bg-green-900 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-black text-center mb-1">Zions Check</h1>

        {/* Room code */}
        <div className="bg-gray-100 rounded-xl p-4 text-center mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Room Code</p>
          <div className="relative">
            <p className="text-4xl font-mono font-black tracking-widest text-green-700">{roomCode}</p>
            <button
              type="button"
              onClick={copyCode}
              aria-label={copied ? 'Copied' : 'Copy room code'}
              title={copied ? 'Copied' : 'Copy room code'}
              className={cn(
                'absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors',
                copied ? 'text-green-600' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200',
              )}
            >
              {copied ? (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
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
