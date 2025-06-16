import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import io from 'socket.io-client';
import PlayerHand from './PlayerHand';
import Card from './Card';

const SERVER_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : 'http://localhost:3001';

// Initialize socket connection
const socket = io(SERVER_URL);

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px;
`;

const GameHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const GameTitle = styled.h1`
  margin: 0;
  color: #fff;
`;

const GameCode = styled.div`
  padding: 10px 15px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  font-weight: bold;
  color: #fff;
  user-select: all;
`;

const GameSection = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
  color: #fff;
  margin-bottom: 15px;
`;

const PlayersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
`;

const PlayerCard = styled.div`
  background: ${props => props.isCurrentPlayer ? 'rgba(46, 204, 113, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
  border: 2px solid ${props => props.isCurrentPlayer ? '#2ecc71' : 'transparent'};
  border-radius: 10px;
  padding: 15px;
  min-width: 120px;
  
  h3 {
    margin: 0 0 10px 0;
    color: #fff;
  }
  
  p {
    margin: 5px 0;
    color: ${props => props.isReady ? '#2ecc71' : '#e74c3c'};
  }
  
  .cards-count {
    color: #f39c12;
  }
  
  .score {
    color: #3498db;
  }
`;

const GameBoard = styled.div`
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  flex-grow: 1;
`;

const TableSection = styled.div`
  margin-bottom: 20px;
`;

const DiscardPile = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 30px;
`;

const DrawPile = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const PileLabel = styled.div`
  color: #fff;
  margin-bottom: 10px;
  font-weight: bold;
`;

const CardBackContainer = styled.div`
  width: 100px;
  height: 140px;
  border-radius: 10px;
  background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: bold;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  }
`;

const CenterTable = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
`;

const Melds = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
`;

const MeldContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 10px;
`;

const MeldLabel = styled.div`
  color: #fff;
  margin-bottom: 10px;
  font-size: 0.9rem;
`;

const MeldCards = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 12px 24px;
  background: ${props => props.primary ? '#3498db' : '#2c3e50'};
  color: white;
  border: none;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s;
  
  &:hover {
    background: ${props => props.primary ? '#2980b9' : '#34495e'};
  }
  
  &:disabled {
    background: #95a5a6;
    cursor: not-allowed;
  }
`;

const ReadyButton = styled(Button)`
  background: #27ae60;
  
  &:hover {
    background: #2ecc71;
  }
`;

const RoundInfo = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
  
  h3 {
    margin: 0 0 10px 0;
    color: #fff;
  }
  
  p {
    margin: 5px 0;
    color: #f1c40f;
  }
`;

const Game = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  
  // Game state
  const [game, setGame] = useState(null);
  const [hand, setHand] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [meldCards, setMeldCards] = useState([]);
  const [meldType, setMeldType] = useState('set');
  const [playerId, setPlayerId] = useState(null);
  const [error, setError] = useState('');
  
  // Initialize game state when component mounts
  useEffect(() => {
    // Set up socket event listeners
    socket.on('gameStateUpdated', ({ game: updatedGame }) => {
      setGame(updatedGame);
    });
    
    socket.on('playerJoined', ({ game: updatedGame }) => {
      setGame(updatedGame);
    });
    
    socket.on('playerStatusChanged', ({ game: updatedGame }) => {
      setGame(updatedGame);
    });
    
    socket.on('roundStarted', ({ game: updatedGame }) => {
      setGame(updatedGame);
    });
    
    socket.on('cardDrawn', ({ card, hand: newHand }) => {
      setHand(newHand);
    });
    
    socket.on('handUpdated', ({ hand: newHand }) => {
      setHand(newHand);
      setSelectedCard(null);
      setMeldCards([]);
    });
    
    socket.on('meldCreated', ({ meld }) => {
      // Meld created by a player
    });
    
    socket.on('meldUpdated', ({ meld }) => {
      // Meld updated by a player
    });
    
    socket.on('roundEnded', ({ game: updatedGame, winner, nextRound }) => {
      setGame(updatedGame);
      setHand([]);
      setSelectedCard(null);
      setMeldCards([]);
    });
    
    socket.on('gameOver', ({ game: updatedGame }) => {
      setGame(updatedGame);
    });
    
    socket.on('error', ({ message }) => {
      setError(message);
      setTimeout(() => setError(''), 3000);
    });
    
    // Store the player's socket ID
    setPlayerId(socket.id);
    
    // Clean up event listeners when component unmounts
    return () => {
      socket.off('gameStateUpdated');
      socket.off('playerJoined');
      socket.off('playerStatusChanged');
      socket.off('roundStarted');
      socket.off('cardDrawn');
      socket.off('handUpdated');
      socket.off('meldCreated');
      socket.off('meldUpdated');
      socket.off('roundEnded');
      socket.off('gameOver');
      socket.off('error');
    };
  }, []);
  
  // Reconnect to the game if needed
  useEffect(() => {
    // Try to reconnect to the game
    if (gameId && playerId) {
      socket.emit('playerJoined', { gameId });
    }
  }, [gameId, playerId]);
  
  // Handle card rearrangement
  const handleCardRearrange = useCallback((newHandOrder) => {
    socket.emit('rearrangeHand', { gameId, newHandOrder });
  }, [gameId]);
  
  // Handle card selection
  const handleCardSelect = useCallback((cardId) => {
    if (selectedCard === cardId) {
      setSelectedCard(null);
    } else {
      setSelectedCard(cardId);
    }
  }, [selectedCard]);
  
  // Handle adding a card to the meld
  const handleAddToMeld = useCallback((cardId) => {
    if (meldCards.includes(cardId)) {
      // Remove card from selection
      setMeldCards(meldCards.filter(id => id !== cardId));
    } else {
      // Add card to selection
      setMeldCards([...meldCards, cardId]);
    }
  }, [meldCards]);
  
  // Handle player ready state
  const handleReady = useCallback(() => {
    socket.emit('playerReady', { gameId });
  }, [gameId]);
  
  // Handle drawing a card from the deck
  const handleDrawFromDeck = useCallback(() => {
    socket.emit('drawFromDeck', { gameId });
  }, [gameId]);
  
  // Handle drawing a card from the discard pile
  const handleDrawFromDiscard = useCallback(() => {
    socket.emit('drawFromDiscard', { gameId });
  }, [gameId]);
  
  // Handle discarding a card
  const handleDiscard = useCallback(() => {
    if (!selectedCard) {
      setError('Please select a card to discard');
      return;
    }
    
    socket.emit('discard', { gameId, cardId: selectedCard });
  }, [gameId, selectedCard]);
  
  // Handle laying down a meld
  const handleLayMeld = useCallback(() => {
    if (meldCards.length < 3) {
      setError('A meld needs at least 3 cards');
      return;
    }
    
    socket.emit('layMeld', { gameId, cardIds: meldCards, meldType });
    setMeldCards([]);
  }, [gameId, meldCards, meldType]);
  
  // Handle adding to an existing meld
  const handleAddToExistingMeld = useCallback((meldId) => {
    if (!selectedCard) {
      setError('Please select a card to add to the meld');
      return;
    }
    
    socket.emit('addToMeld', { gameId, cardId: selectedCard, meldId });
  }, [gameId, selectedCard]);
  
  // Handle starting the next round
  const handleStartNextRound = useCallback(() => {
    socket.emit('startNextRound', { gameId });
  }, [gameId]);
  
  // Render loading state if game hasn't loaded yet
  if (!game) {
    return (
      <GameContainer>
        <GameTitle>Loading game...</GameTitle>
      </GameContainer>
    );
  }
  
  const currentPlayer = game.players[playerId];
  const isPlayerTurn = game.currentTurn === playerId;
  const isHost = currentPlayer?.isHost;
  const currentRoundInfo = game.currentRound < game.roundInfo.length 
    ? game.roundInfo[game.currentRound] 
    : null;
  
  return (
    <GameContainer>
      <GameHeader>
        <GameTitle>Zion's Check</GameTitle>
        <GameCode>Game Code: {game.id}</GameCode>
      </GameHeader>
      
      {game.state === 'waiting' && (
        <RoundInfo>
          <h3>Waiting for players</h3>
          <p>Share the game code with your friends to join!</p>
        </RoundInfo>
      )}
      
      {game.state === 'playing' && currentRoundInfo && (
        <RoundInfo>
          <h3>Round {game.currentRound + 1}: {currentRoundInfo.name}</h3>
          <p>Contract: {currentRoundInfo.requirements}</p>
        </RoundInfo>
      )}
      
      {game.state === 'between_rounds' && (
        <RoundInfo>
          <h3>Round {game.currentRound} Completed</h3>
          {isHost && (
            <Button primary onClick={handleStartNextRound}>
              Start Next Round
            </Button>
          )}
        </RoundInfo>
      )}
      
      {game.state === 'finished' && (
        <RoundInfo>
          <h3>Game Over!</h3>
          <p>
            Winner: {
              Object.values(game.players).reduce((winner, player) => 
                !winner || player.score < winner.score ? player : winner
              ).name
            }
          </p>
        </RoundInfo>
      )}
      
      {error && (
        <div style={{ color: '#e74c3c', marginBottom: '10px' }}>
          {error}
        </div>
      )}
      
      <GameSection>
        <SectionTitle>Players</SectionTitle>
        <PlayersContainer>
          {Object.values(game.players).map(player => (
            <PlayerCard 
              key={player.id} 
              isCurrentPlayer={player.id === game.currentTurn}
              isReady={player.isReady}
            >
              <h3>{player.name} {player.isHost ? '(Host)' : ''}</h3>
              <p>{player.isReady ? 'Ready' : 'Not Ready'}</p>
              <p className="cards-count">
                Cards: {player.id === playerId ? hand.length : player.hand.length}
              </p>
              <p className="score">Score: {player.score}</p>
            </PlayerCard>
          ))}
        </PlayersContainer>
      </GameSection>
      
      {game.state === 'playing' && (
        <GameBoard>
          <CenterTable>
            {game.discardPile.length > 0 && (
              <DiscardPile>
                <PileLabel>Discard Pile</PileLabel>
                <div onClick={handleDrawFromDiscard}>
                  <Card card={game.discardPile[game.discardPile.length - 1]} />
                </div>
              </DiscardPile>
            )}
            
            <DrawPile>
              <PileLabel>Draw Pile ({game.deck.length})</PileLabel>
              <CardBackContainer onClick={handleDrawFromDeck}>
                {game.deck.length}
              </CardBackContainer>
            </DrawPile>
          </CenterTable>
          
          <TableSection>
            <SectionTitle>Melds on Table</SectionTitle>
            <Melds>
              {game.melds.map(meld => (
                <MeldContainer key={meld.id}>
                  <MeldLabel>
                    {meld.type === 'set' ? 'Set' : 'Run'} by {game.players[meld.playerId]?.name}
                  </MeldLabel>
                  <MeldCards>
                    {meld.cards.map(card => (
                      <Card key={card.id} card={card} />
                    ))}
                    {isPlayerTurn && selectedCard && (
                      <Button 
                        onClick={() => handleAddToExistingMeld(meld.id)}
                        style={{ height: '30px', padding: '5px 10px', marginLeft: '5px', alignSelf: 'center' }}
                      >
                        Add
                      </Button>
                    )}
                  </MeldCards>
                </MeldContainer>
              ))}
            </Melds>
          </TableSection>
          
          {isPlayerTurn && (
            <ActionButtons>
              <Button 
                primary 
                onClick={handleDiscard} 
                disabled={!selectedCard || game.lastAction !== 'draw'}
              >
                Discard
              </Button>
              
              {meldCards.length > 0 && (
                <>
                  <Button onClick={() => setMeldType('set')}>
                    Set {meldType === 'set' ? '✓' : ''}
                  </Button>
                  <Button onClick={() => setMeldType('run')}>
                    Run {meldType === 'run' ? '✓' : ''}
                  </Button>
                  <Button primary onClick={handleLayMeld}>
                    Lay Meld ({meldCards.length})
                  </Button>
                </>
              )}
            </ActionButtons>
          )}
        </GameBoard>
      )}
      
      {game.state === 'waiting' && !currentPlayer?.isReady && (
        <ReadyButton onClick={handleReady}>
          Ready to Play
        </ReadyButton>
      )}
      
      {(game.state === 'playing' || game.state === 'waiting') && (
        <GameSection>
          <SectionTitle>Your Hand</SectionTitle>
          <PlayerHand 
            cards={hand} 
            onCardMove={handleCardRearrange}
            onCardSelect={selectedCard ? handleAddToMeld : handleCardSelect}
          />
          {hand.length > 0 && (
            <div style={{ color: '#fff', marginTop: '10px', textAlign: 'center' }}>
              Drag cards to rearrange | Click to {selectedCard ? 'add to meld' : 'select'}
            </div>
          )}
        </GameSection>
      )}
    </GameContainer>
  );
};

export default Game; 