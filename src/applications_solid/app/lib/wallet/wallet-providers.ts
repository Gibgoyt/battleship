/**
 * Multi-Wallet Provider Architecture for SPLITDO
 *
 * Provides abstract interfaces and concrete implementations for different wallet providers
 * Supports Phantom, MetaMask, and Wallet Standard wallets
 */

// Import browser polyfills FIRST to ensure Buffer is available
import './browser-polyfills';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getDeviceInfo } from './exchange-utils';
// Import PhantomMobileProvider statically to avoid require() issues
import { PhantomMobileProvider } from './phantom-mobile-provider';

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
    name: string;
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
    // 🚨 SECURITY FIX: Do NOT access provider in constructor
    // Accessing provider properties might trigger auto-connect behavior for trusted sites
    // We'll defer this to when user explicitly requests connection
  }

  /**
   * Helper to get the Phantom provider from window
   * Follows official docs: https://docs.phantom.app/solana/detecting-the-provider
   */
  private getProvider(): PhantomProvider | null {
    if (typeof window === 'undefined') return null;

    // 1. Check for window.phantom.solana (Recommended)
    if ('phantom' in window) {
      const provider = (window as any).phantom?.solana;
      if (provider?.isPhantom) {
        return provider;
      }
    }

    // 2. Fallback to window.solana (Legacy)
    const legacyProvider = window.solana;
    if (legacyProvider?.isPhantom) {
      return legacyProvider;
    }

    return null;
  }

  isAvailable(): boolean {
    return !!this.getProvider();
  }

  isConnected(): boolean {
    return !!this.provider?.isConnected && !!this.publicKey;
  }

  getPublicKey(): PublicKey | null {
    return this.publicKey;
  }

  async connect(): Promise<{ publicKey: PublicKey }> {
    const provider = this.getProvider();
    
    if (!provider) {
      throw new WalletNotFoundError('Phantom');
    }

    this.provider = provider;

    try {
      console.log('[Phantom] Starting fresh connection...');

      // Ensure clean state by disconnecting first
      // This handles cases where the wallet thinks it's connected but the app doesn't
      try {
        await this.provider.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }

      // Clear local state
      this.publicKey = null;

      // Connect to Phantom
      // NOTE: If the app is "Trusted" by Phantom, this will resolve immediately without a popup.
      // This is standard Phantom behavior and cannot be bypassed programmatically.
      // Passing { onlyIfTrusted: false } is the default behavior.
      console.log('[Phantom] Requesting connection (popup will appear if not already trusted)...');
      const response = await this.provider.connect();
      
      this.publicKey = new PublicKey(response.publicKey.toString());
      console.log('[Phantom] ✅ Connection established');
      
      return { publicKey: this.publicKey };
    } catch (error) {
      // Clear state on error
      this.publicKey = null;
      console.log('[Phantom] Connection failed with error:', error);

      // Enhanced error handling for better user feedback
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = (error as any)?.code;

      if (errorCode === 4001 || errorMessage.includes('rejected') || errorMessage.includes('cancelled')) {
        console.log('[Phantom] User cancelled connection request');
        throw new WalletError('User cancelled connection request', 'USER_REJECTED', 'Phantom');
      } else if (errorCode === 4100 || errorMessage.includes('unauthorized')) {
        console.log('[Phantom] App not authorized by user');
        throw new WalletError('App not authorized. Please try connecting again.', 'UNAUTHORIZED', 'Phantom');
      } else if (errorMessage.includes('popup') || errorMessage.includes('blocked')) {
        console.log('[Phantom] Popup blocked or failed');
        throw new WalletError('Popup blocked. Please allow popups for this site and try again.', 'POPUP_BLOCKED', 'Phantom');
      } else {
        console.error('[Phantom] Unexpected connection error:', error);
        throw new WalletConnectionError('Phantom', error);
      }
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.isConnected()) {
      throw new WalletError('Wallet not connected', 'NOT_CONNECTED', 'Phantom');
    }

    if (!this.provider) {
      // Try to re-acquire provider if missing but logically connected
      this.provider = this.getProvider();
    }

    if (!this.provider) {
      throw new WalletError('Phantom provider not available', 'PROVIDER_ERROR', 'Phantom');
    }

    try {
      return await this.provider.signTransaction(transaction);
    } catch (error) {
      throw new WalletSigningError('Phantom', error);
    }
  }

  async disconnect(): Promise<void> {
    console.log('[Phantom] 🔌 Disconnecting...');

    if (this.provider) {
      try {
        await this.provider.disconnect();
        console.log('[Phantom] ✅ Provider disconnected');
      } catch (error) {
        console.warn('[Phantom] Error disconnecting provider:', error);
      }
    }

    // Clear local state
    this.provider = null;
    this.publicKey = null;

    console.log('[Phantom] ✅ Disconnect completed');
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
      this.provider = window.ethereum || null;
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

// Wallet provider factory with smart device routing
export class WalletProviderFactory {
  private static providers: Map<string, () => WalletProvider> = new Map([
    ['phantom', () => WalletProviderFactory.createPhantomProvider()],
    ['metamask', () => new MetaMaskSolanaProvider()],
    // ['walletconnect', () => new WalletConnectProvider()], // Commented out to fix circular dependency
  ] as [string, () => WalletProvider][]);

  /**
   * Smart Phantom provider creation based on device capabilities
   */
  private static createPhantomProvider(): WalletProvider {
    const deviceInfo = getDeviceInfo();
    
    // Route to mobile deep link provider for iOS/Android Phantom app
    if (deviceInfo.requiresDeepLinks) {
      return new PhantomMobileProvider();
    }
    
    // Use standard browser extension provider for desktop
    return new PhantomWalletProvider();
  }

  static createProvider(id: string): WalletProvider | null {
    const factory = this.providers.get(id);
    return factory ? factory() : null;
  }

  static getAvailableProviders(): WalletProvider[] {
    const providers: WalletProvider[] = [];
    const deviceInfo = getDeviceInfo();

    for (const [id, factory] of this.providers) {
      try {
        const provider = factory();
        
        // Special handling for mobile-only providers
        if (provider.id === 'phantom-mobile' && !deviceInfo.requiresDeepLinks) {
          continue; // Skip mobile provider on desktop
        }
        
        // Special handling for desktop-only providers  
        if (provider.id === 'phantom' && provider.constructor.name === 'PhantomWalletProvider' && deviceInfo.requiresDeepLinks) {
          continue; // Skip desktop provider on mobile
        }
        
        if (provider.isAvailable()) {
          providers.push(provider);
        }
      } catch (error) {
        console.warn(`Failed to create provider ${id}:`, error);
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
        provider,
        name: provider.name
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
  | { type: 'connected'; providerId: string; wallet: { address: string; publicKey: PublicKey; provider: WalletProvider; name: string } }
  | { type: 'disconnected'; providerId: string }
  | { type: 'error'; error: string; providerId?: string };

// Export default instance
export const multiWalletService = new MultiWalletService();
