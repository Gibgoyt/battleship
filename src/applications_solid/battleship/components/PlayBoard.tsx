import { createMemo, Show, type Component } from 'solid-js';
import BoardCanvas from './BoardCanvas';
import { BOARD_SIZE, type ClientGameState, type PlayerNum } from 'src/lib/battleship/types';

interface Props {
  cellSize: number;
  state: ClientGameState;
  busy: boolean;
  errorMsg: string | null;
  onShoot: (x: number, y: number) => void;
}

const tintFor = (p: PlayerNum) =>
  p === 1 ? 'rgba(34, 197, 94, 0.10)' : 'rgba(239, 68, 68, 0.10)';
const shipColorFor = (p: PlayerNum) =>
  p === 1 ? 'rgba(34, 197, 94, 0.85)' : 'rgba(239, 68, 68, 0.85)';

const PlayBoard: Component<Props> = (props) => {
  const me = () => props.state.you;
  const opp = (): PlayerNum => (me() === 1 ? 2 : 1);
  const myTurn = () => props.state.turn === me() && props.state.phase === 'playing';

  const shotSet = createMemo<Set<number>>(() => {
    const s = new Set<number>();
    for (const sh of props.state.myShotsTaken) s.add(sh.y * BOARD_SIZE + sh.x);
    return s;
  });

  const handleShoot = (x: number, y: number) => {
    if (!myTurn() || props.busy) return;
    if (shotSet().has(y * BOARD_SIZE + x)) return;
    props.onShoot(x, y);
  };

  return (
    <div class="p-4 space-y-3">
      <Show when={props.errorMsg}>
        <p class="text-sm text-red-400">{props.errorMsg}</p>
      </Show>
      <div class="flex flex-col xl:flex-row gap-6 items-start">
        <div>
          <h3 class="text-sm font-medium text-zinc-300 mb-2">Your fleet (P{me()})</h3>
          <BoardCanvas
            cellSize={props.cellSize}
            tint={tintFor(me())}
            shipColor={shipColorFor(me())}
            boats={props.state.myBoats}
            shots={props.state.shotsAgainstMe}
            label="Your fleet"
          />
        </div>
        <div>
          <h3 class="text-sm font-medium text-zinc-300 mb-2">
            Enemy waters (P{opp()}){' '}
            <span class="text-xs text-zinc-500">
              {myTurn() ? '— your turn, click to fire' : '— waiting for opponent'}
            </span>
          </h3>
          <BoardCanvas
            cellSize={props.cellSize}
            tint={tintFor(opp())}
            shipColor={shipColorFor(opp())}
            boats={
              props.state.phase === 'finished'
                ? (props.state.opponentBoats ?? [])
                : props.state.opponentSunkBoats
            }
            shots={props.state.myShotsTaken}
            onCellClick={myTurn() ? handleShoot : undefined}
            label="Enemy waters"
          />
        </div>
      </div>
    </div>
  );
};

export default PlayBoard;
