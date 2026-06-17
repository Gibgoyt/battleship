use leptos::*;

use crate::components::app::AppCtx;
use crate::tiles::{tile_at, TileKind};

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
            <ul class="text-xs text-zinc-400 space-y-1 max-h-48 overflow-y-auto">
                {move || {
                    let log = ctx.snapshot.with(|s| s.as_ref().map(|s| s.log.clone()).unwrap_or_default());
                    log.into_iter().rev().take(20).map(|e| {
                        let payload = e.payload.to_string();
                        view! {
                            <li>
                                <span class="text-zinc-500 font-mono">{format!("{}: ", e.kind)}</span>
                                <span>{shorten(&payload, 80)}</span>
                            </li>
                        }
                    }).collect_view()
                }}
            </ul>
        </div>
    }
}

fn shorten(s: &str, n: usize) -> String {
    if s.len() <= n { s.to_string() } else { format!("{}…", &s[..n]) }
}

#[allow(dead_code)]
fn dummy_use_kind(_t: &TileKind) {}
