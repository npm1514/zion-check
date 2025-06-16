'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Card from '../../components/Card';
import PlayerHand from '../../components/PlayerHand';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Define player type
type Player = {
  id: string;
  name: string;
  isReady: boolean;
  hand?: any[];
  score?: number;
};

// Define card type
type Card = {
  id: string;
  suit: 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades' | 'Joker';
  value: string | number;
  isJoker?: boolean;
};

// Define meld type
type Meld = {
  id: string;
  type: 'set' | 'run';
  cards: Card[];
  playerId: string;
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
  const [currentTurn, setCurrentTurn] = useState<string | null>(null);
  const [deck, setDeck] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [melds, setMelds] = useState<Meld[]>([]);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [meldCards, setMeldCards] = useState<string[]>([]);
  const [meldType, setMeldType] = useState<'set' | 'run'>('set');
  const [error, setError] = useState('');
  const [currentRound, setCurrentRound] = useState(1);
  const [lastAction, setLastAction] = useState<'draw' | 'discard' | null>(null);

  // Initialize game state
  useEffect(() => {
    const gameChannel = createGameChannel(gameId);
    const gameStateKey = `game-${gameId}`;

    // Function to broadcast game state changes
    const broadcastGameState = (newState: any) => {
      gameChannel.postMessage({
        type: 'GAME_STATE_UPDATE',
        payload: newState
      });
    };

    // Function to handle player join
    const handlePlayerJoin = () => {
      const storedGameState = localStorage.getItem(gameStateKey);
      let updatedPlayers: Player[];
      
      if (storedGameState) {
        try {
          const { 
            players: storedPlayers, 
            gameStarted: storedGameStarted,
            currentTurn: storedCurrentTurn,
            deck: storedDeck,
            discardPile: storedDiscardPile,
            melds: storedMelds,
            currentRound: storedCurrentRound
          } = JSON.parse(storedGameState);
          
          const existingPlayer = storedPlayers.find((p: Player) => p.name === playerName);
          
          if (!existingPlayer) {
            updatedPlayers = [
              ...storedPlayers,
              { id: localPlayerId, name: playerName, isReady: false, hand: [], score: 0 }
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
          setCurrentTurn(storedCurrentTurn || null);
          setDeck(storedDeck || []);
          setDiscardPile(storedDiscardPile || []);
          setMelds(storedMelds || []);
          setCurrentRound(storedCurrentRound || 1);
        } catch (e) {
          console.error('Error parsing stored game state:', e);
          updatedPlayers = [{ id: localPlayerId, name: playerName, isReady: false, hand: [], score: 0 }];
          setPlayers(updatedPlayers);
          setDeck([]);
          setDiscardPile([]);
          setMelds([]);
          setCurrentTurn(null);
          setCurrentRound(1);
        }
      } else {
        updatedPlayers = [{ id: localPlayerId, name: playerName, isReady: false, hand: [], score: 0 }];
        setPlayers(updatedPlayers);
        setDeck([]);
        setDiscardPile([]);
        setMelds([]);
        setCurrentTurn(null);
        setCurrentRound(1);
      }

      // Store and broadcast the updated state
      const newState = {
        players: updatedPlayers,
        gameStarted,
        currentTurn,
        deck: deck || [],
        discardPile: discardPile || [],
        melds: melds || [],
        currentRound
      };
      localStorage.setItem(gameStateKey, JSON.stringify(newState));
      broadcastGameState(newState);
    };

    // Listen for game state updates from other windows
    const handleGameStateUpdate = (event: MessageEvent) => {
      if (event.data.type === 'GAME_STATE_UPDATE') {
        const { 
          players: newPlayers, 
          gameStarted: newGameStarted,
          currentTurn: newCurrentTurn,
          deck: newDeck,
          discardPile: newDiscardPile,
          melds: newMelds,
          currentRound: newCurrentRound
        } = event.data.payload;
        
        setPlayers(newPlayers || []);
        setGameStarted(newGameStarted);
        setIsReady(newPlayers?.find((p: Player) => p.name === playerName)?.isReady || false);
        setCurrentTurn(newCurrentTurn || null);
        setDeck(newDeck || []);
        setDiscardPile(newDiscardPile || []);
        setMelds(newMelds || []);
        setCurrentRound(newCurrentRound || 1);
        
        localStorage.setItem(gameStateKey, JSON.stringify(event.data.payload));
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
          const { 
            players: finalPlayers, 
            gameStarted: finalGameStarted,
            currentTurn: finalCurrentTurn,
            deck: finalDeck,
            discardPile: finalDiscardPile,
            melds: finalMelds,
            currentRound: finalCurrentRound
          } = JSON.parse(finalGameState);
          
          const updatedPlayers = finalPlayers.filter((p: Player) => p.id !== localPlayerId && p.name !== playerName);
          
          const newState = {
            players: updatedPlayers,
            gameStarted: finalGameStarted,
            currentTurn: finalCurrentTurn,
            deck: finalDeck || [],
            discardPile: finalDiscardPile || [],
            melds: finalMelds || [],
            currentRound: finalCurrentRound
          };
          
          localStorage.setItem(gameStateKey, JSON.stringify(newState));
          broadcastGameState(newState);
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
      // Initialize a standard deck of cards
      const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
      const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      const initialDeck: Card[] = [];
      
      // Create standard cards
      suits.forEach(suit => {
        values.forEach(value => {
          initialDeck.push({
            id: `${value}-${suit}-${Math.random()}`,
            suit: suit as 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades',
            value: value
          });
        });
      });
      
      // Add jokers
      initialDeck.push({
        id: `Joker-1-${Math.random()}`,
        suit: 'Joker',
        value: 'Joker',
        isJoker: true
      });
      initialDeck.push({
        id: `Joker-2-${Math.random()}`,
        suit: 'Joker',
        value: 'Joker',
        isJoker: true
      });
      
      // Shuffle the deck
      for (let i = initialDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [initialDeck[i], initialDeck[j]] = [initialDeck[j], initialDeck[i]];
      }
      
      // Deal initial hands (10 cards per player)
      const updatedPlayers = players.map(player => ({
        ...player,
        hand: initialDeck.splice(0, 10)
      }));
      
      setGameStarted(true);
      setPlayers(updatedPlayers);
      setDeck(initialDeck);
      setCurrentTurn(players[0].id);
      
      const gameStateKey = `game-${gameId}`;
      const newState = {
        players: updatedPlayers,
        gameStarted: true,
        currentTurn: players[0].id,
        deck: initialDeck,
        discardPile: [],
        melds: [],
        currentRound: 1
      };
      
      localStorage.setItem(gameStateKey, JSON.stringify(newState));

      // Broadcast the updated state
      const gameChannel = createGameChannel(gameId);
      gameChannel.postMessage({
        type: 'GAME_STATE_UPDATE',
        payload: newState
      });
      gameChannel.close();
    }
  };

  const handleDrawFromDeck = () => {
    if (currentTurn !== localPlayerId || lastAction === 'draw') {
      setError('Not your turn or you have already drawn');
      return;
    }

    const gameStateKey = `game-${gameId}`;
    const storedGameState = localStorage.getItem(gameStateKey);
    
    if (storedGameState) {
      try {
        const { 
          players: storedPlayers, 
          gameStarted: storedGameStarted,
          currentTurn: storedCurrentTurn,
          deck: storedDeck,
          discardPile: storedDiscardPile,
          melds: storedMelds,
          currentRound: storedCurrentRound
        } = JSON.parse(storedGameState);
        
        if (storedDeck.length === 0) {
          setError('No cards left in deck');
          return;
        }

        const drawnCard = storedDeck[0];
        const newDeck = storedDeck.slice(1);
        const updatedPlayers = storedPlayers.map((player: Player) => 
          player.id === localPlayerId
            ? { ...player, hand: [...(player.hand || []), drawnCard] }
            : player
        );
        
        const newState = {
          players: updatedPlayers,
          gameStarted: storedGameStarted,
          currentTurn: storedCurrentTurn,
          deck: newDeck,
          discardPile: storedDiscardPile,
          melds: storedMelds,
          currentRound: storedCurrentRound
        };
        
        setPlayers(updatedPlayers);
        setDeck(newDeck);
        setLastAction('draw');
        
        localStorage.setItem(gameStateKey, JSON.stringify(newState));
        
        const gameChannel = createGameChannel(gameId);
        gameChannel.postMessage({
          type: 'GAME_STATE_UPDATE',
          payload: newState
        });
        gameChannel.close();
      } catch (e) {
        console.error('Error drawing card:', e);
      }
    }
  };

  const handleDrawFromDiscard = () => {
    if (currentTurn !== localPlayerId || lastAction === 'draw') {
      setError('Not your turn or you have already drawn');
      return;
    }

    const gameStateKey = `game-${gameId}`;
    const storedGameState = localStorage.getItem(gameStateKey);
    
    if (storedGameState) {
      try {
        const { 
          players: storedPlayers, 
          gameStarted: storedGameStarted,
          currentTurn: storedCurrentTurn,
          deck: storedDeck,
          discardPile: storedDiscardPile,
          melds: storedMelds,
          currentRound: storedCurrentRound
        } = JSON.parse(storedGameState);
        
        if (storedDiscardPile.length === 0) {
          setError('No cards in discard pile');
          return;
        }

        const drawnCard = storedDiscardPile[storedDiscardPile.length - 1];
        const newDiscardPile = storedDiscardPile.slice(0, -1);
        const updatedPlayers = storedPlayers.map((player: Player) => 
          player.id === localPlayerId
            ? { ...player, hand: [...(player.hand || []), drawnCard] }
            : player
        );
        
        const newState = {
          players: updatedPlayers,
          gameStarted: storedGameStarted,
          currentTurn: storedCurrentTurn,
          deck: storedDeck,
          discardPile: newDiscardPile,
          melds: storedMelds,
          currentRound: storedCurrentRound
        };
        
        setPlayers(updatedPlayers);
        setDiscardPile(newDiscardPile);
        setLastAction('draw');
        
        localStorage.setItem(gameStateKey, JSON.stringify(newState));
        
        const gameChannel = createGameChannel(gameId);
        gameChannel.postMessage({
          type: 'GAME_STATE_UPDATE',
          payload: newState
        });
        gameChannel.close();
      } catch (e) {
        console.error('Error drawing from discard:', e);
      }
    }
  };

  const handleDiscard = () => {
    if (!selectedCard || lastAction !== 'draw') {
      setError('Please select a card to discard and draw first');
      return;
    }

    const gameStateKey = `game-${gameId}`;
    const storedGameState = localStorage.getItem(gameStateKey);
    
    if (storedGameState) {
      try {
        const { 
          players: storedPlayers, 
          gameStarted: storedGameStarted,
          currentTurn: storedCurrentTurn,
          deck: storedDeck,
          discardPile: storedDiscardPile,
          melds: storedMelds,
          currentRound: storedCurrentRound
        } = JSON.parse(storedGameState);
        
        const currentPlayer = storedPlayers.find((p: Player) => p.id === localPlayerId);
        if (!currentPlayer) return;

        const cardToDiscard = currentPlayer.hand?.find((c: Card) => c.id === selectedCard);
        if (!cardToDiscard) return;

        const updatedPlayers = storedPlayers.map((player: Player) => 
          player.id === localPlayerId
            ? { 
                ...player, 
                hand: (player.hand || []).filter((c: Card) => c.id !== selectedCard)
              }
            : player
        );
        
        const newDiscardPile = [...storedDiscardPile, cardToDiscard];
        const nextPlayerIndex = (storedPlayers.findIndex((p: Player) => p.id === localPlayerId) + 1) % storedPlayers.length;
        const nextPlayer = storedPlayers[nextPlayerIndex];
        
        const newState = {
          players: updatedPlayers,
          gameStarted: storedGameStarted,
          currentTurn: nextPlayer.id,
          deck: storedDeck,
          discardPile: newDiscardPile,
          melds: storedMelds,
          currentRound: storedCurrentRound
        };
        
        setPlayers(updatedPlayers);
        setDiscardPile(newDiscardPile);
        setCurrentTurn(nextPlayer.id);
        setSelectedCard(null);
        setLastAction(null);
        
        localStorage.setItem(gameStateKey, JSON.stringify(newState));
        
        const gameChannel = createGameChannel(gameId);
        gameChannel.postMessage({
          type: 'GAME_STATE_UPDATE',
          payload: newState
        });
        gameChannel.close();
      } catch (e) {
        console.error('Error discarding card:', e);
      }
    }
  };

  const handleLayMeld = () => {
    if (meldCards.length < 3) {
      setError('A meld needs at least 3 cards');
      return;
    }

    const gameStateKey = `game-${gameId}`;
    const storedGameState = localStorage.getItem(gameStateKey);
    
    if (storedGameState) {
      try {
        const { 
          players: storedPlayers, 
          gameStarted: storedGameStarted,
          currentTurn: storedCurrentTurn,
          deck: storedDeck,
          discardPile: storedDiscardPile,
          melds: storedMelds,
          currentRound: storedCurrentRound
        } = JSON.parse(storedGameState);
        
        const currentPlayer = storedPlayers.find((p: Player) => p.id === localPlayerId);
        if (!currentPlayer) return;

        const cardsToMeld = currentPlayer.hand?.filter((c: Card) => meldCards.includes(c.id));
        if (!cardsToMeld || cardsToMeld.length !== meldCards.length) return;

        const newMeld: Meld = {
          id: `meld-${Date.now()}`,
          type: meldType,
          cards: cardsToMeld,
          playerId: localPlayerId
        };

        const updatedPlayers = storedPlayers.map((player: Player) => 
          player.id === localPlayerId
            ? { 
                ...player, 
                hand: (player.hand || []).filter((c: Card) => !meldCards.includes(c.id))
              }
            : player
        );
        
        const newState = {
          players: updatedPlayers,
          gameStarted: storedGameStarted,
          currentTurn: storedCurrentTurn,
          deck: storedDeck,
          discardPile: storedDiscardPile,
          melds: [...storedMelds, newMeld],
          currentRound: storedCurrentRound
        };
        
        setPlayers(updatedPlayers);
        setMelds([...melds, newMeld]);
        setMeldCards([]);
        
        localStorage.setItem(gameStateKey, JSON.stringify(newState));
        
        const gameChannel = createGameChannel(gameId);
        gameChannel.postMessage({
          type: 'GAME_STATE_UPDATE',
          payload: newState
        });
        gameChannel.close();
      } catch (e) {
        console.error('Error laying meld:', e);
      }
    }
  };

  if (!playerName) {
    return (
      <DndProvider backend={HTML5Backend}>
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
      </DndProvider>
    );
  }

  if (gameStarted) {
    const currentPlayer = players.find(p => p.id === localPlayerId);
    const isPlayerTurn = currentTurn === localPlayerId;

    return (
      <DndProvider backend={HTML5Backend}>
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <div className="w-full max-w-4xl p-8 bg-white rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold text-center mb-8">Game in Progress</h1>
            
            <div className="flex justify-between mb-8">
              <div>
                <h2 className="text-xl font-semibold mb-2">Game Code: {gameId}</h2>
                <p className="text-gray-600">Round: {currentRound}/7</p>
              </div>
              <div>
                <p className="text-gray-600">Contract: {
                  currentRound === 1 ? '2 sets' :
                  currentRound === 2 ? '1 set and 1 run' :
                  currentRound === 3 ? '2 runs' :
                  currentRound === 4 ? '3 sets' :
                  currentRound === 5 ? '2 sets and 1 run' :
                  currentRound === 6 ? '1 set and 2 runs' :
                  '3 runs'
                }</p>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="bg-green-100 p-8 rounded-lg mb-8">
              <div className="flex justify-center space-x-8 mb-8">
                <div className="text-center">
                  <p className="text-lg font-semibold mb-2">Draw Pile</p>
                  <div 
                    className="w-24 h-36 bg-indigo-600 rounded-lg shadow-lg flex items-center justify-center text-white font-bold cursor-pointer hover:bg-indigo-700"
                    onClick={handleDrawFromDeck}
                  >
                    {deck.length}
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-lg font-semibold mb-2">Discard Pile</p>
                  {discardPile.length > 0 ? (
                    <div 
                      className="cursor-pointer"
                      onClick={handleDrawFromDiscard}
                    >
                      <Card 
                        card={discardPile[discardPile.length - 1]} 
                        index={0}
                        onCardClick={() => {}}
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-36 bg-gray-200 rounded-lg"></div>
                  )}
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Melds on Table</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {melds.map(meld => (
                    <div key={meld.id} className="bg-white p-4 rounded-lg shadow">
                      <p className="text-sm text-gray-600 mb-2">
                        {meld.type === 'set' ? 'Set' : 'Run'} by {players.find(p => p.id === meld.playerId)?.name}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {meld.cards.map((card, index) => (
                          <Card 
                            key={card.id} 
                            card={card} 
                            index={index}
                            onCardClick={() => {}}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {isPlayerTurn && (
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleDiscard}
                    disabled={!selectedCard || lastAction !== 'draw'}
                    className={`px-4 py-2 rounded-md ${
                      selectedCard && lastAction === 'draw'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Discard
                  </button>
                  
                  {meldCards.length > 0 && (
                    <>
                      <button
                        onClick={() => setMeldType('set')}
                        className={`px-4 py-2 rounded-md ${
                          meldType === 'set'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        Set {meldType === 'set' ? '✓' : ''}
                      </button>
                      <button
                        onClick={() => setMeldType('run')}
                        className={`px-4 py-2 rounded-md ${
                          meldType === 'run'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        Run {meldType === 'run' ? '✓' : ''}
                      </button>
                      <button
                        onClick={handleLayMeld}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        Lay Meld ({meldCards.length})
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {players.map(player => (
                <div 
                  key={player.id}
                  className={`p-4 rounded-lg ${
                    player.id === localPlayerId 
                      ? 'bg-indigo-100' 
                      : 'bg-gray-100'
                  } ${player.id === currentTurn ? 'ring-2 ring-indigo-500' : ''}`}
                >
                  <p className="font-semibold">{player.name}</p>
                  <p>Cards: {player.hand?.length || 0}</p>
                  <p>Score: {player.score || 0}</p>
                </div>
              ))}
            </div>
            
            {currentPlayer && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Your Hand</h3>
                <PlayerHand 
                  cards={currentPlayer.hand || []}
                  onCardMove={(newHand: Card[]) => {
                    // Handle card rearrangement
                    const gameStateKey = `game-${gameId}`;
                    const storedGameState = localStorage.getItem(gameStateKey);
                    
                    if (storedGameState) {
                      try {
                        const { 
                          players: storedPlayers, 
                          gameStarted: storedGameStarted,
                          currentTurn: storedCurrentTurn,
                          deck: storedDeck,
                          discardPile: storedDiscardPile,
                          melds: storedMelds,
                          currentRound: storedCurrentRound
                        } = JSON.parse(storedGameState);
                        
                        const updatedPlayers = storedPlayers.map((player: Player) => 
                          player.id === localPlayerId
                            ? { ...player, hand: newHand }
                            : player
                        );
                        
                        const newState = {
                          players: updatedPlayers,
                          gameStarted: storedGameStarted,
                          currentTurn: storedCurrentTurn,
                          deck: storedDeck,
                          discardPile: storedDiscardPile,
                          melds: storedMelds,
                          currentRound: storedCurrentRound
                        };
                        
                        setPlayers(updatedPlayers);
                        
                        localStorage.setItem(gameStateKey, JSON.stringify(newState));
                        
                        const gameChannel = createGameChannel(gameId);
                        gameChannel.postMessage({
                          type: 'GAME_STATE_UPDATE',
                          payload: newState
                        });
                        gameChannel.close();
                      } catch (e) {
                        console.error('Error rearranging hand:', e);
                      }
                    }
                  }}
                  onCardSelect={(cardId: string) => {
                    if (meldCards.length > 0) {
                      setMeldCards(prev => 
                        prev.includes(cardId)
                          ? prev.filter(id => id !== cardId)
                          : [...prev, cardId]
                      );
                    } else {
                      setSelectedCard(cardId === selectedCard ? null : cardId);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </DndProvider>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
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
    </DndProvider>
  );
} 