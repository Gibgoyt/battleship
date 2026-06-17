use leptos::*;

use crate::board::{corner_large_size, corner_rotation, side_tile_size, tile_position};
use crate::components::app::{AppCtx, ViewMode};
use crate::state::Player;
use crate::tiles::{tile_at, TileKind, N_TILES, TILES_PER_SIDE};

// Visible viewBox of the hex (board.rs vertices live in 0..1000; the hex
// itself occupies roughly x:102..898, y:40..960 — we pad ~40 around it).
const FRAME_X0: f32 = 60.0;
const FRAME_Y0: f32 = 30.0;
const FRAME_W:  f32 = 880.0;
const FRAME_H:  f32 = 940.0;

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
        <div class="absolute top-3 left-1/2 -translate-x-1/2 z-20
                    flex bg-zinc-900/80 backdrop-blur border border-zinc-700 rounded-full p-1">
            <button class=move || btn_cls(is_full())
                    on:click=move |_| ctx.view_mode.set(ViewMode::Full)>"Full"</button>
            <button class=move || btn_cls(is_row())
                    on:click=move |_| ctx.view_mode.set(ViewMode::Row)>"Row"</button>
        </div>
    }
}

// ---------- Full view (hybrid SVG underlay + HTML tile overlay) -----------

#[component]
fn FullBoard() -> impl IntoView {
    view! {
        <div class="absolute inset-0 grid place-items-center overflow-hidden">
            <div class="relative max-w-full max-h-full h-full"
                 style="aspect-ratio: 880 / 940; container-type: inline-size;">
                <BoardBackground/>
                <div class="absolute inset-0">
                    {(0..N_TILES).map(|i| view! { <HtmlTile index=i/> }).collect_view()}
                    <PlayerTokens/>
                </div>
            </div>
        </div>
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
        <svg viewBox="60 30 880 940"
             preserveAspectRatio="xMidYMid meet"
             class="absolute inset-0 w-full h-full pointer-events-none"
             xmlns="http://www.w3.org/2000/svg">
            <polygon points=points fill="#0f172a" stroke="#1f2937" stroke-width="2"/>
            <text x=CENTER y={CENTER - 18.0} text-anchor="middle"
                  font-size="38" fill="#334155" font-weight="700" letter-spacing="6">
                "HEX MONOPOLY"
            </text>
            <text x=CENTER y={CENTER + 14.0} text-anchor="middle" font-size="14" fill="#475569">
                "72 tiles · 6 sides · 6 players"
            </text>
        </svg>
    }
}

