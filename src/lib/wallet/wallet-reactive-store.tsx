/**
 * SolidJS Reactive Wallet Store for SPLITDO
 * Fixed version with proper signal reactivity
 * Manages multi-wallet connections, ATA status, and wallet operations
 */

import {
  createSignal,
  createEffect,
  type Accessor
} from 'solid-js';

export type ATAStatus = 'unknown' | 'checking' | 'exists' | 'not_found' | 'creating' | 'created' | 'error';

export interface ATAInfo {
  status: ATAStatus;
  address?: string;
  balance?: { uiAmount: number };
  error?: string;
}

export interface WalletInfo {
  address: string;
  name: string;
}

export interface SolanaBalance {
  sol: number;
}

// Global reactive signals - created at module level for proper reactivity
const [connectionStatus, setConnectionStatus] = createSignal<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
const [wallet, setWallet] = createSignal<WalletInfo | null>(null);
const [connectionError, setConnectionError] = createSignal<string | null>(null);
const [isModalOpen, setIsModalOpen] = createSignal(false);
const [solBalance, setSolBalance] = createSignal<SolanaBalance | null>(null);
const [splitdoATA, setSplitdoATA] = createSignal<ATAInfo>({ status: 'unknown' });

// Store Firebase token
let firebaseToken: string | undefined = undefined;

// Initialize store with Firebase token
export const initializeWalletStore = (token?: string) => {
  console.log('[ReactiveWalletStore] Initializing with Firebase token:', token ? 'Present' : 'None');
  firebaseToken = token;
};

// Wallet connection simulation
const connectWallet = async (walletId: string) => {
  try {
    console.log('[ReactiveWalletStore] Connecting to wallet:', walletId);
    setConnectionStatus('connecting');
    setConnectionError(null);

    // Simulate wallet connection
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockWallet: WalletInfo = {
      address: walletId === 'phantom' ? 'PhantomWallet123...' : 'MetaMaskWallet456...',
      name: walletId === 'phantom' ? 'Phantom' : 'MetaMask'
    };

    setWallet(mockWallet);
    setConnectionStatus('connected');

    console.log('[ReactiveWalletStore] Wallet connected:', mockWallet.address);

    // Mock balance
    setSolBalance({ sol: 0.05 });

    // Mock SPLITDO ATA status (simulate "not found" for testuser1)
    setSplitdoATA({
      status: 'not_found'
    });

  } catch (error) {
    console.error('[ReactiveWalletStore] Wallet connection failed:', error);
    setConnectionStatus('error');
    setConnectionError(error instanceof Error ? error.message : 'Connection failed');
  }
};

const disconnectWallet = () => {
  console.log('[ReactiveWalletStore] Disconnecting wallet');
  setWallet(null);
  setConnectionStatus('disconnected');
  setConnectionError(null);
  setSolBalance(null);
  setSplitdoATA({ status: 'unknown' });
};

const checkSplitdoBalance = async () => {
  const currentWallet = wallet();
  if (!currentWallet || !firebaseToken) {
    console.log('[ReactiveWalletStore] Skipping SPLITDO balance check - no wallet or token');
    return;
  }

  try {
    console.log('[ReactiveWalletStore] Checking SPLITDO ATA status');
    setSplitdoATA({ status: 'checking' });

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock "not found" response for testuser1
    setSplitdoATA({
      status: 'not_found'
    });

    console.log('[ReactiveWalletStore] SPLITDO ATA check complete: not_found');
  } catch (error) {
    console.error('[ReactiveWalletStore] SPLITDO ATA check failed:', error);
    setSplitdoATA({
      status: 'error',
      error: error instanceof Error ? error.message : 'Network error'
    });
  }
};

const refreshBalances = async () => {
  const currentWallet = wallet();
  if (!currentWallet) {
    console.log('[ReactiveWalletStore] Skipping balance refresh - no wallet connected');
    return;
  }

  console.log('[ReactiveWalletStore] Refreshing wallet balances');
  // Mock balance update
  setSolBalance({ sol: 0.05 });
};

const openModal = () => {
  console.log('[ReactiveWalletStore] Opening wallet selection modal');
  setIsModalOpen(true);
  console.log('[ReactiveWalletStore] Modal state after opening:', isModalOpen());
};

const closeModal = () => {
  console.log('[ReactiveWalletStore] Closing wallet selection modal');
  setIsModalOpen(false);
};

// Export individual hooks for components
export const useWallet = () => {
  return {
    connectionStatus,
    wallet,
    connectionError
  };
};

export const useWalletModal = () => {
  return {
    isModalOpen,
    openModal,
    closeModal
  };
};

export const useWalletConnection = () => {
  return {
    connectWallet,
    disconnectWallet
  };
};

export const useWalletBalances = () => {
  return {
    solBalance,
    refreshBalances
  };
};

export const useSplitdoATA = () => {
  return {
    splitdoATA,
    checkSplitdoBalance
  };
};

export const useMultiWallet = () => {
  const [detectedWallets, setDetectedWallets] = createSignal<any[]>([]);

  // Real wallet detection on first call
  const availableWallets = () => {
    if (typeof window === 'undefined') return [];

    // Basic wallet detection
    const wallets = [];

    // Detect Phantom
    const phantomDetected = !!(window as any).phantom?.solana;
    wallets.push({
      id: 'phantom',
      name: 'Phantom',
      icon: '🟣',
      description: phantomDetected
        ? 'Popular Solana wallet with DeFi support'
        : 'Install Phantom to connect your Solana wallet',
      detected: phantomDetected,
      installUrl: 'https://phantom.app/'
    });

    // Detect MetaMask
    const metamaskDetected = !!(window as any).ethereum?.isMetaMask;
    wallets.push({
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: metamaskDetected
        ? 'Most popular Ethereum wallet'
        : 'Install MetaMask to connect your Ethereum wallet',
      detected: metamaskDetected,
      installUrl: 'https://metamask.io/'
    });

    console.log('[ReactiveWalletStore] Wallet detection results:',
      wallets.map(w => ({ name: w.name, detected: w.detected })));

    return wallets;
  };

  return {
    availableWallets
  };
};