import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { useDrop } from 'react-dnd';
import Card from './Card';

// Define card type to match the game
type Card = {
  id: string;
  suit: 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades' | 'Joker';
  value: string | number;
  isJoker?: boolean;
};

interface PlayerHandProps {
  cards: Card[];
  onCardMove: (cards: Card[]) => void;
  onCardSelect: (cardId: string) => void;
  selectedCardIds: string[];
}

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

const CardSlot = styled.div<{ $isOver: boolean }>`
  position: relative;
  margin: 5px;
  min-width: 100px;
  height: 140px;
  border-radius: 10px;
  border: ${props => props.$isOver ? '2px dashed #3498db' : 'none'};
  background-color: ${props => props.$isOver ? 'rgba(52, 152, 219, 0.2)' : 'transparent'};
  transition: all 0.2s;
`;

// Custom hook for creating drop targets
const useDropTarget = (index: number, moveCard: (dragIndex: number, hoverIndex: number) => void) => {
  const [{ isOver }, dropRef] = useDrop({
    accept: 'CARD',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveCard(item.index, index);
        item.index = index;
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })
  });

  return { isOver, dropRef };
};

const PlayerHand: React.FC<PlayerHandProps> = ({ cards, onCardMove, onCardSelect, selectedCardIds = [] }) => {
  // Handle card movement within the hand
  const moveCard = useCallback((dragIndex: number, hoverIndex: number) => {
    if (dragIndex === hoverIndex) return;
    if (dragIndex < 0 || dragIndex >= cards.length) return;
    if (hoverIndex < 0 || hoverIndex >= cards.length) return;
    
    const newCards = [...cards];
    const draggedCard = newCards[dragIndex];
    if (!draggedCard) return;
    
    newCards.splice(dragIndex, 1);
    newCards.splice(hoverIndex, 0, draggedCard);
    onCardMove(newCards);
  }, [cards, onCardMove]);

  // Create fixed number of drop targets (maximum 13 cards)
  const dropTarget0 = useDropTarget(0, moveCard);
  const dropTarget1 = useDropTarget(1, moveCard);
  const dropTarget2 = useDropTarget(2, moveCard);
  const dropTarget3 = useDropTarget(3, moveCard);
  const dropTarget4 = useDropTarget(4, moveCard);
  const dropTarget5 = useDropTarget(5, moveCard);
  const dropTarget6 = useDropTarget(6, moveCard);
  const dropTarget7 = useDropTarget(7, moveCard);
  const dropTarget8 = useDropTarget(8, moveCard);
  const dropTarget9 = useDropTarget(9, moveCard);
  const dropTarget10 = useDropTarget(10, moveCard);
  const dropTarget11 = useDropTarget(11, moveCard);
  const dropTarget12 = useDropTarget(12, moveCard);

  const dropTargets = [
    dropTarget0, dropTarget1, dropTarget2, dropTarget3, dropTarget4,
    dropTarget5, dropTarget6, dropTarget7, dropTarget8, dropTarget9,
    dropTarget10, dropTarget11, dropTarget12
  ];

  // Handle card selection for playing
  const handleCardClick = useCallback((cardId: string) => {
    onCardSelect(cardId);
  }, [onCardSelect]);

  return (
    <HandContainer>
      {dropTargets.map((target, index) => (
        <CardSlot key={index} ref={target.dropRef as any} $isOver={target.isOver}>
          {index < cards.length && (
            <Card 
              card={cards[index]} 
              index={index} 
              onCardClick={handleCardClick}
              isSelected={selectedCardIds.includes(cards[index]?.id)}
            />
          )}
        </CardSlot>
      ))}
    </HandContainer>
  );
};

export default PlayerHand; 