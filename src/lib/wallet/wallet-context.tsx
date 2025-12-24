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

  // Balance signals
  const [solBalance, setSolBalance] = createSignal<SolanaBalance | null>(null);
  const [splitdoATA, setSplitdoATA] = createSignal<ATAInfo>({ status: 'unknown' });

  // Loading signals
  const [isLoadingBalance, setIsLoadingBalance] = createSignal(false);
  const [isCreatingATA, setIsCreatingATA] = createSignal(false);

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
      // First try to get program info to get the mint address
      const programInfo = await solanaService.getProgramInfo();
      const mintAddress = programInfo.utility_token_mint;

      // Check if ATA exists on blockchain
      const ataCheck = await solanaService.checkATAExists(walletAddress, mintAddress);

      if (ataCheck.exists) {
        setSplitdoATA({
          status: 'exists',
          address: ataCheck.address,
          balance: ataCheck.balance
        });
        return;
      }

      // If no ATA on blockchain, check backend for user registration
      const token = firebaseToken();
      if (token) {
        const backendCheck = await solanaService.checkSplitdoBalance(token);

        if (backendCheck.hasAccount) {
          // User has account in backend but not on blockchain (shouldn't happen)
          setSplitdoATA({
            status: 'exists',
            address: ataCheck.address,
            balance: {
              address: ataCheck.address,
              amount: (backendCheck.balance! * 1000000).toString(), // Convert to token units
              decimals: 6,
              uiAmount: backendCheck.balance!
            }
          });
        } else {
          setSplitdoATA({
            status: 'not_found',
            address: ataCheck.address
          });
        }
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

  const openModal = (): void => {
    walletConnectService.openModal();
  };

  const closeModal = (): void => {
    walletConnectService.closeModal();
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