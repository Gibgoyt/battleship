use leptos::*;
use leptos_router::A;

use crate::leetgpu::PROBLEMS;

/// Tile browser at /cuda/leetgpu. Renders one card per registered Problem.
///
/// Adding a tile: append a Problem to PROBLEMS in `crate::leetgpu`. No code
/// change here required.
#[component]
pub fn LeetGpuIndex() -> impl IntoView {
    view! {
        <header class="mb-10">
            <div class="flex items-center gap-3 mb-3">
                <span class="text-3xl">"⚡"</span>
                <h2 class="text-3xl font-black text-white m-0">"LeetGPU"</h2>
            </div>
            <p class="text-zinc-400 italic">
                "Annotated CUDA solutions to LeetGPU problems. Each tile opens a heavily commented "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">".cu"</code>
                " file rendered inline with proper syntax highlighting."
            </p>
        </header>

        <section class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PROBLEMS
                .iter()
                .map(|p| {
                    let slug = p.slug;
                    let title = p.title;
                    let tagline = p.tagline;
                    let diff_label = p.difficulty.label();
                    let diff_class = p.difficulty.pill_classes();
                    let href = format!("/cuda/leetgpu/{}", slug);

                    view! {
                        <A
                            href=href
                            class="group p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-emerald-500/40 transition-all block"
                        >
                            <div class="flex items-start justify-between gap-3 mb-3">
                                <h3 class="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors m-0">
                                    {title}
                                </h3>
                                <span class=format!("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md font-bold flex-shrink-0 {}", diff_class)>
                                    {diff_label}
                                </span>
                            </div>
                            <p class="text-sm text-zinc-400 m-0 leading-relaxed">
                                {tagline}
                            </p>
                            <div class="mt-4 text-xs text-zinc-500 group-hover:text-emerald-400 transition-colors">
                                "Open solution →"
                            </div>
                        </A>
                    }
                })
                .collect_view()}
        </section>

        <p class="text-xs text-zinc-600 mt-10 leading-relaxed border-t border-zinc-900 pt-6">
            "More problems being added over time. To add one yourself: drop a "
            <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-[11px]">".cu"</code>
            " file under "
            <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-[11px]">"src/chapters_content/leetgpu/"</code>
            ", register it in "
            <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-[11px]">"src/leetgpu.rs"</code>
            ", then add a render arm in "
            <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-[11px]">"chapters_content/mod.rs"</code>
            "."
        </p>
    }
}
