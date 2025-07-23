/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Environment setup
    environment: 'jsdom',
    globals: true,
    
    // Test files (matching user's pattern)
    include: ['src/**/*.{test,spec}.{js,ts,tsx}'],
    exclude: [
      'node_modules/**',
      'dist/**',
      '.astro/**',
      'coverage/**',
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '.astro/**',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
      ],
    },

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
  },

  // Path resolution (matching tsconfig.json)
  resolve: {
    alias: {
      'src': resolve(__dirname, './src'),
    },
  },

  // Define environment variables for tests
  define: {
    // Mock environment variables for testing
    'import.meta.env.PUBLIC_COGNITO_REGION': JSON.stringify('us-east-1'),
    'import.meta.env.PUBLIC_COGNITO_USER_POOL_ID': JSON.stringify('us-east-1_TestPool'),
    'import.meta.env.PUBLIC_COGNITO_CLIENT_ID': JSON.stringify('test-client-id'),
    'import.meta.env.NODE_ENV': JSON.stringify('test'),
  },

  // Vite configuration for tests
  esbuild: {
    target: 'node14',
  },
});