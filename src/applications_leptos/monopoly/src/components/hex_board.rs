use leptos::*;

use crate::board::{corner_tile_size, side_tile_size, tile_position};
use crate::components::app::{AppCtx, ViewMode};
use crate::state::Player;
use crate::tiles::{tile_at, TileKind, N_TILES, TILES_PER_SIDE};

#[component]
pub fn BoardContainer() -> impl IntoView {
    let ctx = use_context::<AppCtx>().expect("app ctx");
    view! {
        <div class="relative w-full h-full">
            <ViewToggle/>
            {move || match ctx.view_mode.get() {
                ViewMode::Full => view! { <FullBoard/> }.into_view(),
                ViewMode::Row  => view! { <RowBoard/> }.into_view(),
            }}
        </div>
    }
}

#[component]
fn ViewToggle() -> impl IntoView {
    let ctx = use_context::<AppCtx>().expect("app ctx");
    let is_full = move || matches!(ctx.view_mode.get(), ViewMode::Full);
    let is_row  = move || matches!(ctx.view_mode.get(), ViewMode::Row);

    let btn_cls = |active: bool| {
        if active {
            "px-4 py-1.5 rounded-full text-sm font-semibold bg-amber-500 text-amber-950"
        } else {
            "px-4 py-1.5 rounded-full text-sm font-semibold text-zinc-300 hover:text-white"
        }
    };

    view! {
        <div class="absolute top-3 left-1/2 -translate-x-1/2 z-10
                    flex bg-zinc-900/80 backdrop-blur border border-zinc-700 rounded-full p-1">
            <button class=move || btn_cls(is_full())
                    on:click=move |_| ctx.view_mode.set(ViewMode::Full)>
                "Full"
            </button>
            <button class=move || btn_cls(is_row())
                    on:click=move |_| ctx.view_mode.set(ViewMode::Row)>
                "Row"
            </button>
        </div>
    }
}

#[component]
fn FullBoard() -> impl IntoView {
    view! {
        <div class="absolute inset-0">
            <svg
                viewBox="60 30 880 940"
                preserveAspectRatio="xMidYMid meet"
                class="w-full h-full block select-none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <filter id="tile-shadow" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="1" stdDeviation="0.8" flood-color="black" flood-opacity="0.35"/>
                    </filter>
                </defs>

                <BoardBackground/>

                {(0..N_TILES).map(|i| view! { <TileShape index=i/> }).collect_view()}

                <PlayerTokens/>
            </svg>
        </div>
    }
}

#[component]
fn PlayerTokens() -> impl IntoView {
    let ctx = use_context::<AppCtx>().expect("app ctx");
    view! {
        {move || {
            let snap = ctx.snapshot.get();
            let players = snap.map(|s| s.players).unwrap_or_default();
            players.into_iter().enumerate()
                .map(|(i, p)| view! { <PlayerToken player=p stack_index=i as u32/> })
                .collect_view()
        }}
    }
}

#[component]
fn BoardBackground() -> impl IntoView {
    use crate::board::{hex_vertices, CENTER};
    let vs = hex_vertices();
    let points = vs.iter()
        .map(|(x, y)| format!("{:.1},{:.1}", x, y))
        .collect::<Vec<_>>()
        .join(" ");
    view! {
        <polygon points=points fill="#0f172a" stroke="#1f2937" stroke-width="2" />
        <text x=CENTER y={CENTER - 20.0} text-anchor="middle" font-size="38" fill="#334155" font-weight="700" letter-spacing="6">"HEX MONOPOLY"</text>
        <text x=CENTER y={CENTER + 12.0} text-anchor="middle" font-size="14" fill="#475569">"72 tiles · 6 sides · 6 players"</text>
    }
}

