/**
 * SolidJS Global Wallet Store for SPLITDO
 * Converted from context to global store to avoid Provider JSX issues
 * Manages multi-wallet connections, ATA status, and wallet operations
 */

import {
  createSignal,
  createRoot,
  createEffect,
  type Accessor
} from 'solid-js';
import {
  walletConnectService,
  type ConnectionState,
  type WalletInfo,
  type AvailableWallet
} from './walletconnect-service';
import { solanaService, type SolanaBalance, type TokenBalance } from './solana-service';
import { ERROR_MESSAGES } from './walletconnect-config';

export type ATAStatus = 'unknown' | 'checking' | 'exists' | 'not_found' | 'creating' | 'created' | 'error';

export interface ATAInfo {
  status: ATAStatus;
  address?: string;
  balance?: TokenBalance;
  error?: string;
}

export interface WalletGlobalState {
  // Connection state
  connectionStatus: Accessor<'disconnected' | 'connecting' | 'connected' | 'error'>;
  wallet: Accessor<WalletInfo | null>;
  connectionError: Accessor<string | null>;

  // Modal state
  isModalOpen: Accessor<boolean>;
  openModal: () => void;
  closeModal: () => void;

  // Multi-wallet state
  availableWallets: Accessor<AvailableWallet[]>;

  // Balances
  solBalance: Accessor<SolanaBalance | null>;
  splitdoATA: Accessor<ATAInfo>;

  // Actions
  connectWallet: (walletId: string) => Promise<void>;
  disconnectWallet: () => void;
  checkSplitdoBalance: () => Promise<void>;
  refreshBalances: () => Promise<void>;
}

function createWalletGlobalStore(firebaseToken?: string) {
  // Connection signals
  const [connectionStatus, setConnectionStatus] = createSignal<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [wallet, setWallet] = createSignal<WalletInfo | null>(null);
  const [connectionError, setConnectionError] = createSignal<string | null>(null);

  // Modal signals
  const [isModalOpen, setIsModalOpen] = createSignal(false);

  // Multi-wallet signals
  const [availableWallets, setAvailableWallets] = createSignal<AvailableWallet[]>([]);

  // Balance signals
  const [solBalance, setSolBalance] = createSignal<SolanaBalance | null>(null);
  const [splitdoATA, setSplitdoATA] = createSignal<ATAInfo>({ status: 'unknown' });

  // Initialize available wallets
  const initializeWallets = async () => {
    try {
      console.log('[WalletStore] Initializing available wallets');
      const wallets = await walletConnectService.getAvailableWallets();
      setAvailableWallets(wallets);
      console.log('[WalletStore] Available wallets loaded:', wallets.length);
    } catch (error) {
      console.error('[WalletStore] Failed to initialize wallets:', error);
    }
  };

  // Connect wallet function
  const connectWallet = async (walletId: string) => {
    try {
      console.log('[WalletStore] Connecting to wallet:', walletId);
      setConnectionStatus('connecting');
      setConnectionError(null);

      const walletInfo = await walletConnectService.connectWallet(walletId);
      setWallet(walletInfo);
      setConnectionStatus('connected');

      console.log('[WalletStore] Wallet connected successfully:', walletInfo.address);

      // Auto-refresh balances and check SPLITDO ATA
      await Promise.all([
        refreshBalances(),
        checkSplitdoBalance()
      ]);

    } catch (error) {
      console.error('[WalletStore] Wallet connection failed:', error);
      setConnectionStatus('error');
      setConnectionError(error instanceof Error ? error.message : ERROR_MESSAGES.CONNECTION_FAILED);
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    try {
      console.log('[WalletStore] Disconnecting wallet');
      walletConnectService.disconnect();
      setWallet(null);
      setConnectionStatus('disconnected');
      setConnectionError(null);
      setSolBalance(null);
      setSplitdoATA({ status: 'unknown' });
    } catch (error) {
      console.error('[WalletStore] Wallet disconnect failed:', error);
    }
  };

  // Check SPLITDO ATA status
  const checkSplitdoBalance = async () => {
    const currentWallet = wallet();
    if (!currentWallet || !firebaseToken) {
      console.log('[WalletStore] Skipping SPLITDO balance check - no wallet or token');
      return;
    }

    try {
      console.log('[WalletStore] Checking SPLITDO ATA status');
      setSplitdoATA({ status: 'checking' });

      const ataInfo = await solanaService.checkSplitdoATA(currentWallet.address, firebaseToken);
      setSplitdoATA(ataInfo);

      console.log('[WalletStore] SPLITDO ATA check complete:', ataInfo.status);
    } catch (error) {
      console.error('[WalletStore] SPLITDO ATA check failed:', error);
      setSplitdoATA({
        status: 'error',
        error: error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR
      });
    }
  };

  // Refresh wallet balances
  const refreshBalances = async () => {
    const currentWallet = wallet();
    if (!currentWallet) {
      console.log('[WalletStore] Skipping balance refresh - no wallet connected');
      return;
    }

    try {
      console.log('[WalletStore] Refreshing wallet balances');
      const balance = await solanaService.getWalletBalance(currentWallet.address);
      setSolBalance(balance);
      console.log('[WalletStore] Balances updated:', balance);
    } catch (error) {
      console.error('[WalletStore] Balance refresh failed:', error);
    }
  };

  // Modal functions
  const openModal = () => {
    console.log('[WalletStore] Opening wallet selection modal');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    console.log('[WalletStore] Closing wallet selection modal');
    setIsModalOpen(false);
  };

  // Initialize wallets on store creation
  initializeWallets();

  return {
    // State
    connectionStatus,
    wallet,
    connectionError,
    isModalOpen,
    availableWallets,
    solBalance,
    splitdoATA,

    // Actions
    connectWallet,
    disconnectWallet,
    checkSplitdoBalance,
    refreshBalances,
    openModal,
    closeModal
  };
}

// Global wallet store instance
let globalWalletStore: WalletGlobalState | null = null;

export const initializeWalletStore = (firebaseToken?: string) => {
  if (!globalWalletStore) {
    globalWalletStore = createRoot(() => createWalletGlobalStore(firebaseToken));
    console.log('[WalletStore] Global wallet store initialized');
  }
  return globalWalletStore;
};

export const useWallet = (): WalletGlobalState => {
  if (!globalWalletStore) {
    throw new Error('Wallet store not initialized. Call initializeWalletStore() first.');
  }
  return globalWalletStore;
};

// Helper hooks for specific functionality
export const useWalletModal = () => {
  const store = useWallet();
  return {
    isModalOpen: store.isModalOpen,
    openModal: store.openModal,
    closeModal: store.closeModal
  };
};

export const useWalletConnection = () => {
  const store = useWallet();
  return {
    connectWallet: store.connectWallet,
    disconnectWallet: store.disconnectWallet
  };
};

export const useWalletBalances = () => {
  const store = useWallet();
  return {
    solBalance: store.solBalance,
    refreshBalances: store.refreshBalances
  };
};

export const useSplitdoATA = () => {
  const store = useWallet();
  return {
    splitdoATA: store.splitdoATA,
    checkSplitdoBalance: store.checkSplitdoBalance
  };
};

export const useMultiWallet = () => {
  const store = useWallet();
  return {
    availableWallets: store.availableWallets
  };
};