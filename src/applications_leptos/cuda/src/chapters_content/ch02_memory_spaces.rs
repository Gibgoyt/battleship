use leptos::*;

#[component]
pub fn Ch02() -> impl IntoView {
    view! {
        <h2 class="text-3xl font-black mb-2 text-white">"2. Memory Spaces — __global__, __shared__, local, __constant__"</h2>
        <p class="text-zinc-400 italic mb-8">
            "Every variable in a CUDA program lives in one of five address spaces. Which one decides its lifetime, who can see it, and how many cycles a load costs you. The qualifiers — "
            <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"__global__"</code>", "
            <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"__shared__"</code>", "
            <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"__device__"</code>", "
            <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"__constant__"</code>
            ", and the absence of all of them — are how you tell the compiler which one."
        </p>

        <section class="space-y-5 text-zinc-300 leading-relaxed">
            <h3 class="text-xl font-bold text-white mt-4 mb-3">"The five spaces at a glance"</h3>
            <div class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 font-mono text-sm overflow-x-auto">
                <table class="w-full text-zinc-300">
                    <thead>
                        <tr class="text-emerald-300 border-b border-zinc-800">
                            <th class="text-left pb-2 pr-4">"Space"</th>
                            <th class="text-left pb-2 pr-4">"Scope"</th>
                            <th class="text-left pb-2 pr-4">"Lifetime"</th>
                            <th class="text-left pb-2">"Latency (cycles)"</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td class="pr-4 py-1">"Registers"</td><td class="pr-4">"1 thread"</td><td class="pr-4">"thread"</td><td>"~1"</td></tr>
                        <tr><td class="pr-4 py-1">"Local"</td><td class="pr-4">"1 thread"</td><td class="pr-4">"thread"</td><td>"~400 (it's DRAM)"</td></tr>
                        <tr><td class="pr-4 py-1">"__shared__"</td><td class="pr-4">"block"</td><td class="pr-4">"block"</td><td>"~20"</td></tr>
                        <tr><td class="pr-4 py-1">"Global / __device__"</td><td class="pr-4">"all"</td><td class="pr-4">"app"</td><td>"~400–800"</td></tr>
                        <tr><td class="pr-4 py-1">"__constant__"</td><td class="pr-4">"all (read-only)"</td><td class="pr-4">"app"</td><td>"~1 (cached, broadcast)"</td></tr>
                    </tbody>
                </table>
            </div>
            <p>
                "The order of those latency numbers is the entire story of GPU performance optimization. A kernel that hits global memory in its inner loop is leaving 400x speedup on the table compared to one that staged the data into shared memory first."
            </p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"Function qualifiers vs. variable qualifiers"</h3>
            <p>"The first confusing thing: the same set of words is used for both functions and variables."</p>
            <div class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 font-mono text-sm overflow-x-auto">
                <table class="w-full text-zinc-300">
                    <thead>
                        <tr class="text-emerald-300 border-b border-zinc-800">
                            <th class="text-left pb-2 pr-4">"Qualifier"</th>
                            <th class="text-left pb-2 pr-4">"On a function"</th>
                            <th class="text-left pb-2">"On a variable"</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td class="pr-4 py-1">"__global__"</td><td class="pr-4">"kernel: host-callable, device-executed"</td><td>"(not used)"</td></tr>
                        <tr><td class="pr-4 py-1">"__device__"</td><td class="pr-4">"device-only helper"</td><td>"resides in global memory"</td></tr>
                        <tr><td class="pr-4 py-1">"__host__"</td><td class="pr-4">"host-only (the default)"</td><td>"(not used)"</td></tr>
                        <tr><td class="pr-4 py-1">"__shared__"</td><td class="pr-4">"(not used)"</td><td>"per-block SRAM"</td></tr>
                        <tr><td class="pr-4 py-1">"__constant__"</td><td class="pr-4">"(not used)"</td><td>"read-only broadcast"</td></tr>
                    </tbody>
                </table>
            </div>
            <p>
                "Functions can stack qualifiers. "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"__host__ __device__"</code>
                " is the everyday combination — a utility that compiles for both sides so you can call it from a kernel "<em>"and"</em>" from CPU code."
            </p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"__global__ — your kernel entry point"</h3>
            <pre class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm overflow-x-auto"><code class="language-cpp">{"__global__ void add_kernel(const float* a, const float* b, float* c, int N) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < N) c[i] = a[i] + b[i];
}"}</code></pre>
            <p>
                "The "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"__global__"</code>" qualifier means: "
                <strong class="text-emerald-300">"this function is called from the host (via "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"<<<...>>>"</code>") and executes on the device."</strong>
                " It "<em>"must"</em>" return "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"void"</code>
                " — there is nowhere meaningful to put a return value when N threads finish independently."
            </p>
            <p>
                "Confusing terminology: \"global memory\" is the DRAM on the GPU board. A "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"__global__"</code>" "<em>"function"</em>" is a kernel. The two share a word and almost nothing else."
            </p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"__shared__ — the fast on-chip scratchpad"</h3>
            <p>"Shared memory is SRAM physically located on the SM. It is partitioned per-block and roughly 20x faster than global memory. It is also small — typically 48–164 KiB per block — so you stage tiles of your data through it, not the whole problem."</p>
            <p><strong class="text-emerald-300">"Static"</strong>" shared memory — size known at compile time:"</p>
            <pre class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm overflow-x-auto"><code class="language-cpp">{"__global__ void tiled_kernel(...) {
    __shared__ float tile[16][16];        // 1 KiB, allocated at compile time
    tile[threadIdx.y][threadIdx.x] = ...;
    __syncthreads();                      // make tile visible to the whole block
    // ... use the staged tile ...
}"}</code></pre>
            <p><strong class="text-emerald-300">"Dynamic"</strong>" shared memory — size decided at launch:"</p>
            <pre class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm overflow-x-auto"><code class="language-cpp">{"__global__ void flash_kernel(...) {
    extern __shared__ float s[];          // size given by the 3rd launch arg
    float* Qi = s;
    float* Ki = &s[QI_SIZE];
    // ...
}

