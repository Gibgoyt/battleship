/**
 * Multi-Wallet Provider Architecture for SPLITDO
 *
 * Provides abstract interfaces and concrete implementations for different wallet providers
 * Supports Phantom, MetaMask, and Wallet Standard wallets
 */

// Import browser polyfills FIRST to ensure Buffer is available
import './browser-polyfills';
import { PublicKey, Transaction } from '@solana/web3.js';

// Core wallet provider interface
export interface WalletProvider {
  id: string;
  name: string;
  icon: string;
  isAvailable(): boolean;
  connect(): Promise<{ publicKey: PublicKey }>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getPublicKey(): PublicKey | null;
}

// Wallet connection result
export interface WalletConnectionResult {
  success: boolean;
  wallet?: {
    address: string;
    publicKey: PublicKey;
    provider: WalletProvider;
  };
  error?: string;
}

// Phantom wallet provider interface (window.solana)
export interface PhantomProvider {
  isPhantom?: boolean;
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  publicKey?: { toString(): string };
  isConnected?: boolean;
}

// MetaMask Solana provider interface (window.ethereum.solana)
export interface MetaMaskEthereumProvider {
  isMetaMask?: boolean;
  solana?: {
    connect(): Promise<{ publicKey: { toString(): string } }>;
    signTransaction(transaction: Transaction): Promise<Transaction>;
    disconnect?(): Promise<void>;
    publicKey?: { toString(): string };
    isConnected?: boolean;
  };
}

declare global {
  interface Window {
    solana?: PhantomProvider;
    ethereum?: MetaMaskEthereumProvider;
  }
}

// Error types for wallet operations
export class WalletError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: string
  ) {
    super(message);
    this.name = 'WalletError';
  }
}

export class WalletNotFoundError extends WalletError {
  constructor(provider: string) {
    super(`${provider} wallet not found`, 'WALLET_NOT_FOUND', provider);
  }
}

export class WalletConnectionError extends WalletError {
  constructor(provider: string, originalError?: any) {
    super(
      `Failed to connect to ${provider}: ${originalError?.message || 'Unknown error'}`,
      'CONNECTION_FAILED',
      provider
    );
  }
}

export class WalletSigningError extends WalletError {
  constructor(provider: string, originalError?: any) {
    super(
      `Failed to sign transaction with ${provider}: ${originalError?.message || 'Unknown error'}`,
      'SIGNING_FAILED',
      provider
    );
  }
}

// Phantom wallet implementation
export class PhantomWalletProvider implements WalletProvider {
  readonly id = 'phantom';
  readonly name = 'Phantom';
  readonly icon = '🟣';

