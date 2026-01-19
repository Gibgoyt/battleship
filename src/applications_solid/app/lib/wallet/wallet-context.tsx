/**
 * Enhanced SolidJS Wallet Context Provider for SPLITDO
 *
 * This is now a compatibility wrapper around the UnifiedWalletProvider
 * that maintains backward compatibility with existing components.
 *
 * All functionality has been moved to unified-wallet-context.tsx
 */

import { type ParentComponent } from 'solid-js';
import {
  UnifiedWalletProvider,
  useUnifiedWallet,
  useWallet as useUnifiedWalletHook,
  type ATAStatus,
  type ATAInfo
} from './unified-wallet-context';
import type { WalletInfo, AvailableWallet } from './walletconnect-service';
import type { SolanaBalance } from './solana-service';
import type { WalletProvider as IWalletProvider } from './wallet-providers';
import type { WalletConnectQRData } from './providers/walletconnect-provider';

// Re-export types for backward compatibility
export type { ATAStatus, ATAInfo };

// Re-export the original WalletContextState interface for backward compatibility
export interface WalletContextState {
  // Connection state
  connectionStatus: () => 'disconnected' | 'connecting' | 'connected' | 'error';
  wallet: () => WalletInfo | null;
  connectionError: () => string | null;
  isModalOpen: () => boolean;

  // Multi-wallet state
  availableWallets: () => AvailableWallet[];
  connectedProviderId: () => string | null;

  // WalletConnect QR modal state
  isQRModalOpen: () => boolean;
  qrData: () => WalletConnectQRData | null;

  // Exchange modal state
  isExchangeModalOpen: () => boolean;
  exchangeStatus: () => 'idle' | 'loading' | 'success' | 'error';
  exchangeError: () => string | null;

  // Create Account modal state
  isCreateAccountModalOpen: () => boolean;

  // Program info state
  programInfo: () => { exchangeRate: number; loading: boolean; error: string | null };

  // SOL price state
  solPrice: () => { usd: number; loading: boolean; error: string | null };

  // Balances
  solBalance: () => SolanaBalance | null;
  splitdoATA: () => ATAInfo;

  // Loading states
  isLoadingBalance: () => boolean;
  isCreatingATA: () => boolean;

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

  // Data fetching - now properly integrated without dynamic imports
  fetchProgramInfo: () => Promise<void>;
  fetchSolPrice: () => Promise<void>;
  executeExchange: (solAmount: number) => Promise<{ success: boolean; signature?: string; error?: string }>;

  // Multi-wallet utilities
  isWalletAvailable: (providerId: string) => boolean;
  getCurrentProvider: () => IWalletProvider | null;
  getWalletDescription: (providerId: string) => string;

  // Utilities
  isConnected: () => boolean;
  hasFirebaseToken: () => boolean;
}

interface WalletProviderProps {
  firebaseToken?: string; // Firebase JWT for backend API calls
  children: any;
}

/**
 * Backward-compatible WalletProvider that wraps the UnifiedWalletProvider
 */
export const WalletProvider: ParentComponent<WalletProviderProps> = (props) => {
  return (
    <UnifiedWalletProvider firebaseToken={props.firebaseToken}>
      {props.children}
    </UnifiedWalletProvider>
  );
};

/**
 * Main wallet hook - backward compatible with original implementation
 * but now uses the unified context internally
 */
