/**
 * Source of truth for the CUDA guide's URL slugs lives in the Rust crate:
 *   - src/chapters.rs       (walkthrough chapters in the sidebar)
 *   - src/leetgpu.rs        (LeetGPU problem registry, shown as tiles)
 *
 * This file exists ONLY so Astro's getStaticPaths() can prerender each
 * /cuda/* route at build time. Slugs MUST stay in sync with the Rust side.
 *
 * URL shape:
 *   /cuda                                      first walkthrough chapter
 *   /cuda/<chapterSlug>                        walkthrough chapter
 *   /cuda/leetgpu                              LeetGPU tile browser
 *   /cuda/leetgpu/<problemSlug>                individual LeetGPU solution
 *
 * To add a new LeetGPU problem later:
 *   1. Append its slug to leetgpuProblemSlugs below.
 *   2. Append a matching entry to PROBLEMS in src/leetgpu.rs.
 *   3. Drop the .cu file under src/chapters_content/leetgpu/.
 *   4. Register a render arm in chapters_content/mod.rs.
 */
export const chapterSlugs = [
  'dim3-and-int3',
  'memory-spaces',
  'async-and-sync',
  'malloc-memcpy-free',
  'higher-level-libraries',
  'bibliography',
] as const

export const leetgpuProblemSlugs = [
  'multi-head-self-attention',
] as const

export const allCudaPaths = [
  ...chapterSlugs,
  'leetgpu',
  ...leetgpuProblemSlugs.map((s) => `leetgpu/${s}`),
] as const
