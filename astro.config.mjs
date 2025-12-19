import { defineConfig } from 'astro/config';
import solidJs from '@astrojs/solid-js';
import tailwind from '@astrojs/tailwind';
import svelte from '@astrojs/svelte';
import qwik from '@qwikdev/astro';
import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  output: 'server',
	server: {
	port: 8443,
	host: true
  },
  adapter: cloudflare(),
  integrations: [solidJs(), tailwind(), svelte(), qwik(), mdx()],
  compressHTML: false
});
