globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createComponent, a as createAstro, d as renderTemplate, r as renderComponent, g as renderSlot, f as renderHead, e as addAttribute } from '../../chunks/astro/server_CzDYtiW_.mjs';
import { D as DarkModeToggle } from '../../chunks/DarkModeToggle_BdAw7Tqm.mjs';
/* empty css                                    */
import { p as push, a as pop } from '../../chunks/_@astro-renderers_DEYiRc3l.mjs';
export { r as renderers } from '../../chunks/_@astro-renderers_DEYiRc3l.mjs';

const ATTR_REGEX = /[&"<]/g;

/**
 * @template V
 * @param {V} value
 * @param {boolean} [is_attr]
 */
function escape_html(value, is_attr) {
	const str = String(value ?? '');

	const pattern = ATTR_REGEX ;
	pattern.lastIndex = 0;

	let escaped = '';
	let last = 0;

	while (pattern.test(str)) {
		const i = pattern.lastIndex - 1;
		const ch = str[i];
		escaped += str.substring(last, i) + (ch === '&' ? '&amp;' : ch === '"' ? '&quot;' : '&lt;');
		last = i + 1;
	}

	return escaped + str.substring(last);
}

/**
 * `<div translate={false}>` should be rendered as `<div translate="no">` and _not_
 * `<div translate="false">`, which is equivalent to `<div translate="yes">`. There
 * may be other odd cases that need to be added to this list in future
 * @type {Record<string, Map<any, string>>}
 */
const replacements = {
	translate: new Map([
		[true, 'yes'],
		[false, 'no']
	])
};

/**
 * @template V
 * @param {string} name
 * @param {V} value
 * @param {boolean} [is_boolean]
 * @returns {string}
 */
function attr(name, value, is_boolean = false) {
	if (value == null || (!value && is_boolean)) return '';
	const normalized = (name in replacements && replacements[name].get(value)) || value;
	const assignment = is_boolean ? '' : `="${escape_html(normalized)}"`;
	return ` ${name}${assignment}`;
}

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$AuthLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$AuthLayout;
  const { title } = Astro2.props;
  return renderTemplate(_a || (_a = __template(['<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"', "><title>", "</title><script>\n		// Prevent flash of light mode\n		const isDarkMode = localStorage.getItem('darkMode') === 'true' ||\n			(!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);\n\n		if (isDarkMode) {\n			document.documentElement.classList.add('dark');\n		}\n	</script>", '</head> <body> <!-- Auth Header with Logo --> <header class="absolute top-0 left-0 w-full z-40 p-6"> <div class="flex justify-between items-center"> <a href="/" class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">\nDocForge AI\n</a> <!-- Optional: Add a back to home link --> <a href="/" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-sm">\n← Back to Home\n</a> </div> </header> ', " <!-- Dark Mode Toggle - Fixed Position at Bottom --> ", " </body></html>"])), addAttribute(Astro2.generator, "content"), title, renderHead(), renderSlot($$result, $$slots["default"]), renderComponent($$result, "DarkModeToggle", DarkModeToggle, { "client:load": true, "client:component-hydration": "load", "client:component-path": "src/components-qwik/DarkModeToggle", "client:component-export": "default" }));
}, "/home/ahmed/Projects-Docforge/Astro/cloudflare-frontend/src/layouts/AuthLayout.astro", void 0);

function SvelteLoginForm($$payload, $$props) {
	push();

	let email = '';
	let password = '';
	let rememberMe = false;
	let loading = false;

	$$payload.out.push(`<main><div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16"><div class="mb-8"><div class="max-w-md w-full space-y-8"><div class="text-center"><div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-600"><svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg></div> <h2 class="mt-6 text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Sign in to your account</h2> <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Welcome back to DocForge AI</p></div> <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">`);

	{
		$$payload.out.push('<!--[!-->');
	}

	$$payload.out.push(`<!--]--> `);

	{
		$$payload.out.push('<!--[!-->');
	}

	$$payload.out.push(`<!--]--> <form class="space-y-6"><div><label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email address</label> <input id="email" name="email" type="email" autocomplete="email" required${attr('value', email)}${attr('disabled', loading, true)} class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed" placeholder="Enter your email"/></div> <div><label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label> <input id="password" name="password" type="password" autocomplete="current-password" required${attr('value', password)}${attr('disabled', loading, true)} class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed" placeholder="Enter your password"/></div> <div class="flex items-center justify-between"><div class="flex items-center"><input id="remember-me" name="remember-me" type="checkbox"${attr('checked', rememberMe, true)}${attr('disabled', loading, true)} class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700"/> <label for="remember-me" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">Remember me</label></div> <div class="text-sm"><a href="/auth/forgot-password" class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">Forgot your password?</a></div></div> <div><button type="submit"${attr('disabled', loading, true)} class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">`);

	{
		$$payload.out.push('<!--[!-->');
		$$payload.out.push(`Sign in`);
	}

	$$payload.out.push(`<!--]--></button></div></form></div> <div class="text-center"><p class="text-sm text-gray-600 dark:text-gray-400">Don't have an account? <a href="/auth/sign-up" class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">Sign up here</a></p></div></div></div></div></main>`);
	pop();
}

const prerender = false;
const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "AuthLayout", $$AuthLayout, { "title": "Sign In - DocForge AI" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "SvelteLoginForm", SvelteLoginForm, { "client:load": true, "client:component-hydration": "load", "client:component-path": "src/components-svelte/auth/SvelteLoginForm.svelte", "client:component-export": "default" })} ` })}`;
}, "/home/ahmed/Projects-Docforge/Astro/cloudflare-frontend/src/pages/auth/sign-in/index.astro", void 0);

const $$file = "/home/ahmed/Projects-Docforge/Astro/cloudflare-frontend/src/pages/auth/sign-in/index.astro";
const $$url = "/auth/sign-in";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Index,
	file: $$file,
	prerender,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