// host:
size_t shmem = compute_needed_bytes(...);
flash_kernel<<<grid, block, shmem>>>(...);"}</code></pre>
            <p>
                "This is exactly the pattern the MHSA solution under LeetGPU uses — one big "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"extern __shared__ float s[]"</code>
                " is carved up into "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"Oi"</code>", "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"Qi"</code>", "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"KiVi"</code>", "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"SiPi"</code>", "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"li"</code>", "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"mi"</code>", "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"mi2"</code>" by pointer arithmetic at the top of the kernel."
            </p>

            <div class="my-8 p-5 rounded-xl bg-emerald-500/5 border-l-4 border-emerald-400">
                <p class="text-emerald-100 m-0">
                    <strong>"__syncthreads():"</strong>
                    " always pair shared-memory writes with a "
                    <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"__syncthreads()"</code>
                    " before the read that depends on them. Without it, threads inside the block see arbitrary stale values and your kernel will appear to \"sometimes work\" — the worst possible failure mode."
                </p>
            </div>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"Local memory — registers, with a trap door"</h3>
            <p>
                "Variables declared inside a kernel with no qualifier go into "<strong class="text-emerald-300">"registers"</strong>". Registers are the fastest storage on the device — single-cycle access. Each SM has tens of thousands of them; the compiler allocates them per-thread."
            </p>
            <p>
                "But the register file is finite. When a kernel needs more registers than it gets, the compiler \"spills\" the excess into "<strong class="text-emerald-300">"local memory"</strong>" — which despite the name is "<em>"global DRAM"</em>" with a per-thread mapping. The latency is the same as global memory. \"Local\" means \"private to one thread,\" not \"close to one thread.\""
            </p>
            <p>"Three things force a register-to-local-memory spill:"</p>
            <ul class="list-disc pl-6 space-y-1">
                <li>"Large per-thread arrays."</li>
                <li>"Arrays indexed dynamically (the compiler cannot pin a register to a runtime-computed index)."</li>
                <li>"Pressure: too many live variables at once for the register budget."</li>
            </ul>
            <p>
                "Inspect with "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"nvcc -Xptxas -v"</code>
                " — the output prints registers per thread and bytes spilled. Spills are why an apparently innocent kernel runs at one-tenth its expected speed."
            </p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"__constant__ — read-only, cached, broadcast"</h3>
            <pre class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm overflow-x-auto"><code class="language-cpp">{"__constant__ float filter_taps[64];     // declared at file scope

