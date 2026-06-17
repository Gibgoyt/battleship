// ===========================================================================
// LeetGPU Problem: Multi-Head Attention                                [Hard]
// ===========================================================================
//
// Implement a program for multi-head self-attention. Given three input
// matrices Q (queries), K (keys), and V (values) of size N x d_model, compute:
//
//     MultiHead(Q, K, V) = Concat(head_1, ..., head_h)
//
// where each head computes:
//
//                                  Q_i K_i^T
//     head_i = softmax( ----------------------------- ) V_i
//                              sqrt(d_k)
//
// with d_k = d_model / h, and Q_i, K_i, V_i being the i-th head's partition
// of the input matrices (i.e. columns [i*d_k, (i+1)*d_k) of Q, K, V).
//
// Implementation Requirements:
//   * Use only native features (external libraries are not permitted).
//   * The `solve` function signature must remain unchanged.
//   * The final result must be stored in the `output` array.
//
// ---------------------------------------------------------------------------
// Example 1:
//   Input:
//     N = 2,  d_model = 4,  h = 2
//     Q = [[1.0  0.0  2.0  3.0],
//          [4.0  5.0  6.0  7.0]]
//     K = [[1.0  2.0  3.0  4.0],
//          [5.0  6.0  7.0  8.0]]
//     V = [[0.5  1.0  1.5  2.0],
//          [2.5  3.0  3.5  4.0]]
//   Output:
//     [[2.39  2.89  3.50  4.00],
//      [2.50  3.00  3.50  4.00]]
//
// Example 2:
//   Input:
//     N = 1,  d_model = 2,  h = 1
//     Q = [1.0  1.0]
//     K = [1.0  1.0]
//     V = [2.0  3.0]
//   Output:
//     [2.0  3.0]
//
// ---------------------------------------------------------------------------
// Constraints:
//   * 1     <= N        <= 10000
//   * 2     <= d_model  <= 1024
//   * 1     <= h        <= d_model
//   * d_model % h == 0
//   * -10.0 <= values   <= 10.0
//   * Performance is measured with N = 1024 and d_model = 1024.
// ===========================================================================
//
// Solution approach: FlashAttention-2  (https://arxiv.org/pdf/2307.08691)
// ---------------------------------------------------------------------------
// The naive softmax(Q K^T / sqrt(d)) V costs O(N^2 * d) work AND requires
// materializing the N x N attention matrix in global memory. For the
// benchmark size N = d_model = 1024 that is ~4 MiB per head per batch -
// uncomfortable but feasible. For longer sequences it is catastrophic.
//
// FlashAttention-2 avoids ever writing the N x N matrix anywhere. Instead it:
//
//   1. Tiles Q row-wise into Tr blocks of Br rows each.
//   2. For each Q-tile, streams K- and V-tiles (Tc blocks of Bc rows each)
//      through shared memory, accumulating a running softmax denominator
//      and output incrementally.
//   3. Maintains per-row running max m_i and running sum l_i so the softmax
//      stays numerically stable AND can be merged across tiles.
//   4. Renormalizes the partial output O_i by exp(m_prev - m_cur) every time
//      a new column tile reveals a larger max. Final divide by l_i happens
//      once, at the very end.
//
// One thread block handles one (Q-tile, head) pair. Heads are independent,
// so we launch Tr * h blocks total.
//
// Per-block shared memory layout (all in `s[]`, sized at launch time):
//     Oi       Br x d         output accumulator for this Q-tile
//     Qi       Br x d         Q rows for this tile
//     KiVi     Bc x d         dual-use: holds K rows, then V^T columns
//     SiPi     Br x Bc        dual-use: holds S = Q K^T, then P = exp(S - m)
//     li       Br             softmax denominator (running)
//     mi       Br             running max (ping)
//     mi2      Br             running max (pong, swapped each tile)
// ===========================================================================

#include "solve.h"
#include <cuda_runtime.h>

