import { createEffect, onMount, type Component } from 'solid-js';
import { BOARD_SIZE, type BoatPlacement, type Shot } from 'src/lib/battleship/types';

export type PreviewKind = 'valid' | 'invalid';

export interface BoardCanvasProps {
  cellSize: number;
  /** Background tint behind everything. */
  tint: string;
  /** Ships to render filled. */
  boats: BoatPlacement[];
  /** Crosses to render on top (red if hit, grey if miss). */
  shots: Shot[];
  /** Optional preview rectangle (for placement hover). */
  preview?: { x: number; y: number; w: number; h: number; kind: PreviewKind } | null;
  /** Color used for ship fill. */
  shipColor?: string;
  /** Called with logical cell coords on click; undefined disables clicks. */
  onCellClick?: (x: number, y: number) => void;
  /** Called with logical cell coords (or null) on hover. */
  onCellHover?: (x: number, y: number | null) => void;
  /** ARIA label. */
  label?: string;
}

const RED = 'rgb(239, 68, 68)';
const GREY = 'rgb(148, 163, 184)';

function drawCross(ctx: CanvasRenderingContext2D, x: number, y: number, sz: number, color: string) {
  const pad = Math.max(1, Math.floor(sz * 0.15));
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, Math.floor(sz * 0.18));
  ctx.beginPath();
  ctx.moveTo(x + pad, y + pad);
  ctx.lineTo(x + sz - pad, y + sz - pad);
  ctx.moveTo(x + sz - pad, y + pad);
  ctx.lineTo(x + pad, y + sz - pad);
  ctx.stroke();
}

const ROW_LABELS = 'ABCDEFGHIJKLMNOPQRST'.split('');

const BoardCanvas: Component<BoardCanvasProps> = (props) => {
  let canvas: HTMLCanvasElement | undefined;

  const draw = () => {
    if (!canvas) return;
    const sz = props.cellSize;
    const lg = Math.max(18, Math.round(sz * 0.7));
    const W = BOARD_SIZE * sz;
    const H = BOARD_SIZE * sz;
    const CW = lg + W;
    const CH = lg + H;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== CW * dpr || canvas.height !== CH * dpr) {
      canvas.width = CW * dpr;
      canvas.height = CH * dpr;
      canvas.style.width = `${CW}px`;
      canvas.style.height = `${CH}px`;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, CW, CH);

    // Labels
    const fontSize = Math.max(9, Math.round(sz * 0.42));
    ctx.font = `${fontSize}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < BOARD_SIZE; i++) {
      ctx.fillText(String(i + 1), lg + i * sz + sz / 2, lg / 2);
      ctx.fillText(ROW_LABELS[i], lg / 2, lg + i * sz + sz / 2);
    }

    ctx.fillStyle = props.tint;
    ctx.fillRect(lg, lg, W, H);

    const shipColor = props.shipColor || 'rgba(100, 116, 139, 0.85)';
    ctx.fillStyle = shipColor;
    for (const b of props.boats) {
      ctx.fillRect(lg + b.x * sz, lg + b.y * sz, b.width * sz, b.height * sz);
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= BOARD_SIZE; i++) {
      const p = Math.floor(i * sz) + 0.5;
      ctx.moveTo(lg + p, lg); ctx.lineTo(lg + p, lg + H);
      ctx.moveTo(lg, lg + p); ctx.lineTo(lg + W, lg + p);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= BOARD_SIZE; i += 10) {
      const p = Math.floor(i * sz) + 0.5;
      ctx.moveTo(lg + p, lg); ctx.lineTo(lg + p, lg + H);
      ctx.moveTo(lg, lg + p); ctx.lineTo(lg + W, lg + p);
    }
    ctx.stroke();

    for (const s of props.shots) {
      drawCross(ctx, lg + s.x * sz, lg + s.y * sz, sz, s.hit ? RED : GREY);
    }

    if (props.preview) {
      const { x, y, w, h, kind } = props.preview;
      ctx.fillStyle =
        kind === 'valid' ? 'rgba(34, 197, 94, 0.55)' : 'rgba(239, 68, 68, 0.55)';
      ctx.fillRect(lg + x * sz, lg + y * sz, w * sz, h * sz);
    }
  };

  onMount(() => {
    draw();
  });

  createEffect(() => {
    // Track reactive props
    void props.cellSize;
    void props.tint;
    void props.boats;
    void props.shots;
    void props.preview;
    void props.shipColor;
    draw();
  });

  const handlePos = (e: MouseEvent): { x: number; y: number } | null => {
    if (!canvas) return null;
    const sz = props.cellSize;
    const lg = Math.max(18, Math.round(sz * 0.7));
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left - lg;
    const py = e.clientY - rect.top - lg;
    const x = Math.floor(px / sz);
    const y = Math.floor(py / sz);
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return null;
    return { x, y };
  };

  return (
    <canvas
      ref={canvas}
      aria-label={props.label}
      class="block border border-zinc-700 rounded"
      style={{ cursor: props.onCellClick ? 'crosshair' : 'default' }}
      onClick={(e) => {
        if (!props.onCellClick) return;
        const p = handlePos(e);
        if (p) props.onCellClick(p.x, p.y);
      }}
      onMouseMove={(e) => {
        if (!props.onCellHover) return;
        const p = handlePos(e);
        props.onCellHover(p?.x ?? 0, p ? p.y : null);
      }}
      onMouseLeave={() => {
        if (props.onCellHover) props.onCellHover(0, null);
      }}
    />
  );
};

export default BoardCanvas;
