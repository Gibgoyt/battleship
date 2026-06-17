// === AUTO-GENERATED single-file bundle of the monopoly-game worker. ===
// Regenerate with: ./build.sh   (from workers/monopoly/monopoly-game/)
// Sources: src/board.js, src/game.js, src/schema.js, src/durable.js, src/index.js
// Paste this file into the Cloudflare dashboard worker editor.

import { DurableObject } from 'cloudflare:workers';

// ==================== src/board.js ====================
// Authoritative tile catalog for the 72-tile hexagonal Monopoly board.
//
// Layout: 6 sides x 12 tiles = 72. Tile 0 of each side is its corner.
// Side index k (0..5) -> tile indices [k*12 .. k*12+11].
//
// Tile shape:
//   { kind: 'corner'    , name, payload }
//   { kind: 'commodity' , name, price, baseRent }       (commodity-group, scales x2 per extra owned)
//   { kind: 'property'  , name, country, price, baseRent }
//   { kind: 'chance' | 'chest' }                         (no-op tile in v1)
//
// This file is mirrored byte-for-byte in semantics by
// src/applications_leptos/monopoly/src/tiles.rs on the client. Keep them in
// sync when adjusting prices / rents / names.

const N_TILES = 72;
const N_SIDES = 6;
const TILES_PER_SIDE = 12;

// Corner tiles (one per side, at side-start index 0/12/24/36/48/60).
const CORNERS = [
  { kind: 'corner', name: 'GO',           sub: 'collect $200'   },
  { kind: 'corner', name: 'Jail',         sub: 'Just Visiting'  },
  { kind: 'corner', name: 'Free Parking', sub: '—'              },
  { kind: 'corner', name: 'Go To Jail',   sub: 'move directly'  },
  { kind: 'corner', name: 'Income Tax',   sub: 'pay $200'       },
  { kind: 'corner', name: 'Luxury Tax',   sub: 'pay $75'        },
];

// The 6 commodity tiles, one per side at side-local index 6 (the midpoint).
const COMMODITIES = [
  { kind: 'commodity', name: 'Suez Canal Toll',         price: 200, baseRent: 25 },
  { kind: 'commodity', name: 'Venezuelan Oil Reserve',  price: 200, baseRent: 25 },
  { kind: 'commodity', name: 'ASML EUV Patent',         price: 200, baseRent: 25 },
  { kind: 'commodity', name: 'Spice Route',             price: 200, baseRent: 25 },
  { kind: 'commodity', name: 'Lithium Triangle',        price: 200, baseRent: 25 },
  { kind: 'commodity', name: 'TSMC Foundry Node',       price: 200, baseRent: 25 },
];

// 6 countries x 5 cities = 30 properties. Each side gets one country's cities
// interleaved with Chance/Community-Chest tiles around the corner+commodity.
// Color is mostly decorative; ownership of all 5 in a country doubles rent.
const COUNTRIES = [
  { country: 'South Africa', color: '#8B5CF6', cities: ['Joburg',       'Cape Town', 'Durban',       'Pretoria', 'Port Elizabeth'] },
  { country: 'Japan',        color: '#EC4899', cities: ['Tokyo',        'Osaka',     'Kyoto',        'Nagoya',   'Fukuoka']        },
  { country: 'Brazil',       color: '#10B981', cities: ['São Paulo',    'Rio',       'Brasília',     'Salvador', 'Belo Horizonte'] },
  { country: 'Germany',      color: '#F59E0B', cities: ['Berlin',       'Hamburg',   'Munich',       'Frankfurt','Cologne']        },
  { country: 'India',        color: '#EF4444', cities: ['Mumbai',       'Delhi',     'Bengaluru',    'Chennai',  'Hyderabad']      },
  { country: 'Egypt',        color: '#06B6D4', cities: ['Cairo',        'Alexandria','Giza',         'Luxor',    'Aswan']          },
];

// Per-city price ladder (low -> high within a country). Multiplied by a
// country-tier later so each side gets steeper rents than the last.
const CITY_PRICE_LADDER = [60, 80, 100, 120, 160];
// Per-country tier multiplier. South Africa cheapest, Egypt priciest.
const COUNTRY_TIER       = [ 1, 1.5,    2,    2.5,    3,    3.5 ];

function propertyForSlot(sideIdx, slotIdx) {
  // slotIdx is 0..4 within a country's 5 cities.
  const c = COUNTRIES[sideIdx];
  const tier = COUNTRY_TIER[sideIdx];
  const ladder = CITY_PRICE_LADDER[slotIdx];
  const price = Math.round(ladder * tier);
  // Base rent = 10% of price (rounded), doubled when monopoly owned.
  const baseRent = Math.max(2, Math.round(price * 0.10));
  return {
    kind: 'property',
    name: c.cities[slotIdx],
    country: c.country,
    color: c.color,
    price,
    baseRent,
  };
}

