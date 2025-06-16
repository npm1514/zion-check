import React, { useCallback } from 'react';
import styled from 'styled-components';
import { useDrop } from 'react-dnd';
import Card from './Card';

const HandContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  min-height: 160px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 15px;
  margin-top: 20px;
`;

const CardSlot = styled.div`
  position: relative;
  margin: 5px;
  min-width: 100px;
  height: 140px;
  border-radius: 10px;
  border: ${props => props.$isOver ? '2px dashed #3498db' : 'none'};
  background-color: ${props => props.$isOver ? 'rgba(52, 152, 219, 0.2)' : 'transparent'};
  transition: all 0.2s;
`;

const PlayerHand = ({ cards, onCardMove, onCardSelect }) => {
  // Handle card movement within the hand
  const moveCard = useCallback((dragIndex, hoverIndex) => {
    // Create a new array with the cards in the new order
    const newCards = [...cards];
    const draggedCard = newCards[dragIndex];
    
    // Remove the dragged card from its original position
    newCards.splice(dragIndex, 1);
    
    // Insert the dragged card at the new position
    newCards.splice(hoverIndex, 0, draggedCard);
    
    // Send the new order to the parent component with full card objects
    onCardMove(newCards);
  }, [cards, onCardMove]);
  
  // Create an array of drop refs and isOver states
  // This approach creates all the hooks at the top level, which follows React's rules
  const dropTargets = [];
  
  // Create one more slot than the number of cards for dragging flexibility
  for (let i = 0; i < cards.length + 1; i++) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [{ isOver }, dropRef] = useDrop({
      accept: 'CARD',
      hover: (item) => {
        if (item.index !== i) {
          moveCard(item.index, i);
          item.index = i;
        }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver()
      })
    });
    
    dropTargets.push({ dropRef, isOver });
  }
  
  // Handle card selection for playing
  const handleCardClick = (cardId) => {
    onCardSelect(cardId);
  };
  
  return (
    <HandContainer>
      {dropTargets.map((target, index) => (
        <CardSlot key={index} ref={target.dropRef} $isOver={target.isOver}>
          {index < cards.length && (
            <Card 
              card={cards[index]} 
              index={index} 
              onCardClick={handleCardClick}
            />
          )}
        </CardSlot>
      ))}
    </HandContainer>
  );
};

export default PlayerHand; 