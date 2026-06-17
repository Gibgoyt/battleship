import { DurableObject } from 'cloudflare:workers';
import { BOARD, N_TILES } from './board.js';
import {
  GO_REWARD,
  JAIL_FINE,
  MAX_DOUBLES_RUN,
  MAX_JAIL_TURNS,
  PLAYER_COLORS,
  STARTING_CASH,
  bankrupt,
  cornerEffect,
  isOwnable,
  move,
  netWorth,
  nextSeat,
  rentDue,
  roll2d6,
  tileAt,
} from './game.js';
import { initSchema, resetSchema } from './schema.js';

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

export class MonopolyGameDO extends DurableObject {
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

    const events = this.sql.exec('SELECT ts, kind, payload_json FROM events ORDER BY id DESC LIMIT ?', EVENT_LOG_CAP).toArray();
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