// Lay out one side: 12 tiles, slot 0 = corner, slot 6 = commodity, the
// remaining 10 slots interleave 5 properties with 5 card tiles. Pattern
// chosen to spread properties evenly and avoid two card tiles back-to-back.
//
// Slot:   0    1    2    3    4    5    6    7    8    9    10   11
// Kind: corner P    C    P    H    P    comm P    H    P    C    H
//   where P = property, C = Chance, H = Community-Chest (chest).
// Property indices within country: 0,1,2,3,4 in order they appear.
function buildSide(sideIdx) {
  const tiles = new Array(TILES_PER_SIDE);
  tiles[0] = CORNERS[sideIdx];
  tiles[6] = COMMODITIES[sideIdx];

  // Slots receiving properties (in order) and card tiles (Chance/Chest).
  const propSlots = [1, 3, 5, 7, 9];
  const cardSlots = [
    { slot: 2,  kind: 'chance' },
    { slot: 4,  kind: 'chest'  },
    { slot: 8,  kind: 'chest'  },
    { slot: 10, kind: 'chance' },
    { slot: 11, kind: 'chest'  },
  ];

  propSlots.forEach((slot, i) => {
    tiles[slot] = propertyForSlot(sideIdx, i);
  });
  cardSlots.forEach(({ slot, kind }) => {
    tiles[slot] = { kind };
  });
  return tiles;
}

// Final 72-tile board, indexed 0..71.
const BOARD = (() => {
  const out = [];
  for (let s = 0; s < N_SIDES; s++) {
    for (const t of buildSide(s)) out.push(t);
  }
  return out;
})();

// Helpers -----------------------------------------------------------------

function tileAt(i) { return BOARD[((i % N_TILES) + N_TILES) % N_TILES]; }
function isOwnable(t) { return t.kind === 'property' || t.kind === 'commodity'; }

// All commodity tile indices (used to compute scaled commodity rent).
const COMMODITY_INDICES = BOARD
  .map((t, i) => (t.kind === 'commodity' ? i : -1))
  .filter((i) => i >= 0);

// Map property tile index -> country name (for monopoly-bonus check).
const PROPERTY_COUNTRY = (() => {
  const m = new Map();
  BOARD.forEach((t, i) => {
    if (t.kind === 'property') m.set(i, t.country);
  });
  return m;
})();

// All tile indices belonging to a given country.
const COUNTRY_INDICES = (() => {
  const m = new Map();
  for (const c of COUNTRIES) m.set(c.country, []);
  BOARD.forEach((t, i) => {
    if (t.kind === 'property') m.get(t.country).push(i);
  });
  return m;
})();

// Corner tile indices by name (for fast lookup in rules).
const CORNER_GO          = 0;
const CORNER_JAIL        = TILES_PER_SIDE * 1;
const CORNER_PARK        = TILES_PER_SIDE * 2;
const CORNER_GO_TO_JAIL  = TILES_PER_SIDE * 3;
const CORNER_INCOME_TAX  = TILES_PER_SIDE * 4;
const CORNER_LUXURY_TAX  = TILES_PER_SIDE * 5;

// ==================== src/game.js ====================
// Pure game-logic helpers — no DO/storage/network calls in here. The DO
// applies these to its in-memory state and persists the result.

const STARTING_CASH    = 1500;
const GO_REWARD        = 200;
const INCOME_TAX       = 200;
const LUXURY_TAX       = 75;
const JAIL_FINE        = 50;
const MAX_JAIL_TURNS   = 3;
const MAX_DOUBLES_RUN  = 3;
const PLAYER_COLORS    = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

function rollDie() { return 1 + Math.floor(Math.random() * 6); }
function roll2d6()  { return [rollDie(), rollDie()]; }

// Apply a move from `from` of `steps` forward; returns { to, passedGo }.
function move(from, steps) {
  const to = ((from + steps) % N_TILES + N_TILES) % N_TILES;
  const passedGo = steps > 0 && to < from; // wrapped past index 0
  return { to, passedGo };
}

// Count how many commodity tiles a given seat currently owns.
function commoditiesOwnedBy(ownership, seat) {
  let n = 0;
  for (const i of COMMODITY_INDICES) if (ownership[i] === seat) n++;
  return n;
}

// True iff `seat` owns every property in the country `tile` belongs to.
function ownsCountryFor(ownership, seat, tileIndex) {
  const country = PROPERTY_COUNTRY.get(tileIndex);
  if (!country) return false;
  for (const i of COUNTRY_INDICES.get(country)) {
    if (ownership[i] !== seat) return false;
  }
  return true;
}

// Compute the rent the player landing on `tileIndex` must pay (0 if none).
// Caller passes ownership map + seat-of-owner (already resolved).
function rentDue(ownership, tileIndex) {
  const t = tileAt(tileIndex);
  const owner = ownership[tileIndex];
  if (owner === undefined || owner === null) return { amount: 0, owner: null };
  if (t.kind === 'commodity') {
    const n = commoditiesOwnedBy(ownership, owner);
    // Classic railroad ladder: $25, $50, $100, $200, $400, $800.
    const amount = t.baseRent * Math.pow(2, Math.max(0, n - 1));
    return { amount, owner };
  }
  if (t.kind === 'property') {
    const monopoly = ownsCountryFor(ownership, owner, tileIndex);
    return { amount: monopoly ? t.baseRent * 2 : t.baseRent, owner };
  }
  return { amount: 0, owner: null };
}

