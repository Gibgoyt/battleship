/**
 * Unified Wallet Context Provider for SPLITDO
 *
 * Consolidates all application state management including:
 * - Wallet connections and multi-wallet support
 * - Authentication state and token management
 * - Persistent data caching and smart fetch
 * - Modal state management
 * - Balance tracking and ATA management
 *
 * This replaces the previous 6-provider hierarchy with a single, unified context.
 */

import {
  createContext,
  useContext,
  createSignal,
  createEffect,
  onMount,
  onCleanup,
  batch,
  type ParentComponent,
  type Accessor,
  type Setter,
  type Component
} from 'solid-js';

// Import existing services and types
import {
  walletConnectService,
  type ConnectionState,
  type WalletInfo,
  type AvailableWallet
} from './walletconnect-service';
import type { SolanaBalance, TokenBalance } from './solana-service';
import { ERROR_MESSAGES } from './walletconnect-config';
import type { WalletProvider as IWalletProvider } from './wallet-providers';
import type { WalletConnectQRData } from './providers/walletconnect-provider';
import { smartFetch, invalidateCache, clearUserCache, getCacheStats, type SmartFetchResult } from '../../data/smart-fetch';
import { CACHE_POLICIES, type CachePolicy } from '../../data/cache-engine';

// Define ProcessedTransaction type locally to avoid importing from solana_mainnet
export interface ProcessedTransaction {
  signature: string;
  slot: number;
  blockTime: number;
  timestamp: string;
  fee: number;
  status: 'success' | 'failed';
  instructions: Array<{
    programId: string;
    type: string;
    data?: any;
  }>;
  balanceChanges: Array<{
    account: string;
    before: number;
    after: number;
    change: number;
  }>;
}
// Import existing auth store to integrate with global auth system
import { getGlobalAuthStore } from '../../middleware/firebase/auth-store';
import { createLogger } from 'src/lib/logger';

const logger = createLogger('[UnifiedWalletProvider]');

// ================================
// TYPE DEFINITIONS
// ================================

export type ATAStatus = 'unknown' | 'checking' | 'exists' | 'not_found' | 'creating' | 'created' | 'error';

export interface ATAInfo {
  status: ATAStatus;
  address?: string;
  balance?: TokenBalance;
  error?: string;
}

// Persistent data types
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

// ================================
// UNIFIED CONTEXT INTERFACE
// ================================

export interface UnifiedWalletContextState {
  // ===============================
  // WALLET CONNECTION STATE
  // ===============================
  connectionStatus: Accessor<'disconnected' | 'connecting' | 'connected' | 'error'>;
  wallet: Accessor<WalletInfo | null>;
  connectionError: Accessor<string | null>;
  availableWallets: Accessor<AvailableWallet[]>;
  connectedProviderId: Accessor<string | null>;

