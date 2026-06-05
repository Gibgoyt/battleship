import {
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
  type Component,
} from 'solid-js';
import BoardCanvas, { type PreviewKind } from './BoardCanvas';
import {
  BOARD_SIZE,
  FLEET,
  type BoatPlacement,
  type PlayerNum,
  validatePlacement,
} from 'src/lib/battleship/types';

interface Props {
  cellSize: number;
  player: PlayerNum;
  busy: boolean;
  errorMsg: string | null;
  onSubmit: (boats: BoatPlacement[]) => void;
}

const PlacementBoard: Component<Props> = (props) => {
  const [slots, setSlots] = createSignal<(BoatPlacement | null)[]>(
    new Array(FLEET.length).fill(null),
  );
  const [selectedSlot, setSelectedSlot] = createSignal<number | null>(0);
  const [rotated, setRotated] = createSignal(false);
  const [hover, setHover] = createSignal<{ x: number; y: number } | null>(null);

  const placed = createMemo<BoatPlacement[]>(() =>
    slots().filter((b): b is BoatPlacement => b !== null),
  );

  const dims = (slotIdx: number) => {
    const spec = FLEET[slotIdx];
    return rotated() ? { w: spec.baseH, h: spec.baseW } : { w: spec.baseW, h: spec.baseH };
  };

  const previewRect = createMemo<{ x: number; y: number; w: number; h: number; kind: PreviewKind } | null>(() => {
    const s = selectedSlot();
    const h = hover();
    if (s === null || h === null) return null;
    const { w, h: ph } = dims(s);
    const x = h.x;
    const y = h.y;
    if (x + w > BOARD_SIZE || y + ph > BOARD_SIZE) {
      return { x: Math.min(x, BOARD_SIZE - w), y: Math.min(y, BOARD_SIZE - ph), w, h: ph, kind: 'invalid' };
    }
    const candidate: BoatPlacement = { type: FLEET[s].type, x, y, width: w, height: ph };
    const test = [...placed(), candidate];
    const err = validatePlacement(test);
    return { x, y, w, h: ph, kind: err ? 'invalid' : 'valid' };
  });

  const tryPlace = (x: number, y: number) => {
    const s = selectedSlot();
    if (s === null) return;
    const { w, h } = dims(s);
    if (x + w > BOARD_SIZE || y + h > BOARD_SIZE) return;
    const candidate: BoatPlacement = { type: FLEET[s].type, x, y, width: w, height: h };
    const test = [...placed(), candidate];
    if (validatePlacement(test)) return;
    const next = slots().slice();
    next[s] = candidate;
    setSlots(next);
    // auto-select next unplaced slot
    const nextIdx = next.findIndex((v) => v === null);
    setSelectedSlot(nextIdx === -1 ? null : nextIdx);
  };

  const removeSlot = (idx: number) => {
    const next = slots().slice();
    next[idx] = null;
    setSlots(next);
    if (selectedSlot() === null) setSelectedSlot(idx);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'r' || e.key === 'R') {
      setRotated((v) => !v);
      e.preventDefault();
    }
  };
  onMount(() => window.addEventListener('keydown', onKey));
  onCleanup(() => window.removeEventListener('keydown', onKey));

  const tint = () =>
    props.player === 1 ? 'rgba(34, 197, 94, 0.10)' : 'rgba(239, 68, 68, 0.10)';
  const shipColor = () =>
    props.player === 1 ? 'rgba(34, 197, 94, 0.85)' : 'rgba(239, 68, 68, 0.85)';

  const allPlaced = createMemo(() => slots().every((s) => s !== null));

  return (
    <div class="flex flex-col lg:flex-row gap-4 p-4">
      <div class="flex-shrink-0">
        <BoardCanvas
          cellSize={props.cellSize}
          tint={tint()}
          shipColor={shipColor()}
          boats={placed()}
          shots={[]}
          preview={previewRect()}
          onCellClick={tryPlace}
          onCellHover={(x, y) => setHover(y === null ? null : { x, y })}
          label="Placement board"
        />
      </div>
      <div class="flex-1 min-w-0 space-y-3">
        <div>
          <h2 class="text-lg font-semibold text-zinc-100 mb-1">
            Place your fleet — Player {props.player}
          </h2>
          <p class="text-sm text-zinc-400">
            Click a boat below, hover the board, press <kbd class="px-1 py-0.5 bg-zinc-800 rounded">R</kbd> to rotate, click to place.
          </p>
        </div>

        <ul class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <For each={FLEET}>{(spec, i) => {
            const isPlaced = () => slots()[i()] !== null;
            const isSelected = () => selectedSlot() === i();
            return (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (isPlaced()) {
                      removeSlot(i());
                    } else {
                      setSelectedSlot(i());
                    }
                  }}
                  class={`w-full px-2 py-1.5 rounded border text-sm flex items-center justify-between gap-2 ${
                    isSelected()
                      ? 'border-blue-500 bg-blue-950/40 text-blue-200'
                      : isPlaced()
                      ? 'border-zinc-700 bg-zinc-900 text-zinc-500 line-through'
                      : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500 text-zinc-200'
                  }`}
                  title={isPlaced() ? 'Click to remove' : 'Click to select'}
                >
                  <span>{spec.type}</span>
                  <span class="text-xs text-zinc-500">
                    {isPlaced() ? 'placed' : isSelected() ? `${rotated() ? spec.baseH : spec.baseW}×${rotated() ? spec.baseW : spec.baseH}` : ''}
                  </span>
                </button>
              </li>
            );
          }}</For>
        </ul>

        <div class="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRotated((v) => !v)}
            class="px-3 py-1.5 text-sm rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
          >
            Rotate (R) — {rotated() ? 'vertical' : 'horizontal'}
          </button>
          <button
            type="button"
            onClick={() => {
              setSlots(new Array(FLEET.length).fill(null));
              setSelectedSlot(0);
            }}
            class="px-3 py-1.5 text-sm rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
          >
            Clear all
          </button>
        </div>

        <Show when={props.errorMsg}>
          <p class="text-sm text-red-400">{props.errorMsg}</p>
        </Show>

        <button
          type="button"
          onClick={() => props.onSubmit(placed())}
          disabled={!allPlaced() || props.busy}
          class="w-full sm:w-auto px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium"
        >
          {props.busy ? 'Submitting…' : allPlaced() ? 'Submit fleet' : `Place ${slots().filter(s => s === null).length} more`}
        </button>
      </div>
    </div>
  );
};

export default PlacementBoard;
