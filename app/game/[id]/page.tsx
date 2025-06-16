'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Define player type
type Player = {
  id: string;
  name: string;
  isReady: boolean;
};

// Create a BroadcastChannel for real-time state synchronization
const createGameChannel = (gameId: string) => new BroadcastChannel(`game-${gameId}`);

// In a real app, this would be managed by a server or database
// For this demo, we'll use localStorage to persist game state across browser tabs
export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const gameId = params.id as string;
  const playerName = searchParams.get('name') || '';
  
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [localPlayerId] = useState(`player-${Date.now()}-${Math.random()}`);

  // Initialize game state
  useEffect(() => {
    const gameChannel = createGameChannel(gameId);
    const gameStateKey = `game-${gameId}`;

    // Function to broadcast game state changes
    const broadcastGameState = (newPlayers: Player[], newGameStarted: boolean) => {
      gameChannel.postMessage({
        type: 'GAME_STATE_UPDATE',
        payload: {
          players: newPlayers,
          gameStarted: newGameStarted
        }
      });
    };

    // Function to handle player join
    const handlePlayerJoin = () => {
      const storedGameState = localStorage.getItem(gameStateKey);
      let updatedPlayers: Player[];
      
      if (storedGameState) {
        try {
          const { players: storedPlayers, gameStarted: storedGameStarted } = JSON.parse(storedGameState);
          const existingPlayer = storedPlayers.find((p: Player) => p.name === playerName);
          
          if (!existingPlayer) {
            updatedPlayers = [
              ...storedPlayers,
              { id: localPlayerId, name: playerName, isReady: false }
            ];
          } else {
            updatedPlayers = storedPlayers.map((player: Player) => 
              player.name === playerName 
                ? { ...player, id: localPlayerId }
                : player
            );
          }
          
          setPlayers(updatedPlayers);
          setGameStarted(storedGameStarted);
          setIsReady(updatedPlayers.find((p: Player) => p.name === playerName)?.isReady || false);
        } catch (e) {
          console.error('Error parsing stored game state:', e);
          updatedPlayers = [{ id: localPlayerId, name: playerName, isReady: false }];
          setPlayers(updatedPlayers);
        }
      } else {
        updatedPlayers = [{ id: localPlayerId, name: playerName, isReady: false }];
        setPlayers(updatedPlayers);
      }

      // Store and broadcast the updated state
      localStorage.setItem(gameStateKey, JSON.stringify({
        players: updatedPlayers,
        gameStarted
      }));
      broadcastGameState(updatedPlayers, gameStarted);
    };

    // Listen for game state updates from other windows
    const handleGameStateUpdate = (event: MessageEvent) => {
      if (event.data.type === 'GAME_STATE_UPDATE') {
        const { players: newPlayers, gameStarted: newGameStarted } = event.data.payload;
        setPlayers(newPlayers);
        setGameStarted(newGameStarted);
        setIsReady(newPlayers.find((p: Player) => p.name === playerName)?.isReady || false);
        localStorage.setItem(gameStateKey, JSON.stringify({
          players: newPlayers,
          gameStarted: newGameStarted
        }));
      }
    };

    // Initial player join
    handlePlayerJoin();

    // Set up message listener
    gameChannel.addEventListener('message', handleGameStateUpdate);

    // Cleanup on unmount
    return () => {
      gameChannel.removeEventListener('message', handleGameStateUpdate);
      
      // Remove player from game when leaving
      const finalGameState = localStorage.getItem(gameStateKey);
      if (finalGameState) {
        try {
          const { players: finalPlayers, gameStarted: finalGameStarted } = JSON.parse(finalGameState);
          const updatedPlayers = finalPlayers.filter((p: Player) => p.id !== localPlayerId && p.name !== playerName);
          
          localStorage.setItem(gameStateKey, JSON.stringify({
            players: updatedPlayers,
            gameStarted: finalGameStarted
          }));
          broadcastGameState(updatedPlayers, finalGameStarted);
        } catch (e) {
          console.error('Error updating final game state:', e);
        }
      }
      
      gameChannel.close();
    };
  }, [gameId, playerName, localPlayerId]);

  const copyGameCode = () => {
    navigator.clipboard.writeText(gameId);
    setCopySuccess('Copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const toggleReady = () => {
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    
    const gameStateKey = `game-${gameId}`;
    const storedGameState = localStorage.getItem(gameStateKey);
    
    if (storedGameState) {
      try {
        const { players: storedPlayers, gameStarted: storedGameStarted } = JSON.parse(storedGameState);
        const updatedPlayers = storedPlayers.map((player: Player) => 
          player.name === playerName
            ? { ...player, isReady: newReadyState }
            : player
        );
        
        setPlayers(updatedPlayers);
        localStorage.setItem(gameStateKey, JSON.stringify({
          players: updatedPlayers,
          gameStarted: storedGameStarted
        }));

        // Broadcast the updated state
        const gameChannel = createGameChannel(gameId);
        gameChannel.postMessage({
          type: 'GAME_STATE_UPDATE',
          payload: {
            players: updatedPlayers,
            gameStarted: storedGameStarted
          }
        });
        gameChannel.close();
      } catch (e) {
        console.error('Error updating ready state:', e);
      }
    }
  };

  const startGame = () => {
    if (players.every((player: Player) => player.isReady) && players.length >= 2) {
      setGameStarted(true);
      
      const gameStateKey = `game-${gameId}`;
      const storedGameState = localStorage.getItem(gameStateKey);
      
      if (storedGameState) {
        try {
          const { players: storedPlayers } = JSON.parse(storedGameState);
          localStorage.setItem(gameStateKey, JSON.stringify({
            players: storedPlayers,
            gameStarted: true
          }));

          // Broadcast the updated state
          const gameChannel = createGameChannel(gameId);
          gameChannel.postMessage({
            type: 'GAME_STATE_UPDATE',
            payload: {
              players: storedPlayers,
              gameStarted: true
            }
          });
          gameChannel.close();
        } catch (e) {
          console.error('Error updating game started state:', e);
        }
      }
    }
  };

  if (!playerName) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Game Access</h1>
          <p className="mb-6">You need to provide a name to join this game.</p>
          <Link 
            href="/"
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  if (gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="w-full max-w-4xl p-8 bg-white rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold text-center mb-8">Game in Progress</h1>
          
          <div className="flex justify-between mb-8">
            <div>
              <h2 className="text-xl font-semibold mb-2">Game Code: {gameId}</h2>
              <p className="text-gray-600">Round: 1/7</p>
            </div>
            <div>
              <p className="text-gray-600">Contract: 2 sets</p>
            </div>
          </div>
          
          <div className="bg-green-100 p-8 rounded-lg mb-8 text-center">
            <p className="text-xl">Game board will be implemented here</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {players.map(player => (
              <div 
                key={player.id}
                className={`p-4 rounded-lg ${
                  player.name === playerName 
                    ? 'bg-indigo-100' 
                    : 'bg-gray-100'
                }`}
              >
                <p className="font-semibold">{player.name}</p>
                <p>Cards: 10</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-8">Game Lobby</h1>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">Game Code:</h2>
            <div className="flex items-center">
              <span className="font-mono mr-2">{gameId}</span>
              <button 
                onClick={copyGameCode}
                className="text-indigo-600 hover:text-indigo-800"
              >
                {copySuccess || 'Copy'}
              </button>
            </div>
          </div>
          <p className="text-gray-600 text-sm">Share this code with friends to join your game</p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Players: {players.length}</h2>
          <div className="space-y-3">
            {players.map(player => (
              <div key={player.id} className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{player.name}</span>
                  {player.name === playerName && <span className="ml-2 text-xs text-green-600">(You)</span>}
                </div>
                <span className={player.isReady ? 'text-green-500 font-medium' : 'text-gray-400'}>
                  {player.isReady ? '✓ Ready' : 'Not Ready'}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col space-y-4">
          <button
            onClick={toggleReady}
            className={`w-full px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition ${
              isReady 
                ? 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500'
            }`}
          >
            {isReady ? '✓ Ready!' : 'Mark as Ready'}
          </button>
          
          <button
            onClick={startGame}
            disabled={!players.every(player => player.isReady) || players.length < 2}
            className={`w-full px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ${
              players.every(player => player.isReady) && players.length >= 2
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-indigo-300 text-white cursor-not-allowed'
            }`}
          >
            {players.length < 2 
              ? 'Waiting for more players (min 2)' 
              : !players.every(player => player.isReady)
                ? 'Waiting for all players to be ready'
                : 'Start Game'}
          </button>
          
          <Link 
            href="/"
            className="w-full px-4 py-3 text-indigo-600 bg-white border border-indigo-600 rounded-md text-center hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
          >
            Leave Game
          </Link>
        </div>
      </div>
    </div>
  );
} 