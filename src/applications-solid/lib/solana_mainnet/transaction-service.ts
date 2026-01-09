/**
 * Transaction Service for Solana Mainnet
 * Handles fetching and processing real transaction history
 */

import { solanaRPC, type ProcessedTransaction } from './rpc-client';
import { createSignal, createEffect } from 'solid-js';

export interface TransactionHistoryState {
  transactions: ProcessedTransaction[];
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  hasMore: boolean;
}

export interface TransactionFilters {
  type?: 'all' | 'exchange' | 'transfer' | 'account_creation';
  timeframe?: '24h' | '7d' | '30d' | 'all';
  limit?: number;
}

class TransactionService {
  private cache = new Map<string, { data: ProcessedTransaction[]; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch transaction history for a given address
   */
  async fetchTransactionHistory(
    address: string,
    filters: TransactionFilters = {}
  ): Promise<{ success: boolean; transactions: ProcessedTransaction[]; error?: string }> {
    try {
      console.log(`[TransactionService] Fetching history for address: ${address}`);

      // Check cache first
      const cacheKey = `${address}_${JSON.stringify(filters)}`;
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('[TransactionService] Returning cached data');
        return {
          success: true,
          transactions: cached.data
        };
      }

      // Fetch from Solana mainnet
      const limit = filters.limit || 10;
      const result = await solanaRPC.getTransactionHistory(address, limit);

      if (!result.success) {
        return {
          success: false,
          transactions: [],
          error: result.error
        };
      }

      let transactions = result.transactions;

      // Apply filters
      if (filters.type && filters.type !== 'all') {
        transactions = transactions.filter(tx => tx.type === filters.type);
      }

      if (filters.timeframe && filters.timeframe !== 'all') {
        const now = new Date();
        const cutoff = new Date();

        switch (filters.timeframe) {
          case '24h':
            cutoff.setHours(now.getHours() - 24);
            break;
          case '7d':
            cutoff.setDate(now.getDate() - 7);
            break;
          case '30d':
            cutoff.setDate(now.getDate() - 30);
            break;
        }

        transactions = transactions.filter(tx =>
          tx.blockTime && new Date(tx.blockTime) >= cutoff
        );
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: transactions,
        timestamp: Date.now()
      });

      console.log(`[TransactionService] Fetched ${transactions.length} transactions`);

      return {
        success: true,
        transactions
      };

    } catch (error) {
      console.error('[TransactionService] Failed to fetch transaction history:', error);
      return {
        success: false,
        transactions: [],
        error: error instanceof Error ? error.message : 'Failed to fetch transactions'
      };
    }
  }

  /**
   * Get human-readable transaction description
   */
  getTransactionDescription(tx: ProcessedTransaction): { title: string; description: string } {
    switch (tx.type) {
      case 'exchange':
        return {
          title: `Exchange ${tx.fromAsset} → ${tx.toAsset}`,
          description: tx.amount && tx.toAmount
            ? `${this.formatAmount(tx.amount, tx.fromAsset!)} → ${this.formatAmount(tx.toAmount, tx.toAsset!)}`
            : 'Token exchange transaction'
        };

      case 'transfer':
        return {
          title: `Transfer ${tx.fromAsset}`,
          description: tx.amount
            ? `${this.formatAmount(tx.amount, tx.fromAsset!)} transferred`
            : 'Token transfer'
        };

      case 'account_creation':
        return {
          title: 'Account Creation',
          description: tx.fromAsset === 'SOL' ? 'SPLITDO Token Account' : 'New account created'
        };

      default:
        return {
          title: 'Transaction',
          description: 'Blockchain transaction'
        };
    }
  }

  /**
   * Format amount with proper decimals and currency
   */
  private formatAmount(amount: number, asset: string): string {
    if (asset === 'SOL') {
      return `${amount.toLocaleString('en-US', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4
      })} SOL`;
    } else {
      return `${amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })} ${asset}`;
    }
  }

  /**
   * Format transaction fee in SOL
   */
  formatFee(feeLamports: number): string {
    const solFee = feeLamports / 1_000_000_000; // Convert lamports to SOL
    return `${solFee.toFixed(6)} SOL`;
  }

  /**
   * Get transaction status color class
   */
  getTransactionStatusClass(tx: ProcessedTransaction): string {
    if (tx.success) {
      return 'transaction-status success';
    } else {
      return 'transaction-status failed';
    }
  }

  /**
   * Get transaction type icon
   */
  getTransactionIcon(type: string): string {
    switch (type) {
      case 'exchange':
        return '🔄';
      case 'transfer':
        return '📤';
      case 'account_creation':
        return '🆕';
      default:
        return '📄';
    }
  }

  /**
   * Clear cache (useful for forcing refresh)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[TransactionService] Cache cleared');
  }

  /**
   * Format date for display
   */
  formatDate(isoString: string | null): string {
    if (!isoString) return 'Unknown';

    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      // Show time for recent transactions
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } else {
      // Show date for older transactions
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
  }

  /**
   * Create a reactive transaction history store
   */
  createTransactionStore(address: () => string | undefined) {
    const [state, setState] = createSignal<TransactionHistoryState>({
      transactions: [],
      loading: false,
      error: null,
      lastFetched: null,
      hasMore: true
    });

    const fetchTransactions = async (filters: TransactionFilters = {}) => {
      const addr = address();
      if (!addr) {
        setState(prev => ({ ...prev, transactions: [], error: null }));
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await this.fetchTransactionHistory(addr, filters);

        setState({
          transactions: result.transactions,
          loading: false,
          error: result.success ? null : result.error || 'Failed to fetch transactions',
          lastFetched: new Date(),
          hasMore: result.transactions.length >= (filters.limit || 10)
        });
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Network error occurred',
          transactions: []
        }));
      }
    };

    // Auto-fetch when address changes
    createEffect(() => {
      if (address()) {
        fetchTransactions();
      }
    });

    return {
      state,
      fetchTransactions,
      refresh: () => {
        this.clearCache();
        fetchTransactions();
      }
    };
  }
}

// Create singleton instance
export const transactionService = new TransactionService();
export default transactionService;