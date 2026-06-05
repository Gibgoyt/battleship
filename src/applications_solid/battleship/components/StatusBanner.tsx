import type { Component } from 'solid-js';
import type { ClientGameState } from 'src/lib/battleship/types';

const StatusBanner: Component<{ state: ClientGameState }> = (props) => {
  const text = () => {
    const s = props.state;
    if (s.phase === 'waiting') {
      return 'Waiting for the second player to join…';
    }
    if (s.phase === 'placing') {
      if (s.turn === s.you) {
        return s.opponentPlaced
          ? 'Opponent has placed their fleet. Your turn to place.'
          : 'Place your fleet first. Opponent will place after you.';
      }
      return s.opponentPlaced
        ? 'Both fleets placed — preparing to play…'
        : 'Waiting for opponent to place their fleet…';
    }
    if (s.phase === 'playing') {
      return s.turn === s.you ? 'Your turn — click an enemy cell to fire.' : 'Opponent is firing…';
    }
    if (s.phase === 'finished') {
      return s.winner === s.you ? 'You won!' : 'You lost.';
    }
    return '';
  };

  const tone = () => {
    const s = props.state;
    if (s.phase === 'finished') return s.winner === s.you ? 'bg-green-900/40 border-green-600/40 text-green-200' : 'bg-red-900/40 border-red-600/40 text-red-200';
    if (s.phase === 'playing' && s.turn === s.you) return 'bg-blue-900/40 border-blue-600/40 text-blue-100';
    return 'bg-zinc-900 border-zinc-700 text-zinc-300';
  };

  return (
    <div class={`px-4 py-2 border-b text-sm ${tone()}`}>
      {text()}
    </div>
  );
};

export default StatusBanner;
