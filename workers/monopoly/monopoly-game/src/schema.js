// SQLite schema for the MonopolyGameDO's private storage. Idempotent.

export const SCHEMA = [
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

export function initSchema(sql) {
  for (const stmt of SCHEMA) sql.exec(stmt);
}

export function resetSchema(sql) {
  sql.exec('DROP TABLE IF EXISTS ownership');
  sql.exec('DROP TABLE IF EXISTS events');
  sql.exec('DROP TABLE IF EXISTS players');
  sql.exec('DROP TABLE IF EXISTS meta');
  initSchema(sql);
}
