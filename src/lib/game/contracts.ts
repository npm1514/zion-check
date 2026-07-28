import { Contract } from '@/types/game';

/**
 * Zion's Check — 7 rounds, displayed as rounds 6–12.
 * Internal round numbers are 1–7; the RoundTracker adds 5 to get the display label.
 * Each round specifies the melds a player must lay down to "go out".
 */
export const CONTRACTS: Contract[] = [
  {
    round: 1, // displayed as Round 6
    label: '2 Sets of 3',
    requirements: [
      { type: 'set', minSize: 3 },
      { type: 'set', minSize: 3 },
    ],
  },
  {
    round: 2, // displayed as Round 7
    label: '1 Set of 3 + 1 Run of 4',
    requirements: [
      { type: 'set', minSize: 3 },
      { type: 'run', minSize: 4 },
    ],
  },
  {
    round: 3, // displayed as Round 8
    label: '2 Runs of 4',
    requirements: [
      { type: 'run', minSize: 4 },
      { type: 'run', minSize: 4 },
    ],
  },
  {
    round: 4, // displayed as Round 9
    label: '3 Sets of 3',
    requirements: [
      { type: 'set', minSize: 3 },
      { type: 'set', minSize: 3 },
      { type: 'set', minSize: 3 },
    ],
  },
  {
    round: 5, // displayed as Round 10
    label: '2 Sets of 3 + 1 Run of 4',
    requirements: [
      { type: 'set', minSize: 3 },
      { type: 'set', minSize: 3 },
      { type: 'run', minSize: 4 },
    ],
  },
  {
    round: 6, // displayed as Round 11
    label: '1 Set of 3 + 2 Runs of 4',
    requirements: [
      { type: 'set', minSize: 3 },
      { type: 'run', minSize: 4 },
      { type: 'run', minSize: 4 },
    ],
  },
  {
    round: 7, // displayed as Round 12
    label: '3 Runs of 4',
    requirements: [
      { type: 'run', minSize: 4 },
      { type: 'run', minSize: 4 },
      { type: 'run', minSize: 4 },
    ],
  },
];

export function getContract(round: number): Contract {
  const c = CONTRACTS.find((c) => c.round === round);
  if (!c) throw new Error(`No contract defined for round ${round}`);
  return c;
}
