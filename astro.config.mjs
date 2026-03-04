// @ts-check
import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import qwikdev from '@qwikdev/astro'
import solidJs from '@astrojs/solid-js'
import svelte from '@astrojs/svelte'
import mdx from '@astrojs/mdx'
import tailwindcss from "@tailwindcss/vite"

// https://astro.build/config
export default defineConfig({
  output: 'server',
  server: {
    port: 2084,
    host: true,
    headers: {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff'
    }
  },
  integrations: [
    // mdx(),
    qwikdev({
      include: [
        '**/components-qwik/*',
        '**/applications-qwik/**/*'
      ]
    }),
    solidJs({
      devtools: true,
      // all SolidJS components will be put inside 'components-solid' folder if ever other TSX frameworks are ever
      // added to this astro project
      include: [
        '**/components-solid/*',
        '**/applications_solid/**/*'
      ]
    }),
    svelte()
  ],
  adapter: cloudflare({
    platformProxy: {
      enabled: false,
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
      // AWS Cognito Configuration (PUBLIC_ variables for client-side access)
      "import.meta.env.PUBLIC_COGNITO_REGION": JSON.stringify(process.env.PUBLIC_COGNITO_REGION),
      "import.meta.env.PUBLIC_COGNITO_USER_POOL_ID": JSON.stringify(process.env.PUBLIC_COGNITO_USER_POOL_ID),
      "import.meta.env.PUBLIC_COGNITO_CLIENT_ID": JSON.stringify(process.env.PUBLIC_COGNITO_CLIENT_ID),

      // Claude API Configuration (server-side variables)
      "process.env.CLAUDE_API_KEY": JSON.stringify(process.env.CLAUDE_API_KEY),
      "process.env.CLAUDE_MODEL": JSON.stringify(process.env.CLAUDE_MODEL),
      "process.env.CLAUDE_MAX_TOKENS": JSON.stringify(process.env.CLAUDE_MAX_TOKENS),
      "process.env.ANTHROPIC_VERSION": JSON.stringify(process.env.ANTHROPIC_VERSION),

      // Google Analytics (public pages - baked into prerendered HTML at build time)
      "import.meta.env.PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID": JSON.stringify(process.env.GOOGLE_ANALYTICS_MEASUREMENT_ID_PUBLIC_PAGES),

      // Fix for Node.js polyfills in browser (AWS Cognito + Solana)
      global: 'globalThis',
    },
    resolve: {
      conditions: [
        'import',
        'module',
        'browser',
        'default'
      ],
    },
    optimizeDeps: {
      include: [
        'buffer',
        '@solana/web3.js',
        '@solana/spl-token'
      ]
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
