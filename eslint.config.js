// @ts-check
import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import astro from 'eslint-plugin-astro';
import qwik from 'eslint-plugin-qwik';
import svelte from 'eslint-plugin-svelte';

export default [
  // Base JavaScript/TypeScript configuration
  eslint.configs.recommended,
  
  // TypeScript configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },

  // Astro configuration
  {
    files: ['**/*.astro'],
    ...astro.configs.recommended,
    rules: {
      ...astro.configs.recommended.rules,
      'astro/no-conflict-set-directives': 'error',
      'astro/no-unused-define-vars-in-style': 'error',
    },
  },

  // Qwik configuration
  {
    files: ['**/components-qwik/**/*.tsx', '**/applications-qwik/**/*.tsx'],
    plugins: {
      qwik,
    },
    rules: {
      ...qwik.configs.recommended.rules,
      'qwik/jsx-img': 'warn',
      'qwik/no-use-after-await': 'error',
      'qwik/prefer-classlist': 'warn',
    },
  },

  // Svelte configuration
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelte.parser,
      parserOptions: {
        parser: tsparser,
        extraFileExtensions: ['.svelte'],
      },
    },
    plugins: {
      svelte,
    },
    rules: {
      ...svelte.configs.recommended.rules,
      'svelte/no-at-debug-tags': 'warn',
      'svelte/no-unused-svelte-ignore': 'error',
      'svelte/prefer-class-directive': 'warn',
    },
  },

  // Global ignores
  {
    ignores: [
      'dist/**',
      'build/**',
      '.astro/**',
      'node_modules/**',
      'wrangler.toml',
      '**/*.d.ts',
      '.wrangler/**',
      'coverage/**',
      '*.config.js',
      '*.config.mjs',
      'clean.sh',
    ],
  },

  // General rules for all files
  {
    rules: {
      'no-console': 'off', // We use our logger instead
      'no-debugger': 'error',
      'no-alert': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
    },
  },
];