// ---------------------------------------------------------------------------
// Hardware-dependent shared-memory budget (bytes).
//
// On a T4 (sm_75) the per-SM shared memory cap is 64 KB; the per-block opt-in
// cap is configured via cudaFuncSetAttribute below to ~99 KB on newer arches.
// We deliberately under-budget here so the kernel fits both T4 and H100.
//
// Bumping this on an H100 (sm_90, up to 228 KB/SM dynamic shmem) lets the
// tile sizes Br/Bc grow, which is the single biggest performance lever.
// ---------------------------------------------------------------------------
// for H100:
// constexpr int SRAM_SIZE = 55000;
// for Tesla T4:
constexpr int SRAM_SIZE = 7000;

// d_model <= 1024, so the running max/sum vectors are at most 1024 floats.
// Allocated as a fixed slot in shared memory regardless of actual d.
constexpr int MAX_VECTOR_SIZE = 1024;

// Sentinel for "no max seen yet". Any real attention score is finite and
// well above this, so the first max(mi_prev, ...) seeds correctly.
constexpr float NEGATIVE_INF = -1e20;

// Integer ceiling division. Used to compute Tr = ceil(N / Br) and Tc.
int ceildiv(int a, int b) {
    return (a + b - 1) / b;
}

// ===========================================================================
// matrix_block_load
// ---------------------------------------------------------------------------
// Cooperatively load a (block_size x d) tile of one head's slice of a
// (M x d_model) matrix from global memory into shared memory.
//
//   src is row-major (M x N) where N == d * num_heads.
//   The tile we want occupies rows [block_idx * block_size,
//   block_idx * block_size + block_size) and columns [head * d, (head+1)*d).
//
// All threads in the block iterate over the (block_size * d) elements in a
// strided round-robin: thread `tid` handles elements tid, tid + blockDim.x,
// tid + 2*blockDim.x, ... This is the standard CUDA "grid-stride loop"
// idiom but applied within a single block over a fixed-size tile.
//
// Rows past M are zero-padded so the kernel can pretend every tile is full.
// ===========================================================================
__device__ void matrix_block_load(
    float* dst,
    const float* src,
    int M,
    int d,
    int block_size,
    int block_idx,
    int head,
    int num_heads
) {
    int N = d * num_heads;
    int tid = threadIdx.x;
    int num_threads = blockDim.x;
    for (int i = tid; i < block_size * d; i += num_threads) {
        int r = i / d;                     // row within the tile
        int c = i % d;                     // column within the tile (and head)
        int SrcR = r + block_idx * block_size;
        int SrcC = c + d * head;
        int SrcIdx = SrcR * N + SrcC;
        dst[i] = SrcIdx < M * N ? src[SrcIdx] : 0;
    }
}

// ===========================================================================
// matrix_block_load_transpose
// ---------------------------------------------------------------------------
// Same as matrix_block_load, but writes the tile TRANSPOSED into dst.
//
// We use this for V: the kernel needs P @ V (Br x Bc) * (Bc x d) -> Br x d,
// but our matrix_multiply helper computes A @ B^T, so we pre-transpose V
// into shared memory to turn (P @ V) into (P @ (V^T)^T) which matrix_multiply
// can consume directly.
//
// loop_block_size is the live row count, which equals block_size for all
// but possibly the last K/V tile (when Bc does not divide N).
//
// Output layout: dst[c * loop_block_size + r] -- i.e. column-major in src's
// original orientation == row-major over the transposed shape (d x loop_block_size).
// ===========================================================================
__device__ void matrix_block_load_transpose(
    float* dst,
    const float* src,
    int M,
    int d,
    int block_size,
    int loop_block_size,
    int block_idx,
    int head,
    int num_heads
) {
    int N = d * num_heads;
    int tid = threadIdx.x;
    int num_threads = blockDim.x;
    for (int i = tid; i < loop_block_size * d; i += num_threads) {
        int r = i / d;
        int c = i % d;
        int SrcR = r + block_idx * block_size;
        int SrcC = c + d * head;
        int SrcIdx = SrcR * N + SrcC;
        dst[c * loop_block_size + r] = SrcIdx < M * N ? src[SrcIdx] : 0;
    }
}

