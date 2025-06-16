import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import io from 'socket.io-client';

const SERVER_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : 'http://localhost:3001';

// Initialize socket connection
const socket = io(SERVER_URL);

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 0 20px;
`;

const Title = styled.h1`
  font-size: 3rem;
  margin-bottom: 2rem;
  color: #fff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 1.5rem;
`;

const Tab = styled.button`
  flex: 1;
  padding: 1rem;
  background: ${props => props.active ? '#3498db' : 'transparent'};
  color: ${props => props.active ? '#fff' : '#333'};
  border: none;
  font-size: 1.1rem;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 2px solid ${props => props.active ? '#3498db' : '#ddd'};
  
  &:hover {
    background: ${props => props.active ? '#3498db' : '#f0f0f0'};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const Input = styled.input`
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
`;

const Button = styled.button`
  padding: 1rem;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s;
  
  &:hover {
    background: #2ecc71;
  }
  
  &:disabled {
    background: #95a5a6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: #e74c3c;
  margin-top: 1rem;
`;

const RulesContainer = styled.div`
  margin-top: 2rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 5px;
`;

const RulesTitle = styled.h3`
  margin-top: 0;
  color: #333;
`;

const RulesList = styled.ul`
  padding-left: 1.5rem;
  color: #333;
`;

const Home = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Handle creating a new game
  const handleCreateGame = (e) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    setError('');
    socket.emit('createGame', { playerName });
    
    socket.once('gameCreated', ({ gameId }) => {
      navigate(`/game/${gameId}`);
    });
    
    socket.once('error', ({ message }) => {
      setError(message);
    });
  };

  // Handle joining an existing game
  const handleJoinGame = (e) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (!gameId.trim()) {
      setError('Please enter a game code');
      return;
    }
    
    setError('');
    socket.emit('joinGame', { gameId, playerName });
    
    socket.once('playerJoined', () => {
      navigate(`/game/${gameId}`);
    });
    
    socket.once('error', ({ message }) => {
      setError(message);
    });
  };

  return (
    <HomeContainer>
      <Title>Zion's Check</Title>
      
      <Card>
        <TabContainer>
          <Tab 
            active={activeTab === 'create'} 
            onClick={() => setActiveTab('create')}
          >
            Create Game
          </Tab>
          <Tab 
            active={activeTab === 'join'} 
            onClick={() => setActiveTab('join')}
          >
            Join Game
          </Tab>
        </TabContainer>
        
        {activeTab === 'create' ? (
          <Form onSubmit={handleCreateGame}>
            <Input
              type="text"
              placeholder="Your Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
              required
            />
            <Button type="submit" disabled={!playerName.trim()}>
              Create Game
            </Button>
          </Form>
        ) : (
          <Form onSubmit={handleJoinGame}>
            <Input
              type="text"
              placeholder="Your Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
              required
            />
            <Input
              type="text"
              placeholder="Game Code"
              value={gameId}
              onChange={(e) => setGameId(e.target.value.toUpperCase())}
              maxLength={6}
              required
            />
            <Button type="submit" disabled={!playerName.trim() || !gameId.trim()}>
              Join Game
            </Button>
          </Form>
        )}
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <RulesContainer>
          <RulesTitle>Zion's Check Rules</RulesTitle>
          <RulesList>
            <li>The game consists of 7 rounds with different contracts.</li>
            <li>Each round, players must fulfill the specified contract to go out.</li>
            <li>A set is a group of 3 or 4 cards of the same rank.</li>
            <li>A run is a sequence of 4 or more cards of the same suit.</li>
            <li>Jokers can be used as wild cards to complete sets or runs.</li>
            <li>Points are scored for cards left in opponents' hands.</li>
            <li>The player with the lowest score at the end wins.</li>
          </RulesList>
        </RulesContainer>
      </Card>
    </HomeContainer>
  );
};

export default Home; 