  // Wallet actions
  connectWallet: (providerId: string) => Promise<void>;
  switchWallet: (providerId: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  isWalletAvailable: (providerId: string) => boolean;
  getCurrentProvider: () => IWalletProvider | null;
  getWalletDescription: (providerId: string) => string;
  isConnected: Accessor<boolean>;

  // ===============================
  // BALANCE AND ATA STATE
  // ===============================
  solBalance: Accessor<SolanaBalance | null>;
  splitdoATA: Accessor<ATAInfo>;
  isLoadingBalance: Accessor<boolean>;
  isCreatingATA: Accessor<boolean>;

  // Balance actions
  refreshBalances: () => Promise<void>;
  createSplitdoATA: () => Promise<{ success: boolean; signature?: string; error?: string }>;

  // ===============================
  // PERSISTENT DATA STATE
  // ===============================
  transactionHistory: Accessor<ProcessedTransaction[]>;
  cachedBalanceData: Accessor<BalanceData | null>;
  exchangeRates: Accessor<ExchangeRateData | null>;
  solPrice: Accessor<SolPriceData | null>;
  isPersistentDataLoading: Accessor<boolean>;

  // Persistent data actions
  fetchTransactions: (address: string, limit?: number, options?: { force?: boolean }) => Promise<SmartFetchResult<ProcessedTransaction[]>>;
  fetchCachedBalances: (options?: { force?: boolean }) => Promise<SmartFetchResult<BalanceData>>;
  fetchExchangeRates: (options?: { force?: boolean }) => Promise<SmartFetchResult<ExchangeRateData>>;
  fetchSolPrice: (options?: { force?: boolean }) => Promise<SmartFetchResult<SolPriceData>>;

  // Cache management
  invalidateTransactions: () => void;
  invalidateBalances: () => void;
  invalidateExchangeRates: () => void;
  invalidateSolPrice: () => void;
  invalidateAll: () => void;
  clearUserData: (userId: string) => void;
  getCacheStats: () => any;

  // ===============================
  // PROGRAM INFO AND EXCHANGE
  // ===============================
  programInfo: Accessor<{ exchangeRate: number; loading: boolean; error: string | null }>;
  exchangeStatus: Accessor<'idle' | 'loading' | 'success' | 'error'>;
  exchangeError: Accessor<string | null>;

  // Exchange actions
  executeExchange: (solAmount: number) => Promise<{ success: boolean; signature?: string; error?: string }>;

  // ===============================
  // MODAL STATE MANAGEMENT
  // ===============================
  isWalletModalOpen: Accessor<boolean>;
  isQRModalOpen: Accessor<boolean>;
  qrData: Accessor<WalletConnectQRData | null>;
  isExchangeModalOpen: Accessor<boolean>;
  isCreateAccountModalOpen: Accessor<boolean>;

  // Modal actions
  openWalletModal: () => void;
  closeWalletModal: () => void;
  openQRModal: () => void;
  closeQRModal: () => void;
  openExchangeModal: () => void;
  closeExchangeModal: () => void;
  openCreateAccountModal: () => void;
  closeCreateAccountModal: () => void;

  // ===============================
  // UTILITY STATE
  // ===============================
  hasFirebaseToken: Accessor<boolean>;
}

// ================================
// PROVIDER PROPS
// ================================

interface UnifiedWalletProviderProps {
  firebaseToken?: string;
  children: any;
}

// ================================
// CONTEXT CREATION
// ================================

const UnifiedWalletContext = createContext<UnifiedWalletContextState | undefined>();

// ================================
// PROVIDER IMPLEMENTATION
// ================================

export const UnifiedWalletProvider: ParentComponent<UnifiedWalletProviderProps> = (props) => {
  logger.info('Initializing Unified Wallet Provider');

  // ===============================
  // WALLET CONNECTION SIGNALS
  // ===============================
  const [connectionStatus, setConnectionStatus] = createSignal<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [wallet, setWallet] = createSignal<WalletInfo | null>(null);
  const [connectionError, setConnectionError] = createSignal<string | null>(null);
  const [availableWallets, setAvailableWallets] = createSignal<AvailableWallet[]>([]);
  const [connectedProviderId, setConnectedProviderId] = createSignal<string | null>(null);

  // ===============================
  // BALANCE AND ATA SIGNALS
  // ===============================
  const [solBalance, setSolBalance] = createSignal<SolanaBalance | null>(null);
  const [splitdoATA, setSplitdoATA] = createSignal<ATAInfo>({ status: 'unknown' });
  const [isLoadingBalance, setIsLoadingBalance] = createSignal(false);
  const [isCreatingATA, setIsCreatingATA] = createSignal(false);

  // ===============================
  // PERSISTENT DATA SIGNALS
  // ===============================
  const [transactionHistory, setTransactionHistory] = createSignal<ProcessedTransaction[]>([]);
  const [cachedBalanceData, setCachedBalanceData] = createSignal<BalanceData | null>(null);
  const [exchangeRates, setExchangeRates] = createSignal<ExchangeRateData | null>(null);
  const [solPrice, setSolPrice] = createSignal<SolPriceData | null>(null);
  const [isPersistentDataLoading, setIsPersistentDataLoading] = createSignal(false);

  // ===============================
  // PROGRAM INFO AND EXCHANGE SIGNALS
  // ===============================
  const [programInfo, setProgramInfo] = createSignal({ exchangeRate: 0, loading: false, error: null });
  const [exchangeStatus, setExchangeStatus] = createSignal<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [exchangeError, setExchangeError] = createSignal<string | null>(null);

  // ===============================
  // MODAL SIGNALS
  // ===============================
  const [isWalletModalOpen, setIsWalletModalOpen] = createSignal(false);
  const [isQRModalOpen, setIsQRModalOpen] = createSignal(false);
  const [qrData, setQrData] = createSignal<WalletConnectQRData | null>(null);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = createSignal(false);
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] = createSignal(false);

