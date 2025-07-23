# DocForge AI - Multi-Framework Frontend

A modern web application built with Astro as the meta-framework, featuring Qwik single-page applications, Svelte components, AWS Cognito authentication, and Cloudflare Workers deployment.

## Features

- **Astro** - Server-side rendering with client islands architecture
- **Qwik** - Resumable single-page applications with client-side routing
- **Svelte** - Reactive UI components for authentication flows
- **SolidJS** - Configured and ready for additional reactive components
- **AWS Cognito** - JWT-based authentication with token management
- **Tailwind CSS v4** - Utility-first CSS framework with dark mode support
- **Cloudflare Workers** - Edge deployment with D1, KV, R2 access
- **TypeScript** - Full type safety across all frameworks

## Getting Started

### Development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Building

```bash
npm run build
npm run preview
```

### Deployment to Cloudflare

1. Configure your `wrangler.toml` with your Cloudflare bindings
2. Deploy with:

```bash
npm run build
npx wrangler pages deploy dist
```

## Project Structure

```
/
├── public/
│   └── favicon.svg
├── src/
│   ├── applications-qwik/        # Full Qwik SPAs
│   │   ├── app/
│   │   │   ├── App.tsx          # Main app SPA
│   │   │   └── pages/           # SPA pages (dashboard, counter, etc.)
│   │   ├── profile/             # Profile management SPA
│   │   └── settings/            # Settings SPA
│   ├── components-qwik/         # Qwik client islands
│   │   ├── QwikLoginForm.tsx    # Login form component
│   │   ├── QwikCounter.tsx      # Counter demo
│   │   └── DarkModeToggle.tsx   # Theme toggle
│   ├── components-svelte/       # Svelte components
│   │   └── auth/
│   │       └── SvelteLoginForm.svelte # Authentication form
│   ├── components/              # Astro components
│   │   └── D1DatabaseDemo.astro # Database integration demo
│   ├── lib/                     # Shared utilities
│   │   ├── auth/                # Authentication system
│   │   │   ├── sign-in.ts       # Cognito sign-in service
│   │   │   ├── jwt-validator.ts # Token validation
│   │   │   ├── token-storage.ts # Browser/cookie token management
│   │   │   └── auth-checker.ts  # Authentication status
│   │   ├── logger.ts            # Production-ready logging
│   │   └── cognito-config.ts    # AWS Cognito configuration
│   ├── layouts/
│   │   ├── Layout.astro         # Main layout
│   │   └── AuthLayout.astro     # Authentication pages layout
│   ├── pages/
│   │   ├── index.astro          # Landing page
│   │   ├── app/
│   │   │   └── [...all].astro   # Qwik SPA catch-all route
│   │   ├── profile/
│   │   │   └── [...all].astro   # Profile SPA catch-all route
│   │   ├── settings/
│   │   │   └── [...all].astro   # Settings SPA catch-all route
│   │   ├── auth/
│   │   │   └── sign-in/
│   │   │       └── index.astro  # Sign-in page
│   │   ├── features/            # Feature showcase
│   │   ├── pricing/             # Pricing page
│   │   └── about/               # About page
│   ├── middleware.ts            # Authentication middleware
│   └── styles/
│       └── global.css           # Global styles with Tailwind
├── astro.config.mjs             # Astro configuration
├── package.json
├── tsconfig.json
└── wrangler.toml               # Cloudflare configuration
```

## Architecture Overview

This project demonstrates a sophisticated multi-framework architecture:

### Meta-Framework (Astro)
- Handles server-side rendering and static generation
- Coordinates multiple client-side frameworks
- Provides the routing foundation and middleware system

### Single-Page Applications (Qwik)
- **Main App** (`/app/*`) - Primary dashboard and features
- **Profile** (`/profile/*`) - User profile management
- **Settings** (`/settings/*`) - Application settings
- Each SPA has its own routing, state management, and page structure

### Component Islands
- **Qwik Components** - Interactive client-side components
- **Svelte Components** - Authentication forms and UI elements
- **Astro Components** - Server-rendered content and demos

## Authentication System

The application uses AWS Cognito for authentication with a comprehensive token management system:

### Features
- **JWT Token Validation** - Server-side and client-side token verification
- **Secure Token Storage** - Cookies for SSR, localStorage/sessionStorage for client
- **Route Protection** - Middleware-based authentication for protected routes
- **Automatic Token Refresh** - Seamless token renewal
- **Multi-Storage Strategy** - Handles both "remember me" and session-only preferences

### Protected Routes
- `/app/*` - Main application (requires authentication)
- `/profile/*` - Profile management (requires authentication)  
- `/settings/*` - Settings (requires authentication)
- `/test-auth/private` - Testing authentication

### Configuration
Update `src/lib/cognito-config.ts` with your AWS Cognito settings:
```typescript
export const cognitoConfig = {
  region: 'your-region',
  userPoolId: 'your-user-pool-id',
  userPoolWebClientId: 'your-client-id'
}
```

