use leptos::*;

#[component]
pub fn Ch04() -> impl IntoView {
    view! {
        <h2 class="text-3xl font-black mb-2 text-white">"4. cudaMalloc, cudaMemcpy, cudaFree — The Host-Side API"</h2>
        <p class="text-zinc-400 italic mb-8">
            "Three calls run roughly 95% of all CUDA programs. Plus a fourth — "
            <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaMallocHost"</code>
            " — which separates the kernels that go fast from the ones that don't."
        </p>

        <section class="space-y-5 text-zinc-300 leading-relaxed">
            <h3 class="text-xl font-bold text-white mt-4 mb-3">"cudaMalloc — allocate on the device"</h3>
            <pre class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm overflow-x-auto"><code class="language-cpp">{"cudaError_t cudaMalloc(void** devPtr, size_t size);

float* d_a = nullptr;
cudaMalloc(&d_a, N * sizeof(float));
// d_a now holds a device-side address. DO NOT dereference it on the host.
"}</code></pre>
            <p>
                "Note the "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"void**"</code>". The function writes the result "<em>"through"</em>" the pointer you pass in. The conventional cast is "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"(void**)&d_a"</code>
                "; in modern C++ it usually compiles without the cast."
            </p>
            <p>
                "The returned address is in the GPU's virtual address space. Dereferencing it on the CPU is undefined behavior and will most likely segfault. You can only use it as a kernel argument or as a "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"src"</code>" / "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"dst"</code>" of a "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaMemcpy"</code>"."
            </p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"cudaMemcpy — and its four directions"</h3>
            <pre class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm overflow-x-auto"><code class="language-cpp">{"cudaError_t cudaMemcpy(void* dst, const void* src,
                       size_t count, cudaMemcpyKind kind);"}</code></pre>
            <div class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 font-mono text-sm overflow-x-auto">
                <table class="w-full text-zinc-300">
                    <thead>
                        <tr class="text-emerald-300 border-b border-zinc-800">
                            <th class="text-left pb-2 pr-4">"Kind"</th>
                            <th class="text-left pb-2">"Use"</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td class="pr-4 py-1">"cudaMemcpyHostToDevice"</td><td>"H2D: upload inputs"</td></tr>
                        <tr><td class="pr-4 py-1">"cudaMemcpyDeviceToHost"</td><td>"D2H: download results"</td></tr>
                        <tr><td class="pr-4 py-1">"cudaMemcpyDeviceToDevice"</td><td>"D2D: copy between two device buffers"</td></tr>
                        <tr><td class="pr-4 py-1">"cudaMemcpyHostToHost"</td><td>"H2H: rarely useful; same as memcpy"</td></tr>
                        <tr><td class="pr-4 py-1">"cudaMemcpyDefault"</td><td>"infer from the pointers (requires unified addressing)"</td></tr>
                    </tbody>
                </table>
            </div>
            <p>
                "Plain "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaMemcpy"</code>" is "<strong class="text-emerald-300">"host-synchronous"</strong>" — it does not return until the copy is complete. That makes it the safe-by-default choice and the reason your first CUDA program just worked."
            </p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"cudaFree — return device memory"</h3>
            <pre class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm overflow-x-auto"><code class="language-cpp">{"cudaFree(d_a);
d_a = nullptr;     // good hygiene"}</code></pre>
            <p>
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaFree(nullptr)"</code>
                " is a no-op (safe). "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaFree"</code>
                " on a host pointer is undefined. "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"free"</code>" on a device pointer is also undefined — and both will silently fail in ways that surface five calls later as cryptic launch errors."
            </p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"A minimal complete example"</h3>
            <pre class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm overflow-x-auto"><code class="language-cpp">{"#include <cuda_runtime.h>
#include <cstdio>

__global__ void add(const float* __restrict__ a,
                    const float* __restrict__ b,
                    float* __restrict__ c, int N) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < N) c[i] = a[i] + b[i];
}

int main() {
    const int N = 1 << 20;
    const size_t bytes = N * sizeof(float);

    // 1. Host allocation
    float* h_a = (float*)malloc(bytes);
    float* h_b = (float*)malloc(bytes);
    float* h_c = (float*)malloc(bytes);
    for (int i = 0; i < N; ++i) { h_a[i] = i; h_b[i] = 2*i; }

    // 2. Device allocation
    float *d_a, *d_b, *d_c;
    cudaMalloc(&d_a, bytes);
    cudaMalloc(&d_b, bytes);
    cudaMalloc(&d_c, bytes);

    // 3. H2D
    cudaMemcpy(d_a, h_a, bytes, cudaMemcpyHostToDevice);
    cudaMemcpy(d_b, h_b, bytes, cudaMemcpyHostToDevice);

    // 4. Launch
    int threads = 256;
    int blocks  = (N + threads - 1) / threads;
    add<<<blocks, threads>>>(d_a, d_b, d_c, N);

    // 5. D2H (implicitly waits for the kernel because it's the same stream)
    cudaMemcpy(h_c, d_c, bytes, cudaMemcpyDeviceToHost);

    // 6. Free
    cudaFree(d_a);
    cudaFree(d_b);
    cudaFree(d_c);
    free(h_a); free(h_b); free(h_c);
    return 0;
}"}</code></pre>
            <p>"Six steps. Almost every CUDA program is some elaboration of this skeleton."</p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"cudaMallocHost — pinned memory, the actual speedup"</h3>
            <pre class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm overflow-x-auto"><code class="language-cpp">{"float* h_a;
