// @ts-check
import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
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
      "process.env.ANTHROPIC_VERSION": JSON.stringify(process.env.ANTHROPIC_VERSION_the),
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