#[component]
fn HtmlTile(index: u32) -> impl IntoView {
    let ctx = use_context::<AppCtx>().expect("app ctx");
    let ((cx, cy), side_rot, is_corner) = tile_position(index);
    let t = tile_at(index);
    let (w, h) = if is_corner { corner_large_size() } else { side_tile_size() };
    let rot = if is_corner {
        let side = (index / TILES_PER_SIDE) as usize % 6;
        corner_rotation(side)
    } else {
        side_rot
    };

    let lx = (cx - FRAME_X0) / FRAME_W * 100.0;
    let ly = (cy - FRAME_Y0) / FRAME_H * 100.0;
    let lw = w / FRAME_W * 100.0;
    let lh = h / FRAME_H * 100.0;

    let bg = match t.kind {
        TileKind::Corner    => "#1f2937",
        TileKind::Commodity => "#082f49",
        TileKind::Chance    => "#3b0764",
        TileKind::Chest     => "#451a03",
        TileKind::Property  => "#0b1220",
    };

    let (has_stripe, stripe_color) = match t.kind {
        TileKind::Property | TileKind::Commodity => (true, t.color.to_string()),
        _ => (false, String::new()),
    };

    let owner_color = create_memo(move |_| {
        let seat = ctx.snapshot.with(|s| s.as_ref().and_then(|s| s.owner_of(index)))?;
        ctx.snapshot.with(|s| s.as_ref()
            .and_then(|s| s.players.iter().find(|p| p.seat == seat))
            .map(|p| p.color.clone()))
    });

    let name  = t.name;
    let sub   = t.sub;
    let price = t.price;

    // Corner tiles get a trapezoid wider on the outer (top in unrotated div) edge.
    let clip = if is_corner {
        "clip-path: polygon(0% 0%, 100% 0%, 78% 100%, 22% 100%);"
    } else { "" };
    let border = if is_corner {
        "border:1px solid #3f3f46;"
    } else {
        "border:1px solid #1e293b;"
    };

    let style = format!(
        "position:absolute; left:{lx:.3}%; top:{ly:.3}%; \
         width:{lw:.3}%; height:{lh:.3}%; \
         transform: translate(-50%, -50%) rotate({rot:.3}deg); \
         background:{bg}; border-radius:4px; overflow:hidden; \
         display:flex; flex-direction:column; box-sizing:border-box; \
         {border}{clip}"
    );

    let (name_fs, sub_fs, price_fs) = if is_corner {
        ("clamp(10px, 1.7cqi, 18px)",
         "clamp(8px, 1.15cqi, 13px)",
         "clamp(8px, 1.1cqi, 13px)")
    } else {
        ("clamp(7px, 1.05cqi, 13px)",
         "clamp(6px, 0.85cqi, 11px)",
         "clamp(7px, 1.0cqi, 12px)")
    };

    let name_style  = format!("font-size:{name_fs}; font-weight:600; color:#e5e7eb; line-height:1.1;");
    let sub_style   = format!("font-size:{sub_fs}; color:#94a3b8; line-height:1.0;");
    let price_style = format!("font-size:{price_fs}; color:#fbbf24; font-weight:600;");

    view! {
        <div style=style>
            // Owner band — outer edge (top of unrotated div).
            <Show when=move || owner_color.get().is_some()>
                <div style=move || format!(
                    "height:12%; width:100%; flex-shrink:0; background:{};",
                    owner_color.get().unwrap_or_default())></div>
            </Show>

            // Content block (name, sub, price), centered.
            <div class="flex-1 flex flex-col items-center justify-center text-center"
                 style="min-height:0; padding:6% 6%; gap:3%;">
                <div style=name_style.clone()>{name}</div>
                <Show when=move || { !sub.is_empty() }>
                    <div style=sub_style.clone()>{sub}</div>
                </Show>
                <Show when=move || { price > 0 }>
                    <div style=price_style.clone()>{format!("${price}")}</div>
                </Show>
            </div>

            // Color stripe — inner edge (bottom of unrotated div).
            <Show when=move || { has_stripe }>
                <div style=format!(
                    "height:16%; width:100%; flex-shrink:0; background:{stripe_color};")></div>
            </Show>
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
fn PlayerToken(player: Player, stack_index: u32) -> impl IntoView {
    let ((cx, cy), _rot, _is_corner) = tile_position(player.position);
    let angle_step = std::f32::consts::TAU / 6.0;
    let theta = angle_step * stack_index as f32;
    let r = 14.0;
    let token_cx = cx + r * theta.cos();
    let token_cy = cy + r * theta.sin();
    let lx = (token_cx - FRAME_X0) / FRAME_W * 100.0;
    let ly = (token_cy - FRAME_Y0) / FRAME_H * 100.0;
    let color = player.color.clone();
    let label = (player.seat + 1).to_string();

    let style = format!(
        "position:absolute; left:{lx:.3}%; top:{ly:.3}%; \
         transform: translate(-50%, -50%); \
         width: clamp(14px, 2.4cqi, 28px); height: clamp(14px, 2.4cqi, 28px); \
         border-radius: 9999px; background:{color}; \
         border: 2px solid #0f172a; \
         display: grid; place-items: center; \
         color: #0f172a; font-weight: 700; \
         font-size: clamp(8px, 1.3cqi, 14px); \
         pointer-events: none; z-index: 5;"
    );
    view! { <div style=style>{label}</div> }
}

// ---------- Row view -------------------------------------------------------

#[component]
fn RowBoard() -> impl IntoView {
    let ctx = use_context::<AppCtx>().expect("app ctx");
    let side = create_memo(move |_| {
        ctx.snapshot.with(|s| {
            let s = s.as_ref()?;
            let seat = ctx.my_seat.get().unwrap_or(s.turn.current_seat);
            let p = s.players.iter().find(|p| p.seat == seat)?;
            Some(p.position / TILES_PER_SIDE)
        }).unwrap_or(0)
    });

    let country_name = move || {
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
