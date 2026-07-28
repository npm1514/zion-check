'use client';

import { GameState } from '@/types/game';
import { totalScore } from '@/lib/game/gameEngine';
import { CONTRACTS } from '@/lib/game/contracts';

interface ScoreboardProps {
  state: GameState;
}

export function Scoreboard({ state }: ScoreboardProps) {
  const sorted = [...state.players].sort((a, b) => totalScore(a) - totalScore(b));

  return (
    <div className="bg-gray-900 rounded-xl p-4 text-white">
      <h2 className="text-lg font-bold mb-3 text-yellow-400">📊 Scoreboard</h2>

      {/* Current round info */}
      <div className="mb-3 text-sm text-gray-300">
        Round <span className="text-white font-bold">{state.round}</span> / 10
        {' · '}
        <span className="italic">{CONTRACTS.find(c => c.round === state.round)?.label}</span>
      </div>

      {/* Per-player scores */}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-xs uppercase border-b border-gray-700">
            <th className="text-left pb-1">Player</th>
            {Array.from({ length: state.round - 1 }, (_, i) => (
              <th key={i} className="text-center pb-1 w-8">R{i + 1}</th>
            ))}
            <th className="text-right pb-1 pr-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((player, rank) => (
            <tr
              key={player.id}
              className={`border-b border-gray-800 ${rank === 0 ? 'text-yellow-300' : ''}`}
            >
              <td className="py-1 flex items-center gap-1">
                {rank === 0 && <span>👑</span>}
                {player.name}
                {player.contractMet && (
                  <span className="ml-1 text-[10px] bg-green-700 px-1 rounded">✓ down</span>
                )}
              </td>
              {player.roundScores.map((score, ri) => (
                <td key={ri} className="text-center py-1 text-gray-300 text-xs">{score}</td>
              ))}
              <td className="text-right py-1 pr-1 font-bold">{totalScore(player)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
