/**
 * Enhanced SolidJS Wallet Context Provider for SPLITDO
 * Manages multi-wallet connections, ATA status, and provides wallet operations
 * Supports Phantom, MetaMask, and Wallet Standard wallets
 */

import {
  createContext,
  useContext,
  createSignal,
  createEffect,
  onMount,
  onCleanup,
  type ParentComponent,
  type Accessor,
  type Setter
} from 'solid-js';
import {
  walletConnectService,
  type ConnectionState,
  type WalletInfo,
  type AvailableWallet
} from './walletconnect-service';
import { solanaService, type SolanaBalance, type TokenBalance } from './solana-service';
import { ERROR_MESSAGES } from './walletconnect-config';
import type { WalletProvider as IWalletProvider } from './wallet-providers';
import type { WalletConnectQRData } from './providers/walletconnect-provider';

export type ATAStatus = 'unknown' | 'checking' | 'exists' | 'not_found' | 'creating' | 'created' | 'error';

export interface ATAInfo {
  status: ATAStatus;
  address?: string;
  balance?: TokenBalance;
  error?: string;
}

export interface WalletContextState {
  // Connection state
  connectionStatus: Accessor<'disconnected' | 'connecting' | 'connected' | 'error'>;
  wallet: Accessor<WalletInfo | null>;
  connectionError: Accessor<string | null>;
  isModalOpen: Accessor<boolean>;

  // Multi-wallet state
  availableWallets: Accessor<AvailableWallet[]>;
  connectedProviderId: Accessor<string | null>;

  // WalletConnect QR modal state
  isQRModalOpen: Accessor<boolean>;
  qrData: Accessor<WalletConnectQRData | null>;

  // Exchange modal state
  isExchangeModalOpen: Accessor<boolean>;
  exchangeStatus: Accessor<'idle' | 'loading' | 'success' | 'error'>;
  exchangeError: Accessor<string | null>;

  // Create Account modal state
  isCreateAccountModalOpen: Accessor<boolean>;

  // Program info state
  programInfo: Accessor<{ exchangeRate: number; loading: boolean; error: string | null }>;

  // SOL price state
  solPrice: Accessor<{ usd: number; loading: boolean; error: string | null }>;

  // Balances
  solBalance: Accessor<SolanaBalance | null>;
  splitdoATA: Accessor<ATAInfo>;

  // Loading states
  isLoadingBalance: Accessor<boolean>;
  isCreatingATA: Accessor<boolean>;

  // Actions
  connect: () => Promise<void>; // Legacy - connects to first available wallet
  connectWallet: (providerId: string) => Promise<void>; // New - connects to specific wallet
  switchWallet: (providerId: string) => Promise<void>; // Switch between wallets
  disconnect: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  createSplitdoATA: () => Promise<{ success: boolean; signature?: string; error?: string }>;

  // Modal controls
  openModal: () => void;
  closeModal: () => void;

  // QR modal controls
  openQRModal: () => void;
  closeQRModal: () => void;

  // Exchange modal controls
  openExchangeModal: () => void;
  closeExchangeModal: () => void;

  // Create Account modal controls
  openCreateAccountModal: () => void;
  closeCreateAccountModal: () => void;

  // Data fetching
  fetchProgramInfo: () => Promise<void>;
  fetchSolPrice: () => Promise<void>;
  executeExchange: (solAmount: number) => Promise<{ success: boolean; signature?: string; error?: string }>;

  // Multi-wallet utilities
  isWalletAvailable: (providerId: string) => boolean;
  getCurrentProvider: () => IWalletProvider | null;
  getWalletDescription: (providerId: string) => string;

  // Utilities
  isConnected: Accessor<boolean>;
  hasFirebaseToken: Accessor<boolean>;
}

interface WalletProviderProps {
  firebaseToken?: string; // Firebase JWT for backend API calls
}

const WalletContext = createContext<WalletContextState | undefined>();

