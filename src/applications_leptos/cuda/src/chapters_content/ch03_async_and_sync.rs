use leptos::*;

#[component]
pub fn Ch03() -> impl IntoView {
    view! {
        <h2 class="text-3xl font-black mb-2 text-white">"3. Launch Is Async — Streams and Synchronization"</h2>
        <p class="text-zinc-400 italic mb-8">
            "When the host calls "
            <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"my_kernel<<<...>>>()"</code>
            ", control returns immediately. The GPU has not finished. It probably has not even started. Most bugs in a first CUDA program come from forgetting this."
        </p>

        <section class="space-y-5 text-zinc-300 leading-relaxed">
            <h3 class="text-xl font-bold text-white mt-4 mb-3">"The fundamental fact"</h3>
            <pre class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm overflow-x-auto"><code class="language-cpp">{"my_kernel<<<grid, block>>>(d_a, d_b);
// <-- we are here BEFORE the kernel has run
printf(\"done\\n\");                       // prints first
"}</code></pre>
            <p>
                "A kernel launch enqueues a command into the driver's work queue and returns. From the host's point of view, the launch is fire-and-forget. The "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"printf"</code>
                " above runs while the kernel is still warming up its first warp."
            </p>
            <p>"This is by design — it lets you overlap CPU work, host-to-device copies, and the kernel itself."</p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"The host-side flow you actually want"</h3>
            <pre class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm overflow-x-auto"><code class="language-text">{"  HOST                                  DEVICE
   |                                      |
   |--- cudaMemcpy(H2D)  ------------------>  (DMA: pageable -> staging -> GPU)
   |                                       \\
   |     [returns AFTER the copy finishes,  \\
   |      because cudaMemcpy is sync.]       v
   |
   |--- kernel<<<...>>>()                 [enqueue work]
   |     [returns immediately. GPU starts.]
   |
   | (host can do CPU work here)
   |
   |--- cudaMemcpy(D2H)  ------------------>  (waits for kernel, then DMA)
   |     [returns AFTER kernel + copy done.]
   |
   v"}</code></pre>
            <p>
                "Notice: a plain "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaMemcpy"</code>
                " is "<strong class="text-emerald-300">"synchronous"</strong>" from the host's point of view (it returns after the copy is done) but it issues on the same stream as the kernel, so it implicitly waits for the kernel to finish first. You almost always get \"the right thing\" without thinking about it."
            </p>
            <p>"You get into trouble the moment you reach for one of the async variants."</p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"Streams — what a stream actually is"</h3>
            <p>
                "A "<strong class="text-emerald-300">"stream"</strong>" is an ordered queue of GPU commands. Within one stream, commands execute strictly in submission order. Between two distinct streams, commands can overlap if the hardware has the resources to run them in parallel."
            </p>
            <pre class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm overflow-x-auto"><code class="language-cpp">{"cudaStream_t s1, s2;
cudaStreamCreate(&s1);
cudaStreamCreate(&s2);

cudaMemcpyAsync(d_a, h_a, n, cudaMemcpyHostToDevice, s1);
cudaMemcpyAsync(d_b, h_b, n, cudaMemcpyHostToDevice, s2);   // can overlap with s1

kernel1<<<g, b, 0, s1>>>(d_a);
kernel2<<<g, b, 0, s2>>>(d_b);                              // can overlap with kernel1

cudaMemcpyAsync(h_a, d_a, n, cudaMemcpyDeviceToHost, s1);
cudaMemcpyAsync(h_b, d_b, n, cudaMemcpyDeviceToHost, s2);

cudaStreamSynchronize(s1);
cudaStreamSynchronize(s2);"}</code></pre>
            <p>"With two streams, the H2D copy of one batch can overlap the compute of another batch and the D2H copy of a third — three things in flight simultaneously. This is where real throughput gains live."</p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"The default stream — and the trap"</h3>
            <p>
                "If you pass "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"0"</code>" (or omit the stream argument), commands go onto the "<strong class="text-emerald-300">"default stream"</strong>". On legacy semantics, the default stream is "<em>"implicitly synchronizing"</em>": any work submitted to it acts as a global barrier — it waits for every other stream to drain before starting, and every other stream waits for it before continuing."
            </p>
            <p>
                "So a kernel launch with no stream argument silently serializes every multi-stream optimization you carefully set up. The fix is either to explicitly pass a non-default stream everywhere, or to compile with "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"--default-stream per-thread"</code>
                " which gives each host thread its own non-blocking default stream."
            </p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"The three synchronization primitives"</h3>
            <div class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 font-mono text-sm overflow-x-auto">
                <table class="w-full text-zinc-300">
                    <thead>
                        <tr class="text-emerald-300 border-b border-zinc-800">
                            <th class="text-left pb-2 pr-4">"Call"</th>
                            <th class="text-left pb-2">"Waits for"</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td class="pr-4 py-1">"cudaDeviceSynchronize()"</td><td>"every pending command on every stream"</td></tr>
                        <tr><td class="pr-4 py-1">"cudaStreamSynchronize(s)"</td><td>"every command queued on stream s up to now"</td></tr>
                        <tr><td class="pr-4 py-1">"cudaEventSynchronize(e)"</td><td>"the single recorded event e (and prior work on its stream)"</td></tr>
                    </tbody>
                </table>
            </div>
            <p>"Use the narrowest one that does what you need. "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaDeviceSynchronize"</code>" is a sledgehammer and kills concurrency."</p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"Events — timing and fine-grained ordering"</h3>
            <pre class="my-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm overflow-x-auto"><code class="language-cpp">{"cudaEvent_t start, stop;
cudaEventCreate(&start);
cudaEventCreate(&stop);

cudaEventRecord(start);
my_kernel<<<g, b>>>(...);
cudaEventRecord(stop);
cudaEventSynchronize(stop);                  // block host until stop has happened

float ms = 0;
cudaEventElapsedTime(&ms, start, stop);      // GPU-side wall time, microsecond precision"}</code></pre>
            <p>"Events are also the cross-stream wait primitive: "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaStreamWaitEvent(s2, e)"</code>
                " makes stream "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"s2"</code>" wait for an event recorded in "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"s1"</code>" without involving the host."
            </p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"Five footguns to know"</h3>
            <div class="my-6 p-5 rounded-xl bg-rose-500/5 border-l-4 border-rose-400 space-y-3">
                <p class="text-rose-100 m-0">
                    <strong>"1. printf from a kernel appears late."</strong>
                    " Device "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"printf"</code>" writes into a ring buffer that is flushed on the next sync. If your program crashes before the sync, you see nothing."
                </p>
                <p class="text-rose-100 m-0">
                    <strong>"2. cudaFree before the kernel finishes."</strong>
                    " Freeing a device buffer without first syncing the stream that uses it is undefined behavior. The runtime does NOT track in-flight work for you."
                </p>
                <p class="text-rose-100 m-0">
                    <strong>"3. Host buffer reuse after cudaMemcpyAsync."</strong>
                    " The async copy reads from the host buffer "<em>"after"</em>" returning to your code. If you mutate the buffer before the copy actually starts, you copy garbage."
                </p>
                <p class="text-rose-100 m-0">
                    <strong>"4. Error checking after async calls."</strong>
                    " A kernel that ran out of registers / hit an illegal address reports the failure on the "<em>"next"</em>" CUDA call, not the launch itself. Use "
                    <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaPeekAtLastError()"</code>
                    " right after the launch and "
                    <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaDeviceSynchronize()"</code>
                    " to surface anything caught during execution."
                </p>
                <p class="text-rose-100 m-0">
                    <strong>"5. Pageable host memory blocks async copies."</strong>
                    " "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaMemcpyAsync"</code>" with a pageable host pointer "<em>"silently becomes synchronous"</em>" because the driver has to stage through a pinned buffer. Use "
                    <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaMallocHost"</code>
                    " for true overlap."
                </p>
            </div>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"What's actually happening on Linux"</h3>
            <p>
                "The CUDA Runtime ("<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"libcudart.so"</code>") is a userspace library that talks to the CUDA Driver ("<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"libcuda.so"</code>"), which talks to the NVIDIA kernel module via "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"ioctl()"</code>" calls on "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"/dev/nvidia*"</code>" device files. A kernel launch enqueues a descriptor into a ring buffer that lives in pinned host memory; the driver doorbells the GPU; the GPU's command processor pulls work off the ring and dispatches it to the SMs."
            </p>
            <p>
                "There is no kernel-mode round trip for ordinary launches — that is why submission is so cheap. Synchronization "<em>"does"</em>" involve a kernel-mode round trip (the driver has to wait on a GPU completion interrupt), which is part of why "
                <code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaDeviceSynchronize"</code>" is expensive even when there is no work to wait for."
            </p>

            <h3 class="text-xl font-bold text-white mt-10 mb-3">"What you should take from this chapter"</h3>
            <div class="my-6 p-5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                <ul class="space-y-2 text-zinc-300 m-0 list-none p-0">
                    <li>"• A kernel launch returns immediately. The GPU runs later."</li>
                    <li>"• "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaMemcpy"</code>" is host-synchronous; "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaMemcpyAsync"</code>" is not."</li>
                    <li>"• Use non-default streams to overlap H2D, compute, and D2H."</li>
                    <li>"• "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaStreamSynchronize"</code>" / events for narrow waits; avoid "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaDeviceSynchronize"</code>" in hot paths."</li>
                    <li>"• Pinned host memory ("<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaMallocHost"</code>") is required for true async copy overlap."</li>
                    <li>"• Check errors right after the launch with "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaPeekAtLastError()"</code>", and after a sync to catch run-time faults."</li>
                </ul>
            </div>

            <p>"Next: the host-side memory API — "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaMalloc"</code>", "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaMemcpy"</code>", "<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">"cudaFree"</code>", and the variants that matter."</p>
        </section>
    }
}