cudaMallocHost(&h_a, bytes);   // page-locked / pinned"}</code></pre>
            <p>
                "Regular "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"malloc"</code>" returns pageable memory — the Linux kernel can swap it out. The GPU's DMA engine cannot DMA from pageable memory; it requires a fixed physical address. So when you "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaMemcpy"</code>" from pageable memory, the driver "<em>"first"</em>" copies your data into an internal pinned staging buffer, "<em>"then"</em>" DMAs to the device. Two copies."
            </p>
            <p>"Pinned memory skips the staging step. Throughput jumps from ~6 GB/s to ~12+ GB/s on PCIe Gen3. It is also a prerequisite for true async overlap with "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaMemcpyAsync"</code>"."
            </p>
            <div class="my-6 p-5 rounded-xl bg-amber-500/5 border-l-4 border-amber-400">
                <p class="text-amber-100 m-0">
                    <strong>"The cost:"</strong>
                    " pinned memory is unswappable, so you should not allocate "<em>"all"</em>" your host memory this way. Use it for the staging buffers you actually feed to the GPU."
                </p>
            </div>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"cudaMallocManaged — Unified Memory"</h3>
            <pre class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm overflow-x-auto"><code class="language-cpp">{"float* u_a;
cudaMallocManaged(&u_a, bytes);
for (int i = 0; i < N; ++i) u_a[i] = i;   // host writes
my_kernel<<<g, b>>>(u_a, N);              // device reads (faults migrate pages in)
cudaDeviceSynchronize();
printf(\"%f\\n\", u_a[0]);                  // host reads (faults migrate back)"}</code></pre>
            <p>
                "One pointer, valid on both sides. Pages migrate on demand via the driver's page-fault handler. Convenient for prototyping; "<em>"not"</em>" the fastest option — fault-driven migration adds overhead that explicit copies avoid. Production code usually goes back to explicit "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaMalloc"</code>" + "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaMemcpy"</code>"."
            </p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"The error-check macro every codebase has"</h3>
            <pre class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm overflow-x-auto"><code class="language-cpp">{"#define CUDA_CHECK(call)                                          \\
    do {                                                          \\
        cudaError_t err = (call);                                 \\
        if (err != cudaSuccess) {                                 \\
            fprintf(stderr, \"CUDA error %s at %s:%d: %s\\n\",       \\
                    cudaGetErrorName(err), __FILE__, __LINE__,    \\
                    cudaGetErrorString(err));                     \\
            std::abort();                                         \\
        }                                                         \\
    } while (0)

CUDA_CHECK(cudaMalloc(&d_a, bytes));
CUDA_CHECK(cudaMemcpy(d_a, h_a, bytes, cudaMemcpyHostToDevice));
my_kernel<<<g, b>>>(d_a, N);
CUDA_CHECK(cudaPeekAtLastError());          // launch-time errors
CUDA_CHECK(cudaDeviceSynchronize());        // run-time errors"}</code></pre>
            <p>"Without this wrapper, errors propagate silently and surface as garbage results several calls later. Every CUDA codebase you read in the wild has some variant of "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"CUDA_CHECK"</code>"."
            </p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"Quick reference"</h3>
            <div class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 font-mono text-sm overflow-x-auto">
                <table class="w-full text-zinc-300">
                    <thead>
                        <tr class="text-emerald-300 border-b border-zinc-800">
                            <th class="text-left pb-2 pr-4">"Want"</th>
                            <th class="text-left pb-2">"Call"</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td class="pr-4 py-1">"Device alloc"</td><td>"cudaMalloc"</td></tr>
                        <tr><td class="pr-4 py-1">"Pinned host alloc"</td><td>"cudaMallocHost / cudaHostAlloc"</td></tr>
                        <tr><td class="pr-4 py-1">"Unified alloc"</td><td>"cudaMallocManaged"</td></tr>
                        <tr><td class="pr-4 py-1">"Free anything from above"</td><td>"cudaFree / cudaFreeHost"</td></tr>
                        <tr><td class="pr-4 py-1">"Sync copy"</td><td>"cudaMemcpy"</td></tr>
                        <tr><td class="pr-4 py-1">"Async copy (needs pinned)"</td><td>"cudaMemcpyAsync"</td></tr>
                        <tr><td class="pr-4 py-1">"Zero device memory"</td><td>"cudaMemset"</td></tr>
                        <tr><td class="pr-4 py-1">"Copy to __constant__"</td><td>"cudaMemcpyToSymbol"</td></tr>
                    </tbody>
                </table>
            </div>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"What you should take from this chapter"</h3>
            <div class="my-6 p-5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                <ul class="space-y-2 text-zinc-300 m-0 list-none p-0">
                    <li>"• "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaMalloc(&p, n)"</code>" — writes through "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"void**"</code>", returns a device-only address."</li>
                    <li>"• "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaMemcpy"</code>" is sync. Four directions (H2D, D2H, D2D, H2H) and a fifth ("<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"Default"</code>") for inference."</li>
                    <li>"• "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaFree"</code>" only on device pointers; never on host pointers."</li>
                    <li>"• "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaMallocHost"</code>" / pinned memory is required for real async copy overlap and roughly doubles bandwidth."</li>
                    <li>"• "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaMallocManaged"</code>" is convenient and slower; production usually goes back to explicit copies."</li>
                    <li>"• Wrap every CUDA call in a "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"CUDA_CHECK"</code>" macro. It will save you days."</li>
                </ul>
            </div>

            <p>"Next: head over to "<strong class="text-emerald-300">"LeetGPU"</strong>" in the sidebar to see all of this applied to a Hard-difficulty problem — multi-head attention with FlashAttention-2."</p>
        </section>
    }
}
