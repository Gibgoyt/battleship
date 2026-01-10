/**
 * Transaction History Reactive Store
 * Manages real transaction history from Solana mainnet
 */

import { createSignal, createEffect, createMemo } from 'solid-js';
import { solanaRPCService, type ProcessedTransaction, type TransactionHistoryResult } from './rpc-service';

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
      const result: TransactionHistoryResult = await solanaRPCService.getTransactionHistory(address, limit);

      if (result.success) {
        setTransactionHistory(result.transactions);
        console.log(`[TransactionHistory] Successfully fetched ${result.transactions.length} transactions`);
      } else {
        setHistoryError(result.error || 'Failed to fetch transaction history');
        console.error('[TransactionHistory] Failed to fetch history:', result.error);
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