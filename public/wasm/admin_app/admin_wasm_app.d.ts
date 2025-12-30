/* tslint:disable */
/* eslint-disable */
/**
 * The `ReadableStreamType` enum.
 *
 * *This API requires the following crate features to be activated: `ReadableStreamType`*
 */

type ReadableStreamType = "bytes";

export class IntoUnderlyingByteSource {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  pull(controller: ReadableByteStreamController): Promise<any>;
  start(controller: ReadableByteStreamController): void;
  cancel(): void;
  readonly autoAllocateChunkSize: number;
  readonly type: ReadableStreamType;
}

export class IntoUnderlyingSink {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  abort(reason: any): Promise<any>;
  close(): Promise<any>;
  write(chunk: any): Promise<any>;
}

export class IntoUnderlyingSource {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  pull(controller: ReadableStreamDefaultController): Promise<any>;
  cancel(): void;
}

export function mount_admin_app(): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly mount_admin_app: () => [number, number];
  readonly __wbg_intounderlyingbytesource_free: (a: number, b: number) => void;
  readonly __wbg_intounderlyingsink_free: (a: number, b: number) => void;
  readonly __wbg_intounderlyingsource_free: (a: number, b: number) => void;
  readonly intounderlyingbytesource_autoAllocateChunkSize: (a: number) => number;
  readonly intounderlyingbytesource_cancel: (a: number) => void;
  readonly intounderlyingbytesource_pull: (a: number, b: any) => any;
  readonly intounderlyingbytesource_start: (a: number, b: any) => void;
  readonly intounderlyingbytesource_type: (a: number) => number;
  readonly intounderlyingsink_abort: (a: number, b: any) => any;
  readonly intounderlyingsink_close: (a: number) => any;
  readonly intounderlyingsink_write: (a: number, b: any) => any;
  readonly intounderlyingsource_cancel: (a: number) => void;
  readonly intounderlyingsource_pull: (a: number, b: any) => any;
  readonly wasm_bindgen__convert__closures_____invoke__h104829505029017a: (a: number, b: number) => void;
  readonly wasm_bindgen__closure__destroy__hde305db5d3849056: (a: number, b: number) => void;
  readonly wasm_bindgen__convert__closures_____invoke__h597a50b6ddf79191: (a: number, b: number, c: any) => void;
  readonly wasm_bindgen__closure__destroy__h33a1835798703fcb: (a: number, b: number) => void;
  readonly wasm_bindgen__convert__closures_____invoke__h49bbdbbf2d3431fb: (a: number, b: number, c: any) => void;
  readonly wasm_bindgen__closure__destroy__h0e3fb0c119504822: (a: number, b: number) => void;
  readonly wasm_bindgen__convert__closures_____invoke__h535821c1b5368d37: (a: number, b: number, c: any) => void;
  readonly wasm_bindgen__closure__destroy__hd5b6c33430620d09: (a: number, b: number) => void;
  readonly wasm_bindgen__convert__closures_____invoke__h90c59cb4d882c183: (a: number, b: number, c: any) => void;
  readonly wasm_bindgen__closure__destroy__haff7f3b68957d50c: (a: number, b: number) => void;
  readonly wasm_bindgen__convert__closures_____invoke__h8e0db29656939dc9: (a: number, b: number) => void;
  readonly wasm_bindgen__closure__destroy__heb91d646fcb6f780: (a: number, b: number) => void;
  readonly wasm_bindgen__convert__closures_____invoke__h09110f03699d3c72: (a: number, b: number, c: any) => void;
  readonly wasm_bindgen__closure__destroy__hd66e82646e2a57df: (a: number, b: number) => void;
  readonly wasm_bindgen__closure__destroy__h69ac4cf9bb407d6c: (a: number, b: number) => void;
  readonly wasm_bindgen__convert__closures_____invoke__h86bfcb4c5d2fae81: (a: number, b: number, c: any, d: any) => void;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
