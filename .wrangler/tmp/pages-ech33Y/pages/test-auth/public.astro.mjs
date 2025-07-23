globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createComponent, r as renderComponent, d as renderTemplate, m as maybeRenderHead, b as renderScript } from '../../chunks/astro/server_CzDYtiW_.mjs';
import { $ as $$Layout } from '../../chunks/Layout_D2pIJP31.mjs';
export { r as renderers } from '../../chunks/_@astro-renderers_DEYiRc3l.mjs';

const prerender = false;
const $$Public = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Public Test Route - DocForge AI" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-16"> <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"> <!-- Header --> <div class="text-center mb-12"> <div class="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-600 mb-6"> <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg> </div> <h1 class="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
Public Test Route
</h1> <p class="text-xl text-gray-600 dark:text-gray-400">
This page is accessible to everyone, no authentication required.
</p> </div> <!-- Test Information Card --> <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"> <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
🧪 Authentication Test Information
</h2> <div class="grid md:grid-cols-2 gap-6"> <!-- Route Information --> <div class="space-y-4"> <h3 class="text-lg font-medium text-gray-800 dark:text-gray-200">Route Details</h3> <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2"> <div class="flex justify-between"> <span class="text-gray-600 dark:text-gray-400">Path:</span> <code class="text-green-600 dark:text-green-400">/test-auth/public</code> </div> <div class="flex justify-between"> <span class="text-gray-600 dark:text-gray-400">Protected:</span> <span class="text-red-600 dark:text-red-400">❌ No</span> </div> <div class="flex justify-between"> <span class="text-gray-600 dark:text-gray-400">Middleware:</span> <span class="text-green-600 dark:text-green-400">✅ Bypassed</span> </div> </div> </div> <!-- Client-side Auth Status --> <div class="space-y-4"> <h3 class="text-lg font-medium text-gray-800 dark:text-gray-200">Client Auth Status</h3> <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"> <div id="auth-status" class="space-y-2"> <div class="flex justify-between"> <span class="text-gray-600 dark:text-gray-400">Status:</span> <span id="auth-status-value" class="text-gray-500">Loading...</span> </div> <div class="flex justify-between"> <span class="text-gray-600 dark:text-gray-400">User:</span> <span id="user-email" class="text-gray-500">Loading...</span> </div> <div class="flex justify-between"> <span class="text-gray-600 dark:text-gray-400">Tokens:</span> <span id="token-status" class="text-gray-500">Loading...</span> </div> </div> </div> </div> </div> </div> <!-- Test Navigation --> <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"> <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
🚀 Test Navigation
</h2> <div class="grid md:grid-cols-3 gap-4"> <!-- Private Route Test --> <a href="/test-auth/private" class="block p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"> <h3 class="text-lg font-medium text-red-800 dark:text-red-300 mb-2">
🔒 Protected Route
</h3> <p class="text-sm text-red-600 dark:text-red-400">
Requires authentication. Will redirect if not logged in.
</p> </a> <!-- Login Test --> <a href="/auth/sign-in" class="block p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"> <h3 class="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">
🔑 Login Page
</h3> <p class="text-sm text-blue-600 dark:text-blue-400">
Test the authentication system.
</p> </a> <!-- App Dashboard Test --> <a href="/app/dashboard" class="block p-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"> <h3 class="text-lg font-medium text-purple-800 dark:text-purple-300 mb-2">
📊 App Dashboard
</h3> <p class="text-sm text-purple-600 dark:text-purple-400">
Protected app route. Requires login.
</p> </a> </div> </div> </div> </main> ${renderScript($$result2, "/home/ahmed/Projects-Docforge/Astro/cloudflare-frontend/src/pages/test-auth/public.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "/home/ahmed/Projects-Docforge/Astro/cloudflare-frontend/src/pages/test-auth/public.astro", void 0);

const $$file = "/home/ahmed/Projects-Docforge/Astro/cloudflare-frontend/src/pages/test-auth/public.astro";
const $$url = "/test-auth/public";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Public,
	file: $$file,
	prerender,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
