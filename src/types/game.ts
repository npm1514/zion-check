// ─── Card Types ───────────────────────────────────────────────────────────────

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank =
  | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
  | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  id: string;           // unique per card instance e.g. "hearts_A_0"
  suit: Suit | 'joker';
  rank: Rank | 'joker';
  isJoker: boolean;
}

// A card slot inside a meld — may be a joker substituting a real card
export interface MeldSlot {
  card: Card;
  substituting?: { suit: Suit; rank: Rank }; // set when card.isJoker === true
}

// ─── Meld Types ───────────────────────────────────────────────────────────────

export type MeldType = 'set' | 'run';

export interface Meld {
  id: string;
  ownerId: string;   // player id who laid this meld
  type: MeldType;
  slots: MeldSlot[];
}

// ─── Contract (per-round objective) ──────────────────────────────────────────

export interface ContractRequirement {
  type: MeldType;
  minSize: number;
}

export interface Contract {
  round: number;
  label: string;
  requirements: ContractRequirement[];
}

// ─── Player State ─────────────────────────────────────────────────────────────

export interface PlayerState {
  id: string;
  name: string;
  seatIndex: number;
  hand: Card[];
  melds: Meld[];          // melds this player has laid on the table
  contractMet: boolean;      // has met the round contract
  justLaidContract: boolean; // laid contract THIS turn — cannot extend melds until next turn
  buysThisRound: number;
  roundScores: number[];  // one entry per completed round
  isConnected: boolean;
  isReady: boolean;
}

// ─── Turn / Phase ─────────────────────────────────────────────────────────────

export type GamePhase =
  | 'lobby'           // waiting for players
  | 'draw'            // active player must draw
  | 'action'          // active player can meld / extend / discard
  | 'buy_window'      // brief window after a discard where others can buy
  | 'round_end'       // scoring between rounds
  | 'game_over';      // final scores

// ─── Game State ───────────────────────────────────────────────────────────────

export interface GameState {
  phase: GamePhase;
  round: number;                    // 1–10
  currentPlayerIdx: number;         // index into players array
  deck: Card[];
  discardPile: Card[];
  players: PlayerState[];
  pendingBuyRequests: string[];     // player ids who clicked "Buy"
  buyWindowOpenAt: number | null;   // epoch ms, null when window closed
  hostId: string;
  version: number;                  // optimistic-lock counter
  lastDrawnId: string | null;       // id of the card drawn this action, for first-draw reject
  lastDiscardedById: string | null; // player who made the most recent discard (cannot take it back)
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export function cardPoints(card: Card): number {
  if (card.isJoker) return 50;
  if (card.rank === 'A') return 15;
  if (['10', 'J', 'Q', 'K'].includes(card.rank)) return 10;
  return 5; // 2–9
}

// ─── Room (Supabase row shape) ────────────────────────────────────────────────

export interface Room {
  id: string;
  code: string;
  state: GameState;
  created_at: string;
  updated_at: string;
}