// ===========================================================================
// matrix_block_store
// ---------------------------------------------------------------------------
// Inverse of matrix_block_load: write a shared-memory tile back to its
// position inside a (M x d_model) global matrix, restricted to one head's
// column slice.
//
// Bounds-checked so the trailing partial row tile does not stomp memory.
// ===========================================================================
__device__ void matrix_block_store(
    float* dst,
    const float* src,
    int M,
    int d,
    int block_size,
    int block_idx,
    int head,
    int num_heads
) {
    int N = d * num_heads;
    int tid = threadIdx.x;
    int num_threads = blockDim.x;

    for (int i = tid; i < block_size * d; i += num_threads) {
        int r = i / d;
        int c = i % d;
        int DstR = r + block_idx * block_size;
        int DstC = c + d * head;
        int DstIdx = DstR * N + DstC;
        if (DstIdx < M * N) {
            dst[DstIdx] = src[i];
        }
    }
}

// ===========================================================================
// array_fill
// ---------------------------------------------------------------------------
// Block-wide cooperative memset for floats. Used to zero Oi and to seed
// mi_prev to NEGATIVE_INF before the outer loop starts.
// ===========================================================================
__device__ void array_fill(
    float* array,
    float fill_value,
    int N
) {
    int tid = threadIdx.x;
    int num_threads = blockDim.x;
    for (int i = tid; i < N; i += num_threads) {
        array[i] = fill_value;
    }
}

// ===========================================================================
// matrix_multiply  (computes C = A @ B^T,  or C += A @ B^T)
// ---------------------------------------------------------------------------
// Naive (no warp tiling, no Tensor Cores) but correct. A is M x K row-major,
// B is N x K row-major (so B^T is K x N), output C is M x N row-major.
//
// Template parameter add_to_output toggles between assignment (S_i = Q_i K_i^T)
// and accumulation (O_i += P_i V_i). C++17 `if constexpr` makes the branch
// vanish at compile time so the loop body stays branchless on the GPU.
//
// Each thread owns a stride-spaced slice of the M*N output elements. For each
// element it walks the shared K axis sequentially. This is O(M*N*K / threads)
// per call and is the kernel's hottest single piece of code.
// ===========================================================================
template <bool add_to_output = false>
__device__ void matrix_multiply(
    const float* A,
    const float* B,
    float* C,
    int M,
    int N,
    int K
) {
    int tid = threadIdx.x;
    int num_threads = blockDim.x;
    int num_elts = M * N;
    for (int i = tid; i < num_elts; i += num_threads) {
        int m = i / N;
        int n = i % N;
        float sum = 0;
        for (int k = 0; k < K; ++k) {
            sum += A[m * K + k] * B[n * K + k];
        }
        if constexpr (add_to_output) {
            C[i] += sum;
        } else {
            C[i] = sum;
        }
    }
}

// ===========================================================================
// divide_by_scalar
// ---------------------------------------------------------------------------
// Block-cooperative in-place division. Used to apply the 1/sqrt(d_k) scaling
// to S_i = Q_i K_i^T before the softmax.
// ===========================================================================
__device__ void divide_by_scalar(
    float* array,
    float scalar,
    int N
) {
    int tid = threadIdx.x;
    int num_threads = blockDim.x;
    for (int i = tid; i < N; i += num_threads) {
        array[i] /= scalar;
    }
}

