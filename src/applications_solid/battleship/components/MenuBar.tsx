import type { Component } from 'solid-js';
import type { ClientGameState } from 'src/lib/battleship/types';

interface Props {
  state: ClientGameState;
  busy: boolean;
  onReset: () => void;
  onLogout: () => void;
}

const MenuBar: Component<Props> = (props) => {
  const youColor = () => (props.state.you === 1 ? 'bg-green-600' : 'bg-red-600');

  const resetLabel = () => {
    const req = props.state.resetRequestedBy;
    if (req === null) return 'Reset game';
    if (req === props.state.you) return 'Cancel reset request';
    return 'Confirm reset game';
  };

  const resetClass = () => {
    const req = props.state.resetRequestedBy;
    if (req !== null && req !== props.state.you) {
      return 'bg-amber-600 hover:bg-amber-500';
    }
    return 'bg-zinc-700 hover:bg-zinc-600';
  };

  return (
    <header class="flex items-center justify-between gap-4 px-4 py-2 border-b border-zinc-800 bg-zinc-950">
      <div class="flex items-center gap-3">
        <span class={`inline-block w-3 h-3 rounded-full ${youColor()}`} />
        <span class="text-sm text-zinc-300">
          You are <strong>Player {props.state.you}</strong>
        </span>
        <span class="text-xs text-zinc-500 hidden sm:inline">
          phase: {props.state.phase} · turn: P{props.state.turn}
          {props.state.winner !== null && ` · winner: P${props.state.winner}`}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button
          onClick={props.onReset}
          disabled={props.busy}
          class={`px-3 py-1.5 text-sm rounded text-white disabled:opacity-50 ${resetClass()}`}
        >
          {resetLabel()}
        </button>
        <button
          onClick={props.onLogout}
          disabled={props.busy}
          class="px-3 py-1.5 text-sm rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-50"
          title="Forget password and seat on this device"
        >
          Sign out
        </button>
      </div>
    </header>
  );
};

export default MenuBar;