export const useWallet = (): WalletContextState => {
  // Use the unified wallet hook internally
  const unifiedWallet = useUnifiedWallet();

  // Map the unified context to the old interface
  return {
    // Connection state
    connectionStatus: unifiedWallet.connectionStatus,
    wallet: unifiedWallet.wallet,
    connectionError: unifiedWallet.connectionError,
    isModalOpen: unifiedWallet.isWalletModalOpen,

    // Multi-wallet state
    availableWallets: unifiedWallet.availableWallets,
    connectedProviderId: unifiedWallet.connectedProviderId,

    // WalletConnect QR modal state
    isQRModalOpen: unifiedWallet.isQRModalOpen,
    qrData: unifiedWallet.qrData,

    // Exchange modal state
    isExchangeModalOpen: unifiedWallet.isExchangeModalOpen,
    exchangeStatus: unifiedWallet.exchangeStatus,
    exchangeError: unifiedWallet.exchangeError,

    // Create Account modal state
    isCreateAccountModalOpen: unifiedWallet.isCreateAccountModalOpen,

    // Program info state - mapped from exchange rates
    programInfo: () => {
      const rates = unifiedWallet.exchangeRates();
      const loading = unifiedWallet.isPersistentDataLoading();

      if (rates) {
        return {
          exchangeRate: rates.exchangeRate,
          loading: false,
          error: null
        };
      } else if (loading) {
        return {
          exchangeRate: 0,
          loading: true,
          error: null
        };
      } else {
        return {
          exchangeRate: 0,
          loading: false,
          error: 'No exchange rate data available'
        };
      }
    },

    // SOL price state - mapped from sol price data
    solPrice: () => {
      const price = unifiedWallet.solPrice();
      const loading = unifiedWallet.isPersistentDataLoading();

      if (price) {
        return {
          usd: price.price,
          loading: false,
          error: null
        };
      } else if (loading) {
        return {
          usd: 0,
          loading: true,
          error: null
        };
      } else {
        return {
          usd: 0,
          loading: false,
          error: 'No SOL price data available'
        };
      }
    },

    // Balances
    solBalance: unifiedWallet.solBalance,
    splitdoATA: unifiedWallet.splitdoATA,

    // Loading states
    isLoadingBalance: unifiedWallet.isLoadingBalance,
    isCreatingATA: unifiedWallet.isCreatingATA,

    // Actions - mapped to unified methods
    connect: async () => {
      // Legacy connect - connect to first available wallet
      const wallets = unifiedWallet.availableWallets();
      if (wallets.length > 0) {
        return await unifiedWallet.connectWallet(wallets[0].id);
      }
      throw new Error('No wallets available');
    },
    connectWallet: unifiedWallet.connectWallet,
    switchWallet: unifiedWallet.switchWallet,
    disconnect: unifiedWallet.disconnectWallet,
    refreshBalances: unifiedWallet.refreshBalances,
    createSplitdoATA: unifiedWallet.createSplitdoATA,

    // Modal controls
    openModal: unifiedWallet.openWalletModal,
    closeModal: unifiedWallet.closeWalletModal,

    // QR modal controls
    openQRModal: unifiedWallet.openQRModal,
    closeQRModal: unifiedWallet.closeQRModal,

    // Exchange modal controls
    openExchangeModal: unifiedWallet.openExchangeModal,
    closeExchangeModal: unifiedWallet.closeExchangeModal,

    // Create Account modal controls
    openCreateAccountModal: unifiedWallet.openCreateAccountModal,
    closeCreateAccountModal: unifiedWallet.closeCreateAccountModal,

    // Data fetching - NO MORE DYNAMIC IMPORTS!
    fetchProgramInfo: async () => {
      await unifiedWallet.fetchExchangeRates();
    },
    fetchSolPrice: async () => {
      await unifiedWallet.fetchSolPrice();
    },
    executeExchange: unifiedWallet.executeExchange,

    // Multi-wallet utilities
    isWalletAvailable: unifiedWallet.isWalletAvailable,
    getCurrentProvider: unifiedWallet.getCurrentProvider,
    getWalletDescription: unifiedWallet.getWalletDescription,

    // Utilities
    isConnected: unifiedWallet.isConnected,
    hasFirebaseToken: unifiedWallet.hasFirebaseToken,
  };
};

// ===============================
// BACKWARD-COMPATIBLE HOOKS
// All existing hooks maintain the same interface
// ===============================

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

// Program info hook - now uses unified data
export const useProgramInfo = () => {
  const { programInfo, fetchProgramInfo } = useWallet();
  return { programInfo, fetchProgramInfo };
};

// SOL price hook - now uses unified data
export const useSolPrice = () => {
  const { solPrice, fetchSolPrice } = useWallet();
  return { solPrice, fetchSolPrice };
};