use leptos::*;

// --- Walkthrough chapters (shown in the left sidebar) ----------------------
mod ch01_dim3_and_int3;
mod ch02_memory_spaces;
mod ch03_async_and_sync;
mod ch04_malloc_memcpy_free;
mod ch05_higher_level_libraries;
mod ch06_bibliography;

pub use ch01_dim3_and_int3::Ch01;
pub use ch02_memory_spaces::Ch02;
pub use ch03_async_and_sync::Ch03;
pub use ch04_malloc_memcpy_free::Ch04;
pub use ch05_higher_level_libraries::Ch05;
pub use ch06_bibliography::Ch06;

// --- LeetGPU sub-section (NOT in the sidebar; lives at /cuda/leetgpu) ------
mod leetgpu_index;
mod leetgpu_multi_head_self_attention;

pub use leetgpu_index::LeetGpuIndex;
pub use leetgpu_multi_head_self_attention::LeetGpuMultiHeadSelfAttention;

/// Map a walkthrough-chapter slug to its Leptos view. Unknown / empty slugs
/// fall back to the first chapter -- matches the laplace sibling guide.
///
/// To add a new walkthrough chapter:
///   1. Add a module + pub use above.
///   2. Add a match arm here.
///   3. Add the entry to CHAPTERS in chapters.rs and to chapters_for_astro.ts.
pub fn render_chapter(slug: &str) -> View {
    match slug {
        "" | "dim3-and-int3" => view! { <Ch01/> }.into_view(),
        "memory-spaces" => view! { <Ch02/> }.into_view(),
        "async-and-sync" => view! { <Ch03/> }.into_view(),
        "malloc-memcpy-free" => view! { <Ch04/> }.into_view(),
        "higher-level-libraries" => view! { <Ch05/> }.into_view(),
        "bibliography" => view! { <Ch06/> }.into_view(),
        _ => view! { <Ch01/> }.into_view(),
    }
}

/// Map a LeetGPU problem slug to its solution view. Unknown slugs fall back
/// to the tile-browser index so a stale URL still lands somewhere useful.
///
/// To add a new LeetGPU problem:
///   1. Add a module + pub use above.
///   2. Add a match arm here.
///   3. Append the Problem entry to PROBLEMS in leetgpu.rs and the slug
///      to leetgpuProblemSlugs in chapters_for_astro.ts.
pub fn render_leetgpu_problem(slug: &str) -> View {
    match slug {
        "multi-head-self-attention" => view! { <LeetGpuMultiHeadSelfAttention/> }.into_view(),
        _ => view! { <LeetGpuIndex/> }.into_view(),
    }
}
