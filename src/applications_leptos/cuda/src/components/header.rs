use leptos::*;

use crate::chapters::{chapter_index, CHAPTERS};
use crate::{current_section, current_slug, NavOpen, Section};

#[component]
pub fn Header() -> impl IntoView {
    let nav_open = use_context::<NavOpen>().expect("NavOpen context").0;
    let slug = current_slug();
    let section = current_section();
    let total = CHAPTERS.len();

    let chapter_number = move || chapter_index(&slug.get()) + 1;

    let counter = move || match section.get() {
        Section::LeetGpu => view! {
            <span class="text-emerald-400 font-mono">"LeetGPU"</span>
        }.into_view(),
        Section::Chapter(_) => view! {
            <>
                "Chapter "
                <span class="text-violet-400 font-mono">{move || chapter_number().to_string()}</span>
                " / "
                {total}
            </>
        }.into_view(),
    };

    view! {
        <header class="border-b border-zinc-800 sticky top-1 bg-zinc-950/95 backdrop-blur-sm z-40">
            <div class="px-4 py-3 flex items-center gap-3">
                // Mobile hamburger
                <button
                    on:click=move |_| nav_open.set(true)
                    class="lg:hidden w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center"
                    aria-label="Open chapters"
                >
                    <svg class="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <a href="/" class="flex items-center gap-2 mr-auto">
                    <span class="text-emerald-400 font-bold">"⚡"</span>
                    <span class="font-bold">"CUDA"</span>
                    <span class="text-zinc-500 text-xs hidden sm:inline">"— a practical walkthrough"</span>
                </a>

                <div class="hidden sm:block text-xs text-zinc-500">
                    {counter}
                </div>
            </div>
        </header>
    }
}
