// Client-side state types. These intentionally mirror what the worker
// serializes — see src/lib/monopoly/types.ts and
// workers/monopoly/monopoly-game/src/durable.js (_snapshot).

use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Player {
    pub seat: u32,
    pub color: String,
    pub display_name: String,
    pub ready: bool,
    pub connected: bool,
    pub money: i64,
    pub position: u32,
    pub in_jail: bool,
    pub jail_turns: u32,
    pub bankrupt: bool,
}

#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Turn {
    pub current_seat: u32,
    #[serde(default)]
    pub dice: Option<(u32, u32)>,
    pub doubles_count: u32,
    pub awaiting: String, // "roll" | "buyOrSkip" | "endTurn"
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct LogEntry {
    pub ts: i64,
    pub kind: String,
    #[serde(default)]
    pub payload: serde_json::Value,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct GameSnapshot {
    pub phase: String, // "lobby" | "playing" | "finished"
    pub players: Vec<Player>,
    pub ownership: std::collections::HashMap<String, u32>, // tile -> seat (JSON object keys are strings)
    pub turn: Turn,
    #[serde(default)]
    pub winner: Option<u32>,
    #[serde(default)]
    pub log: Vec<LogEntry>,
}

impl GameSnapshot {
    pub fn me<'a>(&'a self, my_seat: Option<u32>) -> Option<&'a Player> {
        let seat = my_seat?;
        self.players.iter().find(|p| p.seat == seat)
    }

    pub fn owner_of(&self, tile: u32) -> Option<u32> {
        self.ownership.get(&tile.to_string()).copied()
    }
}

/// Banner toast shown across the top of the screen for transient errors /
/// kicks. Lifetime managed by the caller.
#[derive(Clone, Debug)]
pub struct Toast {
    pub message: String,
    pub kind: ToastKind,
}

#[derive(Clone, Debug, PartialEq)]
pub enum ToastKind {
    Info,
    Warning,
    Error,
}