#[component]
fn TileShape(index: u32) -> impl IntoView {
    let ctx = use_context::<AppCtx>().expect("app ctx");
    let ((cx, cy), rot, is_corner) = tile_position(index);
    let t = tile_at(index);
    let (w, h) = if is_corner { corner_tile_size() } else { side_tile_size() };

    let fill = match t.kind {
        TileKind::Corner    => "#1f2937".to_string(),
        TileKind::Commodity => "#082f49".to_string(),
        TileKind::Chance    => "#3b0764".to_string(),
        TileKind::Chest     => "#451a03".to_string(),
        TileKind::Property  => "#0b1220".to_string(),
    };

    let stripe_color = match t.kind {
        TileKind::Property => t.color.to_string(),
        TileKind::Commodity => t.color.to_string(),
        _ => "transparent".to_string(),
    };

    let owner_seat = create_memo(move |_| {
        ctx.snapshot.with(|s| s.as_ref().and_then(|s| s.owner_of(index)))
    });
    let owner_color = create_memo(move |_| {
        let seat = owner_seat.get()?;
        ctx.snapshot.with(|s| s.as_ref()
            .and_then(|s| s.players.iter().find(|p| p.seat == seat))
            .map(|p| p.color.clone()))
    });

    let transform = format!("translate({cx:.1},{cy:.1}) rotate({rot:.2})");
    let half_w = w / 2.0;
    let half_h = h / 2.0;

    let name_size = if is_corner { 11.0 } else { 9.0 };
    let price = t.price;
    let name = t.name;
    let sub = t.sub;
    let kind = t.kind.clone();

    view! {
        <g transform=transform filter="url(#tile-shadow)">
            <rect
                x=-half_w y=-half_h width=w height=h rx="6"
                fill=fill stroke="#1e293b" stroke-width="1"
            />

            <Show when=move || matches!(kind, TileKind::Property | TileKind::Commodity)>
                <rect
                    x=-half_w
                    y=-half_h
                    width=w
                    height=h * 0.22
                    fill=stripe_color.clone()
                />
            </Show>

            <Show when=move || owner_color.get().is_some()>
                {move || {
                    let c = owner_color.get().unwrap_or_default();
                    let yy = half_h - h * 0.16;
                    view! {
                        <rect
                            x=-half_w
                            y=yy
                            width=w
                            height=h * 0.16
                            fill=c
                        />
                    }
                }}
            </Show>

            <text
                x=0
                y={-half_h + h * 0.35 + 4.0}
                text-anchor="middle"
                font-size=name_size
                fill="#e5e7eb"
                font-weight="600"
            >
                {name}
            </text>
            <Show when=move || !sub.is_empty()>
                <text x=0 y={-half_h + h * 0.55 + 4.0} text-anchor="middle" font-size=name_size - 2.0 fill="#94a3b8">
                    {sub}
                </text>
            </Show>
            <Show when=move || { price > 0 }>
                <text x=0 y={half_h - h * 0.22} text-anchor="middle" font-size=name_size - 1.0 fill="#fbbf24" font-weight="600">
                    {format!("${price}")}
                </text>
            </Show>
        </g>
    }
}

#[component]
fn PlayerToken(player: Player, stack_index: u32) -> impl IntoView {
    let ((cx, cy), _rot, _is_corner) = tile_position(player.position);
    let angle_step = std::f32::consts::TAU / 6.0;
    let theta = angle_step * stack_index as f32;
    let r = 14.0;
    let token_cx = cx + r * theta.cos();
    let token_cy = cy + r * theta.sin();

    let color = player.color.clone();
    let label = (player.seat + 1).to_string();
    view! {
        <g class="pointer-events-none">
            <circle cx=token_cx cy=token_cy r=12 fill=color stroke="#0f172a" stroke-width="2" />
            <text x=token_cx y=token_cy + 4.0 text-anchor="middle" font-size="12" fill="#0f172a" font-weight="700">
                {label}
            </text>
        </g>
    }
}

// ---------- Row view -------------------------------------------------------

