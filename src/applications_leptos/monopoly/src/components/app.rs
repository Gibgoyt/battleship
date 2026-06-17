use leptos::*;
use std::rc::Rc;
use wasm_bindgen::JsCast;

use crate::components::hex_board::BoardContainer;
use crate::components::lobby::LobbyView;
use crate::components::login::Login;
use crate::components::sidebar::Sidebar;
use crate::components::toasts::Toaster;
use crate::components::turn_panel::TurnPanel;
use crate::state::{GameSnapshot, Toast, ToastKind};
use crate::ws::{ClientMsg, Conn, ConnStatus, ServerMsg};

const SEAT_TOKEN_KEY: &str = "mp_seat_token";

/// Top-level signals we share with every sub-component. Wrapped in a context
/// for ergonomic access — same pattern as the CUDA app's NavOpen.
#[derive(Clone, Copy, PartialEq)]
pub enum ViewMode { Full, Row }

#[derive(Clone, Copy)]
pub struct AppCtx {
    pub snapshot: RwSignal<Option<GameSnapshot>>,
    pub my_seat:  RwSignal<Option<u32>>,
    pub conn_status: RwSignal<ConnStatus>,
    pub toast: RwSignal<Option<Toast>>,
    pub view_mode: RwSignal<ViewMode>,
}

#[derive(Clone)]
pub struct ConnHandle(pub Rc<Conn>);

#[component]
pub fn AppShell() -> impl IntoView {
    let snapshot = create_rw_signal::<Option<GameSnapshot>>(None);
    let my_seat = create_rw_signal::<Option<u32>>(None);
    let conn_status = create_rw_signal(ConnStatus::Closed);
    let toast = create_rw_signal::<Option<Toast>>(None);
    let view_mode = create_rw_signal(ViewMode::Full);
    provide_context(AppCtx { snapshot, my_seat, conn_status, toast, view_mode });

    let conn_holder: RwSignal<Option<ConnHandle>> = create_rw_signal(None);
    provide_context(conn_holder);

    // Server-configured WS URL injected by the Astro page on window.
    let ws_url_signal = create_rw_signal(read_window_url());
    let configured = move || {
        ws_url_signal.with(|u| u.as_ref().map_or(false, |s| !s.is_empty() && !s.contains("PLACEHOLDER")))
    };

    let connect = move |pw_hash: String| {
        let Some(base) = ws_url_signal.get() else { return };
        if base.is_empty() || base.contains("PLACEHOLDER") {
            toast.set(Some(Toast {
                message: "Worker URL not configured. Edit src/lib/monopoly/config.ts.".into(),
                kind: ToastKind::Error,
            }));
            return;
        }
        let stored_token = get_storage(SEAT_TOKEN_KEY);
        let mut url = format!("{base}/ws?p={pw_hash}");
        if let Some(tok) = &stored_token {
            url.push_str(&format!("&seatToken={}", urlencoding(tok)));
        }
        let conn = Conn::new(url);
        let conn_for_handlers = Rc::clone(&conn);

        let snap_set = snapshot;
        let seat_set = my_seat;
        let toast_set = toast;
        let conn_send = Rc::clone(&conn_for_handlers);

        conn.connect(
            move |msg| match msg {
                ServerMsg::Welcome { seat, seat_token } => {
                    if let Some(token) = &seat_token {
                        set_storage(SEAT_TOKEN_KEY, token);
                    }
                    seat_set.set(seat);
                }
                ServerMsg::State { state } => snap_set.set(Some(state)),
                ServerMsg::Event { .. } => { /* state snapshot already includes the log */ }
                ServerMsg::Kicked { reason } => {
                    clear_storage(SEAT_TOKEN_KEY);
                    seat_set.set(None);
                    snap_set.set(None);
                    let msg = if reason == "reset" {
                        "Game was reset. Refreshing…".to_string()
                    } else {
                        format!("Disconnected: {reason}")
                    };
                    toast_set.set(Some(Toast { message: msg, kind: ToastKind::Warning }));
                    if let Some(win) = web_sys::window() {
                        let loc = win.location();
                        let cb = wasm_bindgen::closure::Closure::once_into_js(move || {
                            let _ = loc.reload();
                        });
                        let _ = win.set_timeout_with_callback_and_timeout_and_arguments_0(
                            cb.as_ref().unchecked_ref(),
                            1500,
                        );
                    }
                }
                ServerMsg::Error { message } => {
                    toast_set.set(Some(Toast { message, kind: ToastKind::Error }));
                }
            },
            move |st| {
                conn_status.set(st);
                if matches!(st, ConnStatus::Open) {
                    // Send hello (with seat-token if any) immediately so the
                    // worker can rebind us to an existing seat.
                    let token = get_storage(SEAT_TOKEN_KEY);
                    conn_send.send(&ClientMsg::Hello { seat_token: token });
                }
            },
        );
        conn_holder.set(Some(ConnHandle(conn)));
    };

    let on_logout = move || {
        clear_storage(SEAT_TOKEN_KEY);
        if let Some(h) = conn_holder.get() { h.0.close(); }
        conn_holder.set(None);
        my_seat.set(None);
        snapshot.set(None);
        conn_status.set(ConnStatus::Closed);
    };

    view! {
        <Toaster/>
        <Show
            when=move || conn_holder.with(|c| c.is_some())
            fallback=move || view! { <Login configured=Signal::derive(configured) on_pass_hash=connect.clone() /> }
        >
            <GameView on_logout=on_logout.clone() />
        </Show>
    }
}

