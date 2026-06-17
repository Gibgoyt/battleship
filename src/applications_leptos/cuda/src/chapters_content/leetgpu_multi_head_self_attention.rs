use leptos::*;
use leptos_router::A;

/// The .cu source ships INSIDE the WASM via include_str!. Single source of
/// truth: the file under src/chapters_content/leetgpu/. To update the
/// solution, edit the .cu file directly. The Astro page provides highlight.js
/// (loaded once in <head>) and re-tokenizes after every route change.
const MHSA_CU: &str = include_str!("./leetgpu/multi_head_self_attention.cu");

#[component]
pub fn LeetGpuMultiHeadSelfAttention() -> impl IntoView {
    view! {
        // -- breadcrumb --------------------------------------------------
        <div class="mb-6 text-xs text-zinc-500 flex items-center gap-1.5">
            <A href="/cuda/leetgpu" class="hover:text-emerald-300 transition-colors">"⚡ LeetGPU"</A>
            <span>"/"</span>
            <span class="text-zinc-400">"Multi-Head Attention"</span>
        </div>

        // -- title + difficulty pill -------------------------------------
        <header class="mb-8">
            <div class="flex items-start justify-between gap-4 mb-2 flex-wrap">
                <h2 class="text-3xl font-black text-white m-0">"Multi-Head Attention"</h2>
                <span class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                    "Hard"
                </span>
            </div>
            <p class="text-zinc-400 italic m-0">
                "Problem transcribed from LeetGPU. Solution uses FlashAttention-2 — tiled softmax with running max/sum so the N×N attention matrix is never materialized."
            </p>
        </header>

        <section class="space-y-5 text-zinc-300 leading-relaxed">

            // -- problem statement -------------------------------------------
            <h3 class="text-xl font-bold text-white mt-4 mb-3">"Problem"</h3>
            <p>
                "Implement a program for multi-head self-attention. Given three input matrices "
                <strong class="text-emerald-300">"Q"</strong>" (queries), "
                <strong class="text-emerald-300">"K"</strong>" (keys), and "
                <strong class="text-emerald-300">"V"</strong>" (values) of size "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"N × d_model"</code>", compute:"
            </p>
            <div class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 font-mono text-center text-emerald-300">
                "MultiHead(Q, K, V) = Concat(head₁, …, head_h)"
            </div>
            <p>"where each head computes:"</p>
            <div class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 font-mono text-center text-emerald-300">
                "headᵢ = softmax( Qᵢ Kᵢᵀ / √d_k ) Vᵢ"
            </div>
            <p>
                "with "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"d_k = d_model / h"</code>" and "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"Qᵢ, Kᵢ, Vᵢ"</code>
                " being the i-th head's partition of the input matrices (columns "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"[i·d_k, (i+1)·d_k)"</code>
                ")."
            </p>

            // -- implementation requirements --------------------------------
            <h3 class="text-xl font-bold text-white mt-10 mb-3">"Implementation Requirements"</h3>
            <ul class="list-disc pl-6 space-y-1">
                <li>"Use only native features (external libraries are not permitted)."</li>
                <li>"The "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"solve"</code>" function signature must remain unchanged."</li>
                <li>"The final result must be stored in the "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"output"</code>" array."</li>
            </ul>

            // -- examples ----------------------------------------------------
            <h3 class="text-xl font-bold text-white mt-10 mb-3">"Example 1"</h3>
            <div class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 font-mono text-sm overflow-x-auto space-y-2 text-zinc-300">
                <div><span class="text-zinc-500">"Input:"</span></div>
                <div>"N = 2,  d_model = 4,  h = 2"</div>
                <div>"Q = [[1.0  0.0  2.0  3.0]"</div>
                <div>"     [4.0  5.0  6.0  7.0]]"</div>
                <div>"K = [[1.0  2.0  3.0  4.0]"</div>
                <div>"     [5.0  6.0  7.0  8.0]]"</div>
                <div>"V = [[0.5  1.0  1.5  2.0]"</div>
                <div>"     [2.5  3.0  3.5  4.0]]"</div>
                <div class="mt-3"><span class="text-zinc-500">"Output:"</span></div>
                <div>"[[2.39  2.89  3.50  4.00]"</div>
                <div>" [2.50  3.00  3.50  4.00]]"</div>
            </div>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"Example 2"</h3>
            <div class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 font-mono text-sm overflow-x-auto space-y-2 text-zinc-300">
                <div><span class="text-zinc-500">"Input:"</span></div>
                <div>"N = 1,  d_model = 2,  h = 1"</div>
                <div>"Q = [1.0  1.0]"</div>
                <div>"K = [1.0  1.0]"</div>
                <div>"V = [2.0  3.0]"</div>
                <div class="mt-3"><span class="text-zinc-500">"Output:"</span></div>
                <div>"[2.0  3.0]"</div>
            </div>

            // -- constraints -------------------------------------------------
            <h3 class="text-xl font-bold text-white mt-10 mb-3">"Constraints"</h3>
            <ul class="list-disc pl-6 space-y-1 font-mono text-sm">
                <li><code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"1 ≤ N ≤ 10000"</code></li>
                <li><code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"2 ≤ d_model ≤ 1024"</code></li>
                <li><code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"1 ≤ h ≤ d_model"</code></li>
                <li><code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"d_model % h == 0"</code></li>
                <li><code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"-10.0 ≤ values ≤ 10.0"</code></li>
                <li>"Performance is measured with "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"N = 1024"</code>" and "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"d_model = 1024"</code>"."</li>
            </ul>

            // -- approach ---------------------------------------------------
            <h3 class="text-xl font-bold text-white mt-10 mb-3">"Approach — FlashAttention-2"</h3>
            <p>
                "The naive softmax(QK"<sup>"T"</sup>"/√d)V costs O(N² · d) work AND requires materializing the N×N attention matrix in global memory. For the benchmark size (N = d_model = 1024) that's ~4 MiB per head per batch — feasible but wasteful. For longer sequences it is catastrophic."
            </p>
            <p>
                <a href="https://arxiv.org/pdf/2307.08691" target="_blank" rel="noopener" class="text-emerald-400 hover:underline">"FlashAttention-2"</a>
                " avoids ever writing the N×N matrix anywhere:"
            </p>
            <ol class="list-decimal pl-6 space-y-2">
                <li>"Tile Q row-wise into "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"Tr"</code>" blocks of "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"Br"</code>" rows each."</li>
                <li>"For each Q-tile, stream K- and V-tiles ("<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"Tc"</code>" blocks of "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"Bc"</code>" rows each) through shared memory, accumulating partial output."</li>
                <li>"Maintain per-row running max "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"mᵢ"</code>" and running denominator "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"lᵢ"</code>" so the softmax stays numerically stable AND can be merged across tiles."</li>
                <li>"Renormalize the partial output Oᵢ by "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"exp(m_prev − m_cur)"</code>" every time a new column tile reveals a larger max."</li>
                <li>"Final divide by lᵢ happens once, at the end."</li>
            </ol>
            <p>
                "One thread block handles one "
                <em>"(Q-tile, head)"</em>
                " pair. Heads are independent, so the grid is "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"Tr × h"</code>
                " blocks total."
            </p>

            // -- glossary ---------------------------------------------------
            <h3 class="text-xl font-bold text-white mt-10 mb-3">"Symbols in the kernel"</h3>
            <div class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 font-mono text-sm overflow-x-auto">
                <table class="w-full text-zinc-300">
                    <thead>
                        <tr class="text-emerald-300 border-b border-zinc-800">
                            <th class="text-left pb-2 pr-4">"Name"</th>
                            <th class="text-left pb-2">"Meaning"</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td class="pr-4 py-1">"M, N, d"</td><td>"M = N = sequence length; d = d_model / h = per-head dim"</td></tr>
                        <tr><td class="pr-4 py-1">"Br, Bc"</td><td>"row-tile and column-tile sizes (shared-mem budget)"</td></tr>
                        <tr><td class="pr-4 py-1">"Tr, Tc"</td><td>"number of row and column tiles  (ceil(N/Br), ceil(N/Bc))"</td></tr>
                        <tr><td class="pr-4 py-1">"alloc_size"</td><td>"max(Br·Bc, Bc·d) — common slot size for SiPi and KiVi"</td></tr>
                        <tr><td class="pr-4 py-1">"SRAM_SIZE"</td><td>"shared-mem budget in floats; differs T4 vs H100"</td></tr>
                        <tr><td class="pr-4 py-1">"MAX_VECTOR_SIZE"</td><td>"upper bound for d (=1024) so li/mi vector slots are fixed"</td></tr>
                        <tr><td class="pr-4 py-1">"NEGATIVE_INF"</td><td>"−1e20 sentinel for the initial running max"</td></tr>
                        <tr><td class="pr-4 py-1">"mi_prev, mi_cur"</td><td>"running max ping-pong, swapped by pointer each iter"</td></tr>
                        <tr><td class="pr-4 py-1">"Oi"</td><td>"partial output accumulator, Br × d in shared mem"</td></tr>
                        <tr><td class="pr-4 py-1">"Qi"</td><td>"Q tile for this block, Br × d in shared mem"</td></tr>
                        <tr><td class="pr-4 py-1">"KiVi"</td><td>"dual-purpose buffer: K tile, then V transposed"</td></tr>
                        <tr><td class="pr-4 py-1">"SiPi"</td><td>"dual-purpose buffer: raw scores S, then exp-stabilized P"</td></tr>
                    </tbody>
                </table>
            </div>

            // -- inner-loop walk --------------------------------------------
            <h3 class="text-xl font-bold text-white mt-10 mb-3">"What the kernel does in 9 steps"</h3>
            <p>"For each column tile j inside the outer loop:"</p>
            <ol class="list-decimal pl-6 space-y-1.5">
                <li>"Load "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"K_j"</code>" into "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"KiVi"</code>" (row-major)."</li>
                <li>"Compute "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"S_ij = Q_i @ K_j^T"</code>" — the helper natively does A @ B^T."</li>
                <li>"Divide by "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"sqrt(d)"</code>"."</li>
                <li>"Update running per-row max "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"m_cur = max(m_prev, rowmax(S_ij))"</code>"."</li>
                <li>"In place: "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"S_ij ← exp(S_ij − m_cur)"</code>" (now numerically stable P_ij)."</li>
                <li>"Update denominator: "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"l ← exp(m_prev − m_cur)·l + rowsum(P_ij)"</code>"."</li>
                <li>"Load "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"V_j"</code>" TRANSPOSED into "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"KiVi"</code>" (overwrites K_j)."</li>
                <li>"Rescale "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"O_i ← exp(m_prev − m_cur) · O_i + P_ij @ V_j"</code>"."</li>
                <li>"Swap "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"mi_prev ↔ mi_cur"</code>" by pointer (no data copy)."</li>
            </ol>
            <p>
                "After all column tiles are consumed, divide each row of "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"O_i"</code>" by "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"l_i"</code>" and write back. That deferred final divide is FlashAttention-2's key trick."
            </p>

            // -- the full source --------------------------------------------
            <h3 class="text-xl font-bold text-white mt-10 mb-3">"The solution — multi_head_self_attention.cu"</h3>
            <p class="text-zinc-500 text-sm">"Single source of truth: " <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-xs">"src/applications_leptos/cuda/src/chapters_content/leetgpu/multi_head_self_attention.cu"</code>". Edit there; rebuild with " <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-xs">"./build.sh ./src/applications_leptos/cuda/"</code>"."</p>
            <pre class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-xs overflow-x-auto leading-relaxed"><code class="language-cpp">{MHSA_CU}</code></pre>

            <div class="mt-12 pt-6 border-t border-zinc-800">
                <A
                    href="/cuda/leetgpu"
                    class="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-emerald-300 transition-colors"
                >
                    "← Back to LeetGPU"
                </A>
            </div>
        </section>
    }
}
