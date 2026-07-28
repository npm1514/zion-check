import { Contract } from '@/types/game';

/**
 * Standard 10-round Shanghai Rummy contracts used in Zion's Check.
 * Each round specifies the groups a player must lay down to "go out".
 */
export const CONTRACTS: Contract[] = [
  {
    round: 1,
    label: '2 Sets of 3',
    requirements: [
      { type: 'set', minSize: 3 },
      { type: 'set', minSize: 3 },
    ],
  },
  {
    round: 2,
    label: '1 Set of 3 + 1 Run of 4',
    requirements: [
      { type: 'set', minSize: 3 },
      { type: 'run', minSize: 4 },
    ],
  },
  {
    round: 3,
    label: '2 Runs of 4',
    requirements: [
      { type: 'run', minSize: 4 },
      { type: 'run', minSize: 4 },
    ],
  },
  {
    round: 4,
    label: '3 Sets of 3',
    requirements: [
      { type: 'set', minSize: 3 },
      { type: 'set', minSize: 3 },
      { type: 'set', minSize: 3 },
    ],
  },
  {
    round: 5,
    label: '2 Sets of 3 + 1 Run of 4',
    requirements: [
      { type: 'set', minSize: 3 },
      { type: 'set', minSize: 3 },
      { type: 'run', minSize: 4 },
    ],
  },
  {
    round: 6,
    label: '1 Set of 3 + 2 Runs of 4',
    requirements: [
      { type: 'set', minSize: 3 },
      { type: 'run', minSize: 4 },
      { type: 'run', minSize: 4 },
    ],
  },
  {
    round: 7,
    label: '3 Runs of 4',
    requirements: [
      { type: 'run', minSize: 4 },
      { type: 'run', minSize: 4 },
      { type: 'run', minSize: 4 },
    ],
  },
  {
    round: 8,
    label: '3 Sets of 3 + 1 Run of 4',
    requirements: [
      { type: 'set', minSize: 3 },
      { type: 'set', minSize: 3 },
      { type: 'set', minSize: 3 },
      { type: 'run', minSize: 4 },
    ],
  },
  {
    round: 9,
    label: '2 Sets of 3 + 2 Runs of 4',
    requirements: [
      { type: 'set', minSize: 3 },
      { type: 'set', minSize: 3 },
      { type: 'run', minSize: 4 },
      { type: 'run', minSize: 4 },
    ],
  },
  {
    round: 10,
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
