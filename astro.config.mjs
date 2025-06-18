// @ts-check
import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import solidJs from '@astrojs/solid-js'
import svelte from '@astrojs/svelte'
import qwikdev from '@qwikdev/astro'
import mdx from '@astrojs/mdx'
import tailwindcss from "@tailwindcss/vite"

// https://astro.build/config
export default defineConfig({
  output: 'server',
  server: {
    port: 8443,
    host: true
  },
  integrations: [
    mdx(),
    qwikdev({
      include: [
        '**/components-qwik/*',
        '**/applications-qwik/**/*'
      ]
    }),
    solidJs({
      // TODO!!: https://docs.astro.build/en/guides/integrations-guide/solid-js/#configuration
      devtools: true,
      // all SolidJS components will be put inside 'components-solid' folder if ever other TSX frameworks are ever
      // added to this astro project
      include: [
        '**/components-solid/*',
        '**/applications-solid/**/*'
      ]
    }),
    svelte()
  ],
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  vite: {
    plugins: [
      // DO NOT CHANGE THIS, OFFICIAL DOCS: https://tailwindcss.com/docs/installation/framework-guides/astro
      // THIS **IS** 100% the correct way of adding TailwindCSS to an Astro project
      // @ts-ignore
      tailwindcss(),
    ],
    define: {
      // TOD!!: Run test on these inside './src/actions/' folder
      // "process.env.PUBLIC_TEST": JSON.stringify(process.env.PUBLIC_TEST),
      // "process.env.VITE_TEST": JSON.stringify(process.env.VITE_TEST),
      // "process.env.TEST": JSON.stringify(process.env.TEST),
      "process.env.CLAUDE_API_KEY": JSON.stringify(process.env.CLAUDE_API_KEY),
      "process.env.CLAUDE_MODEL": JSON.stringify(process.env.CLAUDE_MODEL),
      "process.env.CLAUDE_MAX_TOKENS": JSON.stringify(process.env.CLAUDE_MAX_TOKENS),
      "process.env.ANTHROPIC_VERSION": JSON.stringify(process.env.ANTHROPIC_VERSION),
    },
    resolve: {
      conditions: [
        'import',
        'module',
        'browser',
        'default'
      ],
    },
    ssr: {
      external: [
        'node:*'
      ]
    },
    server: {
      cors: {
        origin: '*'
      }
    }
  }
})
