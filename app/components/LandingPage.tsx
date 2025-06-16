'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';

export default function LandingPage() {
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [joinMode, setJoinMode] = useState(false);
  const router = useRouter();

  const handleCreateGame = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    
    const newGameCode = uuidv4().substring(0, 8);
    router.push(`/game/${newGameCode}?name=${encodeURIComponent(playerName)}`);
  };

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    
    if (!gameCode.trim()) {
      alert('Please enter a game code');
      return;
    }
    
    router.push(`/game/${gameCode}?name=${encodeURIComponent(playerName)}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-indigo-600 mb-2">Zion's Check</h1>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your name"
            />
          </div>

          {joinMode ? (
            <div>
              <label htmlFor="gameCode" className="block text-sm font-medium text-gray-700 mb-1">
                Game Code
              </label>
              <input
                id="gameCode"
                type="text"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter game code"
              />
            </div>
          ) : null}

          <div className="flex flex-col space-y-3">
            {!joinMode ? (
              <button
                onClick={handleCreateGame}
                className="w-full px-4 py-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
              >
                Create New Game
              </button>
            ) : (
              <button
                onClick={handleJoinGame}
                className="w-full px-4 py-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
              >
                Join Game
              </button>
            )}

            <button
              onClick={() => setJoinMode(!joinMode)}
              className="w-full px-4 py-3 text-indigo-600 bg-white border border-indigo-600 rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
            >
              {joinMode ? "Create a Game Instead" : "Join Existing Game"}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Learn the rules of Zion's Check <a href="/rules" className="text-indigo-600 hover:text-indigo-500">here</a></p>
        </div>
      </div>
    </div>
  );
} 