/**
 * Persistent Data Provider
 * SolidJS Context Provider that manages persistent data across navigation
 */

import { createContext, useContext, createSignal, createEffect, onMount } from 'solid-js';
import type { Component } from 'solid-js';
import { smartFetch, invalidateCache, clearUserCache, getCacheStats, type SmartFetchResult } from './smart-fetch';
import { CACHE_POLICIES, type CachePolicy } from './cache-engine';
import { type ProcessedTransaction } from '../../lib/solana_mainnet/rpc-service';
import { GET as getCoinGeckoPrice } from '../middleware/endpoints/coingecko/_api/v3/simple/price';

// Types for cached data
export interface BalanceData {
  solBalance: number;
  splitdoBalance: number;
  splitdoATA: {
    address: string;
    status: 'exists' | 'unknown' | 'checking';
  };
  lastUpdated: string;
}

export interface ExchangeRateData {
  exchangeRate: number;
  splitdoTokenMint: string;
  lastUpdated: string;
}

export interface SolPriceData {
  price: number;
  currency: string;
  lastUpdated: string;
}

export interface PersistentDataContextValue {
  // Data accessors
  transactionHistory: () => ProcessedTransaction[];
  balanceData: () => BalanceData | null;
  exchangeRates: () => ExchangeRateData | null;
  solPrice: () => SolPriceData | null;

  // Smart fetch functions
  fetchTransactions: (address: string, limit?: number, options?: { force?: boolean }) => Promise<SmartFetchResult<ProcessedTransaction[]>>;
  fetchBalances: (options?: { force?: boolean }) => Promise<SmartFetchResult<BalanceData>>;
  fetchExchangeRates: (options?: { force?: boolean }) => Promise<SmartFetchResult<ExchangeRateData>>;
  fetchSolPrice: (options?: { force?: boolean }) => Promise<SmartFetchResult<SolPriceData>>;

  // Cache management
  invalidateTransactions: () => void;
  invalidateBalances: () => void;
  invalidateExchangeRates: () => void;
  invalidateSolPrice: () => void;
  invalidateAll: () => void;
  clearUserData: (userId: string) => void;

  // Status
  isLoading: () => boolean;
  cacheStats: () => any;
}

const PersistentDataContext = createContext<PersistentDataContextValue>();

