/**
 * Browser Polyfills for Node.js Globals
 * Sets up Node.js globals that Solana and WalletConnect libraries expect in the browser environment
 */

// Import polyfills
import { Buffer } from 'buffer';

// Create minimal process polyfill for browser
const browserProcess = {
  env: {},
  browser: true,
  version: '',
  versions: {},
  nextTick: (fn: (...args: any[]) => void, ...args: any[]) => {
    setTimeout(() => fn(...args), 0);
  }
};

// Immediately define global process if not available
if (typeof globalThis !== 'undefined' && !globalThis.process) {
  (globalThis as any).process = browserProcess;
}

/**
 * Initialize browser polyfills for Node.js globals
 * Must be called before importing any Solana or crypto libraries
 */
export function initializeBrowserPolyfills() {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Polyfill Buffer global
    if (!window.Buffer) {
      window.Buffer = Buffer;
    }

    // Polyfill global object
    if (!window.global) {
      window.global = window;
    }

    // Polyfill process global with minimal implementation
    if (!window.process) {
      window.process = browserProcess;
    }

    // Ensure process.env exists
    if (!window.process.env) {
      window.process.env = {};
    }

    // Polyfill setImmediate for crypto libraries
    if (!window.setImmediate) {
      window.setImmediate = function(callback: (...args: any[]) => void, ...args: any[]) {
        return setTimeout(callback, 0, ...args);
      };
    }

    // Polyfill clearImmediate
    if (!window.clearImmediate) {
      window.clearImmediate = function(id: number) {
        clearTimeout(id);
      };
    }

    // Polyfill require function (minimal implementation for browser)
    if (!window.require) {
      window.require = function(moduleName: string) {
        console.warn(`[BrowserPolyfills] require('${moduleName}') called in browser - returning empty object`);
        return {};
      };
    }

    console.debug('[BrowserPolyfills] Node.js globals initialized successfully');
  } catch (error) {
    console.warn('[BrowserPolyfills] Failed to initialize some polyfills:', error);
  }
}

/**
 * Check if browser supports required crypto features
 */
export function checkBrowserSupport(): {
  supported: boolean;
  missingFeatures: string[];
} {
  if (typeof window === 'undefined') {
    return { supported: false, missingFeatures: ['Not in browser environment'] };
  }

  const missingFeatures: string[] = [];

  // Check for crypto API
  if (!window.crypto) {
    missingFeatures.push('Web Crypto API');
  }

  // Check for crypto.subtle
  if (!window.crypto?.subtle) {
    missingFeatures.push('SubtleCrypto API');
  }

  // Check for TextEncoder/TextDecoder
  if (!window.TextEncoder) {
    missingFeatures.push('TextEncoder');
  }

  if (!window.TextDecoder) {
    missingFeatures.push('TextDecoder');
  }

  return {
    supported: missingFeatures.length === 0,
    missingFeatures
  };
}

/**
 * Safe environment checker for SSR
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Safe environment checker for Node.js
 */
export const isNode = typeof window === 'undefined' && typeof process !== 'undefined';

/**
 * Get environment info for debugging
 */
export function getEnvironmentInfo() {
  return {
    isBrowser,
    isNode,
    hasBuffer: typeof Buffer !== 'undefined',
    hasProcess: isBrowser ? (typeof window !== 'undefined' && typeof window.process !== 'undefined') : true,
    hasWindow: typeof window !== 'undefined',
    hasCrypto: typeof crypto !== 'undefined',
    userAgent: isBrowser ? navigator.userAgent : 'Unknown'
  };
}

// Auto-initialize polyfills when this module is imported in browser
if (isBrowser) {
  initializeBrowserPolyfills();
}

// Type declarations for global augmentation
declare global {
  interface Window {
    Buffer: typeof Buffer;
    global: typeof globalThis;
    process: any; // Use any to avoid complex Node.js Process type conflicts
    setImmediate: any;
    clearImmediate: any;
    require: any;
  }
}