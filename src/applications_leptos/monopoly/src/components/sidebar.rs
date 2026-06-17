use leptos::*;
use serde_json::Value;

use crate::components::app::AppCtx;
use crate::state::Player;
use crate::tiles::tile_at;

#[component]
pub fn Sidebar() -> impl IntoView {
    let ctx = use_context::<AppCtx>().expect("app ctx");

    view! {
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-3">
            <h3 class="text-sm font-semibold text-zinc-300 uppercase tracking-wide">"Players"</h3>
            {move || {
                let s = ctx.snapshot.get();
                let me = ctx.my_seat.get();
                let players = s.as_ref().map(|s| s.players.clone()).unwrap_or_default();
                let current = s.as_ref().map(|s| s.turn.current_seat);
                players.into_iter().map(|p| {
                    let is_me = me == Some(p.seat);
                    let is_turn = current == Some(p.seat);
                    let ring = if is_turn { "ring-2 ring-amber-400" } else { "" };
                    let bg = format!("color-mix(in srgb, {} 18%, #18181b)", p.color);
                    let owned: Vec<String> = s.as_ref()
                        .map(|s| s.ownership.iter()
                            .filter_map(|(k, &v)| if v == p.seat { k.parse::<u32>().ok() } else { None })
                            .map(|i| tile_at(i).name.to_string())
                            .collect())
                        .unwrap_or_default();
                    let owned_count = owned.len();
                    let title_color = p.color.clone();
                    view! {
                        <div
                            class=format!("rounded-lg border border-zinc-700 p-2 {ring}")
                            style=format!("background: {bg};")
                        >
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2 min-w-0">
                                    <span class="w-3 h-3 rounded-full shrink-0" style=format!("background:{title_color}")/>
                                    <span class="font-medium truncate">{p.display_name.clone()}</span>
                                    {is_me.then(|| view! { <span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-600">"YOU"</span> })}
                                    {p.in_jail.then(|| view! { <span class="text-[10px] px-1.5 py-0.5 rounded bg-red-700">"JAIL"</span> })}
                                    {p.bankrupt.then(|| view! { <span class="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 line-through">"OUT"</span> })}
                                </div>
                                <span class="font-mono text-amber-300">{format!("${}", p.money)}</span>
                            </div>
                            <Show when=move || { owned_count > 0 }>
                                <details class="mt-1">
                                    <summary class="text-xs text-zinc-400 cursor-pointer">{format!("{owned_count} tiles")}</summary>
                                    <ul class="mt-1 text-xs text-zinc-300 grid grid-cols-2 gap-x-2">
                                        {owned.iter().map(|n| view! { <li class="truncate">{n.clone()}</li> }).collect_view()}
                                    </ul>
                                </details>
                            </Show>
                        </div>
                    }
                }).collect_view()
            }}
            <EventLog/>
        </div>
    }
}

#[component]
fn EventLog() -> impl IntoView {
    let ctx = use_context::<AppCtx>().expect("app ctx");
    view! {
        <div>
            <h3 class="text-sm font-semibold text-zinc-300 uppercase tracking-wide mt-3 mb-1">"Recent"</h3>
            <ul class="text-xs text-zinc-300 space-y-1 max-h-48 overflow-y-auto pr-1">
                {move || {
                    let (entries, players) = ctx.snapshot.with(|s| {
                        let s = match s { Some(s) => s, None => return (vec![], vec![]) };
                        (s.log.clone(), s.players.clone())
                    });
                    entries.into_iter().rev().take(20).map(|e| {
                        let line = format_log_line(&e.kind, &e.payload, &players);
                        view! { <li class="leading-snug">{line}</li> }
                    }).collect_view()
                }}
            </ul>
        </div>
    }
}

// ---------- formatter ------------------------------------------------------

fn seat_name(seat: u32, players: &[Player]) -> String {
    players.iter()
        .find(|p| p.seat == seat)
        .map(|p| p.display_name.clone())
        .unwrap_or_else(|| format!("Seat {}", seat + 1))
}

fn seat_color(seat: u32, players: &[Player]) -> String {
    players.iter()
        .find(|p| p.seat == seat)
        .map(|p| p.color.clone())
        .unwrap_or_else(|| "#71717a".into())
}

fn dot(color: String) -> impl IntoView {
    view! {
        <span class="inline-block w-2 h-2 rounded-full align-middle mr-1.5"
              style=format!("background:{color}")/>
    }
}

fn tile_name(tile: u32) -> &'static str {
    tile_at(tile).name
}

fn format_log_line(kind: &str, payload: &Value, players: &[Player]) -> View {
    let v = payload;
    match kind {
        "joined" => {
            let name  = v.get("displayName").and_then(|x| x.as_str()).unwrap_or("Player").to_string();
            let color = v.get("color").and_then(|x| x.as_str()).unwrap_or("#71717a").to_string();
            let seat  = v.get("seat").and_then(|x| x.as_u64()).unwrap_or(0) as u32;
            view! {
                <span>
                    {dot(color)}
                    <span class="text-zinc-100">{name}</span>
                    <span class="text-zinc-500">{format!(" joined seat {}", seat + 1)}</span>
                </span>
            }.into_view()
        }
        "ready" => {
            let seat = v.get("seat").and_then(|x| x.as_u64()).unwrap_or(0) as u32;
            let val  = v.get("value").and_then(|x| x.as_bool()).unwrap_or(true);
            let verb = if val { " is ready" } else { " un-readied" };
            view! {
                <span>
                    {dot(seat_color(seat, players))}
                    <span class="text-zinc-100">{seat_name(seat, players)}</span>
                    <span class="text-zinc-500">{verb}</span>
                </span>
            }.into_view()
        }
        "start" => {
            let seats = v.get("seats").and_then(|x| x.as_array())
                .map(|a| a.len()).unwrap_or(0);
            view! {
                <span class="text-zinc-400">
                    {format!("Game started · {seats} players")}
                </span>
            }.into_view()
        }
        "rolled" => {
            let seat = v.get("seat").and_then(|x| x.as_u64()).unwrap_or(0) as u32;
            let to   = v.get("to").and_then(|x| x.as_u64()).unwrap_or(0) as u32;
            let dice = v.get("dice").and_then(|x| x.as_array()).cloned().unwrap_or_default();
            let (a, b) = (
                dice.get(0).and_then(|x| x.as_u64()).unwrap_or(0),
                dice.get(1).and_then(|x| x.as_u64()).unwrap_or(0),
            );
            view! {
                <span>
                    {dot(seat_color(seat, players))}
                    <span class="text-zinc-100">{seat_name(seat, players)}</span>
                    <span class="text-zinc-500">" rolled "</span>
                    <span class="font-mono text-zinc-200">{format!("{a}+{b}")}</span>
                    <span class="text-zinc-500">" → "</span>
                    <span class="text-zinc-200">{tile_name(to)}</span>
                </span>
            }.into_view()
        }
        "bought" => {
            let seat  = v.get("seat").and_then(|x| x.as_u64()).unwrap_or(0) as u32;
            let tile  = v.get("tile").and_then(|x| x.as_u64()).unwrap_or(0) as u32;
            let price = v.get("price").and_then(|x| x.as_i64()).unwrap_or(0);
            view! {
                <span>
                    {dot(seat_color(seat, players))}
                    <span class="text-zinc-100">{seat_name(seat, players)}</span>
                    <span class="text-zinc-500">" bought "</span>
                    <span class="text-zinc-200">{tile_name(tile)}</span>
                    <span class="text-zinc-500">" for "</span>
                    <span class="font-mono text-amber-300">{format!("${price}")}</span>
                </span>
            }.into_view()
        }
        "skipped-buy" => {
            let seat = v.get("seat").and_then(|x| x.as_u64()).unwrap_or(0) as u32;
            let tile = v.get("tile").and_then(|x| x.as_u64()).unwrap_or(0) as u32;
            view! {
                <span>
                    {dot(seat_color(seat, players))}
                    <span class="text-zinc-100">{seat_name(seat, players)}</span>
                    <span class="text-zinc-500">" skipped "</span>
                    <span class="text-zinc-200">{tile_name(tile)}</span>
                </span>
            }.into_view()
        }
        "card-skip" => {
            let seat = v.get("seat").and_then(|x| x.as_u64()).unwrap_or(0) as u32;
            let card = v.get("kind").and_then(|x| x.as_str()).unwrap_or("card").to_string();
            view! {
                <span>
                    {dot(seat_color(seat, players))}
                    <span class="text-zinc-100">{seat_name(seat, players)}</span>
                    <span class="text-zinc-500">{format!(" drew a {card} card")}</span>
                </span>
            }.into_view()
        }
        "rent-paid" => {
            let from  = v.get("from").and_then(|x| x.as_u64()).unwrap_or(0) as u32;
            let to    = v.get("to").and_then(|x| x.as_u64()).unwrap_or(0) as u32;
            let amt   = v.get("amount").and_then(|x| x.as_i64()).unwrap_or(0);
            let tile  = v.get("tile").and_then(|x| x.as_u64()).unwrap_or(0) as u32;
            view! {
                <span>
                    {dot(seat_color(from, players))}
                    <span class="text-zinc-100">{seat_name(from, players)}</span>
                    <span class="text-zinc-500">" paid "</span>
                    <span class="font-mono text-amber-300">{format!("${amt}")}</span>
                    <span class="text-zinc-500">" to "</span>
                    <span class="text-zinc-100">{seat_name(to, players)}</span>
                    <span class="text-zinc-500">{format!(" · {}", tile_name(tile))}</span>
                </span>
            }.into_view()
        }
        "end-turn" => {
            let seat = v.get("seat").and_then(|x| x.as_u64()).unwrap_or(0) as u32;
            view! {
                <span>
                    {dot(seat_color(seat, players))}
                    <span class="text-zinc-100">{seat_name(seat, players)}</span>
                    <span class="text-zinc-500">" ended turn"</span>
                </span>
            }.into_view()
        }
        other => {
            let payload = v.to_string();
            let shortened = if payload.len() > 60 {
                format!("{}…", &payload[..60])
            } else { payload };
            view! {
                <span>
                    <span class="text-zinc-500 font-mono">{format!("{other}: ")}</span>
                    <span class="text-zinc-400">{shortened}</span>
                </span>
            }.into_view()
        }
    }
}