## Using Qwik SPAs

The project includes three full single-page applications. Each SPA is loaded through Astro's catch-all routing:

```astro
---
// src/pages/app/[...all].astro
import { App } from 'src/applications-qwik/app/App.tsx'
---

<App 
  client:load 
  initialRoute={initialRoute}
  initialTheme={initialTheme}
  initialSidebarOpen={initialSidebarOpen}
  initialIsMobile={isMobileDevice}
/>
```

### Adding New SPA Pages
1. Create a new page component in `src/applications-qwik/app/pages/`
2. Import and add routing in the main `App.tsx`
3. The SPA handles client-side navigation automatically

## Using Svelte Components

Svelte components are used primarily for authentication flows:

```astro
---
import SvelteLoginForm from 'src/components-svelte/auth/SvelteLoginForm.svelte';
---

<SvelteLoginForm client:load />
```

## Using Qwik Islands

Individual Qwik components can be used as client islands throughout Astro pages:

```astro
---
import QwikCounter from 'src/components-qwik/QwikCounter.tsx';
---

<QwikCounter client:load />
```

## Framework Integration

The project demonstrates how to coordinate multiple frameworks:

1. **Astro Configuration** - Each framework has specific include patterns
2. **Shared Authentication** - All frameworks use the same auth system
3. **Consistent Styling** - Tailwind CSS works across all frameworks
4. **Type Safety** - TypeScript provides type safety for all components

## Cloudflare Features

The application is optimized for Cloudflare Workers with access to:

- **D1 Database** - SQLite database at the edge
- **KV Storage** - Key-value storage for sessions
- **R2 Storage** - Object storage for assets
- **Workers Analytics** - Performance monitoring

Configure bindings in `wrangler.toml` and access through `locals.runtime.env` in API routes.

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run deploy` - Deploy to Cloudflare Pages
- `npx wrangler pages dev ./dist` - Test with Cloudflare Workers locally

## Environment Setup

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Configure AWS Cognito

1. **Create or Access Your Cognito User Pool**:
   - Go to [AWS Console > Cognito](https://console.aws.amazon.com/cognito/)
   - Create a new User Pool or select an existing one
   - Note your AWS region (e.g., `us-east-1`, `af-south-1`)

2. **Get Required Values**:
   - **User Pool ID**: Found in General Settings (format: `region_xxxxxxxxx`)
   - **Web Client ID**: Found in App Clients section (not the Native client)
   - **Region**: Your AWS region where the User Pool is located

3. **Update Your `.env` File**:
   ```bash
   PUBLIC_COGNITO_REGION=your-aws-region
   PUBLIC_COGNITO_USER_POOL_ID=your-user-pool-id
   PUBLIC_COGNITO_CLIENT_ID=your-web-client-id
   ```

### 3. Optional: Claude API Configuration

If using Claude API features, add your Anthropic API key:

```bash
CLAUDE_API_KEY=your-claude-api-key
CLAUDE_MODEL=claude-3-sonnet-20240229
CLAUDE_MAX_TOKENS=4096
ANTHROPIC_VERSION=2023-06-01
```

### 4. Cloudflare Pages Deployment

For production deployment:

1. **Set Environment Variables in Cloudflare Pages**:
   - Go to Pages > Your Project > Settings > Environment Variables
   - Add all `PUBLIC_` prefixed variables:
     - `PUBLIC_COGNITO_REGION`
     - `PUBLIC_COGNITO_USER_POOL_ID`
     - `PUBLIC_COGNITO_CLIENT_ID`

2. **Server-only Variables** (if needed):
   - `CLAUDE_API_KEY`
   - `CLAUDE_MODEL`
   - `CLAUDE_MAX_TOKENS`
   - `ANTHROPIC_VERSION`

### 5. Verify Configuration

```bash
npm run dev
```

If you see environment variable errors in the console, double-check your `.env` file.

### Required Environment Variables

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `PUBLIC_COGNITO_REGION` | Public | AWS region | `us-east-1` |
| `PUBLIC_COGNITO_USER_POOL_ID` | Public | Cognito User Pool ID | `us-east-1_AbCdEfGhI` |
| `PUBLIC_COGNITO_CLIENT_ID` | Public | Cognito Web Client ID | `1a2b3c4d5e6f7g8h9i0j` |
| `CLAUDE_API_KEY` | Private | Anthropic API key | `sk-ant-api...` |

### Troubleshooting

- **"Missing required environment variables" error**: Check your `.env` file syntax
- **Authentication not working**: Verify your Cognito configuration allows your domain
- **Variables not loading**: Restart your development server after changes
- **Build errors**: Ensure all required PUBLIC_ variables are set

This multi-framework architecture provides the flexibility to use the best tool for each part of your application while maintaining a cohesive user experience.