/**
 * SolidJS Wallet Context with Alternative Pattern
 * Using direct context without .Provider syntax
 */

import {
  createContext,
  useContext,
  createSignal,
  type ParentComponent,
  type Accessor,
  type JSX
} from 'solid-js';

export interface WalletContextState {
  connectionStatus: Accessor<'disconnected' | 'connecting' | 'connected' | 'error'>;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

interface WalletProviderProps {
  firebaseToken?: string;
  children: JSX.Element;
}

// Create context with default value
const WalletContext = createContext<WalletContextState>({
  connectionStatus: () => 'disconnected',
  connectWallet: async () => {},
  disconnectWallet: () => {}
});

export const WalletProvider: ParentComponent<{ firebaseToken?: string }> = (props) => {
  const [connectionStatus, setConnectionStatus] = createSignal<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  const connectWallet = async () => {
    console.log('[WalletProvider] Connect wallet called');
    setConnectionStatus('connecting');
    setTimeout(() => {
      setConnectionStatus('connected');
    }, 1000);
  };

  const disconnectWallet = () => {
    console.log('[WalletProvider] Disconnect wallet called');
    setConnectionStatus('disconnected');
  };

  const contextValue: WalletContextState = {
    connectionStatus,
    connectWallet,
    disconnectWallet
  };

  // Use JSX directly instead of .Provider
  return WalletContext.Provider({
    value: contextValue,
    get children() {
      return props.children;
    }
  });
};

export const useWallet = (): WalletContextState => {
  return useContext(WalletContext);
};