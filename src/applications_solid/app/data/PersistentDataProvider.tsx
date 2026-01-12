/**
 * Persistent Data Provider
 * SolidJS Context Provider that manages persistent data across navigation
 */

import { createContext, useContext, createSignal, createEffect, onMount } from 'solid-js';
import type { Component } from 'solid-js';
import { smartFetch, invalidateCache, clearUserCache, getCacheStats, type SmartFetchResult } from './smart-fetch';
import { CACHE_POLICIES, type CachePolicy } from './cache-engine';
import { type ProcessedTransaction } from '../../lib/solana_mainnet/rpc-service';

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
  solPrice: number;
  splitdoTokenMint: string;
  lastUpdated: string;
}

export interface PersistentDataContextValue {
  // Data accessors
  transactionHistory: () => ProcessedTransaction[];
  balanceData: () => BalanceData | null;
  exchangeRates: () => ExchangeRateData | null;

  // Smart fetch functions
  fetchTransactions: (address: string, limit?: number, options?: { force?: boolean }) => Promise<SmartFetchResult<ProcessedTransaction[]>>;
  fetchBalances: (options?: { force?: boolean }) => Promise<SmartFetchResult<BalanceData>>;
  fetchExchangeRates: (options?: { force?: boolean }) => Promise<SmartFetchResult<ExchangeRateData>>;

  // Cache management
  invalidateTransactions: () => void;
  invalidateBalances: () => void;
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

  // Initialize user context
  onMount(async () => {
    const userId = await getCurrentUserId();
    setCurrentUserId(userId);
    console.log('[PersistentDataProvider] Initialized with user ID:', userId);
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

  // Smart fetch function for exchange rates (placeholder)
  const fetchExchangeRates = async (options: { force?: boolean } = {}): Promise<SmartFetchResult<ExchangeRateData>> => {
    const userId = currentUserId();
    const cacheKey = 'exchange-rates';

    setIsLoading(true);

    try {
      const result = await smartFetch(
        async () => {
          // This would integrate with existing exchange rate fetching
          return {
            exchangeRate: 0.11,
            solPrice: 139.65,
            splitdoTokenMint: '6vdfHTgLiEXvoGVp8Ga2HaKQsPKj6DrUTee7526SCXoM',
            lastUpdated: new Date().toISOString()
          } as ExchangeRateData;
        },
        {
          cacheKey,
          policy: CACHE_POLICIES.EXCHANGE_RATES,
          userId: userId || undefined,
          bypassCache: options.force
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

  const invalidateAll = () => {
    const userId = currentUserId();
    if (userId) {
      clearUserCache(userId);
    }
    setTransactionHistory([]);
    setBalanceData(null);
    setExchangeRates(null);
    console.log('[PersistentDataProvider] Invalidated all cache data');
  };

  const clearUserData = (userId: string) => {
    clearUserCache(userId);
    if (currentUserId() === userId) {
      setTransactionHistory([]);
      setBalanceData(null);
      setExchangeRates(null);
    }
    console.log('[PersistentDataProvider] Cleared user data for:', userId);
  };

  // Context value
  const contextValue: PersistentDataContextValue = {
    // Data accessors
    transactionHistory,
    balanceData,
    exchangeRates,

    // Smart fetch functions
    fetchTransactions,
    fetchBalances,
    fetchExchangeRates,

    // Cache management
    invalidateTransactions,
    invalidateBalances,
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