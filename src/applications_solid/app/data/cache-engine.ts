/**
 * Persistent Cache Engine
 * Combines localStorage persistence with in-memory caching and TTL support
 */

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
}

export interface CachePolicy {
  ttl: number;
  staleWhileRevalidate?: boolean;
  maxAge?: number;
}

export const CACHE_POLICIES = {
  TRANSACTION_HISTORY: {
    ttl: 2 * 60 * 1000,        // 2 minutes
    staleWhileRevalidate: true,
    maxAge: 10 * 60 * 1000     // 10 minutes absolute max
  },
  BALANCE_DATA: {
    ttl: 30 * 1000,            // 30 seconds
    staleWhileRevalidate: true,
    maxAge: 5 * 60 * 1000      // 5 minutes max
  },
  EXCHANGE_RATES: {
    ttl: 5 * 60 * 1000,        // 5 minutes
    staleWhileRevalidate: true,
    maxAge: 30 * 60 * 1000     // 30 minutes max
  },
  SOL_PRICE: {
    ttl: 2 * 60 * 1000,        // 2 minutes
    staleWhileRevalidate: true,
    maxAge: 10 * 60 * 1000     // 10 minutes max
  },
  PROGRAM_INFO: {
    ttl: 10 * 60 * 1000,       // 10 minutes
    staleWhileRevalidate: false,
    maxAge: 60 * 60 * 1000     // 1 hour max
  }
} as const;

class CacheEngine {
  private memoryCache = new Map<string, CacheItem>();
  private readonly STORAGE_PREFIX = 'splitdo_cache_';

  /**
   * Generate cache key with user isolation
   */
  private generateKey(key: string, userId?: string): string {
    return userId ? `${key}:${userId}` : key;
  }

  /**
   * Check if cache item is fresh
   */
  private isFresh(item: CacheItem, policy: CachePolicy): boolean {
    const age = Date.now() - item.timestamp;
    return age < policy.ttl;
  }

  /**
   * Check if cache item is stale but still valid for stale-while-revalidate
   */
  private isStaleButValid(item: CacheItem, policy: CachePolicy): boolean {
    if (!policy.staleWhileRevalidate || !policy.maxAge) return false;
    const age = Date.now() - item.timestamp;
    return age >= policy.ttl && age < policy.maxAge;
  }

  /**
   * Load cache item from localStorage
   */
  private loadFromStorage(key: string): CacheItem | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_PREFIX + key);
      if (!stored) return null;

      const item = JSON.parse(stored) as CacheItem;

      // Validate structure
      if (!item.data || !item.timestamp || !item.ttl) {
        localStorage.removeItem(this.STORAGE_PREFIX + key);
        return null;
      }

      return item;
    } catch (error) {
      console.warn('[CacheEngine] Failed to load from localStorage:', error);
      localStorage.removeItem(this.STORAGE_PREFIX + key);
      return null;
    }
  }

  /**
   * Save cache item to localStorage
   */
  private saveToStorage(key: string, item: CacheItem): void {
    try {
      localStorage.setItem(this.STORAGE_PREFIX + key, JSON.stringify(item));
    } catch (error) {
      console.warn('[CacheEngine] Failed to save to localStorage:', error);
      // Continue without localStorage persistence
    }
  }

  /**
   * Get cached data
   */
  get<T>(key: string, policy: CachePolicy, userId?: string): {
    data: T | null;
    isFresh: boolean;
    isStale: boolean;
    needsRefresh: boolean;
  } {
    const cacheKey = this.generateKey(key, userId);

    // Check memory cache first
    let item = this.memoryCache.get(cacheKey);

    // Fallback to localStorage
    if (!item) {
      item = this.loadFromStorage(cacheKey);
      if (item) {
        this.memoryCache.set(cacheKey, item);
      }
    }

    if (!item) {
      return {
        data: null,
        isFresh: false,
        isStale: false,
        needsRefresh: true
      };
    }

    const isFresh = this.isFresh(item, policy);
    const isStaleButValid = this.isStaleButValid(item, policy);

    // Check if completely expired
    const age = Date.now() - item.timestamp;
    const isExpired = policy.maxAge ? age >= policy.maxAge : age >= policy.ttl;

    if (isExpired) {
      // Remove expired data
      this.delete(key, userId);
      return {
        data: null,
        isFresh: false,
        isStale: false,
        needsRefresh: true
      };
    }

    return {
      data: item.data,
      isFresh,
      isStale: !isFresh && isStaleButValid,
      needsRefresh: !isFresh
    };
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T, policy: CachePolicy, userId?: string): void {
    const cacheKey = this.generateKey(key, userId);
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: policy.ttl,
      key: cacheKey
    };

    // Store in memory cache
    this.memoryCache.set(cacheKey, item);

    // Persist to localStorage
    this.saveToStorage(cacheKey, item);

    console.log(`[CacheEngine] Cached data for key: ${key}`, {
      ttl: policy.ttl,
      expiresAt: new Date(Date.now() + policy.ttl).toLocaleTimeString()
    });
  }

  /**
   * Delete cached data
   */
  delete(key: string, userId?: string): void {
    const cacheKey = this.generateKey(key, userId);
    this.memoryCache.delete(cacheKey);
    localStorage.removeItem(this.STORAGE_PREFIX + cacheKey);
  }

  /**
   * Clear all cache for a user
   */
  clearUser(userId: string): void {
    // Clear memory cache
    for (const [key, item] of this.memoryCache.entries()) {
      if (key.includes(`:${userId}`)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.STORAGE_PREFIX) && key.includes(`:${userId}`)) {
        localStorage.removeItem(key);
      }
    }

    console.log(`[CacheEngine] Cleared cache for user: ${userId}`);
  }

  /**
   * Clear all cache data
   */
  clearAll(): void {
    this.memoryCache.clear();

    // Clear localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }

    console.log('[CacheEngine] Cleared all cache data');
  }

  /**
   * Get cache statistics for debugging
   */
  getStats(): {
    memoryItems: number;
    storageItems: number;
    totalSizeKB: number;
  } {
    const memoryItems = this.memoryCache.size;

    let storageItems = 0;
    let totalSize = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.STORAGE_PREFIX)) {
        storageItems++;
        totalSize += (localStorage.getItem(key) || '').length;
      }
    }

    return {
      memoryItems,
      storageItems,
      totalSizeKB: Math.round(totalSize / 1024)
    };
  }
}

// Global cache engine instance
export const cacheEngine = new CacheEngine();