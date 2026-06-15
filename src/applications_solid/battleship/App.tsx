import {
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  Show,
  type Component,
} from 'solid-js';
import { api, ApiError } from './lib/api';
import { clearAll, getPassHash, getSeatToken, setSeatToken } from './lib/storage';
import Login from './components/Login';
import MenuBar from './components/MenuBar';
import StatusBanner from './components/StatusBanner';
import PlacementBoard from './components/PlacementBoard';
import PlayBoard from './components/PlayBoard';
import type { BoatPlacement, ClientGameState, PlayerNum } from 'src/lib/battleship/types';

const POLL_ACTIVE_MS = 10000;
const POLL_IDLE_MS = 10000;

function pickCellSize(): number {
  if (typeof window === 'undefined') return 30;
  const w = window.innerWidth;
  if (w >= 1920) return 44;
  if (w >= 1440) return 36;
  if (w >= 1100) return 30;
  if (w >= 768) return 22;
  return 18;
}

const App: Component = () => {
  const [authed, setAuthed] = createSignal(false);
  const [state, setState] = createSignal<ClientGameState | null>(null);
  const [busy, setBusy] = createSignal(false);
  const [placeError, setPlaceError] = createSignal<string | null>(null);
  const [shootError, setShootError] = createSignal<string | null>(null);
  const [cellSize, setCellSize] = createSignal(pickCellSize());

  let pollTimer: number | undefined;

  const stopPoll = () => {
    if (pollTimer !== undefined) {
      clearInterval(pollTimer);
      pollTimer = undefined;
    }
  };

  const fetchState = async () => {
    try {
      const s = await api.state();
      setState(s);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        clearAll();
        setAuthed(false);
        setState(null);
        stopPoll();
      }
    }
  };

  const startPoll = () => {
    stopPoll();
    const intervalMs = () => {
      const s = state();
      if (!s) return POLL_ACTIVE_MS;
      if (s.phase === 'finished' || s.phase === 'waiting') return POLL_IDLE_MS;
      return POLL_ACTIVE_MS;
    };
    let current = intervalMs();
    pollTimer = window.setInterval(async () => {
      await fetchState();
      const next = intervalMs();
      if (next !== current) {
        current = next;
        stopPoll();
        pollTimer = window.setInterval(() => void fetchState(), current);
      }
    }, current);
  };

  onMount(async () => {
    const onResize = () => setCellSize(pickCellSize());
    window.addEventListener('resize', onResize);
    onCleanup(() => window.removeEventListener('resize', onResize));

    if (getPassHash() && getSeatToken()) {
      try {
        const r = await api.auth();
        setSeatToken(r.seatToken);
        setAuthed(true);
        await fetchState();
        startPoll();
      } catch {
        clearAll();
      }
    }
  });

  onCleanup(stopPoll);

  const onAuthed = async (_player: PlayerNum) => {
    setAuthed(true);
    await fetchState();
    startPoll();
  };

  const onLogout = async () => {
    try {
      await api.leave();
    } catch {
      // Best-effort: still log out locally even if the server call fails.
      // The /battleship/reset page can clear a stuck seat later.
    }
    clearAll();
    stopPoll();
    setAuthed(false);
    setState(null);
  };

  const onReset = async () => {
    if (busy()) return;
    setBusy(true);
    try {
      await api.reset();
      await fetchState();
    } catch (e) {
      // surface as a banner via state; reset errors are rare
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const onSubmitFleet = async (boats: BoatPlacement[]) => {
    if (busy()) return;
    setBusy(true);
    setPlaceError(null);
    try {
      await api.setPositions(boats);
      await fetchState();
    } catch (e) {
      setPlaceError(e instanceof ApiError ? e.message : 'Failed to submit fleet');
    } finally {
      setBusy(false);
    }
  };

  const onShoot = async (x: number, y: number) => {
    if (busy()) return;
    setBusy(true);
    setShootError(null);
    try {
      await api.shot(x, y);
      await fetchState();
    } catch (e) {
      setShootError(e instanceof ApiError ? e.message : 'Failed to fire');
    } finally {
      setBusy(false);
    }
  };

  // Player-tinted full-page background
  createEffect(() => {
    const s = state();
    if (typeof document === 'undefined') return;
    if (!s) {
      document.body.style.background = '#0b0f17';
      return;
    }
    document.body.style.background =
      s.you === 1
        ? 'linear-gradient(180deg, rgba(34,197,94,0.06), #0b0f17 80%)'
        : 'linear-gradient(180deg, rgba(239,68,68,0.06), #0b0f17 80%)';
  });

  return (
    <Show
      when={authed()}
      fallback={<Login onAuthed={onAuthed} />}
    >
      <Show
        when={state()}
        fallback={
          <div class="min-h-screen flex items-center justify-center text-zinc-400">
            Loading game…
          </div>
        }
      >
        {(s) => {
          const showPlacement = () => {
            const g = s();
            return g.phase === 'placing' && g.turn === g.you && g.myBoats.length === 0;
          };
          return (
            <div class="min-h-screen flex flex-col">
              <MenuBar
                state={s()}
                busy={busy()}
                onReset={onReset}
                onLogout={onLogout}
              />
              <StatusBanner state={s()} />
              <Show when={showPlacement()}>
                <PlacementBoard
                  cellSize={cellSize()}
                  player={s().you}
                  busy={busy()}
                  errorMsg={placeError()}
                  onSubmit={onSubmitFleet}
                />
              </Show>
              <Show when={!showPlacement() && (s().phase === 'placing' || s().phase === 'waiting')}>
                <div class="p-6 text-zinc-300">
                  <Show when={s().phase === 'waiting'}>
                    <p>Share the password with your friend so they can join.</p>
                  </Show>
                  <Show when={s().phase === 'placing' && s().myBoats.length > 0}>
                    <div class="space-y-3">
                      <p>Your fleet is placed. Waiting for opponent…</p>
                      <PlayBoard
                        cellSize={cellSize()}
                        state={s()}
                        busy={true}
                        errorMsg={null}
                        onShoot={() => { /* noop */ }}
                      />
                    </div>
                  </Show>
                  <Show when={s().phase === 'placing' && s().turn !== s().you && s().myBoats.length === 0}>
                    <p>Player {s().turn} is placing their fleet. Your turn next.</p>
                  </Show>
                </div>
              </Show>
              <Show when={s().phase === 'playing' || s().phase === 'finished'}>
                <PlayBoard
                  cellSize={cellSize()}
                  state={s()}
                  busy={busy()}
                  errorMsg={shootError()}
                  onShoot={onShoot}
                />
              </Show>
            </div>
          );
        }}
      </Show>
    </Show>
  );
};

export default App;
