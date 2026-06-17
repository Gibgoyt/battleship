use leptos::*;
use wasm_bindgen::JsCast;
use web_sys::HtmlInputElement;

use crate::components::app::{AppCtx, ConnHandle};
use crate::ws::ClientMsg;

#[component]
pub fn LobbyView() -> impl IntoView {
    let ctx = use_context::<AppCtx>().expect("app ctx");
    let conn = use_context::<RwSignal<Option<ConnHandle>>>().expect("conn ctx");
    let display_name = create_rw_signal(String::from("Player"));

    let me_seat = ctx.my_seat;
    let snap = ctx.snapshot;

    let send = move |m: ClientMsg| {
        if let Some(h) = conn.get() { h.0.send(&m); }
    };

    let join = {
        let send = send.clone();
        move |_| {
            let name = display_name.get();
            send(ClientMsg::Join { display_name: name });
        }
    };

    let toggle_ready = {
        let send = send.clone();
        move |_| {
            let cur = snap.with(|s| {
                s.as_ref()
                    .and_then(|s| me_seat.get().and_then(|me| s.players.iter().find(|p| p.seat == me).map(|p| p.ready)))
                    .unwrap_or(false)
            });
            send(ClientMsg::Ready { value: !cur });
        }
    };

    let leave = {
        let send = send.clone();
        move |_| send(ClientMsg::Leave)
    };

    view! {
        <section class="flex-1 grid place-items-center p-6">
            <div class="w-full max-w-2xl space-y-6">
                <header class="text-center space-y-1">
                    <h2 class="text-3xl font-bold">"Lobby"</h2>
                    <p class="text-zinc-400 text-sm">
                        "Up to 6 players — everyone clicks "<em>"Ready"</em>" to start. No late joins."
                    </p>
                </header>

                <Show
                    when=move || me_seat.get().is_none()
                    fallback=move || view! { <SeatedControls toggle_ready=toggle_ready.clone() leave=leave.clone() /> }
                >
                    <div class="bg-zinc-900 border border-zinc-700 rounded-xl p-4 flex gap-2 items-center">
                        <input
                            type="text"
                            placeholder="Your display name"
                            on:input=move |e| display_name.set(event_target_value(&e))
                            prop:value=move || display_name.get()
                            class="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none"
                            maxlength="24"
                        />
                        <button on:click=join.clone() class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
                            "Take a seat"
                        </button>
                    </div>
                </Show>

                <PlayersGrid/>

                <p class="text-center text-xs text-zinc-500">
                    {move || {
                        let snap = snap.get().clone();
                        let s = snap.unwrap_or_default();
                        let total = s.players.len();
                        let ready = s.players.iter().filter(|p| p.ready).count();
                        format!("{ready}/{total} ready — need ≥ 2 players, all ready, to start")
                    }}
                </p>
            </div>
        </section>
    }
}

#[component]
fn SeatedControls<F: Fn(ev::MouseEvent) + Clone + 'static, G: Fn(ev::MouseEvent) + Clone + 'static>(
    toggle_ready: F,
    leave: G,
) -> impl IntoView {
    let ctx = use_context::<AppCtx>().expect("app ctx");
    let me_seat = ctx.my_seat;
    let snap = ctx.snapshot;

    let me_ready = move || {
        snap.with(|s| {
            s.as_ref()
                .and_then(|s| me_seat.get().and_then(|m| s.players.iter().find(|p| p.seat == m).map(|p| p.ready)))
                .unwrap_or(false)
        })
    };

    view! {
        <div class="flex gap-2 justify-center">
            <button
                on:click=toggle_ready
                class="px-4 py-2 rounded-lg font-semibold border border-zinc-700 hover:bg-zinc-800"
                class:bg-emerald-600=move || me_ready()
                class:text-white=move || me_ready()
            >
                {move || if me_ready() { "Ready ✓ (click to unready)" } else { "Click when ready" }}
            </button>
            <button on:click=leave class="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                "Leave seat"
            </button>
        </div>
    }
}

#[component]
fn PlayersGrid() -> impl IntoView {
    let ctx = use_context::<AppCtx>().expect("app ctx");
    let snap = ctx.snapshot;
    let me   = ctx.my_seat;

    view! {
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {move || {
                let s = snap.get().unwrap_or_default();
                let cells: Vec<_> = (0..6u32).collect();
                cells.into_iter().map(|seat| {
                    let player = s.players.iter().find(|p| p.seat == seat).cloned();
                    let is_me = me.get() == Some(seat);
                    let bg = player.as_ref().map(|p| p.color.as_str()).unwrap_or("#27272a");
                    view! {
                        <div class="rounded-xl border border-zinc-700 p-3 min-h-[88px] flex flex-col justify-between"
                             style=format!("background: color-mix(in srgb, {bg} 22%, #18181b);")
                        >
                            <div class="flex items-center justify-between">
                                <span class="text-xs uppercase tracking-wider text-zinc-300">{format!("Seat {}", seat + 1)}</span>
                                {is_me.then(|| view! { <span class="text-xs px-2 py-0.5 rounded bg-blue-600">"YOU"</span> })}
                            </div>
                            {match player {
                                Some(p) => view! {
                                    <div class="flex items-center justify-between mt-2">
                                        <span class="font-semibold truncate">{p.display_name.clone()}</span>
                                        {if p.ready {
                                            view! { <span class="text-emerald-400 text-xs font-mono">"READY"</span> }.into_view()
                                        } else {
                                            view! { <span class="text-zinc-500 text-xs font-mono">"waiting"</span> }.into_view()
                                        }}
                                    </div>
                                }.into_view(),
                                None => view! {
                                    <div class="text-zinc-500 italic text-sm mt-2">"open seat"</div>
                                }.into_view(),
                            }}
                        </div>
                    }
                }).collect_view()
            }}
        </div>
    }
}

fn event_target_value(e: &ev::Event) -> String {
    e.target()
        .and_then(|t| t.dyn_into::<HtmlInputElement>().ok())
        .map(|el| el.value())
        .unwrap_or_default()
}
