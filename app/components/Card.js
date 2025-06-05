import React from 'react';
import styled from 'styled-components';
import { useDrag } from 'react-dnd';

const CardContainer = styled.div`
  position: relative;
  width: 100px;
  height: 140px;
  border-radius: 10px;
  margin: 0 5px;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  user-select: none;
  cursor: ${props => props.isDragging ? 'grabbing' : 'grab'};
  opacity: ${props => props.isDragging ? 0.5 : 1};
  transform: ${props => props.isDragging ? 'scale(1.05)' : 'scale(1)'};
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: ${props => props.isDragging ? 'scale(1.05)' : 'translateY(-5px)'};
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  }
`;

const CardContent = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 5px;
  color: ${props => props.color};
  font-weight: bold;
`;

const CardCorner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const CardValue = styled.div`
  font-size: 1.5rem;
`;

const CardSuit = styled.div`
  font-size: 1.5rem;
`;

const CardCenter = styled.div`
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 3rem;
`;

const JokerCard = styled(CardContainer)`
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
`;

const JokerText = styled.div`
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
`;

const Card = ({ card, index, onCardClick }) => {
  // Map card suits to symbols and colors
  const suitSymbol = {
    'Hearts': '♥',
    'Diamonds': '♦',
    'Clubs': '♣',
    'Spades': '♠',
    'Joker': '🃏'
  };
  
  const suitColor = {
    'Hearts': '#e74c3c',
    'Diamonds': '#e74c3c',
    'Clubs': '#2c3e50',
    'Spades': '#2c3e50',
    'Joker': '#333'
  };
  
  // Configure drag and drop
  const [{ isDragging }, drag] = useDrag({
    type: 'CARD',
    item: { id: card.id, index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  });
  
  // Render a joker card
  if (card.isJoker) {
    return (
      <JokerCard 
        ref={drag} 
        isDragging={isDragging} 
        onClick={() => onCardClick(card.id)}
      >
        <JokerText>JOKER</JokerText>
      </JokerCard>
    );
  }
  
  // Render a regular card
  return (
    <CardContainer 
      ref={drag} 
      isDragging={isDragging} 
      onClick={() => onCardClick(card.id)}
    >
      <CardContent color={suitColor[card.suit]}>
        <CardCorner>
          <CardValue>{card.value}</CardValue>
          <CardSuit>{suitSymbol[card.suit]}</CardSuit>
        </CardCorner>
        <CardCenter>
          {suitSymbol[card.suit]}
        </CardCenter>
      </CardContent>
    </CardContainer>
  );
};

export default Card; 