// host side, before launch:
cudaMemcpyToSymbol(filter_taps, host_taps, 64 * sizeof(float));

// kernel just reads it directly; no pointer needed:
__global__ void apply_filter(...) {
    float t = filter_taps[i];
}"}</code></pre>
            <p>
                "Constant memory lives in a 64 KiB region with its own cache. When every thread in a warp reads the "<em>"same"</em>" address, the cache broadcasts it in a single transaction — effectively register-speed for uniform reads. When threads in the warp read "<em>"different"</em>" addresses, the broadcast unit serializes. So: constant memory is great for kernel coefficients (filter taps, lookup tables) and terrible as a fallback global array."
            </p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"__restrict__ — telling the compiler your pointers don't overlap"</h3>
            <pre class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm overflow-x-auto"><code class="language-cpp">{"__global__ void add(const float* __restrict__ a,
                    const float* __restrict__ b,
                    float* __restrict__ c, int N) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < N) c[i] = a[i] + b[i];
}"}</code></pre>
            <p>
                "Without "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"__restrict__"</code>" the compiler must assume "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"a"</code>", "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"b"</code>", and "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"c"</code>
                " might alias each other. That forces it to serialize loads — load "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"a[i]"</code>
                ", store "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"c[i]"</code>
                ", load "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"a[i+1]"</code>
                ", ... With "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"__restrict__"</code>
                " it knows they don't overlap and can issue all the loads upfront and pipeline them through the LSU."
            </p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"Bank conflicts — the shared-memory gotcha"</h3>
            <p>
                "Shared memory is split into 32 "<strong class="text-emerald-300">"banks"</strong>", each 4 bytes wide. The 32 threads in a warp can all access shared memory in one cycle — "<em>"if"</em>" each thread hits a different bank. If two threads hit the same bank with different addresses, those accesses are serialized (a 2-way bank conflict halves throughput; an 8-way conflict drops it to 1/8)."
            </p>
            <p>"Stride-1 access patterns are safe: thread "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"t"</code>" reads "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"sh[t]"</code>" -> bank "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"t % 32"</code>", no conflicts. The classic conflict bug is a column access in a "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"[32][32]"</code>" tile: every thread hits the same bank. Pad to "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"[32][33]"</code>" and the column stride desynchronizes the banks."</p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"What you should take from this chapter"</h3>
            <div class="my-6 p-5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                <ul class="space-y-2 text-zinc-300 m-0 list-none p-0">
                    <li>"• Five spaces: registers, local (=global), shared, global, constant. Latency spans 1–800 cycles."</li>
                    <li>"• "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"__global__"</code>" function = kernel; "<em>"global memory"</em>" = the DRAM. Same word, unrelated."</li>
                    <li>"• "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"__shared__"</code>" is the on-chip scratchpad. Stage data through it; sync before reading."</li>
                    <li>"• \"Local\" means private-to-thread, not close-to-thread. Spills hurt as much as global loads."</li>
                    <li>"• "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"__constant__"</code>" is a broadcast cache. Great for filter taps; bad for arbitrary reads."</li>
                    <li>"• Add "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"__restrict__"</code>" to non-aliasing pointer args. Free speedup."</li>
                    <li>"• Watch for bank conflicts in shared memory. Pad if you see them."</li>
                </ul>
            </div>

            <p>"Next: kernel launches are asynchronous. The host does not wait. Understanding "<em>"when"</em>" the GPU has actually finished is more subtle than it looks."</p>
        </section>
    }
}
