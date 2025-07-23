// <define:__ROUTES__>
var define_ROUTES_default = {
  version: 1,
  include: [
    "/_server-islands/*",
    "/_image",
    "/_actions/*",
    "/app/*",
    "/auth/*",
    "/profile/*",
    "/settings/*",
    "/test-auth/*"
  ],
  exclude: [
    "/",
    "/_astro/*",
    "/favicon.svg",
    "/404",
    "/500",
    "/about",
    "/features",
    "/pricing"
  ]
};

// node_modules/wrangler/templates/pages-dev-pipeline.ts
import worker from "/home/ahmed/Projects-Docforge/Astro/cloudflare-frontend/.wrangler/tmp/pages-ech33Y/bundledWorker-0.7873948246168205.mjs";
import { isRoutingRuleMatch } from "/home/ahmed/Projects-Docforge/Astro/cloudflare-frontend/node_modules/wrangler/templates/pages-dev-util.ts";
export * from "/home/ahmed/Projects-Docforge/Astro/cloudflare-frontend/.wrangler/tmp/pages-ech33Y/bundledWorker-0.7873948246168205.mjs";
var routes = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = worker;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  pages_dev_pipeline_default as default
};
//# sourceMappingURL=ml58pm85ac8.js.map