  private provider: PhantomProvider | null = null;
  private publicKey: PublicKey | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.provider = window.solana || null;
    }
  }

  isAvailable(): boolean {
    return !!(this.provider?.isPhantom);
  }

  async connect(): Promise<{ publicKey: PublicKey }> {
    if (!this.isAvailable()) {
      throw new WalletNotFoundError('Phantom');
    }

    try {
      // EXTENSIVE DEBUGGING: Log initial Phantom state
      console.log('🚨 [Phantom DEBUG] ===== DETAILED CONNECTION DEBUGGING =====');
      console.log('🚨 [Phantom DEBUG] Initial provider state:', {
        isPhantom: !!this.provider?.isPhantom,
        isConnected: !!this.provider?.isConnected,
        publicKey: this.provider?.publicKey?.toString() || 'null',
        localPublicKey: this.publicKey?.toString() || 'null'
      });

      // SECURITY FIX: Force disconnect first to ensure popup appears every time
      // This is necessary because once a site is "trusted" by Phantom,
      // it will auto-connect without popup even with onlyIfTrusted: false
      console.log('🚨 [Phantom DEBUG] Forcing disconnect to ensure fresh connection popup...');

      const preDisconnectState = {
        isConnected: !!this.provider?.isConnected,
        publicKey: this.provider?.publicKey?.toString() || 'null'
      };
      console.log('🚨 [Phantom DEBUG] State before disconnect:', preDisconnectState);

      try {
        console.log('🚨 [Phantom DEBUG] Calling provider.disconnect()...');
        await this.provider!.disconnect();
        console.log('🚨 [Phantom DEBUG] provider.disconnect() call completed');
      } catch (disconnectError) {
        console.log('🚨 [Phantom DEBUG] Pre-connection disconnect failed:', disconnectError);
        console.log('🚨 [Phantom DEBUG] This might be expected if not previously connected');
      }

      const postDisconnectState = {
        isConnected: !!this.provider?.isConnected,
        publicKey: this.provider?.publicKey?.toString() || 'null'
      };
      console.log('🚨 [Phantom DEBUG] State after disconnect:', postDisconnectState);

      // Clear local state to ensure clean slate
      this.publicKey = null;
      console.log('🚨 [Phantom DEBUG] Cleared local publicKey state');

      // Small delay to allow Phantom to process the disconnect
      console.log('🚨 [Phantom DEBUG] Waiting 100ms for Phantom to process disconnect...');
      await new Promise(resolve => setTimeout(resolve, 100));

      const preConnectState = {
        isConnected: !!this.provider?.isConnected,
        publicKey: this.provider?.publicKey?.toString() || 'null'
      };
      console.log('🚨 [Phantom DEBUG] State before connect attempt:', preConnectState);

      // SECURITY FIX: Now connect with onlyIfTrusted: false to force popup
      console.log('🚨 [Phantom DEBUG] 🔥 CRITICAL: Calling connect({ onlyIfTrusted: false })...');
      console.log('🚨 [Phantom DEBUG] 🔥 IF NO POPUP APPEARS, THIS IS THE BUG!');

      const startTime = Date.now();
      const response = await this.provider!.connect({ onlyIfTrusted: false });
      const endTime = Date.now();
      const connectionTime = endTime - startTime;

      console.log('🚨 [Phantom DEBUG] connect() call completed in', connectionTime, 'ms');
      console.log('🚨 [Phantom DEBUG] 🔥 CRITICAL: If this was < 500ms, NO POPUP appeared!');
      console.log('🚨 [Phantom DEBUG] Response:', {
        publicKey: response?.publicKey?.toString() || 'null',
        responseObject: response
      });

      const finalState = {
        isConnected: !!this.provider?.isConnected,
        publicKey: this.provider?.publicKey?.toString() || 'null',
        responsePublicKey: response?.publicKey?.toString() || 'null'
      };
      console.log('🚨 [Phantom DEBUG] Final state after connect:', finalState);

      this.publicKey = new PublicKey(response.publicKey.toString());

      if (connectionTime < 500) {
        console.error('🚨 [Phantom DEBUG] 💥 FALSE POSITIVE DETECTED!');
        console.error('🚨 [Phantom DEBUG] 💥 Connection completed too fast - NO USER INTERACTION!');
        console.error('🚨 [Phantom DEBUG] 💥 This proves the site is TRUSTED and auto-connecting!');
      } else {
        console.log('🚨 [Phantom DEBUG] ✅ Connection took long enough - likely genuine popup interaction');
      }

      console.log('🚨 [Phantom DEBUG] ===== END DETAILED DEBUGGING =====');
      return { publicKey: this.publicKey };
    } catch (error) {
      // Clear state on error
      this.publicKey = null;
      console.log('🚨 [Phantom DEBUG] Connection failed with error:', error);

      // Enhanced error handling for better user feedback
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = (error as any)?.code;

      if (errorCode === 4001 || errorMessage.includes('rejected') || errorMessage.includes('cancelled')) {
        console.log('🚨 [Phantom DEBUG] ℹ️ User cancelled connection request');
        throw new WalletError('User cancelled connection request', 'USER_REJECTED', 'Phantom');
      } else if (errorCode === 4100 || errorMessage.includes('unauthorized')) {
        console.log('🚨 [Phantom DEBUG] ⚠️ App not authorized by user');
        throw new WalletError('App not authorized. Please try connecting again.', 'UNAUTHORIZED', 'Phantom');
      } else if (errorMessage.includes('popup') || errorMessage.includes('blocked')) {
        console.log('🚨 [Phantom DEBUG] ⚠️ Popup blocked or failed');
        throw new WalletError('Popup blocked. Please allow popups for this site and try again.', 'POPUP_BLOCKED', 'Phantom');
      } else {
        console.error('🚨 [Phantom DEBUG] ❌ Unexpected connection error:', error);
        throw new WalletConnectionError('Phantom', error);
      }
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.isConnected()) {
      throw new WalletError('Wallet not connected', 'NOT_CONNECTED', 'Phantom');
    }

    try {
      return await this.provider!.signTransaction(transaction);
    } catch (error) {
      throw new WalletSigningError('Phantom', error);
    }
  }

  async disconnect(): Promise<void> {
    console.log('[Phantom] Starting clean disconnect to prevent cached connections');

    // SECURITY FIX: Enhanced disconnect handling to prevent cached connections
    if (this.provider) {
      try {
        await this.provider.disconnect();
        console.log('[Phantom] ✅ Provider disconnect completed');
      } catch (error) {
        console.warn('Error disconnecting Phantom wallet:', error);
      }
    }

    // Always clear local state regardless of provider disconnect result
    this.publicKey = null;

    // Additional validation to ensure clean state
    if (this.provider?.isConnected) {
      console.warn('[Phantom] Provider still reports connected after disconnect - state inconsistency detected');
    }

    console.log('[Phantom] ✅ Local state cleared, disconnect completed');
  }

  isConnected(): boolean {
    // SECURITY FIX: Enhanced connection state validation
    // Ensure connection state matches actual user authorization
    const hasProvider = !!this.provider;
    const hasPublicKey = !!this.publicKey;
    const providerConnected = !!this.provider?.isConnected;
    const providerPublicKey = this.provider?.publicKey?.toString();
    const localPublicKey = this.publicKey?.toString();

    // Validate that all connection states are consistent
    const isValid = hasProvider &&
                   hasPublicKey &&
                   providerConnected &&
                   providerPublicKey &&
                   localPublicKey &&
                   providerPublicKey === localPublicKey;

    if (!isValid && (hasProvider || hasPublicKey || providerConnected)) {
      console.warn('[Phantom] Connection state inconsistency detected, forcing disconnect');
      // Clear inconsistent state
      this.publicKey = null;
    }

    return isValid;
  }

  getPublicKey(): PublicKey | null {
    return this.publicKey;
  }
}

