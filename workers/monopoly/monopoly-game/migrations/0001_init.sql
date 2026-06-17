-- D1 migration for the monopoly game's persisted history tables.
-- Runs against the SHARED D1 database (same instance as battleship).
-- Apply with:
--   wrangler d1 execute internal-ops-admin-db --remote --file=migrations/0001_init.sql
--
-- Notes:
-- - D1/SQLite has no schemas; every monopoly table is prefixed `monopoly_`.
-- - Only finished games are written here. Live state lives inside the DO's
--   own private SQLite (workers/monopoly/monopoly-game/src/schema.js).

CREATE TABLE IF NOT EXISTS monopoly_games (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at   INTEGER NOT NULL,
  ended_at     INTEGER NOT NULL,
  winner_seat  INTEGER NOT NULL,
  num_players  INTEGER NOT NULL,
  total_turns  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS monopoly_game_players (
  game_id         INTEGER NOT NULL REFERENCES monopoly_games(id) ON DELETE CASCADE,
  seat            INTEGER NOT NULL,
  color           TEXT    NOT NULL,
  display_name    TEXT,
  final_net_worth INTEGER NOT NULL,
  PRIMARY KEY (game_id, seat)
);

CREATE INDEX IF NOT EXISTS idx_monopoly_games_ended_at
  ON monopoly_games(ended_at DESC);
