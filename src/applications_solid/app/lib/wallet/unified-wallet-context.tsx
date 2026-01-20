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
import { middlewareFetch } from '../../middleware/endpoints';

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
// DATA TRANSFORMATION FUNCTIONS
// ================================

/**
 * Transform balance middleware response to expected BalanceData format
 */
function transformBalanceResponse(balanceResponse: any): BalanceData {
  return {
    solBalance: 0, // Will need to fetch separately or add to backend
    splitdoBalance: balanceResponse.mainnet_response?.balance || 0,
    splitdoATA: {
      address: balanceResponse.token_account_pubkey || '',
      status: balanceResponse.token_account_pubkey ? 'exists' as const : 'unknown' as const
    },
    lastUpdated: balanceResponse.last_updated || new Date().toISOString()
  };
}

/**
 * Transform signature history response to ProcessedTransaction format
 */
function transformHistoryResponse(historyResponse: any): ProcessedTransaction[] {
  if (!historyResponse.signature_history?.signatures) {
    return [];
  }

  return historyResponse.signature_history.signatures.map((sig: any) => ({
    signature: sig.signature,
    slot: sig.slot,
    blockTime: sig.blockTime,
    timestamp: new Date(sig.blockTime * 1000).toISOString(),
    fee: 0, // Not provided by this endpoint
    status: 'success' as const, // Assume success if in history
    instructions: [], // Not provided by this endpoint
    balanceChanges: [] // Not provided by this endpoint
  }));
}

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

      logger.info(`🔌 Connecting to wallet provider: ${providerId}`);

      const result = await walletConnectService.connectWallet(providerId);

      if (result.success && result.wallet) {
        batch(() => {
          setWallet(result.wallet!);
          setConnectedProviderId(providerId);
          setConnectionStatus('connected');
        });

        logger.info('✅ Wallet connected successfully:', result.wallet);

        // 🚨 CRITICAL FIX: Wait for state to properly settle before refreshing balances
        await new Promise(resolve => setTimeout(resolve, 150));

        // Validate connection state before refreshing balances
        if (isConnected() && wallet()?.address) {
          logger.debug('🔄 Connection state validated, refreshing balances...');
          await refreshBalances();
        } else {
          logger.warn('⚠️ Connection state validation failed, skipping balance refresh');
        }
      } else {
        setConnectionStatus('error');
        setConnectionError(result.error || 'Failed to connect wallet');
        logger.error('❌ Wallet connection failed:', result.error);
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      logger.error('❌ Wallet connection error:', error);
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
      logger.info('🔌 Disconnecting wallet with comprehensive cache clearing...');

      // 🚨 ENHANCED SECURITY FIX: Use comprehensive cache clearing on disconnect
      await clearAllWalletData();

      await walletConnectService.disconnect();

      batch(() => {
        setWallet(null);
        setConnectedProviderId(null);
        setConnectionStatus('disconnected');
        setConnectionError(null);
        setSolBalance(null);
        setSplitdoATA({ status: 'unknown' });
      });

      logger.info('✅ Wallet disconnected successfully with comprehensive cache clearing');
    } catch (error) {
      logger.error('❌ Error disconnecting wallet:', error);
      setConnectionError(error instanceof Error ? error.message : 'Disconnection failed');
    }
  };

  // ===============================
  // BALANCE AND ATA METHODS
  // ===============================
  const refreshBalances = async (): Promise<void> => {
    // 🚨 ENHANCED VALIDATION: Check both internal state and provider state
    if (!isConnected() || !wallet()?.address) {
      logger.warn('⚠️ Cannot refresh balances: wallet not connected');
      return;
    }

    // Double-check provider is actually connected
    const provider = getCurrentProvider();
    const currentWallet = wallet();
    if (provider && currentWallet && provider.getPublicKey()) {
      const providerKey = provider.getPublicKey()!.toString();
      const walletKey = currentWallet.address;
      
      if (providerKey !== walletKey) {
        logger.warn('⚠️ Provider state mismatch detected - forcing reconnection');
        logger.debug('Provider key:', providerKey, 'Wallet key:', walletKey);
        await disconnectWallet();
        return;
      }
    }

    try {
      setIsLoadingBalance(true);

      const address = currentWallet!.address;
      logger.debug('🔄 Refreshing balances for address:', address);

      // FIXED: Use backend API instead of direct Solana calls
      // Fetch balance data from cached backend API
      const balanceResult = await fetchCachedBalances({ force: true });

      if (balanceResult.data) {
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

        logger.debug('✅ Balances refreshed successfully via backend API');
      } else {
        logger.warn('⚠️ No balance data received from backend API');
      }
    } catch (error) {
      logger.error('❌ Error refreshing balances:', error);
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

      // TODO: The middleware POST endpoint requires wallet_address, token_account_address, and signed_transaction
      // This needs coordination with backend team to either:
      // 1. Add a simplified account creation endpoint that only requires wallet_address
      // 2. Implement client-side transaction creation and signing

      // For now, return an error indicating this needs implementation
      logger.error('createSplitdoATA: Middleware endpoint requires signed transaction - needs implementation');

      setSplitdoATA(prev => ({ ...prev, status: 'error', error: 'Account creation not implemented with new middleware system' }));
      return {
        success: false,
        error: 'Account creation requires coordination with backend team for proper transaction signing implementation'
      };

      // Future implementation would look like:
      // const createResponse = await middlewareFetch.Endpoints.Devbackend._Api.SplitdoToken.Accounts.Create.POST({
      //   wallet_address: wallet()!.address,
      //   token_account_address: '...', // Generated client-side
      //   signed_transaction: '...' // Signed client-side
      // });

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
        async () => {
          // Use middleware system for history API
          const historyResponse = await middlewareFetch.Endpoints.Devbackend._Api.SplitdoToken.History[':Index'].GET(limit);

          if (historyResponse.status !== 200) {
            throw new Error(`History API returned ${historyResponse.status}: ${historyResponse.data.message || 'Unknown error'}`);
          }

          // Transform middleware response to expected format
          return transformHistoryResponse(historyResponse.data);
        },
        {
          cacheKey: `transactions-${address}`,
          policy: CACHE_POLICIES.TRANSACTION_HISTORY,
          bypassCache: options.force
        }
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
        async () => {
          // Use middleware system for balance API
          const balanceResponse = await middlewareFetch.Endpoints.Devbackend._Api.SplitdoToken.Balance.GET();

          if (balanceResponse.status !== 200) {
            throw new Error(`Balance API returned ${balanceResponse.status}: ${balanceResponse.data.message || 'Unknown error'}`);
          }

          // Transform middleware response to expected format
          return transformBalanceResponse(balanceResponse.data);
        },
        {
          cacheKey: 'user-balances',
          policy: CACHE_POLICIES.BALANCE_DATA,
          bypassCache: options.force
        }
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
        async () => {
          // No exchange rate endpoint available in middleware - use default rate
          // This should be coordinated with backend team to create proper endpoint
          logger.warn('Using default exchange rate as no middleware endpoint exists');

          return {
            exchangeRate: 1000, // Default: 1 SOL = 1000 SPLITDO tokens
            splitdoTokenMint: '6vdfHTgLiEXvoGVp8Ga2HaKQsPKj6DrUTee7526SCXoM',
            lastUpdated: new Date().toISOString()
          };
        },
        {
          cacheKey: 'exchange-rates',
          policy: CACHE_POLICIES.EXCHANGE_RATES,
          bypassCache: options.force
        }
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
        async () => {
          // Use middleware system for CoinGecko API
          const priceResponse = await middlewareFetch.Endpoints.CoinGecko._Api.V3.Simple.Price.GET({
            ids: 'solana',
            vs_currencies: 'usd'
          });

          if (priceResponse.status !== 200) {
            throw new Error(`CoinGecko API returned ${priceResponse.status}: ${priceResponse.data.error || 'Unknown error'}`);
          }

          return {
            price: priceResponse.data.solana?.usd || 0,
            currency: 'usd',
            lastUpdated: new Date().toISOString()
          };
        },
        {
          cacheKey: 'sol-price',
          policy: CACHE_POLICIES.SOL_PRICE,
          bypassCache: options.force
        }
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

      logger.info(`🚀 Executing exchange: ${solAmount} SOL`);

      // Import exchange utilities dynamically to avoid circular dependencies
      const { ExchangeUtils } = await import('./exchange-utils');
      const { solanaService } = await import('./solana-service');

      const currentWallet = wallet()!;
      const walletAddress = currentWallet.address;

      // Step 1: Device detection and validation
      const deviceInfo = ExchangeUtils.getDeviceInfo();
      logger.debug('📱 Device info for exchange:', deviceInfo);

      // Step 2: Validate exchange parameters
      const validation = await solanaService.validateExchangeParams(walletAddress, solAmount);
      if (!validation.isValid) {
        setExchangeStatus('error');
        setExchangeError(validation.error || 'Invalid exchange parameters');
        return { success: false, error: validation.error };
      }

      // Step 3: Get current wallet provider
      const provider = getCurrentProvider();
      if (!provider) {
        setExchangeStatus('error');
        setExchangeError('Wallet provider not available');
        return { success: false, error: 'Wallet provider not available' };
      }

      // Step 4: Calculate exchange amounts
      const calculation = await solanaService.calculateExchangeAmount(solAmount);
      logger.info('💰 Exchange calculation:', calculation);

      // Step 5: Device-specific transaction flow
      let result: { success: boolean; signature?: string; error?: string };

      if (deviceInfo.requiresDeepLinks || deviceInfo.isPhantomMobile) {
        // iOS/Mobile flow: signTransaction + submit signed tx to exchange endpoint
        logger.info('🔄 Using mobile deep link exchange flow for iOS Phantom');
        result = await executeMobileExchange(provider, solanaService, walletAddress, solAmount);
      } else {
        // Desktop flow: signAndSendTransaction + submit signature to exchange-new endpoint  
        logger.info('🔄 Using desktop extension exchange flow');
        result = await executeDesktopExchange(provider, solanaService, walletAddress, solAmount, calculation);
      }

      // Step 6: Update UI state based on result
      if (result.success) {
        setExchangeStatus('success');
        setExchangeError(null);
        
        // Show success toast with transaction link
        const { showExchangeSuccess } = await import('../../components/ToastNotification');
        showExchangeSuccess(solAmount, calculation.splitdoAmount, result.signature || '');
        
        // Refresh balances after successful exchange
        setTimeout(() => {
          refreshBalances();
        }, 2000);

        logger.info('✅ Exchange completed successfully:', result);
      } else {
        setExchangeStatus('error');
        setExchangeError(result.error || 'Exchange failed');
        
        // Show error toast
        const { showExchangeError } = await import('../../components/ToastNotification');
        showExchangeError(result.error || 'Exchange failed', true, () => executeExchange(solAmount));
        
        logger.error('❌ Exchange failed:', result.error);
      }

      return result;

    } catch (error) {
      setExchangeStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Exchange failed';
      setExchangeError(errorMsg);
      logger.error('❌ Exchange error:', error);
      return { success: false, error: errorMsg };
    }
  };

  // ===============================
  // MOBILE EXCHANGE FLOW
  // ===============================
  const executeMobileExchange = async (
    provider: IWalletProvider,
    solanaService: typeof import('./solana-service').solanaService,
    walletAddress: string,
    solAmount: number
  ): Promise<{ success: boolean; signature?: string; error?: string }> => {
    try {
      logger.info('📱 Starting mobile exchange flow...');

      // Create exchange transaction
      const exchangeTx = await solanaService.createExchangeTransaction(walletAddress, solAmount);
      
      // Sign transaction (mobile wallets return signed transaction)
      logger.debug('✍️ Requesting wallet signature (mobile flow)...');
      const signedTransaction = await provider.signTransaction(exchangeTx.transaction);
      
      // Serialize signed transaction for backend
      const serializedTx = signedTransaction.serialize({ requireAllSignatures: false }).toString('base64');
      
      // **CRITICAL: For mobile, we submit the signed transaction to backend**
      // **Backend will handle the submission to Solana mainnet**
      // **WE NEVER SUBMIT SOLANA RPC CALLS FROM THE FRONTEND!**
      logger.debug('💱 Submitting signed transaction to backend exchange endpoint...');
      const exchangeResponse = await middlewareFetch.Endpoints.Devbackend._Api.Testing.Usockets.Exchange.Solana.Splitdo.POST(
        Math.floor(solAmount * 1e9), // Convert to lamports
        serializedTx
      );

      if (exchangeResponse.status === 200) {
        logger.info('✅ Mobile exchange completed successfully');
        
        // The backend handles the transaction submission, so we don't have the signature yet
        // but the exchange endpoint should return transaction info
        return {
          success: true,
          signature: exchangeResponse.data?.stage1_sol_confirmation?.result?.value?.slot ? 'backend-submitted' : undefined
        };
      } else {
        logger.error('❌ Exchange endpoint error:', exchangeResponse);
        return {
          success: false,
          error: `Exchange failed: ${exchangeResponse.data?.message || 'Unknown error'}`
        };
      }

    } catch (error) {
      logger.error('❌ Mobile exchange error:', error);
      
      // Parse wallet-specific errors
      const { ExchangeUtils } = await import('./exchange-utils');
      const parsedError = ExchangeUtils.parseWalletError(error);
      
      return {
        success: false,
        error: parsedError.message
      };
    }
  };

  // ===============================
  // DESKTOP EXCHANGE FLOW
  // ===============================
  const executeDesktopExchange = async (
    provider: IWalletProvider,
    solanaService: typeof import('./solana-service').solanaService,
    walletAddress: string,
    solAmount: number,
    calculation: { splitdoAmount: number; exchangeRate: number }
  ): Promise<{ success: boolean; signature?: string; error?: string }> => {
    try {
      logger.info('🖥️ Starting desktop exchange flow...');

      // Create exchange transaction
      const exchangeTx = await solanaService.createExchangeTransaction(walletAddress, solAmount);
      
      // Check if provider has signAndSendTransaction (Phantom desktop)
      logger.debug('✍️ Requesting wallet sign and send (desktop flow)...');
      
      let result: { signature?: string };
      
      // Try to access signAndSendTransaction on the provider if available
      const phantomProvider = (provider as any);
      if (typeof phantomProvider.signAndSendTransaction === 'function') {
        // Desktop Phantom has signAndSendTransaction
        logger.debug('🖥️ Using Phantom signAndSendTransaction');
        result = await phantomProvider.signAndSendTransaction(exchangeTx.transaction);
      } else if (typeof window !== 'undefined' && (window as any).solana?.signAndSendTransaction) {
        // Fallback: try window.solana directly
        logger.debug('🖥️ Using window.solana.signAndSendTransaction');
        result = await (window as any).solana.signAndSendTransaction(exchangeTx.transaction);
      } else {
        throw new Error('signAndSendTransaction not available on this wallet provider');
      }
      
      if (!result.signature) {
        throw new Error('No transaction signature received from wallet');
      }

      // Get user's SPLITDO token account address
      const splitdoMint = await solanaService.getSplitdoMint();
      const tokenAccountAddress = await solanaService.getAssociatedTokenAddress(walletAddress, splitdoMint);

      // Submit to exchange-new endpoint with signature
      logger.debug('💱 Submitting to exchange-new endpoint...');
      const exchangeResponse = await middlewareFetch.Endpoints.Devbackend._Api.Testing.Usockets.ExchangeNew.Solana.Splitdo.POST(
        result.signature,
        walletAddress,
        tokenAccountAddress
      );

      if (exchangeResponse.status === 200) {
        logger.info('✅ Desktop exchange completed successfully');
        return {
          success: true,
          signature: result.signature
        };
      } else {
        logger.error('❌ Exchange-new endpoint error:', exchangeResponse);
        return {
          success: false,
          error: `Exchange failed: ${exchangeResponse.data?.message || 'Unknown error'}`
        };
      }

    } catch (error) {
      logger.error('❌ Desktop exchange error:', error);
      
      // Parse wallet-specific errors
      const { ExchangeUtils } = await import('./exchange-utils');
      const parsedError = ExchangeUtils.parseWalletError(error);
      
      return {
        success: false,
        error: parsedError.message
      };
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
  // ENHANCED WALLET CACHE CLEARING
  // ===============================
  
  /**
   * 🚨 CRITICAL SECURITY FIX: Enhanced wallet cache clearing
   * This function aggressively clears ALL wallet-related data from ALL storage types
   * to prevent Phantom from persisting connection state across page refreshes
   */
  const clearAllWalletData = async (): Promise<void> => {
    if (typeof window === 'undefined') return;
    
    logger.debug('🧹 Starting comprehensive wallet cache clearing...');
    
    try {
      // 1. Clear localStorage with expanded Phantom-specific keys
      const localStorageKeys = Object.keys(window.localStorage);
      const phantomStoragePatterns = [
        'phantom',
        'solana',
        'wallet',
        'walletconnect',
        'wc@',
        'phantom_auto_connect',
        'phantom_connected', 
        'phantom_permissions',
        'phantom_trusted_origins',
        'phantom-wallet',
        'solana-wallet',
        'wallet-standard',
        'standard:connect',
        'wallet-adapter',
        'sol-wallet-adapter'
      ];
      
      localStorageKeys.forEach(key => {
        const shouldClear = phantomStoragePatterns.some(pattern => 
          key.toLowerCase().includes(pattern.toLowerCase())
        );
        if (shouldClear) {
          try {
            window.localStorage.removeItem(key);
            logger.debug(`🗑️ Cleared localStorage: ${key}`);
          } catch (e) {
            // Ignore individual key errors
          }
        }
      });

      // 2. Clear sessionStorage with same patterns
      const sessionStorageKeys = Object.keys(window.sessionStorage);
      sessionStorageKeys.forEach(key => {
        const shouldClear = phantomStoragePatterns.some(pattern => 
          key.toLowerCase().includes(pattern.toLowerCase())
        );
        if (shouldClear) {
          try {
            window.sessionStorage.removeItem(key);
            logger.debug(`🗑️ Cleared sessionStorage: ${key}`);
          } catch (e) {
            // Ignore individual key errors
          }
        }
      });

      // 3. Clear IndexedDB databases that might store wallet data
      try {
        if ('indexedDB' in window && typeof indexedDB.databases === 'function') {
          const databases = await indexedDB.databases();
          for (const db of databases) {
            const dbName = db.name?.toLowerCase() || '';
            if (dbName.includes('phantom') || 
                dbName.includes('wallet') || 
                dbName.includes('solana') ||
                dbName.includes('standard')) {
              try {
                indexedDB.deleteDatabase(db.name!);
                logger.debug(`🗑️ Cleared IndexedDB: ${db.name}`);
              } catch (e) {
                // Ignore individual DB errors
              }
            }
          }
        }
      } catch (e) {
        // IndexedDB not supported or access denied
        logger.debug('IndexedDB clearing not available:', e);
      }

      // 4. Force nullify window.solana provider reference
      try {
        if (window.solana) {
          // @ts-ignore - Force clear the provider
          delete window.solana;
          // @ts-ignore - Ensure it's completely removed
          window.solana = undefined;
          logger.debug('🗑️ Cleared window.solana provider reference');
        }
      } catch (e) {
        // Ignore provider clearing errors
      }

      logger.debug('✅ Comprehensive wallet cache clearing completed successfully');
    } catch (error) {
      logger.warn('⚠️ Error during comprehensive wallet cache clearing:', error);
    }
  };

  // ===============================
  // EFFECTS AND INITIALIZATION
  // ===============================

  // Initialize provider on mount
  onMount(async () => {
    logger.info('UnifiedWalletProvider mounting');

    try {
      // SECURITY FIX: Clear connection state on initialization to prevent false positives
      logger.info('Clearing any cached connection state on initialization');

      batch(() => {
        setConnectionStatus('disconnected');
        setWallet(null);
        setConnectedProviderId(null);
        setConnectionError(null);
        setSolBalance(null);
        setSplitdoATA({ status: 'unknown' });
        setQrData(null);
      });

      // ENHANCED PHANTOM CACHE CLEARING: Clear comprehensive wallet data from browser storage
      await clearAllWalletData();

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

      logger.info('UnifiedWalletProvider initialized successfully with clean state');
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