export const WalletProvider: ParentComponent<WalletProviderProps> = (props) => {
  // Connection signals
  const [connectionStatus, setConnectionStatus] = createSignal<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [wallet, setWallet] = createSignal<WalletInfo | null>(null);
  const [connectionError, setConnectionError] = createSignal<string | null>(null);
  const [isModalOpen, setIsModalOpen] = createSignal(false);

  // Multi-wallet signals
  const [availableWallets, setAvailableWallets] = createSignal<AvailableWallet[]>([]);
  const [connectedProviderId, setConnectedProviderId] = createSignal<string | null>(null);

  // QR modal signals
  const [isQRModalOpen, setIsQRModalOpen] = createSignal(false);
  const [qrData, setQrData] = createSignal<WalletConnectQRData | null>(null);

  // Balance signals
  const [solBalance, setSolBalance] = createSignal<SolanaBalance | null>(null);
  const [splitdoATA, setSplitdoATA] = createSignal<ATAInfo>({ status: 'unknown' });

  // Loading signals
  const [isLoadingBalance, setIsLoadingBalance] = createSignal(false);
  const [isCreatingATA, setIsCreatingATA] = createSignal(false);

  // Exchange modal signals
  const [isExchangeModalOpen, setIsExchangeModalOpen] = createSignal(false);
  const [exchangeStatus, setExchangeStatus] = createSignal<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [exchangeError, setExchangeError] = createSignal<string | null>(null);

  // Create Account modal signals
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] = createSignal(false);

  // Program info signals
  const [programInfo, setProgramInfo] = createSignal<{ exchangeRate: number; loading: boolean; error: string | null }>({
    exchangeRate: 0.11, // Default fallback value
    loading: false,
    error: null
  });

  // SOL price signals
  const [solPrice, setSolPrice] = createSignal<{ usd: number; loading: boolean; error: string | null }>({
    usd: 0,
    loading: false,
    error: null
  });

  // Request guards to prevent concurrent fetches
  const [isFetchingProgramInfo, setIsFetchingProgramInfo] = createSignal(false);
  const [isFetchingSolPrice, setIsFetchingSolPrice] = createSignal(false);

  // Firebase token signal
  const [firebaseToken, setFirebaseToken] = createSignal<string | null>(props.firebaseToken || null);

  // WalletConnect event subscription cleanup
  let unsubscribeWalletConnect: (() => void) | null = null;

  // Initialize wallet connection monitoring
  onMount(() => {
    console.log('Enhanced WalletProvider mounted');

    // Subscribe to WalletConnect state changes
    unsubscribeWalletConnect = walletConnectService.subscribe((state: ConnectionState) => {
      setConnectionStatus(state.status);
      setWallet(state.wallet);
      setConnectionError(state.error);
      setIsModalOpen(state.isModalOpen);
      setAvailableWallets(state.availableWallets);
      setConnectedProviderId(state.connectedProviderId);
    });

    // Set initial state
    const initialState = walletConnectService.getState();
    setConnectionStatus(initialState.status);
    setWallet(initialState.wallet);
    setConnectionError(initialState.error);
    setIsModalOpen(initialState.isModalOpen);
    setAvailableWallets(initialState.availableWallets);
    setConnectedProviderId(initialState.connectedProviderId);
  });

  // Cleanup on unmount
  onCleanup(() => {
    console.log('WalletProvider cleanup');
    if (unsubscribeWalletConnect) {
      unsubscribeWalletConnect();
    }
  });

  // Auto-refresh balances when wallet connects
  createEffect(() => {
    const walletAddress = wallet()?.address;
    const isConnected = connectionStatus() === 'connected';

    if (isConnected && walletAddress) {
      console.log('Wallet connected, refreshing balances:', walletAddress);
      refreshBalances();
    } else {
      // Clear balances when disconnected
      setSolBalance(null);
      setSplitdoATA({ status: 'unknown' });
    }
  });

  // Update Firebase token when props change
  createEffect(() => {
    if (props.firebaseToken !== firebaseToken()) {
      setFirebaseToken(props.firebaseToken || null);
    }
  });

  // Actions
  const connect = async (): Promise<void> => {
    try {
      // Legacy method - connects to first available wallet
      await walletConnectService.connect();
    } catch (error) {
      console.error('Connect failed:', error);
      throw error;
    }
  };

  const connectWallet = async (providerId: string): Promise<void> => {
    try {
      const result = await walletConnectService.connectWallet(providerId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to connect wallet');
      }
    } catch (error) {
      console.error(`Connect to ${providerId} failed:`, error);
      throw error;
    }
  };

  const switchWallet = async (providerId: string): Promise<void> => {
    try {
      const result = await walletConnectService.switchWallet(providerId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to switch wallet');
      }
    } catch (error) {
      console.error(`Switch to ${providerId} failed:`, error);
      throw error;
    }
  };

  const disconnect = async (): Promise<void> => {
    try {
      await walletConnectService.disconnect();
      // Clear all state
      setSolBalance(null);
      setSplitdoATA({ status: 'unknown' });
      setConnectedProviderId(null);
    } catch (error) {
      console.error('Disconnect failed:', error);
      throw error;
    }
  };

  const refreshBalances = async (): Promise<void> => {
    const walletAddress = wallet()?.address;
    if (!walletAddress) {
      console.log('No wallet address available for balance refresh');
      return;
    }

    setIsLoadingBalance(true);

    try {
      // Load SOL balance
      const solBal = await solanaService.getSolBalance(walletAddress);
      setSolBalance(solBal);

      // Check SPLITDO ATA status
      await checkSplitdoATA(walletAddress);
    } catch (error) {
      console.error('Failed to refresh balances:', error);
      setSolBalance(null);
      setSplitdoATA({
        status: 'error',
        error: error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR
      });
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const checkSplitdoATA = async (walletAddress: string): Promise<void> => {
    setSplitdoATA({ status: 'checking' });

    try {
      const token = firebaseToken();
      if (!token) {
        // No Firebase token - can only get ATA address, not check existence
        const programInfo = await solanaService.getProgramInfo();
        const mintAddress = programInfo.utility_token_mint;
        const ataAddress = await solanaService.getAssociatedTokenAddress(walletAddress, mintAddress);

        setSplitdoATA({
          status: 'not_found',
          address: ataAddress
        });
        return;
      }

      // Use the enhanced SPLITDO ATA check that requires Firebase token
      const ataCheck = await solanaService.checkSplitdoATAExists(walletAddress, token);

      if (ataCheck.exists) {
        setSplitdoATA({
          status: 'exists',
          address: ataCheck.address,
          balance: ataCheck.balance ? {
            address: ataCheck.address,
            amount: (ataCheck.balance * 1000000).toString(), // Convert to token units
            decimals: 6,
            uiAmount: ataCheck.balance
          } : undefined
        });
      } else {
        setSplitdoATA({
          status: 'not_found',
          address: ataCheck.address
        });
      }
    } catch (error) {
      console.error('Error checking SPLITDO ATA:', error);
      setSplitdoATA({
        status: 'error',
        error: error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR
      });
    }
  };

  const createSplitdoATA = async (): Promise<{ success: boolean; signature?: string; error?: string }> => {
    const currentWallet = wallet();
    const token = firebaseToken();
    const provider = getCurrentProvider();

    if (!currentWallet || !provider) {
      return { success: false, error: 'No wallet connected' };
    }

    if (!token) {
      return { success: false, error: 'No authentication token available' };
    }

    setIsCreatingATA(true);
    setSplitdoATA(prev => ({ ...prev, status: 'creating' }));

    try {
      // Use the enhanced solana service with wallet provider
      const ataResult = await solanaService.createSplitdoATA(provider);

      if (!ataResult.success) {
        setSplitdoATA(prev => ({
          ...prev,
          status: 'error',
          error: ataResult.error
        }));
        return {
          success: false,
          error: ataResult.error
        };
      }

      if (!ataResult.signature) {
        // ATA already exists
        setSplitdoATA({
          status: 'exists',
          address: ataResult.ataAddress
        });
        return { success: true, signature: 'already_exists' };
      }

      // Submit signed transaction to backend
      const submitResult = await solanaService.submitSignedATATransaction(
        token,
        currentWallet.address,
        ataResult.ataAddress!,
        ataResult.signature
      );

      if (submitResult.success) {
        setSplitdoATA({
          status: 'created',
          address: ataResult.ataAddress,
          balance: {
            address: ataResult.ataAddress!,
            amount: '0',
            decimals: 6,
            uiAmount: 0
          }
        });

        // Refresh balances after creation
        setTimeout(() => refreshBalances(), 2000);

        return {
          success: true,
          signature: submitResult.transactionSignature
        };
      } else {
        setSplitdoATA(prev => ({
          ...prev,
          status: 'error',
          error: submitResult.error
        }));

        return {
          success: false,
          error: submitResult.error
        };
      }
    } catch (error) {
      console.error('ATA creation failed:', error);

      let errorMessage = ERROR_MESSAGES.TRANSACTION_FAILED;
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          errorMessage = ERROR_MESSAGES.USER_REJECTED;
        } else {
          errorMessage = error.message;
        }
      }

      setSplitdoATA(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }));

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsCreatingATA(false);
    }
  };

  // Exchange modal controls
  const openExchangeModal = (): void => {
    console.log('Opening exchange modal');
    setIsExchangeModalOpen(true);
  };

  const closeExchangeModal = (): void => {
    console.log('Closing exchange modal');
    setIsExchangeModalOpen(false);
    // Reset exchange state when modal closes
    setExchangeStatus('idle');
    setExchangeError(null);
  };

  // Create Account modal controls
  const openCreateAccountModal = (): void => {
    console.log('Opening create account modal');
    setIsCreateAccountModalOpen(true);
  };

  const closeCreateAccountModal = (): void => {
    console.log('Closing create account modal');
    setIsCreateAccountModalOpen(false);
  };

  // Fetch program info from backend
  const fetchProgramInfo = async (): Promise<void> => {
    // Prevent concurrent fetches
    if (isFetchingProgramInfo()) {
      console.log('Already fetching program info, skipping...');
      return;
    }

    setIsFetchingProgramInfo(true);
    console.log('Fetching program info...');
    setProgramInfo({ ...programInfo(), loading: true, error: null });

    try {
      // Use the cached version from PersistentDataProvider
      const { usePersistentData } = await import('../../data/PersistentDataProvider');
      const { fetchExchangeRates } = usePersistentData();

      const result = await fetchExchangeRates();

      if (result.data) {
        const exchangeRate = result.data.exchangeRate;
        console.log('Fetched exchange rate:', exchangeRate);

        setProgramInfo({
          exchangeRate: exchangeRate,
          loading: false,
          error: null
        });
      } else {
        throw new Error('No exchange rate data available from cache');
      }
    } catch (error) {
      console.error('Failed to fetch program info:', error);
      setProgramInfo({
        ...programInfo(),
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch exchange rates'
      });
    } finally {
      setIsFetchingProgramInfo(false);
    }
  };

  // Fetch SOL price from CoinGecko
  const fetchSolPrice = async (): Promise<void> => {
    // Prevent concurrent fetches
    if (isFetchingSolPrice()) {
      console.log('Already fetching SOL price, skipping...');
      return;
    }

    setIsFetchingSolPrice(true);
    console.log('Fetching SOL price from CoinGecko...');
    setSolPrice({ ...solPrice(), loading: true, error: null });

    try {
      // Use the cached version from PersistentDataProvider
      const { usePersistentData } = await import('../../data/PersistentDataProvider');
      const { fetchSolPrice: fetchCachedSolPrice } = usePersistentData();

      const result = await fetchCachedSolPrice();

      if (result.data) {
        const usdPrice = result.data.price;
        console.log('Fetched SOL price:', `$${usdPrice}`);

        setSolPrice({
          usd: usdPrice,
          loading: false,
          error: null
        });
      } else {
        throw new Error('No SOL price data available from cache');
      }
    } catch (error) {
      console.error('Failed to fetch SOL price:', error);
      setSolPrice({
        ...solPrice(),
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch SOL price'
      });
    } finally {
      setIsFetchingSolPrice(false);
    }
  };

  // Execute SOL to SPLITDO exchange
  const executeExchange = async (solAmount: number): Promise<{ success: boolean; signature?: string; error?: string }> => {
    console.log('Starting SOL to SPLITDO exchange:', solAmount);
    setExchangeStatus('loading');
    setExchangeError(null);

    try {
      // 1. Validate user has SPLITDO account
      const currentATA = splitdoATA();
      if (currentATA.status !== 'exists') {
        throw new Error('SPLITDO account required. Please create your SPLITDO account first.');
      }

      // 2. Validate SOL amount
      const MIN_SOL_AMOUNT = 0.01;
      if (solAmount < MIN_SOL_AMOUNT) {
        throw new Error(`Minimum exchange amount is ${MIN_SOL_AMOUNT} SOL`);
      }

      const currentWallet = wallet();
      const provider = getCurrentProvider();

      if (!currentWallet || !provider) {
        throw new Error('No wallet connected');
      }

      // 3. Get SOL vault address from backend
      console.log('Fetching vault address...');

      // Dynamic import to avoid issues
      const { middlewareFetch } = await import('../../middleware/endpoints');

      const vaultResponse = await middlewareFetch.Endpoints.DevbackendNoAuth._Api.SplitdoToken.Exchange.Solana.Vault.GET();
      if (vaultResponse.status !== 200) {
        throw new Error('Failed to fetch vault address');
      }

      const solVaultAddress = vaultResponse.data.data.sol_vault_address;
      console.log('Got vault address:', solVaultAddress);

      // 4. Create and send transaction using solana service
      const lamports = Math.floor(solAmount * 1000000000); // Convert SOL to lamports

      // Use the enhanced solana service for transaction creation and signing
      const exchangeResult = await solanaService.createAndSendSOLTransfer(
        provider,
        solVaultAddress,
        lamports
      );

      if (!exchangeResult.success) {
        setExchangeStatus('error');
        setExchangeError(exchangeResult.error || 'Exchange failed');
        return {
          success: false,
          error: exchangeResult.error
        };
      }

      setExchangeStatus('success');

      // Refresh balances after successful exchange
      setTimeout(() => refreshBalances(), 2000);

      return {
        success: true,
        signature: exchangeResult.signature
      };

    } catch (error) {
      console.error('Exchange failed:', error);

      let errorMessage = 'Exchange transaction failed';
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          errorMessage = 'Transaction was rejected by user';
        } else {
          errorMessage = error.message;
        }
      }

      setExchangeStatus('error');
      setExchangeError(errorMessage);

      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const openModal = (): void => {
    walletConnectService.openModal();
  };

  const closeModal = (): void => {
    walletConnectService.closeModal();
  };

  const openQRModal = (): void => {
    setIsQRModalOpen(true);
  };

  const closeQRModal = (): void => {
    setIsQRModalOpen(false);
    setQrData(null);
  };

  // Multi-wallet utilities
  const isWalletAvailable = (providerId: string): boolean => {
    return walletConnectService.isWalletAvailable(providerId);
  };

  const getCurrentProvider = (): IWalletProvider | null => {
    return walletConnectService.getCurrentWallet();
  };

  const getWalletDescription = (providerId: string): string => {
    const availableWallet = availableWallets().find(w => w.id === providerId);
    return availableWallet?.description || walletConnectService.getInstallationPrompt(providerId);
  };

  // Computed values
  const isConnected = (): boolean => {
    return connectionStatus() === 'connected' && wallet() !== null;
  };

  const hasFirebaseToken = (): boolean => {
    return firebaseToken() !== null;
  };

  const contextValue: WalletContextState = {
    // State accessors
    connectionStatus,
    wallet,
    connectionError,
    isModalOpen,

    // Multi-wallet state
    availableWallets,
    connectedProviderId,

    // QR modal state
    isQRModalOpen,
    qrData,

    // Exchange modal state
    isExchangeModalOpen,
    exchangeStatus,
    exchangeError,

    // Create Account modal state
    isCreateAccountModalOpen,

    // Program info state
    programInfo,

    // SOL price state
    solPrice,

    // Balances
    solBalance,
    splitdoATA,

    // Loading states
    isLoadingBalance,
    isCreatingATA,

    // Actions
    connect,
    connectWallet,
    switchWallet,
    disconnect,
    refreshBalances,
    createSplitdoATA,
    openModal,
    closeModal,
    openQRModal,
    closeQRModal,
    openExchangeModal,
    closeExchangeModal,
    openCreateAccountModal,
    closeCreateAccountModal,
    fetchProgramInfo,
    fetchSolPrice,
    executeExchange,

    // Multi-wallet utilities
    isWalletAvailable,
    getCurrentProvider,
    getWalletDescription,

    // Computed
    isConnected,
    hasFirebaseToken
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {props.children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextState => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// Helper hooks for specific use cases
export const useWalletConnection = () => {
  const {
    connectionStatus,
    wallet,
    connectionError,
    connect,
    connectWallet,
    switchWallet,
    disconnect,
    isConnected
  } = useWallet();

  return {
    connectionStatus,
    wallet,
    connectionError,
    connect,
    connectWallet,
    switchWallet,
    disconnect,
    isConnected
  };
};

export const useMultiWallet = () => {
  const {
    availableWallets,
    connectedProviderId,
    connectWallet,
    switchWallet,
    isWalletAvailable,
    getCurrentProvider,
    getWalletDescription
  } = useWallet();

  return {
    availableWallets,
    connectedProviderId,
    connectWallet,
    switchWallet,
    isWalletAvailable,
    getCurrentProvider,
    getWalletDescription
  };
};

export const useWalletBalances = () => {
  const { solBalance, splitdoATA, isLoadingBalance, refreshBalances } = useWallet();
  return { solBalance, splitdoATA, isLoadingBalance, refreshBalances };
};

export const useSplitdoATA = () => {
  const { splitdoATA, createSplitdoATA, isCreatingATA } = useWallet();
  return { splitdoATA, createSplitdoATA, isCreatingATA };
};

export const useWalletModal = () => {
  const { isModalOpen, openModal, closeModal } = useWallet();
  return { isModalOpen, openModal, closeModal };
};

export const useWalletConnectQRModal = () => {
  const { isQRModalOpen, qrData, openQRModal, closeQRModal } = useWallet();
  return { isQRModalOpen, qrData, openQRModal, closeQRModal };
};

// Exchange modal hook
export const useExchangeModal = () => {
  const { isExchangeModalOpen, openExchangeModal, closeExchangeModal } = useWallet();
  return { isExchangeModalOpen, openExchangeModal, closeExchangeModal };
};

// Create Account modal hook
export const useCreateAccountModal = () => {
  const { isCreateAccountModalOpen, openCreateAccountModal, closeCreateAccountModal } = useWallet();
  return { isCreateAccountModalOpen, openCreateAccountModal, closeCreateAccountModal };
};

// Exchange operations hook
export const useExchange = () => {
  const { exchangeStatus, exchangeError, executeExchange } = useWallet();
  return { exchangeStatus, exchangeError, executeExchange };
};

// Program info hook
export const useProgramInfo = () => {
  const { programInfo, fetchProgramInfo } = useWallet();
  return { programInfo, fetchProgramInfo };
};

// SOL price hook
export const useSolPrice = () => {
  const { solPrice, fetchSolPrice } = useWallet();
  return { solPrice, fetchSolPrice };
};