// ===========================================================================
// mi_update    mi_cur[r] = max( mi_prev[r], rowmax(Si[r, :]) )
// ---------------------------------------------------------------------------
// Compute the running per-row maximum after consuming a new K/V tile.
//
// This is the safe-softmax pivot: subtracting the running max before
// exponentiation keeps values in a numerically sane range (no overflow,
// no all-zero underflow), and lets us merge partial results across tiles
// via the renormalization exp(m_prev - m_cur).
//
// One thread per row of the Q-tile, sequentially scanning Bc columns.
// ===========================================================================
__device__ void mi_update(
    float* mi_cur,
    const float* mi_prev,
    const float* Si,
    int Br,
    int Bc
) {
    int tid = threadIdx.x;
    int num_threads = blockDim.x;
    for (int i = tid; i < Br; i += num_threads) {
        float max_val = mi_prev[i];
        for (int j = 0; j < Bc; ++j) {
            max_val = max(max_val, Si[i * Bc + j]);
        }
        mi_cur[i] = max_val;
    }
}

// ===========================================================================
// si_to_pi    Si <- exp(Si - mi)    (in place; same buffer is reused as Pi)
// ---------------------------------------------------------------------------
// Convert raw attention scores S_i into stabilized unnormalized weights P_i.
// Because mi already includes the running max, no element of (Si - mi) can
// exceed 0, so exp(.) is bounded in (0, 1]. Numerically safe.
// ===========================================================================
__device__ void si_to_pi(
    float* SiPi,
    const float* mi,
    int Br,
    int Bc
) {
    int tid = threadIdx.x;
    int num_threads = blockDim.x;
    for (int i = tid; i < Br * Bc; i += num_threads) {
        int r = i / Bc;
        SiPi[i] = exp(SiPi[i] - mi[r]);
    }
}

// ===========================================================================
// li_update    li <- exp(mi_prev - mi_cur) * li + rowsum(Pi)
// ---------------------------------------------------------------------------
// Maintain the running softmax denominator. The first term rescales the
// already-accumulated weights to match the new max; the second term adds
// the contribution from the current tile.
//
// This is the FA-2 trick: l_i is the true denominator of softmax(S_full)
// at the END of the column loop, expressed as a sum of contributions seen
// so far, kept consistent by the same renormalization factor we will apply
// to O_i.
// ===========================================================================
__device__ void li_update(
    float* li,
    const float* Pi,
    const float* mi_prev,
    const float* mi_cur,
    int Br,
    int Bc
) {
    int tid = threadIdx.x;
    int num_threads = blockDim.x;
    for (int i = tid; i < Br; i += num_threads) {
        float sum = 0;
        for (int j = 0; j < Bc; ++j) {
            sum += Pi[i * Bc + j];
        }
        li[i] = exp(mi_prev[i] - mi_cur[i]) * li[i] + sum;
    }
}

// ===========================================================================
// Oi_update    Oi <- diag(exp(mi_prev - mi_cur)) Oi  +  Pi @ V_tile
// ---------------------------------------------------------------------------
// Two-step:
//   (1) Rescale the already-accumulated output rows by the same factor used
//       to rescale li. This keeps Oi consistent with the new running max.
//   (2) Accumulate the current tile's contribution Pi @ V using the
//       transposed V we loaded into KiVi via matrix_block_load_transpose.
//
// At the END of the column loop, Oi holds (sum_j exp(s_j - m_full) v_j) for
// each row; dividing by l_i (in Oi_scale) yields the final softmax-weighted
// output without ever materializing the full attention matrix.
// ===========================================================================
__device__ void Oi_update(
    float* Oi,
    const float* Pi,
    const float* VT,
    const float* mi_prev,
    const float* mi_cur,
    int Br,
    int Bc,
    int d
) {
    int tid = threadIdx.x;
    int num_threads = blockDim.x;
    int num_elts = Br * d;
    for (int i = tid; i < num_elts; i += num_threads) {
        int r = i / d;
        Oi[i] *= exp(mi_prev[r] - mi_cur[r]);
    }
    matrix_multiply<true>(Pi, VT, Oi, Br, d, Bc);
}

