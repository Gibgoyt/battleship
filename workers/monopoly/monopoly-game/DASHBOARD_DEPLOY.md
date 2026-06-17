# Dashboard deploy — monopoly-game worker (no CLI required)

This is the click-through path for deploying via
<https://dash.cloudflare.com/48f95850ec5aeb74dbb20ed143beaa29/workers-and-pages/create>.

If you'd rather use `wrangler` from the CLI, follow `README.md` instead.

---

## What you'll upload

A single self-contained JavaScript file:

```
workers/monopoly/monopoly-game/src/worker.bundle.js
```

Everything (board catalog, game logic, DO class, fetch handler, password
gate) is in that one file so it pastes cleanly into the dashboard's inline
worker editor. Regenerate it any time you edit the sources:

```sh
cd workers/monopoly/monopoly-game
./build.sh
```

`build.sh` is a thin wrapper around `bundle.mjs` (zero npm deps; just needs
`node`). Output goes to `src/worker.bundle.js`. Don't hand-edit the bundle
— edit `src/{board,game,schema,durable,index}.js` and rerun `./build.sh`.

---

## Step 1 — Create the worker

1. Open the dashboard link above.
2. Click **Create application → Create Worker**.
3. Name it `monopoly-game` (this becomes the public hostname:
   `https://monopoly-game.<your-subdomain>.workers.dev`).
4. Click **Deploy** to create the starter "Hello world" worker.
5. Once it's deployed, click **Edit Code** to open the inline editor.
6. **Replace the entire `worker.js` contents** with the contents of
   `workers/monopoly/monopoly-game/src/worker.bundle.js`.
7. Click **Save and Deploy** at the top right.

At this point the worker is live but has no bindings yet, so every request
will fail. Add the bindings next.

---

## Step 2 — Add the Durable Object binding

1. From the worker's page, go to **Settings → Bindings → Add binding**.
2. Choose **Durable Object**.
3. Fill in exactly:
   - **Variable name**: `MONOPOLY_GAME`
   - **Durable Object class name**: `MonopolyGameDO`
   - **Worker**: `monopoly-game` (this same worker)
4. Click **Save**.

When you save, Cloudflare will prompt you that the class is brand new and
needs a migration. Accept the prompt — it will register a
`new_sqlite_classes: ["MonopolyGameDO"]` migration for you automatically.
This gives the DO its private SQLite database.

> If the dashboard ever asks "SQLite or KV storage?" choose **SQLite**.
> The whole DO is built around `ctx.storage.sql.exec(...)`.

---

## Step 3 — Add the D1 binding (shared database)

1. **Settings → Bindings → Add binding → D1 database**.
2. Fill in:
   - **Variable name**: `MONOPOLY_DB`
   - **D1 database**: select **`internal-ops-admin-db`**
     (same database as battleship, id `7578e789-07c9-4f9e-8cc4-8a3044847b22`)
3. Click **Save**.

D1 has no schemas (it's SQLite), so all monopoly tables live alongside the
battleship ones — they're prefixed `monopoly_` to keep things tidy.

---

## Step 4 — Run the D1 migration (one-time)

The DO has its own private SQLite (auto-created), but we also write
finished-game results to the shared D1. Create those two tables once:

1. In the dashboard, go to **D1 → internal-ops-admin-db → Console**.
2. Paste the contents of
   `workers/monopoly/monopoly-game/migrations/0001_init.sql`
   into the SQL console and run it.

That creates `monopoly_games` and `monopoly_game_players`. You'll see them
appear in the table list afterwards.

If you'd rather use the CLI:

```sh
npx wrangler d1 execute internal-ops-admin-db --remote \
  --file=workers/monopoly/monopoly-game/migrations/0001_init.sql
```

---

## Step 5 — (Optional but recommended) Tighten CORS

The bundled worker reads a comma-separated `ALLOWED_ORIGINS` environment
variable. To set it:

1. **Settings → Variables and Secrets → Add variable**.
2. **Variable name**: `ALLOWED_ORIGINS`
3. **Value**: your production Pages origin, comma-separated. e.g.
   `https://your-site.pages.dev,http://localhost:2084`
4. Choose **Plaintext** (not Secret) so the worker can read it.
5. Click **Save and Deploy**.

If you skip this, the worker uses `*` which is fine for testing but lets
any site's JavaScript talk to your reset/state endpoints from a logged-in
browser (the password gate still protects mutations).

---

## Step 6 — Give me back the URL

Once deployed, copy the worker's public URL — it'll look like:

```
https://monopoly-game.broskikiller.workers.dev
```

…and paste just the hostname into `src/lib/monopoly/config.ts`:

```ts
export const MONOPOLY_WORKER_HOST = 'monopoly-game.broskikiller.workers.dev';
```

Then rebuild + redeploy the Pages app:

```sh
./build.sh ./src/applications_leptos/monopoly/
npm run build && wrangler pages deploy dist
```

Until you do this, the login screen on `/monopoly` will show a banner
saying the worker URL is not configured.

---

## Sanity check

After all six steps, run this in a terminal to confirm the worker is alive
and the password gate works:

```sh
# Replace HOST with your actual worker URL.
HOST="monopoly-game.broskikiller.workers.dev"
PASS_HASH=$(printf 'Broskikiller1!' | sha256sum | awk '{print $1}')

# 401 expected (no password)
curl -s -o /dev/null -w "%{http_code}\n" "https://$HOST/state"

# 200 expected (with password) — should return a small JSON snapshot.
curl -s -H "X-BS-Pass: $PASS_HASH" "https://$HOST/state" | head -c 200
```

If both checks pass you're done — open `/monopoly` in a browser and the
lobby should appear.

---

## TL;DR — what you need to upload / configure

| Step | Where in dashboard                                       | What                                                                                  |
| ---- | -------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Code | Workers → Create → "monopoly-game" → Edit Code           | Paste `workers/monopoly/monopoly-game/src/worker.bundle.js`                           |
| DO   | This worker → Settings → Bindings → Durable Object       | name `MONOPOLY_GAME`, class `MonopolyGameDO` (accept SQLite migration prompt)         |
| D1   | This worker → Settings → Bindings → D1 database          | name `MONOPOLY_DB`, database `internal-ops-admin-db`                                  |
| SQL  | D1 → internal-ops-admin-db → Console                     | Run `workers/monopoly/monopoly-game/migrations/0001_init.sql`                         |
| Env  | This worker → Settings → Variables and Secrets           | (optional) `ALLOWED_ORIGINS` = your Pages origin                                      |
| URL  | (your terminal)                                          | Paste deployed host into `src/lib/monopoly/config.ts` → rebuild WASM → redeploy Pages |