#[component]
fn RowBoard() -> impl IntoView {
    let ctx = use_context::<AppCtx>().expect("app ctx");

    // Side index of the row to display: my own position if known, else the
    // current turn player's position, else side 0.
    let side = create_memo(move |_| {
        ctx.snapshot.with(|s| {
            let s = s.as_ref()?;
            let seat = ctx.my_seat.get().unwrap_or(s.turn.current_seat);
            let p = s.players.iter().find(|p| p.seat == seat)?;
            Some(p.position / TILES_PER_SIDE)
        }).unwrap_or(0)
    });

    let country_name = move || {
        // Any property slot (e.g. slot 1) on the side carries the country name.
        let s = side.get();
        let t = tile_at(s * TILES_PER_SIDE + 1);
        if t.country.is_empty() { "" } else { t.country }
    };

    view! {
        <div class="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 pt-16">
            <div class="text-zinc-400 text-sm tracking-widest uppercase">
                {move || format!("Side {} · {}", side.get() + 1, country_name())}
            </div>
            <div class="w-full flex-1 max-h-[70vh] flex gap-2">
                {move || {
                    let s = side.get();
                    (0..TILES_PER_SIDE).map(|slot| {
                        let idx = s * TILES_PER_SIDE + slot;
                        view! { <RowCard tile_index=idx/> }
                    }).collect_view()
                }}
            </div>
        </div>
    }
}

#[component]
fn RowCard(tile_index: u32) -> impl IntoView {
    let ctx = use_context::<AppCtx>().expect("app ctx");
    let t = tile_at(tile_index);

    let bg = match t.kind {
        TileKind::Corner    => "bg-zinc-800",
        TileKind::Commodity => "bg-sky-950",
        TileKind::Chance    => "bg-purple-950",
        TileKind::Chest     => "bg-amber-950",
        TileKind::Property  => "bg-zinc-900",
    };

    let (has_stripe, stripe_color) = match t.kind {
        TileKind::Property | TileKind::Commodity => (true, t.color.to_string()),
        _ => (false, String::new()),
    };

    let owner_color = create_memo(move |_| {
        let seat = ctx.snapshot.with(|s| s.as_ref().and_then(|s| s.owner_of(tile_index)))?;
        ctx.snapshot.with(|s| s.as_ref()
            .and_then(|s| s.players.iter().find(|p| p.seat == seat))
            .map(|p| p.color.clone()))
    });

    let here = create_memo(move |_| {
        ctx.snapshot.with(|s| s.as_ref()
            .map(|s| s.players.iter().filter(|p| p.position == tile_index).cloned().collect::<Vec<_>>())
            .unwrap_or_default())
    });

    let is_mine_tile = create_memo(move |_| {
        let my = match ctx.my_seat.get() { Some(s) => s, None => return false };
        ctx.snapshot.with(|s| s.as_ref()
            .and_then(|s| s.players.iter().find(|p| p.seat == my))
            .map(|p| p.position == tile_index)
            .unwrap_or(false))
    });

    let name  = t.name;
    let sub   = t.sub;
    let price = t.price;

    view! {
        <div
            class=move || {
                let ring = if is_mine_tile.get() { "ring-2 ring-amber-400" } else { "ring-1 ring-zinc-700" };
                format!("relative flex-1 min-w-0 flex flex-col rounded-md overflow-hidden {bg} {ring}")
            }
        >
            <Show when=move || { has_stripe }>
                <div class="h-3 w-full" style:background-color=stripe_color.clone()></div>
            </Show>

            <div class="flex-1 flex flex-col items-center justify-center text-center px-2 py-3 gap-1">
                <div class="text-zinc-100 font-semibold text-sm leading-tight break-words">{name}</div>
                <Show when=move || !sub.is_empty()>
                    <div class="text-zinc-400 text-[10px] leading-tight">{sub}</div>
                </Show>
                <Show when=move || { price > 0 }>
                    <div class="text-amber-300 font-mono text-sm mt-1">{format!("${price}")}</div>
                </Show>
            </div>

            <div class="flex items-center justify-center gap-1 px-2 pb-2 min-h-[22px]">
                {move || here.get().into_iter().map(|p| {
                    let color = p.color.clone();
                    let label = (p.seat + 1).to_string();
                    view! {
                        <span
                            class="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-zinc-950 border border-zinc-950"
                            style:background-color=color
                        >{label}</span>
                    }
                }).collect_view()}
            </div>

            <Show when=move || owner_color.get().is_some()>
                <div
                    class="h-1.5 w-full"
                    style:background-color=move || owner_color.get().unwrap_or_default()
                ></div>
            </Show>
        </div>
    }
}