// Net worth = cash + sum of prices of owned tiles. Used for end-of-game
// scoreboard and bankruptcy comparisons.
function netWorth(player, ownership) {
  let n = player.money;
  for (let i = 0; i < N_TILES; i++) {
    if (ownership[i] === player.seat) n += BOARD[i].price || 0;
  }
  return n;
}

// Marks a player bankrupt and releases all their properties back to the bank.
function bankrupt(player, ownership) {
  player.bankrupt = true;
  player.money = 0;
  for (let i = 0; i < N_TILES; i++) {
    if (ownership[i] === player.seat) delete ownership[i];
  }
}

// Returns the seat of the next non-bankrupt player after `currentSeat`,
// or null if zero/one non-bankrupt remain (in which case caller declares end).
function nextSeat(players, currentSeat) {
  const alive = players.filter((p) => !p.bankrupt);
  if (alive.length <= 1) return null;
  const order = [...players].sort((a, b) => a.seat - b.seat);
  const idx = order.findIndex((p) => p.seat === currentSeat);
  for (let step = 1; step <= order.length; step++) {
    const candidate = order[(idx + step) % order.length];
    if (!candidate.bankrupt) return candidate.seat;
  }
  return null;
}

// Corner-tile side effects. Returns one of:
//   { kind: 'none' }
//   { kind: 'tax',     amount }   // collect from player to bank
//   { kind: 'go-to-jail' }
function cornerEffect(tileIndex) {
  switch (tileIndex) {
    case CORNER_GO_TO_JAIL: return { kind: 'go-to-jail' };
    case CORNER_INCOME_TAX: return { kind: 'tax', amount: INCOME_TAX };
    case CORNER_LUXURY_TAX: return { kind: 'tax', amount: LUXURY_TAX };
    case CORNER_GO:
    case CORNER_JAIL:       // Just Visiting — no effect
    default:                return { kind: 'none' };
  }
}

