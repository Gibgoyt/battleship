/// Source of truth for the four "walkthrough" chapters that live in the
/// left sidebar. Anything that is part of the conceptual CUDA walkthrough
/// (host API, memory model, launch semantics, etc.) lives here.
///
/// The LeetGPU problem set is a SEPARATE registry, see `crate::leetgpu`.
/// It is shown as a tile browser at /cuda/leetgpu, not in the sidebar.
///
/// To add a NEW walkthrough chapter:
///   1. Append a `Chapter { slug, short_title, title }` entry below.
///   2. Add a matching slug to `chapters_for_astro.ts` so Astro prerenders
///      the route.
///   3. Create `src/chapters_content/chNN_<topic>.rs` with a `ChNN`
///      component and register it in `chapters_content/mod.rs`.
///   4. Add the slug arm to `render_chapter()` in `chapters_content/mod.rs`.
pub struct Chapter {
    pub slug: &'static str,
    pub title: &'static str,
    pub short_title: &'static str,
}

pub const ROOT: &str = "cuda";

pub const CHAPTERS: &[Chapter] = &[
    Chapter {
        slug: "dim3-and-int3",
        short_title: "dim3 & int3",
        title: "1. dim3 and int3 — How CUDA Indexes Threads",
    },
    Chapter {
        slug: "memory-spaces",
        short_title: "Memory Spaces",
        title: "2. Memory Spaces — __global__, __shared__, local, __constant__",
    },
    Chapter {
        slug: "async-and-sync",
        short_title: "Async & Sync",
        title: "3. Launch Is Async — Streams and Synchronization",
    },
    Chapter {
        slug: "malloc-memcpy-free",
        short_title: "malloc / memcpy / free",
        title: "4. cudaMalloc, cudaMemcpy, cudaFree — The Host-Side API",
    },
    Chapter {
        slug: "higher-level-libraries",
        short_title: "Thrust, cuBLAS, cuFFT",
        title: "5. Higher-level Libraries — Thrust, cuBLAS, cuFFT",
    },
    Chapter {
        slug: "bibliography",
        short_title: "Bibliography",
        title: "6. Bibliography & References",
    },
];

pub fn chapter_by_slug(slug: &str) -> &'static Chapter {
    CHAPTERS
        .iter()
        .find(|c| c.slug == slug)
        .unwrap_or(&CHAPTERS[0])
}

pub fn chapter_index(slug: &str) -> usize {
    CHAPTERS.iter().position(|c| c.slug == slug).unwrap_or(0)
}
