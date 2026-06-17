use leptos::*;

use crate::board::{corner_tile_size, side_tile_size, tile_position, SIZE};
use crate::components::app::{AppCtx, ViewMode};
use crate::state::Player;
use crate::tiles::{tile_at, TileKind, N_TILES};

#[component]
pub fn BoardContainer() -> impl IntoView {
    let ctx = use_context::<AppCtx>().expect("app ctx");
    view! {
        <div class="relative w-full h-full">
             <div class="absolute top-4 left-4 z-10 flex gap-2">
                <button on:click=move |_| ctx.view_mode.set(ViewMode::Full) class="px-3 py-1 bg-zinc-800 text-white rounded">"Full View"</button>
                <button on:click=move |_| ctx.view_mode.set(ViewMode::Row) class="px-3 py-1 bg-zinc-800 text-white rounded">"Row View"</button>
            </div>
            {move || match ctx.view_mode.get() {
                ViewMode::Full => view! { <FullBoard/> }.into_view(),
                ViewMode::Row  => view! { <RowBoard/> }.into_view(),
            }}
        </div>
    }
}

#[component]
fn FullBoard() -> impl IntoView {
    let ctx = use_context::<AppCtx>().expect("app ctx");

    // Effect to focus on current player
    create_effect(move |_| {
        let snapshot = ctx.snapshot.get();
        let my_seat = ctx.my_seat.get();
        if let (Some(s), Some(my_s)) = (snapshot, my_seat) {
            if my_s == s.turn.current_seat {
                let player = s.players.iter().find(|p| p.seat == my_s);
                if let Some(p) = player {
                    let (pos, _, _) = crate::board::tile_position(p.position);
                    ctx.view_center.set(pos);
                }
            }
        }
    });

    let vb = move || {
        let zoom = ctx.zoom_level.get();
        let (cx, cy) = ctx.view_center.get();
        let view_size = SIZE / zoom;
        let min_x = cx - view_size / 2.0;
        let min_y = cy - view_size / 2.0;
        format!("{min_x:.1} {min_y:.1} {view_size:.1} {view_size:.1}")
    };

    view! {
        <div class="w-full h-full grid place-items-center">
            <div class="relative w-full max-w-[min(96vh,1100px)] aspect-square">
                <div class="absolute top-4 right-4 z-10 flex gap-2">
                    <button on:click=move |_| ctx.zoom_level.set((ctx.zoom_level.get() * 1.2).min(5.0)) class="px-3 py-1 bg-zinc-800 text-white rounded">"+"</button>
                    <button on:click=move |_| ctx.zoom_level.set((ctx.zoom_level.get() / 1.2).max(1.0)) class="px-3 py-1 bg-zinc-800 text-white rounded">"-"</button>
                    <button on:click=move |_| { ctx.zoom_level.set(1.0); ctx.view_center.set((SIZE/2.0, SIZE/2.0)) } class="px-3 py-1 bg-zinc-800 text-white rounded">"Reset"</button>
                </div>
                <svg
                    viewBox=vb
                    class="w-full h-full select-none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <filter id="tile-shadow" x="-10%" y="-10%" width="120%" height="120%">
                            <feDropShadow dx="0" dy="1" stdDeviation="0.8" flood-color="black" flood-opacity="0.35"/>
                        </filter>
                    </defs>

                    <BoardBackground/>

                    {(0..N_TILES).map(|i| view! { <TileShape index=i/> }).collect_view()}

                    {move || {
                        let snap = ctx.snapshot.get();
                        let players = snap.map(|s| s.players).unwrap_or_default();
                        players.into_iter().enumerate().map(|(i, p)| view! { <PlayerToken player=p stack_index=i as u32/> }).collect_view()
                    }}
                </svg>
            </div>
        </div>
    }
}

#[component]
fn RowBoard() -> impl IntoView {
    let ctx = use_context::<AppCtx>().expect("app ctx");
    
    // Simple horizontal layout: 72 tiles side by side
    view! {
        <div class="w-full h-full overflow-x-auto flex items-center p-4 bg-zinc-900">
            <div class="flex gap-2">
                {(0..N_TILES).map(|i| {
                    let t = tile_at(i);
                    view! {
                        <div class="w-32 h-48 border border-zinc-700 rounded p-2 flex flex-col justify-between bg-zinc-800">
                            <div class="text-xs font-bold text-zinc-300">{t.name}</div>
                            <div class="text-amber-300 font-mono text-sm">{format!("${}", t.price)}</div>
                        </div>
                    }
                }).collect_view()}
            </div>
        </div>
    }
}

#[component]
fn BoardBackground() -> impl IntoView {
    use crate::board::hex_vertices;
    let vs = hex_vertices();
    let points = vs.iter()
        .map(|(x, y)| format!("{:.1},{:.1}", x, y))
        .collect::<Vec<_>>()
        .join(" ");
    view! {
        <polygon points=points fill="#0f172a" stroke="#1f2937" stroke-width="2" />
        <text x={SIZE / 2.0} y={SIZE / 2.0 - 20.0} text-anchor="middle" font-size="38" fill="#334155" font-weight="700" letter-spacing="6">"HEX MONOPOLY"</text>
        <text x={SIZE / 2.0} y={SIZE / 2.0 + 12.0} text-anchor="middle" font-size="14" fill="#475569">"72 tiles · 6 sides · 6 players"</text>
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

    // Tile group: translated to (cx,cy), rotated to side angle, drawn centered at origin.
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

            // Color stripe along the inner edge for properties / commodities.
            <Show when=move || matches!(kind, TileKind::Property | TileKind::Commodity)>
                <rect
                    x=-half_w
                    y=-half_h
                    width=w
                    height=h * 0.22
                    fill=stripe_color.clone()
                />
            </Show>

            // Owner ribbon — colored band on the outer edge.
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
    // Offset tokens so multiple players on the same tile don't fully overlap.
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