// MetaMask Solana wallet implementation
export class MetaMaskSolanaProvider implements WalletProvider {
  readonly id = 'metamask';
  readonly name = 'MetaMask';
  readonly icon = '🦊';

  private provider: MetaMaskEthereumProvider | null = null;
  private publicKey: PublicKey | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.provider = window.ethereum;
    }
  }

  isAvailable(): boolean {
    return !!(this.provider?.isMetaMask && this.provider?.solana);
  }

  async connect(): Promise<{ publicKey: PublicKey }> {
    if (!this.isAvailable()) {
      throw new WalletNotFoundError('MetaMask');
    }

    try {
      const response = await this.provider!.solana!.connect();
      this.publicKey = new PublicKey(response.publicKey.toString());

      return { publicKey: this.publicKey };
    } catch (error) {
      throw new WalletConnectionError('MetaMask', error);
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.isConnected()) {
      throw new WalletError('Wallet not connected', 'NOT_CONNECTED', 'MetaMask');
    }

    try {
      return await this.provider!.solana!.signTransaction(transaction);
    } catch (error) {
      throw new WalletSigningError('MetaMask', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.provider?.solana?.disconnect) {
      try {
        await this.provider.solana.disconnect();
      } catch (error) {
        console.warn('Error disconnecting MetaMask wallet:', error);
      }
    }
    this.publicKey = null;
  }

  isConnected(): boolean {
    return !!(this.provider?.solana?.isConnected && this.publicKey);
  }

  getPublicKey(): PublicKey | null {
    return this.publicKey;
  }
}

// Wallet provider factory
export class WalletProviderFactory {
  private static providers: Map<string, () => WalletProvider> = new Map([
    ['phantom', () => new PhantomWalletProvider()],
    ['metamask', () => new MetaMaskSolanaProvider()],
    // ['walletconnect', () => new WalletConnectProvider()], // Commented out to fix circular dependency
  ]);

