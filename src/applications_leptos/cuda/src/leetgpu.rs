/// LeetGPU problem registry.
///
/// Every entry here becomes a tile on the /cuda/leetgpu landing page and a
/// route at /cuda/leetgpu/<slug>. Kept INTENTIONALLY separate from the
/// walkthrough chapters in `crate::chapters` so the sidebar stays
/// pedagogical and the LeetGPU collection can grow freely.
///
/// =========================================================================
/// To add a new LeetGPU problem:
///
///   1. Drop the (annotated) .cu file under
///      `src/chapters_content/leetgpu/<your_problem>.cu`.
///
///   2. Append a `Problem { slug, title, difficulty, tagline }` to PROBLEMS
///      below. Keep the slug kebab-case and stable (it goes in the URL).
///
///   3. Create `src/chapters_content/leetgpu_<your_problem>.rs` that:
///        - re-states the LeetGPU problem at the top (transcribed from
///          the LeetGPU page, including examples and constraints),
///        - explains the solution approach in prose,
///        - renders the .cu via
///            include_str!("./leetgpu/<your_problem>.cu")
///          inside a <pre><code class="language-cpp"> block.
///
///   4. Register the module in `chapters_content/mod.rs` and add a render
///      arm to `render_leetgpu_problem()`.
///
///   5. Append the slug to `leetgpuProblemSlugs` in
///      `chapters_for_astro.ts` so Astro prerenders the route at build time.
/// =========================================================================
pub struct Problem {
    pub slug: &'static str,
    pub title: &'static str,
    pub difficulty: Difficulty,
    pub tagline: &'static str,
}

#[derive(Clone, Copy)]
#[allow(dead_code)] // Easy/Medium are unused until more problems are added
pub enum Difficulty {
    Easy,
    Medium,
    Hard,
}

impl Difficulty {
    pub fn label(self) -> &'static str {
        match self {
            Difficulty::Easy => "Easy",
            Difficulty::Medium => "Medium",
            Difficulty::Hard => "Hard",
        }
    }
    /// Tailwind classes for the pill background and text. Kept inline so the
    /// rendering site does not need a Tailwind plugin to learn new colors.
    pub fn pill_classes(self) -> &'static str {
        match self {
            Difficulty::Easy => "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30",
            Difficulty::Medium => "bg-amber-500/10 text-amber-300 border border-amber-500/30",
            Difficulty::Hard => "bg-rose-500/10 text-rose-300 border border-rose-500/30",
        }
    }
}

pub const PROBLEMS: &[Problem] = &[
    Problem {
        slug: "multi-head-self-attention",
        title: "Multi-Head Attention",
        difficulty: Difficulty::Hard,
        tagline: "FlashAttention-2 with tiled softmax and on-the-fly renormalization. No N×N matrix is ever materialized.",
    },
];

#[allow(dead_code)] // exported for future use by chapter components
pub fn problem_by_slug(slug: &str) -> Option<&'static Problem> {
    PROBLEMS.iter().find(|p| p.slug == slug)
}