// ==================== src/schema.js ====================
// SQLite schema for the MonopolyGameDO's private storage. Idempotent.

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY,
    value TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS players (
    seat         INTEGER PRIMARY KEY,
    color        TEXT    NOT NULL,
    display_name TEXT    NOT NULL,
    seat_token   TEXT    NOT NULL,
    ready        INTEGER NOT NULL DEFAULT 0,
    money        INTEGER NOT NULL,
    position     INTEGER NOT NULL DEFAULT 0,
    in_jail      INTEGER NOT NULL DEFAULT 0,
    jail_turns   INTEGER NOT NULL DEFAULT 0,
    bankrupt     INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS ownership (
    tile_index INTEGER PRIMARY KEY,
    owner_seat INTEGER NOT NULL REFERENCES players(seat) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ts          INTEGER NOT NULL,
    kind        TEXT    NOT NULL,
    payload_json TEXT
  )`,
];

function initSchema(sql) {
  for (const stmt of SCHEMA) sql.exec(stmt);
}

function resetSchema(sql) {
  sql.exec('DROP TABLE IF EXISTS ownership');
  sql.exec('DROP TABLE IF EXISTS events');
  sql.exec('DROP TABLE IF EXISTS players');
  sql.exec('DROP TABLE IF EXISTS meta');
  initSchema(sql);
}

// ==================== src/durable.js ====================



const PHASE_LOBBY     = 'lobby';
const PHASE_PLAYING   = 'playing';
const PHASE_FINISHED  = 'finished';

const MAX_PLAYERS = 6;
const MIN_PLAYERS = 2;
const EVENT_LOG_CAP = 50;

// Helper: how many sockets are open for a given seat.
function countSocketsForSeat(state, seat) {
  let n = 0;
  for (const ws of state.getWebSockets()) {
    const attached = ws.deserializeAttachment();
    if (attached && attached.seat === seat) n++;
  }
  return n;
}

class MonopolyGameDO extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.env = env;
    this.sql = ctx.storage.sql;
    initSchema(this.sql);
    this._loaded = false;
    this._game = null;
  }

  // ---- persistence ------------------------------------------------------

  _loadFromSql() {
    const game = {
      phase: PHASE_LOBBY,
      players: [],
      ownership: {},        // tileIndex -> seat
      turn: { currentSeat: 0, dice: null, doublesCount: 0, awaiting: 'roll' },
      winner: null,
      log: [],
      startedAt: 0,
      totalTurns: 0,
    };

    const metaRows = this.sql.exec('SELECT key, value FROM meta').toArray();
    const meta = Object.fromEntries(metaRows.map((r) => [r.key, r.value]));
    if (meta.phase) game.phase = meta.phase;
    if (meta.currentSeat)  game.turn.currentSeat  = Number(meta.currentSeat);
    if (meta.doublesCount) game.turn.doublesCount = Number(meta.doublesCount);
    if (meta.awaiting)     game.turn.awaiting     = meta.awaiting;
    if (meta.winner)       game.winner            = Number(meta.winner);
    if (meta.startedAt)    game.startedAt         = Number(meta.startedAt);
    if (meta.totalTurns)   game.totalTurns        = Number(meta.totalTurns);
    if (meta.diceJson) {
      try { game.turn.dice = JSON.parse(meta.diceJson); } catch { /* ignore */ }
    }

    const players = this.sql.exec('SELECT * FROM players ORDER BY seat').toArray();
    for (const p of players) {
      game.players.push({
        seat:         p.seat,
        color:        p.color,
        displayName:  p.display_name,
        seatToken:    p.seat_token,
        ready:        p.ready === 1,
        money:        p.money,
        position:     p.position,
        inJail:       p.in_jail === 1,
        jailTurns:    p.jail_turns,
        bankrupt:     p.bankrupt === 1,
      });
    }

    const owns = this.sql.exec('SELECT tile_index, owner_seat FROM ownership').toArray();
    for (const r of owns) game.ownership[r.tile_index] = r.owner_seat;

    const events = this.sql.exec('SELECT ts, kind, payload_json FROM events ORDER BY id DESC LIMIT ?').bind(EVENT_LOG_CAP).toArray();
    game.log = events.reverse().map((e) => ({
      ts: e.ts,
      kind: e.kind,
      payload: e.payload_json ? JSON.parse(e.payload_json) : null,
    }));

    return game;
  }

  _ensureLoaded() {
    if (this._loaded) return;
    this._game = this._loadFromSql();
    this._loaded = true;
  }

  _persistMeta() {
    const g = this._game;
    const rows = [
      ['phase',         g.phase],
      ['currentSeat',   String(g.turn.currentSeat)],
      ['doublesCount',  String(g.turn.doublesCount)],
      ['awaiting',      g.turn.awaiting],
      ['winner',        g.winner === null ? '' : String(g.winner)],
      ['startedAt',     String(g.startedAt)],
      ['totalTurns',    String(g.totalTurns)],
      ['diceJson',      g.turn.dice ? JSON.stringify(g.turn.dice) : ''],
    ];
    for (const [k, v] of rows) {
      this.sql.exec('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', k, v);
    }
  }

  _persistPlayer(p) {
    this.sql.exec(
      `INSERT INTO players (seat, color, display_name, seat_token, ready, money, position, in_jail, jail_turns, bankrupt)
        VALUES (?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(seat) DO UPDATE SET
          color=excluded.color,
          display_name=excluded.display_name,
          seat_token=excluded.seat_token,
          ready=excluded.ready,
          money=excluded.money,
          position=excluded.position,
          in_jail=excluded.in_jail,
          jail_turns=excluded.jail_turns,
          bankrupt=excluded.bankrupt`,
      p.seat, p.color, p.displayName, p.seatToken,
      p.ready ? 1 : 0, p.money, p.position,
      p.inJail ? 1 : 0, p.jailTurns,
      p.bankrupt ? 1 : 0,
    );
  }

  _persistOwnership() {
    this.sql.exec('DELETE FROM ownership');
    for (const [tile, seat] of Object.entries(this._game.ownership)) {
      this.sql.exec('INSERT INTO ownership (tile_index, owner_seat) VALUES (?, ?)', Number(tile), seat);
    }
  }

  _appendEvent(kind, payload) {
    const ev = { ts: Date.now(), kind, payload: payload || null };
    this._game.log.push(ev);
    if (this._game.log.length > EVENT_LOG_CAP) this._game.log = this._game.log.slice(-EVENT_LOG_CAP);
    this.sql.exec(
      'INSERT INTO events (ts, kind, payload_json) VALUES (?, ?, ?)',
      ev.ts, kind, payload ? JSON.stringify(payload) : null,
    );
  }

  // ---- snapshots & broadcast --------------------------------------------

  _snapshot() {
    const g = this._game;
    return {
      phase: g.phase,
      players: g.players.map((p) => ({
        seat:        p.seat,
        color:       p.color,
        displayName: p.displayName,
        ready:       p.ready,
        connected:   countSocketsForSeat(this.ctx, p.seat) > 0,
        money:       p.money,
        position:    p.position,
        inJail:      p.inJail,
        jailTurns:   p.jailTurns,
        bankrupt:    p.bankrupt,
      })),
      ownership: g.ownership,
      turn:      g.turn,
      winner:    g.winner,
      log:       g.log,
    };
  }

  _broadcast(msg) {
    const json = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets()) {
      try { ws.send(json); } catch { /* hibernated/closed sockets are harmless */ }
    }
  }

  _broadcastState() { this._broadcast({ t: 'state', state: this._snapshot() }); }

  // ---- HTTP entrypoints (WebSocket upgrade + REST) -----------------------

  async fetch(request) {
    this._ensureLoaded();
    const url = new URL(request.url);

    if (url.pathname === '/ws') {
      const upgrade = request.headers.get('Upgrade');
      if (upgrade !== 'websocket') return new Response('expected websocket', { status: 426 });
      const pair = new WebSocketPair();
      const [client, server] = [pair[0], pair[1]];
      this.ctx.acceptWebSocket(server);
      // initially unattached to any seat — the client sends `hello` to bind
      server.serializeAttachment({ seat: null });
      return new Response(null, { status: 101, webSocket: client });
    }

    if (url.pathname === '/force-reset' && request.method === 'POST') {
      await this._reset();
      this._broadcast({ t: 'kicked', reason: 'reset' });
      // Close all sockets after the kick so the WASM hard-reloads to lobby.
      for (const ws of this.ctx.getWebSockets()) {
        try { ws.close(1000, 'reset'); } catch { /* noop */ }
      }
      return new Response(JSON.stringify({ status: 'reset' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/state') {
      return new Response(JSON.stringify(this._snapshot()), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('not found', { status: 404 });
  }

  // ---- WebSocket message handler ----------------------------------------

  async webSocketMessage(ws, raw) {
    this._ensureLoaded();
    let msg;
    try { msg = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw)); }
    catch { return ws.send(JSON.stringify({ t: 'error', message: 'malformed json' })); }

    const attached = ws.deserializeAttachment() || { seat: null };
    const me = attached.seat !== null ? this._game.players.find((p) => p.seat === attached.seat) : null;

    try {
      switch (msg.t) {
        case 'hello':       return this._handleHello(ws, msg);
        case 'join':        return this._handleJoin(ws, msg);
        case 'leave':       return this._handleLeave(ws, me);
        case 'ready':       return this._handleReady(ws, me, !!msg.value);
        case 'roll':        return this._handleRoll(ws, me);
        case 'buy':         return this._handleBuy(ws, me);
        case 'skip':        return this._handleSkip(ws, me);
        case 'endTurn':     return this._handleEndTurn(ws, me);
        default:            return ws.send(JSON.stringify({ t: 'error', message: 'unknown message type' }));
      }
    } catch (e) {
      ws.send(JSON.stringify({ t: 'error', message: String(e && e.message || e) }));
    }
  }

  async webSocketClose(ws /* , code, reason, wasClean */) {
    // Recompute connected status by rebroadcasting state. Player record stays
    // in SQLite so they can rejoin via seatToken if they refresh.
    try { this._broadcastState(); } catch { /* ignore */ }
  }

  // ---- handlers ----------------------------------------------------------

  _handleHello(ws, msg) {
    // Rebind socket to an existing seat by seatToken if supplied.
    if (msg.seatToken) {
      const p = this._game.players.find((q) => q.seatToken === msg.seatToken);
      if (p) {
        ws.serializeAttachment({ seat: p.seat });
        ws.send(JSON.stringify({ t: 'welcome', seat: p.seat, seatToken: p.seatToken }));
        this._broadcastState();
        return;
      }
    }
    // No (or unknown) token: client just gets the current snapshot.
    ws.send(JSON.stringify({ t: 'welcome', seat: null, seatToken: null }));
    ws.send(JSON.stringify({ t: 'state', state: this._snapshot() }));
  }

  _handleJoin(ws, msg) {
    if (this._game.phase !== PHASE_LOBBY) {
      return ws.send(JSON.stringify({ t: 'error', message: 'Game already in progress — wait for reset' }));
    }
    if (this._game.players.length >= MAX_PLAYERS) {
      return ws.send(JSON.stringify({ t: 'error', message: 'Lobby full (6 players)' }));
    }
    const displayName = String(msg.displayName || '').slice(0, 24).trim() || 'Player';
    const usedSeats = new Set(this._game.players.map((p) => p.seat));
    let seat = 0;
    while (usedSeats.has(seat)) seat++;
    const color = PLAYER_COLORS[seat] || 'gray';
    const seatToken = crypto.randomUUID();
    const player = {
      seat, color, displayName, seatToken,
      ready: false, money: STARTING_CASH,
      position: 0, inJail: false, jailTurns: 0, bankrupt: false,
    };
    this._game.players.push(player);
    this._persistPlayer(player);
    this._appendEvent('joined', { seat, color, displayName });
    ws.serializeAttachment({ seat });
    ws.send(JSON.stringify({ t: 'welcome', seat, seatToken }));
    this._broadcastState();
  }

  _handleLeave(ws, me) {
    if (!me) return;
    if (this._game.phase !== PHASE_LOBBY) {
      return ws.send(JSON.stringify({ t: 'error', message: 'Cannot leave mid-game — use /monopoly/reset' }));
    }
    this._game.players = this._game.players.filter((p) => p.seat !== me.seat);
    this.sql.exec('DELETE FROM players WHERE seat = ?', me.seat);
    this._appendEvent('left', { seat: me.seat });
    ws.serializeAttachment({ seat: null });
    try { ws.close(1000, 'left'); } catch { /* noop */ }
    this._broadcastState();
  }

  _handleReady(ws, me, value) {
    if (!me) return ws.send(JSON.stringify({ t: 'error', message: 'Not seated' }));
    if (this._game.phase !== PHASE_LOBBY) return;
    me.ready = value;
    this._persistPlayer(me);
    this._appendEvent('ready', { seat: me.seat, value });

    const allReady = this._game.players.length >= MIN_PLAYERS
      && this._game.players.every((p) => p.ready);
    if (allReady) this._startGame();
    else this._broadcastState();
  }

  _startGame() {
    const g = this._game;
    g.phase = PHASE_PLAYING;
    g.startedAt = Date.now();
    g.totalTurns = 0;
    // Seat 0 plays first (lowest seat number). All players keep their stats.
    const lowest = g.players.reduce((m, p) => (p.seat < m ? p.seat : m), g.players[0].seat);
    g.turn = { currentSeat: lowest, dice: null, doublesCount: 0, awaiting: 'roll' };
    g.winner = null;
    this._persistMeta();
    this._appendEvent('start', { seats: g.players.map((p) => p.seat) });
    this._broadcastState();
  }

  _handleRoll(ws, me) {
    const g = this._game;
    if (g.phase !== PHASE_PLAYING) return;
    if (g.turn.currentSeat !== me?.seat) return ws.send(JSON.stringify({ t: 'error', message: "Not your turn" }));
    if (g.turn.awaiting !== 'roll') return ws.send(JSON.stringify({ t: 'error', message: 'Already rolled — resolve current action' }));

    const dice = roll2d6();
    const isDouble = dice[0] === dice[1];
    const sum = dice[0] + dice[1];

    if (me.inJail) {
      if (isDouble) {
        // Break out, move that many; doubles do NOT grant another roll out of jail.
        me.inJail = false;
        me.jailTurns = 0;
        g.turn.doublesCount = 0;
        this._applyMove(me, sum, dice);
      } else {
        me.jailTurns += 1;
        this._appendEvent('jail-roll', { seat: me.seat, dice });
        if (me.jailTurns >= MAX_JAIL_TURNS) {
          if (me.money < JAIL_FINE) {
            this._appendEvent('jail-bankrupt', { seat: me.seat });
            bankrupt(me, g.ownership);
            this._persistPlayer(me);
            this._persistOwnership();
            this._afterTurn(me);
            return;
          }
          me.money -= JAIL_FINE;
          me.inJail = false;
          me.jailTurns = 0;
          this._appendEvent('jail-paid', { seat: me.seat, fine: JAIL_FINE });
          this._applyMove(me, sum, dice);
        } else {
          g.turn.dice = dice;
          g.turn.awaiting = 'endTurn';
          this._persistPlayer(me);
          this._persistMeta();
          this._broadcastState();
        }
      }
      return;
    }

    if (isDouble) {
      g.turn.doublesCount += 1;
      if (g.turn.doublesCount >= MAX_DOUBLES_RUN) {
        // Three doubles: do not move; go straight to jail.
        this._appendEvent('three-doubles', { seat: me.seat });
        this._sendToJail(me);
        this._afterTurn(me);
        return;
      }
    } else {
      g.turn.doublesCount = 0;
    }
    this._applyMove(me, sum, dice);
  }

  _applyMove(me, steps, dice) {
    const g = this._game;
    const { to, passedGo } = move(me.position, steps);
    me.position = to;
    g.turn.dice = dice;
    this._appendEvent('rolled', { seat: me.seat, dice, to });
    if (passedGo) {
      me.money += GO_REWARD;
      this._appendEvent('pass-go', { seat: me.seat, reward: GO_REWARD });
    }
    this._resolveLanding(me, to);
  }

  _resolveLanding(me, tileIndex) {
    const g = this._game;
    const t = tileAt(tileIndex);

    if (t.kind === 'corner') {
      const eff = cornerEffect(tileIndex);
      if (eff.kind === 'go-to-jail') {
        this._sendToJail(me);
        this._afterTurn(me);
        return;
      }
      if (eff.kind === 'tax') {
        if (me.money < eff.amount) {
          this._appendEvent('tax-bankrupt', { seat: me.seat, amount: eff.amount });
          bankrupt(me, g.ownership);
        } else {
          me.money -= eff.amount;
          this._appendEvent('tax-paid', { seat: me.seat, amount: eff.amount });
        }
        this._persistPlayer(me);
        this._persistOwnership();
        g.turn.awaiting = 'endTurn';
        this._maybeAutoContinue(me);
        return;
      }
      // GO / Just Visiting / Free Parking — no action needed.
      g.turn.awaiting = 'endTurn';
      this._persistPlayer(me);
      this._persistMeta();
      this._maybeAutoContinue(me);
      return;
    }

    if (t.kind === 'chance' || t.kind === 'chest') {
      // v1: no-op flavor tiles. Reserved for future card decks.
      this._appendEvent('card-skip', { seat: me.seat, kind: t.kind });
      g.turn.awaiting = 'endTurn';
      this._persistMeta();
      this._maybeAutoContinue(me);
      return;
    }

    if (isOwnable(t)) {
      const owner = g.ownership[tileIndex];
      if (owner === undefined) {
        // Unowned: prompt to buy or skip.
        g.turn.awaiting = 'buyOrSkip';
        this._persistMeta();
        this._broadcastState();
        return;
      }
      if (owner === me.seat) {
        g.turn.awaiting = 'endTurn';
        this._persistMeta();
        this._maybeAutoContinue(me);
        return;
      }
      const { amount } = rentDue(g.ownership, tileIndex);
      const ownerP = g.players.find((p) => p.seat === owner);
      if (me.money < amount) {
        // Bankruptcy: surrender remaining cash to the owner, release tiles.
        if (ownerP) ownerP.money += me.money;
        me.money = 0;
        this._appendEvent('rent-bankrupt', { from: me.seat, to: owner, amount });
        bankrupt(me, g.ownership);
        this._persistPlayer(me);
        if (ownerP) this._persistPlayer(ownerP);
        this._persistOwnership();
      } else {
        me.money -= amount;
        if (ownerP) ownerP.money += amount;
        this._appendEvent('rent-paid', { from: me.seat, to: owner, amount });
        this._persistPlayer(me);
        if (ownerP) this._persistPlayer(ownerP);
      }
      g.turn.awaiting = 'endTurn';
      this._maybeAutoContinue(me);
      return;
    }
  }

  _handleBuy(ws, me) {
    const g = this._game;
    if (!me || g.phase !== PHASE_PLAYING || g.turn.currentSeat !== me.seat || g.turn.awaiting !== 'buyOrSkip') {
      return ws.send(JSON.stringify({ t: 'error', message: 'Cannot buy right now' }));
    }
    const tileIndex = me.position;
    const t = tileAt(tileIndex);
    if (!isOwnable(t)) return ws.send(JSON.stringify({ t: 'error', message: 'Tile not ownable' }));
    if (g.ownership[tileIndex] !== undefined) return ws.send(JSON.stringify({ t: 'error', message: 'Already owned' }));
    if (me.money < t.price) return ws.send(JSON.stringify({ t: 'error', message: 'Not enough cash' }));

    me.money -= t.price;
    g.ownership[tileIndex] = me.seat;
    this._appendEvent('bought', { seat: me.seat, tile: tileIndex, price: t.price });
    g.turn.awaiting = 'endTurn';
    this._persistPlayer(me);
    this._persistOwnership();
    this._persistMeta();
    this._broadcastState();
  }

  _handleSkip(ws, me) {
    const g = this._game;
    if (!me || g.phase !== PHASE_PLAYING || g.turn.currentSeat !== me.seat || g.turn.awaiting !== 'buyOrSkip') {
      return ws.send(JSON.stringify({ t: 'error', message: 'Nothing to skip' }));
    }
    this._appendEvent('skipped-buy', { seat: me.seat, tile: me.position });
    g.turn.awaiting = 'endTurn';
    this._persistMeta();
    this._broadcastState();
  }

  _handleEndTurn(ws, me) {
    const g = this._game;
    if (!me || g.phase !== PHASE_PLAYING || g.turn.currentSeat !== me.seat) {
      return ws.send(JSON.stringify({ t: 'error', message: 'Not your turn' }));
    }
    if (g.turn.awaiting !== 'endTurn') {
      return ws.send(JSON.stringify({ t: 'error', message: 'Resolve current action first' }));
    }
    this._advanceTurn(me);
  }

  _sendToJail(me) {
    const g = this._game;
    me.position = 12; // CORNER_JAIL
    me.inJail = true;
    me.jailTurns = 0;
    g.turn.doublesCount = 0;
    this._appendEvent('jailed', { seat: me.seat });
    this._persistPlayer(me);
    this._persistMeta();
  }

  _afterTurn(me) {
    this._game.turn.awaiting = 'endTurn';
    this._broadcastState();
  }

  _maybeAutoContinue(me) {
    // If the player rolled doubles and isn't in jail and isn't bankrupt and
    // doesn't owe an unresolved action, reset awaiting back to 'roll' for
    // their bonus turn — but only via explicit endTurn. We keep awaiting on
    // 'endTurn' so the client always confirms.
    this._broadcastState();
  }

  _advanceTurn(me) {
    const g = this._game;
    g.totalTurns += 1;

    // Bonus roll on doubles — keep same seat, reset awaiting to 'roll'.
    const eligibleDouble = g.turn.dice && g.turn.dice[0] === g.turn.dice[1]
      && !me.bankrupt && !me.inJail && g.turn.doublesCount > 0 && g.turn.doublesCount < MAX_DOUBLES_RUN;

    if (eligibleDouble) {
      g.turn.awaiting = 'roll';
      g.turn.dice = null;
      this._appendEvent('bonus-roll', { seat: me.seat });
      this._persistMeta();
      this._broadcastState();
      return;
    }

    // Check victory: only one non-bankrupt player remains.
    const alive = g.players.filter((p) => !p.bankrupt);
    if (alive.length <= 1) {
      g.phase = PHASE_FINISHED;
      g.winner = alive.length === 1 ? alive[0].seat : null;
      this._appendEvent('game-over', { winner: g.winner });
      this._persistMeta();
      this._broadcastState();
      void this._writeFinishedGameToD1().catch((e) => console.error('D1 write failed', e));
      return;
    }

    const next = nextSeat(g.players, g.turn.currentSeat);
    if (next === null) {
      g.phase = PHASE_FINISHED;
      g.winner = null;
      this._persistMeta();
      this._broadcastState();
      return;
    }
    g.turn = { currentSeat: next, dice: null, doublesCount: 0, awaiting: 'roll' };
    this._persistMeta();
    this._broadcastState();
  }

  async _writeFinishedGameToD1() {
    if (!this.env.MONOPOLY_DB) return;
    const g = this._game;
    const startedAt = g.startedAt || Date.now();
    const endedAt = Date.now();
    const r = await this.env.MONOPOLY_DB
      .prepare('INSERT INTO monopoly_games (started_at, ended_at, winner_seat, num_players, total_turns) VALUES (?, ?, ?, ?, ?)')
      .bind(Math.floor(startedAt / 1000), Math.floor(endedAt / 1000), g.winner ?? -1, g.players.length, g.totalTurns)
      .run();
    const gameId = r.meta && r.meta.last_row_id;
    if (!gameId) return;
    const stmts = g.players.map((p) =>
      this.env.MONOPOLY_DB
        .prepare('INSERT INTO monopoly_game_players (game_id, seat, color, display_name, final_net_worth) VALUES (?, ?, ?, ?, ?)')
        .bind(gameId, p.seat, p.color, p.displayName, netWorth(p, g.ownership)),
    );
    if (stmts.length > 0) await this.env.MONOPOLY_DB.batch(stmts);
  }

  async _reset() {
    resetSchema(this.sql);
    this._game = null;
    this._loaded = false;
    this._ensureLoaded();
  }
}

// ==================== src/index.js ====================
// Cloudflare Worker entrypoint for the monopoly-game project.
//
// Routes:
//   GET  /ws            -> WebSocket upgrade, forwarded to the global DO
//   GET  /state         -> JSON snapshot (debug / reset-page polling)
//   POST /force-reset   -> wipes the DO; password-gated (X-BS-Pass)
//
// All requests are forwarded to the single global instance of MonopolyGameDO
// via env.MONOPOLY_GAME.getByName("global") — there is only one running game.

// SHA-256("Broskikiller1!") in lowercase hex. Mirrors src/lib/battleship/secret.ts.
const PASSWORD_PLAINTEXT = 'Broskikiller1!';

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
  return out;
}
let _expected = null;
async function expectedHash() {
  if (!_expected) _expected = await sha256Hex(PASSWORD_PLAINTEXT);
  return _expected;
}
function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let m = 0;
  for (let i = 0; i < a.length; i++) m |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return m === 0;
}

async function checkPassword(request, url) {
  const supplied =
    request.headers.get('X-BS-Pass') ||
    url.searchParams.get('p') ||
    '';
  if (!supplied) return false;
  return constantTimeEqual(supplied.toLowerCase(), await expectedHash());
}

function corsHeaders(env, request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const allow = allowed.includes(origin) ? origin : (allowed[0] || '*');
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-BS-Pass, X-BS-Seat',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function jsonResponse(body, init = {}, env, request) {
  return new Response(JSON.stringify(body), {
    status: init.status || 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...corsHeaders(env, request),
      ...(init.headers || {}),
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env, request) });
    }

    // Password gate on every entrypoint except OPTIONS.
    if (!(await checkPassword(request, url))) {
      return jsonResponse({ error: 'Invalid password' }, { status: 401 }, env, request);
    }

    const stub = env.MONOPOLY_GAME.getByName('global');

    if (url.pathname === '/ws') {
      // The DO handles the websocket upgrade itself.
      return stub.fetch(request);
    }

    if (url.pathname === '/state' && request.method === 'GET') {
      const res = await stub.fetch(new Request(new URL('/state', request.url), { method: 'GET' }));
      const body = await res.text();
      return new Response(body, {
        status: res.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(env, request) },
      });
    }

    if (url.pathname === '/force-reset' && request.method === 'POST') {
      const res = await stub.fetch(new Request(new URL('/force-reset', request.url), { method: 'POST' }));
      const body = await res.text();
      return new Response(body, {
        status: res.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(env, request) },
      });
    }

    return jsonResponse({ error: 'not found' }, { status: 404 }, env, request);
  },
};


// Cloudflare looks up the DO class on the module's named exports.
export { MonopolyGameDO };