// ===========================================================================
// Oi_scale     Oi[r, :] /= li[r]
// ---------------------------------------------------------------------------
// Final per-row normalization. Done once, after the column loop completes,
// to produce the true softmax output. Folding this divide into the inner
// loop would still be correct but would do Tc extra divides per element.
// ===========================================================================
__device__ void Oi_scale(
    float* Oi,
    const float* li,
    int Br,
    int d
) {
    int tid = threadIdx.x;
    int num_threads = blockDim.x;
    int num_elts = Br * d;
    for (int i = tid; i < num_elts; i += num_threads) {
        int r = i / d;
        Oi[i] /= li[r];
    }
}

// ===========================================================================
// flash_attention_2_kernel
// ---------------------------------------------------------------------------
// One block computes one (Q-row-tile, head) pair of the output.
//
// Grid : blocksPerGrid = Tr * h
// Block: threadsPerBlock = 1024  (one warp = 32 lanes; 1024 = 32 warps)
//
// Per-block shared memory layout, all carved from a single extern __shared__
// buffer at launch time:
//
//     s[0                            .. alloc_size            )  Oi
//     s[alloc_size                   .. 2*alloc_size          )  Qi
//     s[2*alloc_size                 .. 3*alloc_size          )  KiVi    (K, then V^T)
//     s[3*alloc_size                 .. 4*alloc_size          )  SiPi    (S, then P)
//     s[4*alloc_size                 .. 4*alloc_size + MAX    )  li
//     s[4*alloc_size + MAX           .. 4*alloc_size + 2*MAX  )  mi (ping)
//     s[4*alloc_size + 2*MAX         .. 4*alloc_size + 3*MAX  )  mi2 (pong)
//
// alloc_size = max(Br*Bc, Bc*d) so SiPi (Br*Bc) and KiVi (Bc*d) both fit
// in the same-sized slot.
//
// The mi ping-pong avoids needing to copy mi_cur back to mi_prev each
// iteration -- we just swap two pointers at the end of the loop body.
// ===========================================================================
__global__ void flash_attention_2_kernel(
    const float* Q,
    const float* K,
    const float* V,
    float* O,
    const int M,
    const int N,
    const int d,
    const int Br,
    const int Bc,
    const int Tr,
    const int Tc,
    const int alloc_size,
    const int num_heads
) {
    extern __shared__ float s[];
    float* Oi   = s;
    float* Qi   = &s[alloc_size];
    // will first store Ki, then get overridden with V^T
    float* KiVi = &s[2 * alloc_size];
    // will first store Si = Q K^T / sqrt(d), then get overridden with Pi
    float* SiPi = &s[3 * alloc_size];
    float* li   = &s[4 * alloc_size];
    float* mi   = &s[4 * alloc_size + MAX_VECTOR_SIZE];
    float* mi2  = &s[4 * alloc_size + 2 * MAX_VECTOR_SIZE];

    float* mi_prev = mi;   // m(i, j-1) - the max BEFORE the current column tile
    float* mi_cur  = mi2;  // m(i, j)   - the max AFTER  the current column tile

    int i        = blockIdx.x / num_heads;   // which Q-row-tile
    int head     = blockIdx.x % num_heads;   // which head
    int loopBr   = min(Br, M - i * Br);      // partial row tile at the end?

    // ----- One-time setup for this Q-tile -----
    matrix_block_load(Qi, Q, M, d, Br, i, head, num_heads);
    array_fill(Oi, 0, loopBr * d);
    array_fill(li, 0, loopBr);
    array_fill(mi_prev, NEGATIVE_INF, loopBr);
    __syncthreads();

    // ----- Stream over column tiles of K and V -----
    for (int j = 0; j < Tc; j++) {
        int loopBc = min(Bc, N - j * Bc);    // partial col tile at the end?

        // (1) Load K_j into KiVi as a Bc x d row-major tile.
        matrix_block_load(KiVi, K, N, d, Bc, j, head, num_heads);
        __syncthreads();

        // (2) S_ij = Q_i @ K_j^T  -- matrix_multiply does A @ B^T natively.
        matrix_multiply(Qi, KiVi, SiPi, loopBr, loopBc, d);
        __syncthreads();

        // (3) Apply the 1/sqrt(d_k) scale.
        divide_by_scalar(SiPi, sqrtf(d), loopBr * loopBc);
        __syncthreads();

        // (4) Update the running per-row max.
        mi_update(mi_cur, mi_prev, SiPi, loopBr, loopBc);
        __syncthreads();

        // (5) S_ij -> P_ij = exp(S_ij - m_cur)  (in place).
        si_to_pi(SiPi, mi_cur, loopBr, loopBc);
        __syncthreads();

        // (6) Update the running denominator with both rescaling and
        //     the new tile's row-sum.
        li_update(li, SiPi, mi_prev, mi_cur, loopBr, loopBc);

        // (7) Re-purpose KiVi: load V_j TRANSPOSED so the next matmul can
        //     compute P_ij @ V_j as A @ B^T against the transposed buffer.
        matrix_block_load_transpose(KiVi, V, N, d, Bc, loopBc, j, head, num_heads);
        __syncthreads();

        // (8) Rescale already-accumulated O_i and add P_ij @ V_j.
        Oi_update(Oi, SiPi, KiVi, mi_prev, mi_cur, loopBr, loopBc, d);
        __syncthreads();

        // (9) Swap mi_prev <-> mi_cur for the next iteration. Two pointer
        //     writes, no data copy.
        auto tmp = mi_prev;
        mi_prev = mi_cur;
        mi_cur  = tmp;
    }

    // Final per-row normalization, then write back to global.
    Oi_scale(Oi, li, loopBr, d);
    __syncthreads();
    matrix_block_store(O, Oi, M, d, Br, i, head, num_heads);
    __syncthreads();
}

