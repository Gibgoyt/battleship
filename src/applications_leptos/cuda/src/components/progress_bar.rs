use leptos::*;

use crate::chapters::{chapter_index, CHAPTERS};
use crate::{current_section, current_slug, Section};

/// Reading progress bar pinned to the top. For walkthrough chapters this is
/// (chapter_index + 1) / total. Anywhere under /cuda/leetgpu it fills 100%
/// in a different color so the UX clearly signals "different sub-app".
#[component]
pub fn ProgressBar() -> impl IntoView {
    let slug = current_slug();
    let section = current_section();
    let total = CHAPTERS.len();

    let progress = move || {
        match section.get() {
            Section::LeetGpu => 100.0,
            Section::Chapter(_) => {
                let idx = chapter_index(&slug.get());
                ((idx + 1) as f64 / total as f64) * 100.0
            }
        }
    };

    let bar_class = move || match section.get() {
        Section::LeetGpu => {
            "h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-cyan-400 transition-all duration-300"
        }
        Section::Chapter(_) => {
            "h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 transition-all duration-300"
        }
    };

    view! {
        <div class="fixed top-0 left-0 right-0 z-50 h-1 bg-zinc-900">
            <div
                class=bar_class
                style=move || format!("width: {}%", progress())
            />
        </div>
    }
}
