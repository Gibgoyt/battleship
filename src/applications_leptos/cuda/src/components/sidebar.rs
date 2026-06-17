use leptos::*;
use leptos_router::A;

use crate::chapters::{CHAPTERS, ROOT};
use crate::{current_section, NavOpen, Section};

#[component]
pub fn Sidebar() -> impl IntoView {
    let nav_open = use_context::<NavOpen>().expect("NavOpen context").0;

    view! {
        // Desktop sticky sidebar
        <aside class="hidden lg:block w-72 flex-shrink-0 border-r border-zinc-800 sticky top-14 self-start h-[calc(100vh-3.5rem)] overflow-y-auto">
            <NavContents/>
        </aside>

        // Mobile drawer
        <Show when=move || nav_open.get() fallback=|| view! { <></> }>
            <div
                class="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                on:click=move |_| nav_open.set(false)
            />
            <aside class="lg:hidden fixed top-0 left-0 bottom-0 w-72 z-50 bg-zinc-950 border-r border-zinc-800 overflow-y-auto">
                <div class="p-3 flex justify-between items-center border-b border-zinc-800">
                    <div class="text-sm font-bold text-emerald-400">"CUDA"</div>
                    <button
                        on:click=move |_| nav_open.set(false)
                        class="text-zinc-400 hover:text-white text-xl leading-none"
                        aria-label="Close"
                    >
                        "×"
                    </button>
                </div>
                <NavContents/>
            </aside>
        </Show>
    }
}

#[component]
fn NavContents() -> impl IntoView {
    view! {
        <ChapterList/>
        <LeetGpuLink/>
    }
}

#[component]
fn ChapterList() -> impl IntoView {
    let nav_open = use_context::<NavOpen>().expect("NavOpen context").0;
    let section = current_section();

    view! {
        <nav class="p-3">
            <div class="text-xs uppercase tracking-wider text-zinc-500 px-2 mb-2">"Walkthrough"</div>
            <ul class="space-y-0.5">
                {CHAPTERS
                    .iter()
                    .enumerate()
                    .map(|(i, ch)| {
                        let ch_slug = ch.slug;
                        let short = ch.short_title;
                        let href = if i == 0 {
                            format!("/{}", ROOT)
                        } else {
                            format!("/{}/{}", ROOT, ch_slug)
                        };
                        let section_for_active = section;
                        let is_active = move || {
                            matches!(section_for_active.get(), Section::Chapter(ref s) if s == ch_slug)
                        };

                        let btn_class = move || {
                            if is_active() {
                                "w-full text-left px-2 py-2 rounded-lg text-sm transition-colors flex items-start gap-2 bg-violet-500/10 text-violet-300"
                            } else {
                                "w-full text-left px-2 py-2 rounded-lg text-sm transition-colors flex items-start gap-2 text-zinc-400 hover:bg-zinc-900 hover:text-white"
                            }
                        };
                        let num_class = move || {
                            if is_active() {
                                "font-mono text-xs mt-0.5 w-6 flex-shrink-0 text-violet-400"
                            } else {
                                "font-mono text-xs mt-0.5 w-6 flex-shrink-0 text-zinc-600"
                            }
                        };

                        view! {
                            <li>
                                <A
                                    href=href
                                    class=btn_class
                                    on:click=move |_| nav_open.set(false)
                                >
                                    <span class=num_class>
                                        {format!("{:02}", i + 1)}
                                    </span>
                                    <span class="leading-snug">{short}</span>
                                </A>
                            </li>
                        }
                    })
                    .collect_view()}
            </ul>
        </nav>
    }
}

/// Single entry under its own section header. Clicking it goes to
/// /cuda/leetgpu (the tile browser). Stays highlighted while the user is
/// inside any /cuda/leetgpu/... route.
#[component]
fn LeetGpuLink() -> impl IntoView {
    let nav_open = use_context::<NavOpen>().expect("NavOpen context").0;
    let section = current_section();

    let is_active = move || matches!(section.get(), Section::LeetGpu);

    let btn_class = move || {
        if is_active() {
            "w-full text-left px-2 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 bg-emerald-500/10 text-emerald-300"
        } else {
            "w-full text-left px-2 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 text-zinc-400 hover:bg-zinc-900 hover:text-white"
        }
    };

    let icon_class = move || {
        if is_active() {
            "font-mono text-xs w-6 flex-shrink-0 text-emerald-400"
        } else {
            "font-mono text-xs w-6 flex-shrink-0 text-zinc-600"
        }
    };

    view! {
        <nav class="px-3 pb-6 mt-2 border-t border-zinc-800 pt-4">
            <div class="text-xs uppercase tracking-wider text-zinc-500 px-2 mb-2">"Practice"</div>
            <ul class="space-y-0.5">
                <li>
                    <A
                        href="/cuda/leetgpu"
                        class=btn_class
                        on:click=move |_| nav_open.set(false)
                    >
                        <span class=icon_class>"⚡"</span>
                        <span class="leading-snug font-medium">"LeetGPU"</span>
                    </A>
                </li>
            </ul>
            <p class="text-[10px] text-zinc-600 px-2 mt-3 leading-snug">
                "Annotated CUDA solutions, one per tile. Grows over time."
            </p>
        </nav>
    }
}