// ===========================================================================
// solve  --  host-side launch glue
// ---------------------------------------------------------------------------
// All pointers are device pointers (LeetGPU pre-copies inputs to the GPU).
// We just choose tile sizes, opt in to extra dynamic shared memory if needed,
// and launch.
//
// Tile-size policy (T4 SRAM budget):
//   Bc   = ceil(SRAM_SIZE / (4 * d))   -- the 4 reflects {Oi, Qi, KiVi, SiPi}
//                                         sharing the alloc_size slot
//   Br   = min(Bc, d)                   -- caps Br so SiPi (Br*Bc) is not
//                                         larger than KiVi (Bc*d) and the
//                                         shared "alloc_size" slot fits both
//   Tr   = ceil(N / Br)                 -- number of Q row tiles
//   Tc   = ceil(N / Bc)                 -- number of K/V column tiles
// ===========================================================================
void solve(const float* Q, const float* K, const float* V, float* output, int N, int d_model, int h) {
    // Opt in to the >48 KB dynamic shared memory carve-out. This is an
    // attribute on the kernel symbol, not a launch flag.
    // for H100:
    // cudaFuncSetAttribute(flash_attention_2_kernel, cudaFuncAttributeMaxDynamicSharedMemorySize, 232448);
    // for Tesla T4:
    cudaFuncSetAttribute(flash_attention_2_kernel, cudaFuncAttributeMaxDynamicSharedMemorySize, 99 * 1024);

    int d  = d_model / h;
    int Bc = ceildiv(SRAM_SIZE, 4 * d);
    int Br = min(Bc, d);
    int Tr = ceildiv(N, Br);
    int Tc = ceildiv(N, Bc);

    int alloc_size  = max(Br * Bc, Bc * d);
    int shmem_needed = (4 * alloc_size + 3 * MAX_VECTOR_SIZE) * sizeof(float);

    const int threadsPerBlock = 1024;
    const int blocksPerGrid   = Tr * h;
    flash_attention_2_kernel<<<blocksPerGrid, threadsPerBlock, shmem_needed>>>(
        Q, K, V, output, N, N, d, Br, Bc, Tr, Tc, alloc_size, h
    );
}