  static createProvider(id: string): WalletProvider | null {
    const factory = this.providers.get(id);
    return factory ? factory() : null;
  }

  static getAvailableProviders(): WalletProvider[] {
    const providers: WalletProvider[] = [];

    for (const [, factory] of this.providers) {
      const provider = factory();
      if (provider.isAvailable()) {
        providers.push(provider);
      }
    }

    return providers;
  }

  static getSupportedProviderIds(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Multi-wallet management service
export class MultiWalletService {
  private providers: Map<string, WalletProvider> = new Map();
  private activeProvider: WalletProvider | null = null;
  private eventCallbacks: Set<(event: WalletEvent) => void> = new Set();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    const availableProviders = WalletProviderFactory.getAvailableProviders();

    for (const provider of availableProviders) {
      this.providers.set(provider.id, provider);
    }
  }

  async connectWallet(providerId: string): Promise<WalletConnectionResult> {
    const provider = this.providers.get(providerId);

    if (!provider) {
      const error = `Wallet provider ${providerId} not found`;
      this.emitEvent({ type: 'error', error });
      return { success: false, error };
    }

    if (!provider.isAvailable()) {
      const error = `${provider.name} wallet not available`;
      this.emitEvent({ type: 'error', error, providerId });
      return { success: false, error };
    }

    try {
      this.emitEvent({ type: 'connecting', providerId });

      const { publicKey } = await provider.connect();
      this.activeProvider = provider;

      const wallet = {
        address: publicKey.toString(),
        publicKey,
        provider
      };

      this.emitEvent({ type: 'connected', providerId, wallet });

      return { success: true, wallet };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emitEvent({ type: 'error', error: errorMessage, providerId });
      return { success: false, error: errorMessage };
    }
  }

  async disconnectWallet(): Promise<void> {
    if (this.activeProvider) {
      const providerId = this.activeProvider.id;

      try {
        await this.activeProvider.disconnect();
        this.emitEvent({ type: 'disconnected', providerId });
      } catch (error) {
        console.warn(`Error disconnecting ${providerId}:`, error);
      } finally {
        this.activeProvider = null;
      }
    }
  }

  async switchWallet(providerId: string): Promise<WalletConnectionResult> {
    // Disconnect current wallet without clearing the active provider immediately
    // to maintain state during switching
    const previousProvider = this.activeProvider;

    try {
      if (previousProvider) {
        await previousProvider.disconnect();
      }
      return await this.connectWallet(providerId);
    } catch (error) {
      // Restore previous provider if switch fails
      this.activeProvider = previousProvider;
      throw error;
    }
  }

  getAvailableWallets(): WalletProvider[] {
    return Array.from(this.providers.values()).filter(p => p.isAvailable());
  }

  getCurrentWallet(): WalletProvider | null {
    return this.activeProvider;
  }

  isConnected(): boolean {
    return this.activeProvider?.isConnected() ?? false;
  }

  getConnectedAddress(): string | null {
    const publicKey = this.activeProvider?.getPublicKey();
    return publicKey ? publicKey.toString() : null;
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.activeProvider) {
      throw new WalletError('No wallet connected', 'NOT_CONNECTED');
    }

    return await this.activeProvider.signTransaction(transaction);
  }

  // Event handling
  onWalletEvent(callback: (event: WalletEvent) => void): () => void {
    this.eventCallbacks.add(callback);
    return () => this.eventCallbacks.delete(callback);
  }

  private emitEvent(event: WalletEvent) {
    for (const callback of this.eventCallbacks) {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in wallet event callback:', error);
      }
    }
  }
}

// Wallet event types
export type WalletEvent =
  | { type: 'connecting'; providerId: string }
  | { type: 'connected'; providerId: string; wallet: { address: string; publicKey: PublicKey; provider: WalletProvider } }
  | { type: 'disconnected'; providerId: string }
  | { type: 'error'; error: string; providerId?: string };

// Export default instance
export const multiWalletService = new MultiWalletService();