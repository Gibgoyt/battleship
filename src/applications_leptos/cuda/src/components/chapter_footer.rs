use leptos::*;
use leptos_router::A;

use crate::chapters::{chapter_index, CHAPTERS, ROOT};
use crate::{current_section, current_slug, Section};

/// Prev/Next links shown under every walkthrough chapter. Hidden inside the
/// LeetGPU sub-section so the tile browser feels like its own surface.
#[component]
pub fn ChapterFooter() -> impl IntoView {
    let slug = current_slug();
    let section = current_section();
    let total = CHAPTERS.len();

    view! {
        {move || {
            // Hide on LeetGPU pages — they have their own internal navigation
            // via the tile browser.
            if matches!(section.get(), Section::LeetGpu) {
                return view! { <></> }.into_view();
            }

            let idx = chapter_index(&slug.get());
            let prev = if idx > 0 { Some(&CHAPTERS[idx - 1]) } else { None };
            let next = if idx + 1 < total { Some(&CHAPTERS[idx + 1]) } else { None };

            let prev_view = match prev {
                Some(ch) => {
                    let title = ch.title;
                    let href = if idx - 1 == 0 {
                        format!("/{}", ROOT)
                    } else {
                        format!("/{}/{}", ROOT, ch.slug)
                    };
                    view! {
                        <A
                            href=href
                            class="text-left p-4 rounded-xl border border-zinc-800 hover:border-violet-400 hover:bg-zinc-900/50 transition-all group block"
                        >
                            <div class="text-xs text-zinc-500 mb-1">"← Previous"</div>
                            <div class="font-bold text-white group-hover:text-violet-400 transition-colors">
                                {title}
                            </div>
                        </A>
                    }.into_view()
                }
                None => view! { <div /> }.into_view(),
            };

            let next_view = match next {
                Some(ch) => {
                    let title = ch.title;
                    let href = format!("/{}/{}", ROOT, ch.slug);
                    view! {
                        <A
                            href=href
                            class="text-right p-4 rounded-xl border border-zinc-800 hover:border-violet-400 hover:bg-zinc-900/50 transition-all group block sm:col-start-2"
                        >
                            <div class="text-xs text-zinc-500 mb-1">"Next →"</div>
                            <div class="font-bold text-white group-hover:text-violet-400 transition-colors">
                                {title}
                            </div>
                        </A>
                    }.into_view()
                }
                // After the last walkthrough chapter, point at LeetGPU as a
                // natural next destination.
                None => view! {
                    <A
                        href="/cuda/leetgpu"
                        class="text-right p-4 rounded-xl border border-zinc-800 hover:border-emerald-400 hover:bg-zinc-900/50 transition-all group block sm:col-start-2"
                    >
                        <div class="text-xs text-zinc-500 mb-1">"Practice →"</div>
                        <div class="font-bold text-white group-hover:text-emerald-400 transition-colors">
                            "LeetGPU Solutions"
                        </div>
                    </A>
                }.into_view(),
            };

            view! {
                <div class="mt-16 pt-8 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {prev_view}
                    {next_view}
                </div>
            }.into_view()
        }}
    }
}