export const PersistentDataProvider: Component<{ children: any }> = (props) => {
  // Reactive signals for cached data
  const [transactionHistory, setTransactionHistory] = createSignal<ProcessedTransaction[]>([]);
  const [balanceData, setBalanceData] = createSignal<BalanceData | null>(null);
  const [exchangeRates, setExchangeRates] = createSignal<ExchangeRateData | null>(null);
  const [solPrice, setSolPrice] = createSignal<SolPriceData | null>(null);
  const [isLoading, setIsLoading] = createSignal(false);
  const [currentUserId, setCurrentUserId] = createSignal<string | null>(null);

  console.log('[PersistentDataProvider] Initializing with persistent data context');

  // Helper to get current user ID from auth
  const getCurrentUserId = async (): Promise<string | null> => {
    try {
      // Get auth store to extract user ID from token
      const { getGlobalAuthStore } = await import('../middleware/firebase/auth-store');
      const authStore = getGlobalAuthStore();

      // This would need to be implemented in auth store to extract user ID from token
      // For now, we'll use a placeholder
      return 'current-user-id';
    } catch (error) {
      console.warn('[PersistentDataProvider] Could not get current user ID:', error);
      return null;
    }
  };

  // Initialize user context and auth state listeners
  onMount(async () => {
    const userId = await getCurrentUserId();
    setCurrentUserId(userId);
    console.log('[PersistentDataProvider] Initialized with user ID:', userId);

    // Set up auth state listeners for cache invalidation
    try {
      const { getGlobalAuthStore } = await import('../middleware/firebase/auth-store');
      const authStore = getGlobalAuthStore();

      // Listen to session expiry notifications
      createEffect(() => {
        try {
          const sessionNotification = authStore.getSessionExpiryNotification();
          if (sessionNotification && sessionNotification.isVisible) {
            console.log('[PersistentDataProvider] Session expiry detected - clearing all caches');
            invalidateAll();

            // Clear user-specific data
            const currentUser = currentUserId();
            if (currentUser) {
              clearUserData(currentUser);
            }
            setCurrentUserId(null);
          }
        } catch (error) {
          console.warn('[PersistentDataProvider] Error checking session notification:', error);
        }
      });

      // Listen to auth state changes
      createEffect(() => {
        try {
          const isAuthenticated = authStore.isAuthenticated();
          if (!isAuthenticated) {
            // User logged out - clear caches
            console.log('[PersistentDataProvider] User logged out - clearing caches');
            invalidateAll();
            setCurrentUserId(null);
          }
        } catch (error) {
          console.warn('[PersistentDataProvider] Error checking auth state:', error);
        }
      });

      // Listen for auth errors via custom events (from fetch-wrapper and smart-fetch)
      const handleAuthError = (event: CustomEvent) => {
        console.warn('[PersistentDataProvider] Auth error event received:', event.detail);

        // Clear cache for affected user
        const currentUser = currentUserId();
        if (currentUser) {
          clearUserData(currentUser);
        }

        // If this was a session-ending error, clear current user
        if (event.detail?.statusCode === 401 || event.detail?.statusCode === 403) {
          setCurrentUserId(null);
        }
      };

      // Listen for auth error events from window
      window.addEventListener('authError', handleAuthError as EventListener);

      console.log('[PersistentDataProvider] Auth state listeners initialized successfully');
    } catch (authError) {
      console.warn('[PersistentDataProvider] Could not initialize auth state listeners:', authError);
    }
  });

  // Smart fetch function for transactions
  const fetchTransactions = async (
    address: string,
    limit: number = 20,
    options: { force?: boolean } = {}
  ): Promise<SmartFetchResult<ProcessedTransaction[]>> => {
    const userId = currentUserId();
    const cacheKey = `transactions:${address}:${limit}`;

    console.log('[PersistentDataProvider] Fetching transactions', { address, limit, force: options.force });
    setIsLoading(true);

    try {
      const result = await smartFetch(
        async () => {
          // Import the backend endpoint dynamically
          const { middlewareFetch } = await import('../middleware/endpoints');
          const response = await middlewareFetch.Endpoints.Devbackend._Api.SplitdoToken.History[':Index'].GET(limit);

          if (response.status === 200) {
            // Transform backend data to ProcessedTransaction format (using existing logic)
            const transformedTransactions = response.data.signature_history.signatures.map((sig: any): ProcessedTransaction => ({
              signature: sig.signature,
              slot: sig.slot,
              blockTime: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : null,
              fee: 0,
              success: sig.confirmationStatus === 'finalized',
              error: null,
              preBalances: [],
              postBalances: [],
              preTokenBalances: [],
              postTokenBalances: [],
              instructions: [],
              accounts: [],
              type: 'unknown',
              fromAsset: undefined,
              toAsset: undefined,
              amount: undefined,
              toAmount: undefined
            }));

            console.log('[PersistentDataProvider] Successfully transformed transaction data', {
              count: transformedTransactions.length
            });

            return transformedTransactions;
          } else {
            throw new Error(`Backend API error: ${response.status}`);
          }
        },
        {
          cacheKey,
          policy: CACHE_POLICIES.TRANSACTION_HISTORY,
          userId: userId || undefined,
          bypassCache: options.force,
          backgroundRefresh: true
        }
      );

      // Update signal with result
      if (result.data) {
        setTransactionHistory(result.data);
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  };

  // Smart fetch function for balances (placeholder - would integrate with existing balance logic)
  const fetchBalances = async (options: { force?: boolean } = {}): Promise<SmartFetchResult<BalanceData>> => {
    const userId = currentUserId();
    const cacheKey = 'balances';

    setIsLoading(true);

    try {
      const result = await smartFetch(
        async () => {
          // This would integrate with existing balance fetching logic
          // For now, return placeholder data
          return {
            solBalance: 0,
            splitdoBalance: 0,
            splitdoATA: {
              address: '',
              status: 'unknown' as const
            },
            lastUpdated: new Date().toISOString()
          } as BalanceData;
        },
        {
          cacheKey,
          policy: CACHE_POLICIES.BALANCE_DATA,
          userId: userId || undefined,
          bypassCache: options.force
        }
      );

      if (result.data) {
        setBalanceData(result.data);
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  };

  // Smart fetch function for exchange rates
  const fetchExchangeRates = async (options: { force?: boolean } = {}): Promise<SmartFetchResult<ExchangeRateData>> => {
    const userId = currentUserId();
    const cacheKey = 'exchange-rates';

    setIsLoading(true);

    try {
      const result = await smartFetch(
        async () => {
          // Call the actual backend API for exchange rates
          const { middlewareFetch } = await import('../middleware/endpoints');
          const response = await middlewareFetch.Endpoints.Devbackend._Api.SplitdoToken.Program.Info.GET();

          if (response.status === 200) {
            const data = response.data;
            return {
              exchangeRate: data.exchangeRate || 0.11,
              splitdoTokenMint: data.splitdoTokenMint || '6vdfHTgLiEXvoGVp8Ga2HaKQsPKj6DrUTee7526SCXoM',
              lastUpdated: new Date().toISOString()
            } as ExchangeRateData;
          } else {
            throw new Error(`Exchange rate API error: ${response.status}`);
          }
        },
        {
          cacheKey,
          policy: CACHE_POLICIES.EXCHANGE_RATES,
          userId: userId || undefined,
          bypassCache: options.force,
          backgroundRefresh: true
        }
      );

      if (result.data) {
        setExchangeRates(result.data);
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  };

  // Smart fetch function for SOL price
  const fetchSolPrice = async (options: { force?: boolean } = {}): Promise<SmartFetchResult<SolPriceData>> => {
    const userId = currentUserId();
    const cacheKey = 'sol-price';

    setIsLoading(true);

    try {
      const result = await smartFetch(
        async () => {
          // Use the proper CoinGecko endpoint
          const response = await getCoinGeckoPrice({
            ids: 'solana',
            vs_currencies: 'usd'
          });

          if (response.status !== 200) {
            throw new Error(`SOL price API error: ${response.status}`);
          }

          const data = response.data as Record<string, { usd?: number }>;
          const solanaPrice = data.solana?.usd;

          if (typeof solanaPrice !== 'number') {
            throw new Error('Invalid SOL price response format');
          }

          return {
            price: solanaPrice,
            currency: 'usd',
            lastUpdated: new Date().toISOString()
          } as SolPriceData;
        },
        {
          cacheKey,
          policy: CACHE_POLICIES.SOL_PRICE,
          userId: userId || undefined,
          bypassCache: options.force,
          backgroundRefresh: true
        }
      );

      if (result.data) {
        setSolPrice(result.data);
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  };

  // Cache invalidation functions
  const invalidateTransactions = () => {
    const userId = currentUserId();
    invalidateCache('transactions', userId || undefined);
    setTransactionHistory([]);
    console.log('[PersistentDataProvider] Invalidated transaction cache');
  };

  const invalidateBalances = () => {
    const userId = currentUserId();
    invalidateCache('balances', userId || undefined);
    setBalanceData(null);
    console.log('[PersistentDataProvider] Invalidated balance cache');
  };

  const invalidateExchangeRates = () => {
    const userId = currentUserId();
    invalidateCache('exchange-rates', userId || undefined);
    setExchangeRates(null);
    console.log('[PersistentDataProvider] Invalidated exchange rates cache');
  };

  const invalidateSolPrice = () => {
    const userId = currentUserId();
    invalidateCache('sol-price', userId || undefined);
    setSolPrice(null);
    console.log('[PersistentDataProvider] Invalidated SOL price cache');
  };

  const invalidateAll = () => {
    const userId = currentUserId();
    if (userId) {
      clearUserCache(userId);
    }
    setTransactionHistory([]);
    setBalanceData(null);
    setExchangeRates(null);
    setSolPrice(null);
    console.log('[PersistentDataProvider] Invalidated all cache data');
  };

  const clearUserData = (userId: string) => {
    clearUserCache(userId);
    if (currentUserId() === userId) {
      setTransactionHistory([]);
      setBalanceData(null);
      setExchangeRates(null);
      setSolPrice(null);
    }
    console.log('[PersistentDataProvider] Cleared user data for:', userId);
  };

  // Context value
  const contextValue: PersistentDataContextValue = {
    // Data accessors
    transactionHistory,
    balanceData,
    exchangeRates,
    solPrice,

    // Smart fetch functions
    fetchTransactions,
    fetchBalances,
    fetchExchangeRates,
    fetchSolPrice,

    // Cache management
    invalidateTransactions,
    invalidateBalances,
    invalidateExchangeRates,
    invalidateSolPrice,
    invalidateAll,
    clearUserData,

    // Status
    isLoading,
    cacheStats: getCacheStats
  };

  return (
    <PersistentDataContext.Provider value={contextValue}>
      {props.children}
    </PersistentDataContext.Provider>
  );
};

/**
 * Hook to access persistent data context
 */
export function usePersistentData(): PersistentDataContextValue {
  const context = useContext(PersistentDataContext);
  if (!context) {
    throw new Error('usePersistentData must be used within PersistentDataProvider');
  }
  return context;
}

/**
 * Hook for transaction history with cache awareness
 */
export function usePersistedTransactions() {
  const { transactionHistory, fetchTransactions, invalidateTransactions, isLoading } = usePersistentData();
  const [error, setError] = createSignal<string | null>(null);

  const fetchIfStale = async (address: string, limit: number = 20) => {
    setError(null); // Clear previous errors
    console.log('[usePersistedTransactions] Checking if fetch needed for:', address);

    // Always attempt smart fetch - it will check cache internally
    try {
      const result = await fetchTransactions(address, limit);

      if (result.fromCache && result.isFresh) {
        console.log('[usePersistedTransactions] Using fresh cache, no API call needed');
      } else if (result.fromCache && result.isStale) {
        console.log('[usePersistedTransactions] Using stale cache, refreshing in background');
      } else {
        console.log('[usePersistedTransactions] Fresh data fetched from API');
      }

      return result;
    } catch (fetchError) {
      console.error('[usePersistedTransactions] Fetch failed:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch transactions');
      throw fetchError;
    }
  };

  const refreshTransactions = async (address: string, limit: number = 20) => {
    setError(null);
    console.log('[usePersistedTransactions] Force refreshing transactions');
    try {
      return await fetchTransactions(address, limit, { force: true });
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Failed to refresh transactions');
      throw refreshError;
    }
  };

  return {
    transactions: transactionHistory,
    isLoading,
    error,
    fetchIfStale,
    refreshTransactions,
    invalidate: invalidateTransactions
  };
}