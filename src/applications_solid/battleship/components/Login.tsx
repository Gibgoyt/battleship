import { createSignal, type Component } from 'solid-js';
import { sha256Hex } from '../lib/hash';
import { setPassHash, setSeatToken } from '../lib/storage';
import { api, ApiError } from '../lib/api';
import type { PlayerNum } from 'src/lib/battleship/types';

interface LoginProps {
  onAuthed: (player: PlayerNum) => void;
}

const Login: Component<LoginProps> = (props) => {
  const [pw, setPw] = createSignal('');
  const [busy, setBusy] = createSignal(false);
  const [err, setErr] = createSignal<string | null>(null);

  const submit = async (e: Event) => {
    e.preventDefault();
    if (busy()) return;
    setErr(null);
    setBusy(true);
    try {
      const hash = await sha256Hex(pw());
      setPassHash(hash);
      const res = await api.auth();
      setSeatToken(res.seatToken);
      props.onAuthed(res.player);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Login failed';
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={submit}
        class="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-xl p-6 space-y-4 shadow-xl"
      >
        <h1 class="text-2xl font-semibold text-zinc-100">Battleship</h1>
        <p class="text-sm text-zinc-400">Enter the game password to join.</p>
        <input
          type="password"
          autocomplete="current-password"
          placeholder="Password"
          value={pw()}
          onInput={(e) => setPw(e.currentTarget.value)}
          class="w-full px-3 py-2 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 focus:border-blue-500 focus:outline-none"
          disabled={busy()}
        />
        {err() && <p class="text-sm text-red-400">{err()}</p>}
        <button
          type="submit"
          disabled={busy() || !pw()}
          class="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium"
        >
          {busy() ? 'Joining…' : 'Join'}
        </button>
      </form>
    </div>
  );
};

export default Login;
