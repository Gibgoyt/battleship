/**
 * Smart Fetch Logic
 * Provides intelligent caching and deduplication for API calls
 */

import { cacheEngine, type CachePolicy } from './cache-engine';

export interface SmartFetchOptions {
  cacheKey: string;
  policy: CachePolicy;
  userId?: string;
  bypassCache?: boolean;
  backgroundRefresh?: boolean;
}

export interface SmartFetchResult<T> {
  data: T | null;
  fromCache: boolean;
  isStale: boolean;
  needsRefresh: boolean;
  refresh: () => Promise<void>;
}

// Track pending requests to prevent duplicates
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Smart fetch function that handles caching, deduplication, and stale-while-revalidate
 */
export async function smartFetch<T>(
  fetchFn: () => Promise<T>,
  options: SmartFetchOptions
): Promise<SmartFetchResult<T>> {
  const { cacheKey, policy, userId, bypassCache = false, backgroundRefresh = false } = options;

  console.log(`[SmartFetch] Request for key: ${cacheKey}`, {
    bypassCache,
    backgroundRefresh,
    policy: policy.ttl
  });

  // Create unique request key for deduplication
  const requestKey = userId ? `${cacheKey}:${userId}` : cacheKey;

  // Check cache first (unless bypassing)
  if (!bypassCache) {
    const cached = cacheEngine.get<T>(cacheKey, policy, userId);

    if (cached.data !== null) {
      console.log(`[SmartFetch] Cache hit for key: ${cacheKey}`, {
        isFresh: cached.isFresh,
        isStale: cached.isStale,
        needsRefresh: cached.needsRefresh
      });

      // Create refresh function
      const refresh = () => smartFetch(fetchFn, { ...options, bypassCache: true }).then(() => {});

      if (cached.isFresh) {
        // Fresh data - return immediately
        return {
          data: cached.data,
          fromCache: true,
          isStale: false,
          needsRefresh: false,
          refresh
        };
      }

      if (cached.isStale && policy.staleWhileRevalidate) {
        // Stale but valid - return immediately, refresh in background
        if (backgroundRefresh) {
          console.log(`[SmartFetch] Starting background refresh for: ${cacheKey}`);
          smartFetch(fetchFn, { ...options, bypassCache: true }).catch(error => {
            console.warn(`[SmartFetch] Background refresh failed for ${cacheKey}:`, error);
          });
        }

        return {
          data: cached.data,
          fromCache: true,
          isStale: true,
          needsRefresh: true,
          refresh
        };
      }
    }
  }

  // Check for pending request to prevent duplication
  if (pendingRequests.has(requestKey)) {
    console.log(`[SmartFetch] Deduplicating request for: ${cacheKey}`);
    try {
      const data = await pendingRequests.get(requestKey);
      return {
        data,
        fromCache: false,
        isStale: false,
        needsRefresh: false,
        refresh: () => smartFetch(fetchFn, { ...options, bypassCache: true }).then(() => {})
      };
    } catch (error) {
      // If the pending request failed, continue with a new request
      pendingRequests.delete(requestKey);
    }
  }

  // Make fresh request
  console.log(`[SmartFetch] Making fresh request for: ${cacheKey}`);

  // Enhanced fetch function with auth error handling
  const executeWithAuth = async (): Promise<T> => {
    try {
      const result = await fetchFn();
      return result;
    } catch (error: any) {
      // Handle 401/403 responses
      if (error.status === 401 || error.status === 403) {
        console.warn('[SmartFetch] Auth error detected, invalidating cache and triggering auth flow', {
          status: error.status,
          cacheKey,
          userId
        });

        // Invalidate cache for this user
        if (userId) {
          clearUserCache(userId);
        }

        // Notify auth system
        try {
          const { getGlobalAuthStore } = await import('../middleware/firebase/auth-store');
          const authStore = getGlobalAuthStore();

          // Attempt token refresh
          try {
            await authStore.refreshToken();
            console.log('[SmartFetch] Token refresh successful, retrying request');

            // Retry request once with new token
            return await fetchFn();
          } catch (refreshError) {
            console.error('[SmartFetch] Token refresh failed during 401 handling', refreshError);

            // Refresh failed - trigger session expiry
            authStore.triggerSessionExpiryNotification();
            throw error;
          }
        } catch (importError) {
          console.error('[SmartFetch] Failed to import auth store for 401 handling', importError);
          throw error;
        }
      }

      // Re-throw non-auth errors
      throw error;
    }
  };

  const fetchPromise = (async () => {
    try {
      const data = await executeWithAuth();

      // Cache the successful response
      cacheEngine.set(cacheKey, data, policy, userId);

      console.log(`[SmartFetch] Successfully cached fresh data for: ${cacheKey}`);
      return data;
    } catch (error) {
      console.error(`[SmartFetch] Request failed for ${cacheKey}:`, error);

      // Try to return stale cache on error (but not for auth errors)
      if (!((error as any)?.status === 401 || (error as any)?.status === 403)) {
        const fallbackCache = cacheEngine.get<T>(cacheKey, policy, userId);
        if (fallbackCache.data !== null) {
          console.log(`[SmartFetch] Using stale cache as fallback for: ${cacheKey}`);
          return fallbackCache.data;
        }
      }

      throw error;
    } finally {
      pendingRequests.delete(requestKey);
    }
  })();

  pendingRequests.set(requestKey, fetchPromise);

  try {
    const data = await fetchPromise;
    return {
      data,
      fromCache: false,
      isStale: false,
      needsRefresh: false,
      refresh: () => smartFetch(fetchFn, { ...options, bypassCache: true }).then(() => {})
    };
  } catch (error) {
    // Return null data but still provide refresh function
    return {
      data: null,
      fromCache: false,
      isStale: false,
      needsRefresh: true,
      refresh: () => smartFetch(fetchFn, { ...options, bypassCache: true }).then(() => {})
    };
  }
}

/**
 * Invalidate cache for specific key
 */
export function invalidateCache(cacheKey: string, userId?: string): void {
  cacheEngine.delete(cacheKey, userId);
  console.log(`[SmartFetch] Invalidated cache for key: ${cacheKey}`);
}

/**
 * Clear all cache for user
 */
export function clearUserCache(userId: string): void {
  cacheEngine.clearUser(userId);
  // Clear pending requests for this user
  for (const [key] of pendingRequests) {
    if (key.includes(`:${userId}`)) {
      pendingRequests.delete(key);
    }
  }
  console.log(`[SmartFetch] Cleared all cache for user: ${userId}`);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    ...cacheEngine.getStats(),
    pendingRequests: pendingRequests.size
  };
}