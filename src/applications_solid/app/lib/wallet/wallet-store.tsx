/**
 * SolidJS Wallet Store (Global State)
 * Alternative to context that avoids Provider JSX issues
 */

import {
  createSignal,
  createRoot,
  type Accessor
} from 'solid-js';

export interface WalletState {
  connectionStatus: Accessor<'disconnected' | 'connecting' | 'connected' | 'error'>;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

function createWalletStore(firebaseToken?: string) {
  const [connectionStatus, setConnectionStatus] = createSignal<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  const connectWallet = async () => {
    console.log('[WalletStore] Connect wallet called with Firebase token:', firebaseToken ? 'Present' : 'None');
    setConnectionStatus('connecting');
    setTimeout(() => {
      setConnectionStatus('connected');
    }, 1000);
  };

  const disconnectWallet = () => {
    console.log('[WalletStore] Disconnect wallet called');
    setConnectionStatus('disconnected');
  };

  return {
    connectionStatus,
    connectWallet,
    disconnectWallet
  };
}

// Global wallet store instance
export const walletStore = createRoot(createWalletStore);

export const useWallet = () => walletStore;