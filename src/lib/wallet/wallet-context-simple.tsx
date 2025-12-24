/**
 * Simplified SolidJS Wallet Context Provider for SPLITDO
 * Basic wallet integration for testing
 */

import {
  createContext,
  useContext,
  createSignal,
  type ParentComponent,
  type Accessor
} from 'solid-js';

export interface SimpleWalletContextState {
  connectionStatus: Accessor<'disconnected' | 'connecting' | 'connected' | 'error'>;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

interface WalletProviderProps {
  firebaseToken?: string;
}

const SimpleWalletContext = createContext<SimpleWalletContextState>();

export const SimpleWalletProvider: ParentComponent<WalletProviderProps> = (props) => {
  const [connectionStatus, setConnectionStatus] = createSignal<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  const connectWallet = async () => {
    console.log('[SimpleWalletProvider] Connect wallet called');
    setConnectionStatus('connecting');
    // Simulate connection
    setTimeout(() => {
      setConnectionStatus('connected');
    }, 1000);
  };

  const disconnectWallet = () => {
    console.log('[SimpleWalletProvider] Disconnect wallet called');
    setConnectionStatus('disconnected');
  };

  const contextValue: SimpleWalletContextState = {
    connectionStatus,
    connectWallet,
    disconnectWallet
  };

  return (
    <SimpleWalletContext.Provider value={contextValue}>
      {props.children}
    </SimpleWalletContext.Provider>
  );
};

export const useSimpleWallet = (): SimpleWalletContextState => {
  const context = useContext(SimpleWalletContext);
  if (!context) {
    throw new Error('useSimpleWallet must be used within a SimpleWalletProvider');
  }
  return context;
};