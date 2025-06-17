/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  SESSION?: KVNamespace;
}

declare global {
  namespace App {
    interface Locals {
      runtime: {
        env: Env;
        cf: CfProperties;
        ctx: ExecutionContext;
      };
    }
  }
}

export {};