use leptos::*;

#[component]
pub fn Ch01() -> impl IntoView {
    view! {
        <h2 class="text-3xl font-black mb-2 text-white">"1. dim3 and int3 — How CUDA Indexes Threads"</h2>
        <p class="text-zinc-400 italic mb-8">
            "Before you write a single kernel, you need to understand the two tiny aggregate types that the entire CUDA execution model is built on. Everything — every launch configuration, every per-thread address calculation — flows through "
            <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"dim3"</code>
            " and "
            <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"int3"</code>
            "."
        </p>

        <section class="space-y-5 text-zinc-300 leading-relaxed">
            <h3 class="text-xl font-bold text-white mt-4 mb-3">"The two types, declared"</h3>
            <p>
                "Both types are plain C aggregates declared in "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"<vector_types.h>"</code>
                ". Their entire definition is:"
            </p>
            <pre class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm overflow-x-auto"><code class="language-cpp">{"struct int3 { int x, y, z; };

struct dim3 {
    unsigned int x, y, z;
    __host__ __device__ dim3(unsigned int x = 1,
                             unsigned int y = 1,
                             unsigned int z = 1) : x(x), y(y), z(z) {}
};"}</code></pre>
            <p>
                "Three fields. That's it. The "<em>"interesting"</em>" thing about "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"dim3"</code>
                " is that its constructor "<strong class="text-emerald-300">"defaults missing dimensions to 1"</strong>
                " — so "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"dim3 grid(256)"</code>
                " is shorthand for "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"dim3 grid(256, 1, 1)"</code>
                ". A 1D launch is a 3D launch where you didn't bother filling in the other axes."
            </p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"The four built-in variables every kernel sees"</h3>
            <p>"Inside any "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"__global__"</code>" function, the compiler injects four read-only variables. You did not declare them; they appear by magic."</p>
            <div class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 font-mono text-sm overflow-x-auto">
                <table class="w-full text-zinc-300">
                    <thead>
                        <tr class="text-emerald-300 border-b border-zinc-800">
                            <th class="text-left pb-2 pr-4">"Variable"</th>
                            <th class="text-left pb-2 pr-4">"Type"</th>
                            <th class="text-left pb-2">"Meaning"</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td class="pr-4 py-1">"gridDim"</td><td class="pr-4">"dim3"</td><td>"size of the whole grid in blocks"</td></tr>
                        <tr><td class="pr-4 py-1">"blockIdx"</td><td class="pr-4">"uint3"</td><td>"this block's coordinate in the grid"</td></tr>
                        <tr><td class="pr-4 py-1">"blockDim"</td><td class="pr-4">"dim3"</td><td>"size of every block in threads"</td></tr>
                        <tr><td class="pr-4 py-1">"threadIdx"</td><td class="pr-4">"uint3"</td><td>"this thread's coordinate in its block"</td></tr>
                    </tbody>
                </table>
            </div>
            <p>
                "(Yes, "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"blockIdx"</code>" and "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"threadIdx"</code>
                " are technically "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"uint3"</code>
                " — the unsigned cousin of "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"int3"</code>
                ". You will never write "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"uint3"</code>
                " in your own code; the runtime owns it.)"
            </p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"The canonical global-thread-index idiom"</h3>
            <p>"The one line of CUDA you will write more than any other:"</p>
            <pre class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm overflow-x-auto"><code class="language-cpp">{"int tid = blockIdx.x * blockDim.x + threadIdx.x;"}</code></pre>
            <p>
                "Each block owns "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"blockDim.x"</code>
                " consecutive thread IDs starting at "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"blockIdx.x * blockDim.x"</code>
                ". Adding the local "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"threadIdx.x"</code>
                " gives you a unique index for every thread in the whole grid. Use that as the array index and you're 90% of the way to a working kernel."
            </p>
            <p>"For a 2D launch (e.g. a matrix), you do this twice:"</p>
            <pre class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm overflow-x-auto"><code class="language-cpp">{"int row = blockIdx.y * blockDim.y + threadIdx.y;
int col = blockIdx.x * blockDim.x + threadIdx.x;
if (row < M && col < N) {
    C[row * N + col] = A[row * N + col] + B[row * N + col];
}"}</code></pre>
            <p>
                "Note the "<strong class="text-emerald-300">"bounds check"</strong>". Grids are launched in whole blocks; the last block will almost certainly have threads with no real work to do."
            </p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"Launching: the triple-chevron syntax"</h3>
            <pre class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm overflow-x-auto"><code class="language-cpp">{"// 1D launch: 256 threads per block, ceil(N/256) blocks
int threads = 256;
int blocks  = (N + threads - 1) / threads;
my_kernel<<<blocks, threads>>>(d_a, d_b, N);

// 2D launch: 16x16 = 256 threads per block, ceil(M/16) x ceil(N/16) grid
dim3 block(16, 16);
dim3 grid((N + 15) / 16, (M + 15) / 16);
mat_kernel<<<grid, block>>>(d_A, d_B, d_C, M, N);"}</code></pre>
            <p>
                "The triple chevron "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"<<<grid, block>>>"</code>
                " is not standard C++ — it is recognized by "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"nvcc"</code>
                " and rewritten into a call to "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaLaunchKernel"</code>
                ". The grid arg goes first, the block arg second. Mix them up and your launch silently does the wrong thing."
            </p>

            <div class="my-8 p-5 rounded-xl bg-emerald-500/5 border-l-4 border-emerald-400">
                <p class="text-emerald-100 m-0">
                    <strong>"Two more launch arguments:"</strong>
                    " the full form is "
                    <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"<<<grid, block, shmem_bytes, stream>>>"</code>
                    ". The third — dynamic shared memory size in bytes — is how the MHSA kernel under LeetGPU allocates its shared-memory tiles. The fourth — the stream — controls concurrency (see the Async chapter)."
                </p>
            </div>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"int3 — the same shape, used differently"</h3>
            <p>
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"int3"</code>
                " is just a packed triple of signed ints. CUDA never uses it for indexing — that's "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"uint3"</code>
                "/"
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"dim3"</code>
                "'s job. You use "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"int3"</code>
                " when you want a small SIMD-shaped value: an RGB pixel, a 3D coordinate, a small SoA-style tuple. The compiler treats reads / writes of "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"int3"</code>
                " as 12-byte vector loads on modern arches, which is cheaper than three separate "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"int"</code>
                " loads."
            </p>
            <p>"Related vector types you will see in real code: "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"float2, float3, float4, int4, uchar4"</code>
                " — same shape, same constructor convention, different element types. "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"float4"</code>
                " is the workhorse for 16-byte coalesced loads."
            </p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"The gotcha that gets everyone"</h3>
            <p>
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"dim3"</code>
                " uses "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">".x"</code>
                " as the "<strong>"fastest-varying"</strong>" axis. That is the "<em>"opposite"</em>" of NumPy / standard math notation, where the trailing axis is the fastest-varying. So a 2D launch that wants to walk a row-major matrix in coalesced order does:"
            </p>
            <pre class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm overflow-x-auto"><code class="language-cpp">{"dim3 block(WARP_SIZE, ROWS_PER_BLOCK);   // 32 along columns, threads with
                                          // adjacent .x access adjacent
                                          // memory addresses -> coalesced"}</code></pre>
            <p>"Get this backwards and your kernel will run, return the right answer, and be 10x slower than it should be."</p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"What you should take from this chapter"</h3>
            <div class="my-6 p-5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                <ul class="space-y-2 text-zinc-300 m-0 list-none p-0">
                    <li>"• "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"dim3"</code>" / "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"uint3"</code>" are 3-element aggregates; missing dims default to 1."</li>
                    <li>"• Every kernel sees four magic variables: "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"gridDim, blockIdx, blockDim, threadIdx"</code>"."</li>
                    <li>"• Global thread ID = "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"blockIdx.x * blockDim.x + threadIdx.x"</code>". Memorize."</li>
                    <li>"• "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"<<<grid, block, shmem, stream>>>"</code>" — the last two args are optional but matter."</li>
                    <li>"• "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">".x"</code>" is the fastest-varying axis. Put your warp dimension on "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">".x"</code>"."</li>
                </ul>
            </div>

            <p>"Next: the qualifiers that decide "<em>"where"</em>" each variable in a kernel lives — registers, shared memory, global memory, or constant memory."</p>
        </section>
    }
}
