import Link from 'next/link';

export default function RulesPage() {
  return (
    <div className="flex flex-col items-center min-h-screen p-8">
      <div className="w-full max-w-4xl p-8 bg-white rounded-xl shadow-lg">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Zion's Check Rules</h1>
          <Link 
            href="/"
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Back to Home
          </Link>
        </div>
        
        <div className="prose max-w-none">
          <h2>Overview</h2>
          <p>
            Zion's Check is a variant of Rummy played with 2-6 players. The game consists of 7 rounds, 
            each with a different "contract" that players must fulfill before they can go out.
          </p>
          
          <h2>Objective</h2>
          <p>
            The objective is to be the player with the lowest score at the end of the game. 
            Points are scored for cards left in your hand at the end of each round.
          </p>
          
          <h2>The Contracts</h2>
          <p>Each round has a specific contract that must be fulfilled:</p>
          <ol>
            <li><strong>Round 1:</strong> 2 sets</li>
            <li><strong>Round 2:</strong> 1 set and 1 run</li>
            <li><strong>Round 3:</strong> 2 runs</li>
            <li><strong>Round 4:</strong> 3 sets</li>
            <li><strong>Round 5:</strong> 2 sets and 1 run</li>
            <li><strong>Round 6:</strong> 1 set and 2 runs</li>
            <li><strong>Round 7:</strong> 3 runs</li>
          </ol>
          
          <h3>Definitions:</h3>
          <ul>
            <li><strong>Set:</strong> 3 or 4 cards of the same rank (e.g., three 8s, four Kings)</li>
            <li><strong>Run:</strong> 4 or more cards of the same suit in sequence (e.g., 5-6-7-8 of Hearts)</li>
          </ul>
          
          <h2>Gameplay</h2>
          <p>Each round follows these steps:</p>
          <ol>
            <li>Deal cards (Round 1: 10 cards, Round 2: 12 cards, and so on)</li>
            <li>On your turn:
              <ul>
                <li>Draw a card from either the draw pile or the discard pile</li>
                <li>Play melds (sets or runs) if possible</li>
                <li>Discard one card to end your turn</li>
              </ul>
            </li>
            <li>The first player to play all their cards wins the round</li>
          </ol>
          
          <h2>Scoring</h2>
          <p>After each round, points are scored for cards remaining in players' hands:</p>
          <ul>
            <li>Ace: 15 points</li>
            <li>Face cards (K, Q, J): 10 points</li>
            <li>Number cards: face value (e.g., 7 is worth 7 points)</li>
            <li>Joker: 25 points</li>
          </ul>
          
          <h2>Special Rules</h2>
          <ul>
            <li>Jokers are wild and can be used to complete sets or runs</li>
            <li>You cannot go out unless you have completed the required contract</li>
            <li>You must discard a card at the end of your turn, even when going out</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 