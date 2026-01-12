/**
 * Persistent Data Layer - Main Exports
 * Provides intelligent caching and data persistence across navigation
 */

export { PersistentDataProvider, usePersistentData, usePersistedTransactions } from './PersistentDataProvider';
export { smartFetch, invalidateCache, clearUserCache, getCacheStats } from './smart-fetch';
export { cacheEngine, CACHE_POLICIES, type CacheItem, type CachePolicy } from './cache-engine';

// Re-export types for convenience
export type { SmartFetchOptions, SmartFetchResult } from './smart-fetch';