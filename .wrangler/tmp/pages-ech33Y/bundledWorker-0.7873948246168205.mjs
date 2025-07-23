var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// _worker.js/index.js
import { r as renderers } from "./chunks/_@astro-renderers_DEYiRc3l.mjs";
import { c as createExports, s as serverEntrypointModule } from "./chunks/_@astrojs-ssr-adapter_ZyN4B9xY.mjs";
import { manifest } from "./manifest_B2p8vcJu.mjs";
globalThis.process ??= {};
globalThis.process.env ??= {};
var serverIslandMap = /* @__PURE__ */ new Map();
var _page0 = /* @__PURE__ */ __name(() => import("./pages/_image.astro.mjs"), "_page0");
var _page1 = /* @__PURE__ */ __name(() => import("./pages/_actions/_---path_.astro.mjs"), "_page1");
var _page2 = /* @__PURE__ */ __name(() => import("./pages/404.astro.mjs"), "_page2");
var _page3 = /* @__PURE__ */ __name(() => import("./pages/500.astro.mjs"), "_page3");
var _page4 = /* @__PURE__ */ __name(() => import("./pages/about.astro.mjs"), "_page4");
var _page5 = /* @__PURE__ */ __name(() => import("./pages/app/_---all_.astro.mjs"), "_page5");
var _page6 = /* @__PURE__ */ __name(() => import("./pages/auth/sign-in.astro.mjs"), "_page6");
var _page7 = /* @__PURE__ */ __name(() => import("./pages/features.astro.mjs"), "_page7");
var _page8 = /* @__PURE__ */ __name(() => import("./pages/pricing.astro.mjs"), "_page8");
var _page9 = /* @__PURE__ */ __name(() => import("./pages/profile/_---all_.astro.mjs"), "_page9");
var _page10 = /* @__PURE__ */ __name(() => import("./pages/settings/_---all_.astro.mjs"), "_page10");
var _page11 = /* @__PURE__ */ __name(() => import("./pages/test-auth/private.astro.mjs"), "_page11");
var _page12 = /* @__PURE__ */ __name(() => import("./pages/test-auth/public.astro.mjs"), "_page12");
var _page13 = /* @__PURE__ */ __name(() => import("./pages/index.astro.mjs"), "_page13");
var pageMap = /* @__PURE__ */ new Map([
  ["node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint.js", _page0],
  ["node_modules/astro/dist/actions/runtime/route.js", _page1],
  ["src/pages/404.astro", _page2],
  ["src/pages/500.astro", _page3],
  ["src/pages/about/index.astro", _page4],
  ["src/pages/app/[...all].astro", _page5],
  ["src/pages/auth/sign-in/index.astro", _page6],
  ["src/pages/features/index.astro", _page7],
  ["src/pages/pricing/index.astro", _page8],
  ["src/pages/profile/[...all].astro", _page9],
  ["src/pages/settings/[...all].astro", _page10],
  ["src/pages/test-auth/private.astro", _page11],
  ["src/pages/test-auth/public.astro", _page12],
  ["src/pages/index.astro", _page13]
]);
var _manifest = Object.assign(manifest, {
  pageMap,
  serverIslandMap,
  renderers,
  actions: /* @__PURE__ */ __name(() => import("./_astro-internal_actions.mjs"), "actions"),
  middleware: /* @__PURE__ */ __name(() => import("./_astro-internal_middleware.mjs"), "middleware")
});
var _args = void 0;
var _exports = createExports(_manifest);
var __astrojsSsrVirtualEntry = _exports.default;
var _start = "start";
if (_start in serverEntrypointModule) {
  serverEntrypointModule[_start](_manifest, _args);
}
export {
  __astrojsSsrVirtualEntry as default,
  pageMap
};
//# sourceMappingURL=bundledWorker-0.7873948246168205.mjs.map