#[component]
fn GameView<F: Fn() + Clone + 'static>(on_logout: F) -> impl IntoView {
    let ctx = use_context::<AppCtx>().expect("app ctx");

    view! {
        <div class="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
            <TopBar on_logout=on_logout.clone()/>
            <Show
                when=move || ctx.snapshot.with(|s| s.is_some())
                fallback=|| view! { <div class="flex-1 grid place-items-center text-zinc-400">"Connecting…"</div> }
            >
                <PhaseRouter/>
            </Show>
        </div>
    }
}

#[component]
fn PhaseRouter() -> impl IntoView {
    let ctx = use_context::<AppCtx>().expect("app ctx");
    let phase = create_memo(move |_| {
        ctx.snapshot.with(|s| s.as_ref().map(|x| x.phase.clone()).unwrap_or_default())
    });

    view! {
        <main class="flex-1 flex flex-col lg:flex-row gap-2 p-2">
            {move || match phase.get().as_str() {
                "lobby"    => view! { <LobbyView/> }.into_view(),
                "playing"  => view! {
                    <div class="flex-1 min-w-0 h-[calc(100vh-3.25rem)]">
                        <BoardContainer/>
                    </div>
                    <aside class="lg:w-80 flex flex-col gap-3">
                        <Sidebar/>
                        <TurnPanel/>
                    </aside>
                }.into_view(),
                "finished" => view! { <FinishedView/> }.into_view(),
                _          => view! { <div>"Unknown phase"</div> }.into_view(),
            }}
        </main>
    }
}

#[component]
fn TopBar<F: Fn() + Clone + 'static>(on_logout: F) -> impl IntoView {
    let ctx = use_context::<AppCtx>().expect("app ctx");
    view! {
        <header class="px-4 py-2 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 backdrop-blur sticky top-0 z-30">
            <div class="flex items-center gap-3">
                <h1 class="text-lg font-semibold tracking-tight">"Monopoly · Hexagonal"</h1>
                <span class="text-xs text-zinc-500">
                    {move || match ctx.conn_status.get() {
                        ConnStatus::Open       => "● live".to_string(),
                        ConnStatus::Connecting => "○ connecting".to_string(),
                        ConnStatus::Closed     => "● offline".to_string(),
                    }}
                </span>
            </div>
            <div class="flex items-center gap-2">
                <a href="/monopoly/reset" class="text-xs px-3 py-1.5 rounded border border-zinc-700 hover:bg-zinc-800">"Reset game"</a>
                <button on:click=move |_| on_logout() class="text-xs px-3 py-1.5 rounded border border-zinc-700 hover:bg-zinc-800">"Log out"</button>
            </div>
        </header>
    }
}

#[component]
fn FinishedView() -> impl IntoView {
    let ctx = use_context::<AppCtx>().expect("app ctx");
    view! {
        <section class="flex-1 grid place-items-center p-8">
            <div class="max-w-md text-center space-y-4">
                <h2 class="text-3xl font-bold">"Game over"</h2>
                {move || ctx.snapshot.with(|s| {
                    let s = s.as_ref().unwrap();
                    let winner = s.winner
                        .and_then(|w| s.players.iter().find(|p| p.seat == w))
                        .map(|p| format!("Winner: {} ({})", p.display_name, p.color))
                        .unwrap_or_else(|| "No winner".to_string());
                    view! { <p class="text-zinc-300">{winner}</p> }
                })}
                <a href="/monopoly/reset" class="inline-block px-4 py-2 rounded bg-amber-500 text-amber-950 font-semibold">"Reset & play again"</a>
            </div>
        </section>
    }
}

// ---------- helpers --------------------------------------------------------

fn read_window_url() -> Option<String> {
    let win = web_sys::window()?;
    let v = js_sys::Reflect::get(&win, &wasm_bindgen::JsValue::from_str("__MONOPOLY_WS_URL")).ok()?;
    v.as_string()
}

fn get_storage(key: &str) -> Option<String> {
    let win = web_sys::window()?;
    let ls = win.local_storage().ok().flatten()?;
    ls.get_item(key).ok().flatten()
}
fn set_storage(key: &str, value: &str) {
    if let Some(win) = web_sys::window() {
        if let Ok(Some(ls)) = win.local_storage() {
            let _ = ls.set_item(key, value);
        }
    }
}
fn clear_storage(key: &str) {
    if let Some(win) = web_sys::window() {
        if let Ok(Some(ls)) = win.local_storage() {
            let _ = ls.remove_item(key);
        }
    }
}

fn urlencoding(s: &str) -> String {
    js_sys::encode_uri_component(s).as_string().unwrap_or_default()
}
