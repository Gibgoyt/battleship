/**
 * Transaction History Reactive Store
 * Manages real transaction history from Solana mainnet
 */

import { createSignal, createEffect, createMemo } from 'solid-js';
import { type ProcessedTransaction, type TransactionHistoryResult } from './rpc-service';

// Import backend history endpoint
const getBackendHistoryEndpoint = async () => {
  const { middlewareFetch } = await import('../../app/middleware/endpoints');
  return middlewareFetch.Endpoints.Devbackend._Api.SplitdoToken.History[':Index'];
};

// Data transformation utility
function transformBackendResponseToProcessedTransactions(backendResponse: any): ProcessedTransaction[] {
  if (!backendResponse?.signature_history?.signatures) {
    return [];
  }

  return backendResponse.signature_history.signatures.map((sig: any): ProcessedTransaction => ({
    signature: sig.signature,
    slot: sig.slot,
    blockTime: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : null,
    fee: 0, // Not available from backend, set to 0
    success: sig.confirmationStatus === 'finalized',
    error: null,
    preBalances: [],
    postBalances: [],
    preTokenBalances: [],
    postTokenBalances: [],
    instructions: [],
    accounts: [],
    type: 'unknown', // Analysis not available without full transaction data
    fromAsset: undefined,
    toAsset: undefined,
    amount: undefined,
    toAmount: undefined
  }));
}

// Global reactive signals for transaction history
const [transactionHistory, setTransactionHistory] = createSignal<ProcessedTransaction[]>([]);
const [isLoadingHistory, setIsLoadingHistory] = createSignal(false);
const [historyError, setHistoryError] = createSignal<string | null>(null);
const [lastFetchedAddress, setLastFetchedAddress] = createSignal<string | null>(null);

interface TransactionHistoryHook {
  transactions: () => ProcessedTransaction[];
  isLoading: () => boolean;
  error: () => string | null;
  fetchHistory: (address: string, limit?: number) => Promise<void>;
  refreshHistory: () => Promise<void>;
  clearHistory: () => void;
}

/**
 * Hook for managing transaction history
 */
export function useTransactionHistory(): TransactionHistoryHook {
  const fetchHistory = async (address: string, limit: number = 10): Promise<void> => {
    if (!address) {
      console.warn('No address provided to fetch transaction history');
      return;
    }

    console.log(`[TransactionHistory] Fetching history for address: ${address}`);
    setIsLoadingHistory(true);
    setHistoryError(null);
    setLastFetchedAddress(address);

    try {
      // Get backend endpoint
      const historyEndpoint = await getBackendHistoryEndpoint();

      // Call backend API with authentication
      console.log(`[TransactionHistory] Calling backend API with limit: ${limit}`);
      const response = await historyEndpoint.GET(limit);

      console.log(`[TransactionHistory] Backend response status: ${response.status}`);

      if (response.status === 200) {
        // Transform backend data to ProcessedTransaction format
        const transformedTransactions = transformBackendResponseToProcessedTransactions(response.data);
        setTransactionHistory(transformedTransactions);
        console.log(`[TransactionHistory] Successfully fetched ${transformedTransactions.length} transactions from backend`);
      } else {
        // Handle backend error responses
        let errorMessage = 'Failed to fetch transaction history';

        switch (response.status) {
          case 400:
            errorMessage = `Invalid parameters: ${response.data.message}`;
            break;
          case 401:
            errorMessage = 'Authentication required. Please log in again.';
            break;
          case 404:
            errorMessage = 'No transaction account found. Create your SPLITDO account to see transactions.';
            break;
          case 422:
            errorMessage = 'Account not fully set up. Please complete account initialization.';
            break;
          case 429:
            const retryAfter = response.data.retry_after ? ` Try again in ${response.data.retry_after} seconds.` : '';
            errorMessage = `Rate limit exceeded.${retryAfter}`;
            break;
          case 502:
          case 503:
            errorMessage = 'Blockchain data temporarily unavailable. Please try again later.';
            break;
          default:
            errorMessage = response.data.message || `Server error (${response.status})`;
        }

        setHistoryError(errorMessage);
        console.error('[TransactionHistory] Backend API error:', {
          status: response.status,
          data: response.data
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setHistoryError(errorMessage);
      console.error('[TransactionHistory] Error fetching history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const refreshHistory = async (): Promise<void> => {
    const address = lastFetchedAddress();
    if (address) {
      await fetchHistory(address);
    } else {
      console.warn('[TransactionHistory] No address to refresh');
    }
  };

  const clearHistory = (): void => {
    setTransactionHistory([]);
    setHistoryError(null);
    setLastFetchedAddress(null);
    console.log('[TransactionHistory] History cleared');
  };

  return {
    transactions: transactionHistory,
    isLoading: isLoadingHistory,
    error: historyError,
    fetchHistory,
    refreshHistory,
    clearHistory
  };
}

// Export signals for direct access if needed
export {
  transactionHistory,
  isLoadingHistory,
  historyError,
  lastFetchedAddress
};