  // ===============================
  // GLOBAL AUTH STORE INTEGRATION
  // ===============================
  const globalAuthStore = getGlobalAuthStore();

  // ===============================
  // COMPUTED SIGNALS
  // ===============================
  const isConnected = () => connectionStatus() === 'connected' && wallet() !== null;
  const hasFirebaseToken = () => !!props.firebaseToken;

  // ===============================
  // WALLET CONNECTION METHODS
  // ===============================
  const connectWallet = async (providerId: string): Promise<void> => {
    try {
      setConnectionStatus('connecting');
      setConnectionError(null);

      logger.info(`Connecting to wallet provider: ${providerId}`);

      const result = await walletConnectService.connect(providerId);

      if (result.success && result.wallet) {
        batch(() => {
          setWallet(result.wallet!);
          setConnectedProviderId(providerId);
          setConnectionStatus('connected');
        });

        logger.info('Wallet connected successfully:', result.wallet);

        // Refresh balances after connection
        await refreshBalances();
      } else {
        setConnectionStatus('error');
        setConnectionError(result.error || 'Failed to connect wallet');
        logger.error('Wallet connection failed:', result.error);
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      logger.error('Wallet connection error:', error);
    }
  };

  const switchWallet = async (providerId: string): Promise<void> => {
    logger.info(`Switching to wallet provider: ${providerId}`);

    // Disconnect current wallet first
    await disconnectWallet();

    // Connect to new wallet
    await connectWallet(providerId);
  };

  const disconnectWallet = async (): Promise<void> => {
    try {
      logger.info('Disconnecting wallet');

      await walletConnectService.disconnect();

      batch(() => {
        setWallet(null);
        setConnectedProviderId(null);
        setConnectionStatus('disconnected');
        setConnectionError(null);
        setSolBalance(null);
        setSplitdoATA({ status: 'unknown' });
      });

      logger.info('Wallet disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting wallet:', error);
      setConnectionError(error instanceof Error ? error.message : 'Disconnection failed');
    }
  };

  // ===============================
  // BALANCE AND ATA METHODS
  // ===============================
  const refreshBalances = async (): Promise<void> => {
    if (!isConnected() || !wallet()?.address) {
      logger.warn('Cannot refresh balances: wallet not connected');
      return;
    }

    try {
      setIsLoadingBalance(true);

      const address = wallet()!.address;
      logger.debug('Refreshing balances for address:', address);

      // FIXED: Use backend API instead of direct Solana calls
      // Fetch balance data from cached backend API
      const balanceResult = await fetchCachedBalances({ force: true });

      if (balanceResult.success && balanceResult.data) {
        const balanceData = balanceResult.data;

        // Set SOL balance
        setSolBalance({
          sol: balanceData.solBalance,
          lamports: Math.floor(balanceData.solBalance * 1e9)
        });

        // Set SPLITDO ATA info
        setSplitdoATA({
          status: balanceData.splitdoATA.status as ATAStatus,
          address: balanceData.splitdoATA.address,
          balance: {
            amount: balanceData.splitdoBalance,
            decimals: 9 // SPLITDO token decimals
          }
        });
      }

      logger.debug('Balances refreshed successfully via backend API');
    } catch (error) {
      logger.error('Error refreshing balances:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const createSplitdoATA = async (): Promise<{ success: boolean; signature?: string; error?: string }> => {
    if (!isConnected() || !wallet()?.address) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setIsCreatingATA(true);
      setSplitdoATA(prev => ({ ...prev, status: 'creating' }));

      // FIXED: Use backend API instead of direct Solana calls
      const response = await fetch('/api/splitdo-token/accounts/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${props.firebaseToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: wallet()!.address
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create ATA via backend API');
      }

      const result = await response.json();

      if (result.success) {
        setSplitdoATA({
          status: 'created',
          address: result.address,
          balance: { amount: 0, decimals: 9 }
        });

        return { success: true, signature: result.signature };
      } else {
        setSplitdoATA(prev => ({ ...prev, status: 'error', error: result.error }));
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create ATA';
      setSplitdoATA(prev => ({ ...prev, status: 'error', error: errorMsg }));
      return { success: false, error: errorMsg };
    } finally {
      setIsCreatingATA(false);
    }
  };

  // ===============================
  // PERSISTENT DATA METHODS
  // ===============================
  const fetchTransactions = async (
    address: string,
    limit = 100,
    options: { force?: boolean } = {}
  ): Promise<SmartFetchResult<ProcessedTransaction[]>> => {
    try {
      setIsPersistentDataLoading(true);

      const result = await smartFetch(
        `transactions-${address}`,
        async () => {
          // FIXED: Use backend API instead of direct RPC calls
          const response = await fetch(`/api/splitdo-token/history/${address}?limit=${limit}`, {
            headers: {
              'Authorization': `Bearer ${props.firebaseToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch transaction history from backend API');
          }

          return await response.json();
        },
        CACHE_POLICIES.TRANSACTIONS,
        options.force
      );

      if (result.success && result.data) {
        setTransactionHistory(result.data);
      }

      return result;
    } catch (error) {
      logger.error('Error fetching transactions:', error);
      return {
        success: false,
        data: [],
        fromCache: false,
        cacheAge: 0,
        error: error instanceof Error ? error.message : 'Failed to fetch transactions'
      };
    } finally {
      setIsPersistentDataLoading(false);
    }
  };

  const fetchCachedBalances = async (options: { force?: boolean } = {}): Promise<SmartFetchResult<BalanceData>> => {
    try {
      setIsPersistentDataLoading(true);

      const result = await smartFetch(
        'user-balances',
        async () => {
          // This would fetch from your backend API
          const response = await fetch('/api/user/balances', {
            headers: {
              'Authorization': `Bearer ${props.firebaseToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch balances from API');
          }

          return await response.json();
        },
        CACHE_POLICIES.BALANCES,
        options.force
      );

      if (result.success && result.data) {
        setCachedBalanceData(result.data);
      }

      return result;
    } catch (error) {
      logger.error('Error fetching cached balances:', error);
      return {
        success: false,
        data: null as any,
        fromCache: false,
        cacheAge: 0,
        error: error instanceof Error ? error.message : 'Failed to fetch cached balances'
      };
    } finally {
      setIsPersistentDataLoading(false);
    }
  };

  const fetchExchangeRates = async (options: { force?: boolean } = {}): Promise<SmartFetchResult<ExchangeRateData>> => {
    try {
      setIsPersistentDataLoading(true);

      const result = await smartFetch(
        'exchange-rates',
        async () => {
          const response = await fetch('/api/exchange/rates', {
            headers: {
              'Authorization': `Bearer ${props.firebaseToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch exchange rates');
          }

          return await response.json();
        },
        CACHE_POLICIES.EXCHANGE_RATES,
        options.force
      );

      if (result.success && result.data) {
        setExchangeRates(result.data);
      }

      return result;
    } catch (error) {
      logger.error('Error fetching exchange rates:', error);
      return {
        success: false,
        data: null as any,
        fromCache: false,
        cacheAge: 0,
        error: error instanceof Error ? error.message : 'Failed to fetch exchange rates'
      };
    } finally {
      setIsPersistentDataLoading(false);
    }
  };

  const fetchSolPrice = async (options: { force?: boolean } = {}): Promise<SmartFetchResult<SolPriceData>> => {
    try {
      setIsPersistentDataLoading(true);

      const result = await smartFetch(
        'sol-price',
        async () => {
          const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');

          if (!response.ok) {
            throw new Error('Failed to fetch SOL price from CoinGecko');
          }

          const data = await response.json();
          return {
            price: data.solana.usd,
            currency: 'usd',
            lastUpdated: new Date().toISOString()
          };
        },
        CACHE_POLICIES.SOL_PRICE,
        options.force
      );

      if (result.success && result.data) {
        setSolPrice(result.data);
      }

      return result;
    } catch (error) {
      logger.error('Error fetching SOL price:', error);
      return {
        success: false,
        data: null as any,
        fromCache: false,
        cacheAge: 0,
        error: error instanceof Error ? error.message : 'Failed to fetch SOL price'
      };
    } finally {
      setIsPersistentDataLoading(false);
    }
  };

  // ===============================
  // EXCHANGE METHODS
  // ===============================
  const executeExchange = async (solAmount: number): Promise<{ success: boolean; signature?: string; error?: string }> => {
    if (!isConnected() || !wallet()?.address) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setExchangeStatus('loading');
      setExchangeError(null);

      logger.info(`Executing exchange: ${solAmount} SOL`);

      // FIXED: Use backend API instead of direct Solana calls
      const response = await fetch('/api/exchange-new/solana/splitdo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${props.firebaseToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: wallet()!.address,
          solAmount: solAmount,
          exchangeRate: exchangeRates()?.exchangeRate || 1
        })
      });

      if (!response.ok) {
        throw new Error('Failed to execute exchange via backend API');
      }

      const result = await response.json();

      if (result.success) {
        setExchangeStatus('success');

        // Refresh balances after successful exchange
        await refreshBalances();

        return { success: true, signature: result.signature };
      } else {
        setExchangeStatus('error');
        setExchangeError(result.error || 'Exchange failed');
        return { success: false, error: result.error };
      }
    } catch (error) {
      setExchangeStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Exchange failed';
      setExchangeError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // ===============================
  // WALLET UTILITY METHODS
  // ===============================
  const isWalletAvailable = (providerId: string): boolean => {
    return availableWallets().some(wallet => wallet.id === providerId && wallet.isAvailable);
  };

  const getCurrentProvider = (): IWalletProvider | null => {
    return walletConnectService.getCurrentWallet();
  };

  const getWalletDescription = (providerId: string): string => {
    const wallet = availableWallets().find(w => w.id === providerId);
    return wallet?.description || 'Unknown wallet';
  };

  // Cache management methods
  const invalidateTransactions = () => invalidateCache('transactions');
  const invalidateBalances = () => invalidateCache('user-balances');
  const invalidateExchangeRates = () => invalidateCache('exchange-rates');
  const invalidateSolPrice = () => invalidateCache('sol-price');
  const invalidateAll = () => invalidateCache();
  const clearUserData = (userId: string) => clearUserCache(userId);

  // ===============================
  // EFFECTS AND INITIALIZATION
  // ===============================

  // Initialize provider on mount
  onMount(async () => {
    logger.info('UnifiedWalletProvider mounting');

    try {
      // Get available wallets (service auto-initializes in constructor)
      setAvailableWallets(walletConnectService.getAvailableWallets());

      // Set up wallet service listeners
      walletConnectService.subscribe((state: ConnectionState) => {
        logger.debug('Wallet connection state changed:', state);
        setConnectionStatus(state.status);
        if (state.wallet) {
          setWallet(state.wallet);
        }
        if (state.error) {
          setConnectionError(state.error);
        }
      });

      logger.info('UnifiedWalletProvider initialized successfully');
    } catch (error) {
      logger.error('Error initializing UnifiedWalletProvider:', error);
    }
  });

  // Cleanup on unmount
  onCleanup(() => {
    logger.info('UnifiedWalletProvider cleaning up');
    // No specific cleanup needed since we use the global auth store
  });

  // ===============================
  // CONTEXT VALUE
  // ===============================
  const contextValue: UnifiedWalletContextState = {
    // Wallet connection
    connectionStatus,
    wallet,
    connectionError,
    availableWallets,
    connectedProviderId,
    connectWallet,
    switchWallet,
    disconnectWallet,
    isWalletAvailable,
    getCurrentProvider,
    getWalletDescription,
    isConnected,

    // Balances and ATA
    solBalance,
    splitdoATA,
    isLoadingBalance,
    isCreatingATA,
    refreshBalances,
    createSplitdoATA,

    // Persistent data
    transactionHistory,
    cachedBalanceData,
    exchangeRates,
    solPrice,
    isPersistentDataLoading,
    fetchTransactions,
    fetchCachedBalances,
    fetchExchangeRates,
    fetchSolPrice,
    invalidateTransactions,
    invalidateBalances,
    invalidateExchangeRates,
    invalidateSolPrice,
    invalidateAll,
    clearUserData,
    getCacheStats,

    // Program info and exchange
    programInfo,
    exchangeStatus,
    exchangeError,
    executeExchange,

    // Modals
    isWalletModalOpen,
    isQRModalOpen,
    qrData,
    isExchangeModalOpen,
    isCreateAccountModalOpen,
    openWalletModal: () => setIsWalletModalOpen(true),
    closeWalletModal: () => setIsWalletModalOpen(false),
    openQRModal: () => setIsQRModalOpen(true),
    closeQRModal: () => setIsQRModalOpen(false),
    openExchangeModal: () => setIsExchangeModalOpen(true),
    closeExchangeModal: () => setIsExchangeModalOpen(false),
    openCreateAccountModal: () => setIsCreateAccountModalOpen(true),
    closeCreateAccountModal: () => setIsCreateAccountModalOpen(false),

    // Utilities
    hasFirebaseToken,
  };

  return (
    <UnifiedWalletContext.Provider value={contextValue}>
      {props.children}
    </UnifiedWalletContext.Provider>
  );
};

// ===============================
// BACKWARD-COMPATIBLE HOOKS
// ===============================

/**
 * Main hook for accessing the unified wallet context
 */
export const useUnifiedWallet = (): UnifiedWalletContextState => {
  const context = useContext(UnifiedWalletContext);
  if (!context) {
    throw new Error('useUnifiedWallet must be used within a UnifiedWalletProvider');
  }
  return context;
};

/**
 * Backward-compatible hook for wallet functionality
 */
export const useWallet = () => {
  const context = useUnifiedWallet();

  return {
    // Connection state
    connectionStatus: context.connectionStatus,
    wallet: context.wallet,
    connectionError: context.connectionError,
    isConnected: context.isConnected,

    // Multi-wallet state
    availableWallets: context.availableWallets,
    connectedProviderId: context.connectedProviderId,

    // Actions
    connect: () => {
      // Legacy connect - connect to first available wallet
      const wallets = context.availableWallets();
      if (wallets.length > 0) {
        return context.connectWallet(wallets[0].id);
      }
      return Promise.reject(new Error('No wallets available'));
    },
    connectWallet: context.connectWallet,
    switchWallet: context.switchWallet,
    disconnect: context.disconnectWallet,

    // Balances
    solBalance: context.solBalance,
    splitdoATA: context.splitdoATA,
    isLoadingBalance: context.isLoadingBalance,
    isCreatingATA: context.isCreatingATA,
    refreshBalances: context.refreshBalances,
    createSplitdoATA: context.createSplitdoATA,

    // Modals
    isModalOpen: context.isWalletModalOpen,
    openModal: context.openWalletModal,
    closeModal: context.closeWalletModal,
    isQRModalOpen: context.isQRModalOpen,
    qrData: context.qrData,
    openQRModal: context.openQRModal,
    closeQRModal: context.closeQRModal,
    isExchangeModalOpen: context.isExchangeModalOpen,
    openExchangeModal: context.openExchangeModal,
    closeExchangeModal: context.closeExchangeModal,

    // Program info
    programInfo: context.programInfo,
    fetchProgramInfo: () => context.fetchExchangeRates(),
    fetchSolPrice: () => context.fetchSolPrice(),
    executeExchange: context.executeExchange,

    // Utilities
    isWalletAvailable: context.isWalletAvailable,
    getCurrentProvider: context.getCurrentProvider,
    getWalletDescription: context.getWalletDescription,
    hasFirebaseToken: context.hasFirebaseToken,
  };
};

/**
 * Backward-compatible hook for persistent data functionality
 */
export const usePersistentData = () => {
  const context = useUnifiedWallet();

  return {
    // Data accessors
    transactionHistory: context.transactionHistory,
    balanceData: context.cachedBalanceData,
    exchangeRates: context.exchangeRates,
    solPrice: context.solPrice,

    // Smart fetch functions
    fetchTransactions: context.fetchTransactions,
    fetchBalances: context.fetchCachedBalances,
    fetchExchangeRates: context.fetchExchangeRates,
    fetchSolPrice: context.fetchSolPrice,

    // Cache management
    invalidateTransactions: context.invalidateTransactions,
    invalidateBalances: context.invalidateBalances,
    invalidateExchangeRates: context.invalidateExchangeRates,
    invalidateSolPrice: context.invalidateSolPrice,
    invalidateAll: context.invalidateAll,
    clearUserData: context.clearUserData,

    // Status
    isLoading: context.isPersistentDataLoading,
    cacheStats: context.getCacheStats,
  };
};

/**
 * Backward-compatible hook for authentication functionality
 * Uses the global auth store instead of creating a conflicting auth system
 */
export const useAuth = () => {
  const globalAuthStore = getGlobalAuthStore();

  return {
    // Auth state from global store
    isAuthenticated: globalAuthStore.isAuthenticated,
    user: globalAuthStore.currentUser,
    authError: globalAuthStore.authError,
    tokenStatus: globalAuthStore.tokenStatus,

    // Auth actions from global store
    initialize: globalAuthStore.initialize,
    refreshToken: globalAuthStore.refreshToken,
    validateAuth: globalAuthStore.validateAuth,
    logout: globalAuthStore.logout,
  };
};

/**
 * Hook for modal management
 */
export const useModals = () => {
  const context = useUnifiedWallet();

  return {
    // Wallet modal
    isWalletModalOpen: context.isWalletModalOpen,
    openWalletModal: context.openWalletModal,
    closeWalletModal: context.closeWalletModal,

    // QR modal
    isQRModalOpen: context.isQRModalOpen,
    qrData: context.qrData,
    openQRModal: context.openQRModal,
    closeQRModal: context.closeQRModal,

    // Exchange modal
    isExchangeModalOpen: context.isExchangeModalOpen,
    openExchangeModal: context.openExchangeModal,
    closeExchangeModal: context.closeExchangeModal,

    // Create account modal
    isCreateAccountModalOpen: context.isCreateAccountModalOpen,
    openCreateAccountModal: context.openCreateAccountModal,
    closeCreateAccountModal: context.closeCreateAccountModal,
  };
};

/**
 * Backward-compatible hook for WalletConnect QR modal (used by App.tsx)
 */
export const useWalletConnectQRModal = () => {
  const context = useUnifiedWallet();

  return {
    isQRModalOpen: context.isQRModalOpen,
    qrData: context.qrData,
    openQRModal: context.openQRModal,
    closeQRModal: context.closeQRModal,
  };
};