/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

// Cloudflare Workers Environment
export interface Env {
  DB: D1Database;
  INTERNAL_OPS_ADMIN_DB: D1Database;
  SESSION?: KVNamespace;
}

// Extend Vite's ImportMetaEnv to include our custom environment variables
interface ImportMetaEnv {
  // AWS Cognito Configuration (Public - accessible in client-side code)
  readonly PUBLIC_COGNITO_REGION: string;
  readonly PUBLIC_COGNITO_USER_POOL_ID: string;
  readonly PUBLIC_COGNITO_CLIENT_ID: string;

  // Claude API Configuration (Server-side only)
  readonly CLAUDE_API_KEY?: string;
  readonly CLAUDE_MODEL?: string;
  readonly CLAUDE_MAX_TOKENS?: string;
  readonly ANTHROPIC_VERSION?: string;

  // Google Analytics (Public - baked into prerendered HTML at build time)
  readonly PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID?: string;

  // Other environment variables as needed
  readonly NODE_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  namespace App {
    interface Locals {
      runtime: {
        env: Env;
        cf: CfProperties;
        ctx: ExecutionContext;
      };
      user?: {
        sub: string;
        email: string;
        username: string;
        emailVerified: boolean;
        groups: string[];
        tokenUse: string;
      };
    }
  }
}

export {};