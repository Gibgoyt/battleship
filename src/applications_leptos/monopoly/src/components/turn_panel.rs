use leptos::*;

use crate::components::app::{AppCtx, ConnHandle};
use crate::tiles::{tile_at, TileKind};
use crate::ws::ClientMsg;

#[component]
pub fn TurnPanel() -> impl IntoView {
    let ctx = use_context::<AppCtx>().expect("app ctx");
    let conn = use_context::<RwSignal<Option<ConnHandle>>>().expect("conn ctx");

    let send = move |m: ClientMsg| {
        if let Some(h) = conn.get() { h.0.send(&m); }
    };

    let my_turn = create_memo(move |_| {
        let me = ctx.my_seat.get();
        ctx.snapshot.with(|s| {
            s.as_ref().map(|s| me == Some(s.turn.current_seat)).unwrap_or(false)
        })
    });

    let awaiting = create_memo(move |_| {
        ctx.snapshot.with(|s| s.as_ref().map(|s| s.turn.awaiting.clone()).unwrap_or_default())
    });

    let dice = create_memo(move |_| {
        ctx.snapshot.with(|s| s.as_ref().and_then(|s| s.turn.dice))
    });

    let current_player_name = create_memo(move |_| {
        ctx.snapshot.with(|s| {
            s.as_ref().and_then(|s| s.players.iter().find(|p| p.seat == s.turn.current_seat).map(|p| p.display_name.clone()))
                .unwrap_or_default()
        })
    });

    let my_position_info = create_memo(move |_| {
        let me = ctx.my_seat.get()?;
        ctx.snapshot.with(|s| {
            let s = s.as_ref()?;
            let player = s.players.iter().find(|p| p.seat == me)?;
            let tile = tile_at(player.position);
            Some((player.position, tile.name.to_string(), tile.kind.clone(), tile.price))
        })
    });

    let send_roll    = { let s = send.clone(); move |_| s(ClientMsg::Roll) };
    let send_buy     = { let s = send.clone(); move |_| s(ClientMsg::Buy) };
    let send_skip    = { let s = send.clone(); move |_| s(ClientMsg::Skip) };
    let send_endturn = { let s = send.clone(); move |_| s(ClientMsg::EndTurn) };

    view! {
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-3">
            <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-zinc-300 uppercase tracking-wide">"Your Turn"</h3>
                <Show when=move || dice.get().is_some()>
                    {move || {
                        let (d1, d2) = dice.get().unwrap();
                        view! { <span class="font-mono text-zinc-200">{format!("🎲 {d1} + {d2} = {}", d1 + d2)}</span> }
                    }}
                </Show>
            </div>

            <Show
                when=move || my_turn.get()
                fallback=move || view! {
                    <p class="text-sm text-zinc-400">
                        "Waiting for "
                        <span class="font-semibold text-zinc-200">{move || current_player_name.get()}</span>
                        "…"
                    </p>
                }
            >
                <Show when=move || my_position_info.get().is_some()>
                    {move || {
                        let (idx, name, _kind, price) = my_position_info.get().unwrap();
                        view! {
                            <p class="text-xs text-zinc-400">
                                "You are on "
                                <span class="text-zinc-100 font-medium">{format!("#{idx} {name}")}</span>
                                <Show when=move || { price > 0 }>
                                    <span class="text-amber-300 font-mono">{format!(" · ${price}")}</span>
                                </Show>
                            </p>
                        }
                    }}
                </Show>

                <div class="flex flex-wrap gap-2">
                    {move || match awaiting.get().as_str() {
                        "roll" => view! {
                            <button on:click=send_roll.clone() class="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium">
                                "Roll dice"
                            </button>
                        }.into_view(),
                        "buyOrSkip" => view! {
                            <button on:click=send_buy.clone() class="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
                                {move || {
                                    let p = my_position_info.get().map(|x| x.3).unwrap_or(0);
                                    format!("Buy for ${p}")
                                }}
                            </button>
                            <button on:click=send_skip.clone() class="px-3 py-1.5 rounded border border-zinc-700 hover:bg-zinc-800">
                                "Skip"
                            </button>
                        }.into_view(),
                        "endTurn" => view! {
                            <button on:click=send_endturn.clone() class="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium">
                                "End turn"
                            </button>
                        }.into_view(),
                        _ => view! { <p class="text-sm text-zinc-500">"…"</p> }.into_view(),
                    }}
                </div>
            </Show>
        </div>
    }
}

#[allow(dead_code)]
fn dummy_use_kind(_t: &TileKind) {}
