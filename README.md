# Zion's Check

A multiplayer online card game built with Next.js.

## Overview

This project is a web-based implementation of Zion's Check, a popular card game variant. The game allows multiple players to join a game room and play together in real-time.

## Features

- Create and join game rooms
- Real-time multiplayer gameplay
- Drag and drop card interface
- Set and run formation
- Score tracking
- Round-based gameplay with different contracts

## Technologies Used

- Next.js 15
- React 19
- Styled Components
- React DnD for drag and drop
- Client-side game state management

## Getting Started

### Prerequisites

- Node.js 18.17 or higher

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Game Rules

Zion's Check is played with the following rules:

- The game consists of 7 rounds with different contracts
- Each round, players must fulfill the specified contract to go out
- A set is a group of 3 or 4 cards of the same rank
- A run is a sequence of 4 or more cards of the same suit
- Jokers can be used as wild cards to complete sets or runs
- Points are scored for cards left in opponents' hands
- The player with the lowest score at the end wins

## How to Play

1. Create a new game or join an existing one with a game code
2. Wait for all players to mark themselves as ready
3. On your turn, draw a card from either the draw pile or discard pile
4. Play melds (sets or runs) if possible
5. Discard one card to end your turn
6. The first player to play all their cards wins the round

## License

MIT
