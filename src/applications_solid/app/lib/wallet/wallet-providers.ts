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
import { iOSPhantomAuthManager } from './ios-phantom-auth-manager';

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

// MetaMask Ethereum provider interface (window.ethereum)
export interface MetaMaskEthereumProvider {
  isMetaMask?: boolean;
  version?: string;
  request?(args: { method: string; params?: any }): Promise<any>;
  solana?: {
    connect(): Promise<{ publicKey: { toString(): string } }>;
    signTransaction(transaction: Transaction): Promise<Transaction>;
    signAllTransactions?(transactions: Transaction[]): Promise<Transaction[]>;
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
    const deviceInfo = getDeviceInfo();
    const isIOS = deviceInfo.platform === 'iOS';
    const isPhantomApp = deviceInfo.isPhantomApp;

    console.log('[Phantom] Starting enhanced connection...', { isIOS, isPhantomApp });

    // Use enhanced iOS authorization manager for iOS Phantom app
    if (isIOS && isPhantomApp) {
      console.log('[Phantom] 🚀 Using enhanced iOS authorization flow');
      
      const authManager = new iOSPhantomAuthManager(provider);
      
      try {
        // Record user gesture for iOS validation
        authManager.recordUserGesture();
        
        // Attempt connection with iOS-specific handling
        const result = await authManager.connect({
          timeout: 30000,
          retryAttempts: 3,
          requireUserGesture: true,
          clearStateFirst: true,
          onlyIfTrusted: false
        });

        if (result.success && result.publicKey) {
          this.publicKey = new PublicKey(result.publicKey.toString());
          console.log('[Phantom] ✅ iOS authorization successful');
          return { publicKey: this.publicKey };
        } else {
          // Enhanced error handling with recovery steps
          const errorMessage = result.error?.message || 'Authorization failed';
          console.log('[Phantom] iOS authorization failed:', errorMessage);
          
          if (result.recoverySteps && result.recoverySteps.length > 0) {
            console.log('[Phantom] Recovery steps:', result.recoverySteps);
            
            // Create enhanced error with recovery information
            const enhancedError = new WalletError(
              errorMessage,
              'IOS_AUTHORIZATION_FAILED',
              'Phantom'
            );
            
            // Add recovery information to error (if supported)
            (enhancedError as any).recoverySteps = result.recoverySteps;
            (enhancedError as any).retryable = result.retryable;
            
            throw enhancedError;
          } else {
            throw new WalletError(errorMessage, 'IOS_AUTHORIZATION_FAILED', 'Phantom');
          }
        }
      } finally {
        authManager.destroy();
      }
    }

    // Fallback to standard connection flow for non-iOS or non-Phantom-app scenarios
    try {
      console.log('[Phantom] Using standard connection flow...');

      // Ensure clean state by disconnecting first
      try {
        await this.provider.disconnect();
      } catch (e) {
        // Ignore disconnect errors
        console.log('[Phantom] Ignoring disconnect error:', e);
      }

      // Clear local state
      this.publicKey = null;

      // Connect to Phantom with standard flow
      console.log('[Phantom] Requesting connection (popup will appear if not already trusted)...');
      const response = await this.provider.connect({ onlyIfTrusted: false });
      
      this.publicKey = new PublicKey(response.publicKey.toString());
      console.log('[Phantom] ✅ Standard connection established');
      
      return { publicKey: this.publicKey };
    } catch (error) {
      // Clear state on error
      this.publicKey = null;
      console.log('[Phantom] Standard connection failed with error:', error);

      // Enhanced error handling for better user feedback
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = (error as any)?.code;

      if (errorCode === 4001 || errorMessage.includes('rejected') || errorMessage.includes('cancelled')) {
        console.log('[Phantom] User cancelled connection request');
        throw new WalletError('User cancelled connection request', 'USER_REJECTED', 'Phantom');
      } else if (errorCode === 4100 || errorMessage.includes('unauthorized') || errorMessage.includes('not been authorized')) {
        console.log('[Phantom] App not authorized by user');
        
        // iOS-specific authorization error message
        if (isIOS && isPhantomApp) {
          throw new WalletError('Authorization required. Please try connecting again or refresh the Phantom app.', 'IOS_AUTHORIZATION_REQUIRED', 'Phantom');
        } else {
          throw new WalletError('App not authorized. Please try connecting again.', 'UNAUTHORIZED', 'Phantom');
        }
      } else if (errorMessage.includes('popup') || errorMessage.includes('blocked')) {
        console.log('[Phantom] Popup blocked or failed');
        throw new WalletError('Popup blocked. Please allow popups for this site and try again.', 'POPUP_BLOCKED', 'Phantom');
      } else if (errorMessage.includes('timeout') || errorMessage.includes('Connection timeout')) {
        console.log('[Phantom] Connection timeout');
        
        // iOS-specific timeout message
        if (isIOS && isPhantomApp) {
          throw new WalletError('Connection timeout. Please refresh the Phantom app and try again.', 'IOS_CONNECTION_TIMEOUT', 'Phantom');
        } else {
          throw new WalletError('Connection timeout. Please try again.', 'CONNECTION_TIMEOUT', 'Phantom');
        }
      } else {
        console.error('[Phantom] Unexpected connection error:', error);
        
        // iOS-specific generic error message
        if (isIOS && isPhantomApp) {
          throw new WalletError('Connection failed. Please refresh the Phantom app and try again.', 'IOS_CONNECTION_ERROR', 'Phantom');
        } else {
          throw new WalletConnectionError('Phantom', error);
        }
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
    if (typeof window === 'undefined') {
      return false;
    }

    // Method 1: Check for MetaMask with direct Solana support (legacy/future)
    if (this.provider?.isMetaMask && this.provider?.solana) {
      console.log('[MetaMaskSolanaProvider] 🟢 Detected direct Solana support');
      return true;
    }

    // Method 2: Check for MetaMask with request capability (for Snaps)
    if (this.provider?.isMetaMask && this.provider?.request) {
      console.log('[MetaMaskSolanaProvider] 🟢 Detected MetaMask with Snaps capability');
      return true;
    }

    // Method 3: Check Wallet Standard registry for MetaMask
    if (window.navigator && (window.navigator as any).wallets) {
      try {
        const wallets = (window.navigator as any).wallets.getWallets();
        const metaMaskWallet = wallets.find((wallet: any) => 
          wallet.name.toLowerCase().includes('metamask') && 
          wallet.chains.some((chain: any) => chain.includes('solana'))
        );
        if (metaMaskWallet) {
          console.log('[MetaMaskSolanaProvider] 🟢 Detected via Wallet Standard');
          return true;
        }
      } catch (error) {
        // Wallet Standard not available, continue
      }
    }

    console.log('[MetaMaskSolanaProvider] 🔴 No MetaMask Solana support detected');
    return false;
  }

  async connect(): Promise<{ publicKey: PublicKey }> {
    if (!this.isAvailable()) {
      throw new WalletNotFoundError('MetaMask');
    }

    console.log('[MetaMaskSolanaProvider] 🔄 Attempting to connect...');

    try {
      // Method 1: Try direct Solana connection (if available)
      if (this.provider?.solana) {
        console.log('[MetaMaskSolanaProvider] 🟢 Using direct Solana connection');
        const response = await this.provider.solana.connect();
        this.publicKey = new PublicKey(response.publicKey.toString());
        console.log('[MetaMaskSolanaProvider] ✅ Connected with public key:', this.publicKey.toString());
        return { publicKey: this.publicKey };
      }

      // Method 2: Try multiple alternative connection methods
      if (this.provider?.request) {
        console.log('[MetaMaskSolanaProvider] 🔄 Attempting Drift Labs Snap connection');
        
        // Method 2a: Try Snap-based connection (Primary)
        try {
          const snapId = 'npm:@drift-labs/snap-solana';
          const snapVersion = '0.3.0';
          
          // Check if Snap is already installed
          console.log('[MetaMaskSolanaProvider] 🔄 Checking for existing Drift Labs Snap installation...');
          let installedSnaps;
          try {
            installedSnaps = await this.provider.request({
              method: 'wallet_getSnaps'
            }) as Record<string, any>;
          } catch (getSnapError) {
            console.warn('[MetaMaskSolanaProvider] Could not check installed snaps:', getSnapError);
            installedSnaps = {};
          }

          // Install or update Snap if needed
          if (!installedSnaps[snapId] || installedSnaps[snapId]?.version !== snapVersion) {
            console.log('[MetaMaskSolanaProvider] 🔄 Installing/updating Drift Labs Snap to version', snapVersion);
            const snapParams: Record<string, any> = {};
            snapParams[snapId] = { version: snapVersion };
            
            await this.provider.request({
              method: 'wallet_requestSnaps',
              params: snapParams
            });
            console.log('[MetaMaskSolanaProvider] ✅ Drift Labs Snap installed/updated successfully');
          } else {
            console.log('[MetaMaskSolanaProvider] ✅ Drift Labs Snap already installed with correct version');
          }

          // Get public key via Drift Labs Snap
          console.log('[MetaMaskSolanaProvider] 🔄 Getting public key via Drift Labs Snap');
          const publicKeyString = await this.provider.request({
            method: 'wallet_invokeSnap',
            params: {
              snapId,
              request: {
                method: 'getPublicKey'
              }
            }
          });

          if (publicKeyString) {
            this.publicKey = new PublicKey(publicKeyString);
            console.log('[MetaMaskSolanaProvider] ✅ Connected via Drift Labs Snap with public key:', this.publicKey.toString());
            return { publicKey: this.publicKey };
          }
        } catch (snapError) {
          console.warn('[MetaMaskSolanaProvider] ⚠️ Snap connection failed:', snapError);
        }

        // Method 2c: Try Wallet Standard
        try {
          if (window.navigator && (window.navigator as any).wallets) {
            console.log('[MetaMaskSolanaProvider] 🔄 Attempting Wallet Standard connection');
            const wallets = (window.navigator as any).wallets.getWallets();
            const metaMaskWallet = wallets.find((wallet: any) => 
              wallet.name.toLowerCase().includes('metamask')
            );
            
            if (metaMaskWallet) {
              console.log('[MetaMaskSolanaProvider] ✅ Found MetaMask via Wallet Standard:', metaMaskWallet);
              // Additional implementation would go here for Wallet Standard connection
            }
          }
        } catch (walletStandardError) {
          console.warn('[MetaMaskSolanaProvider] ⚠️ Wallet Standard failed:', walletStandardError);
        }

        // Final fallback - inform user about the status
        throw new WalletConnectionError('MetaMask', 
          'MetaMask detected but Drift Labs Snap connection failed. Please install the Drift Labs Snap.');
      }

      throw new WalletConnectionError('MetaMask', 'No supported connection method available');
    } catch (error) {
      console.error('[MetaMaskSolanaProvider] ❌ Connection failed:', error);
      throw new WalletConnectionError('MetaMask', error);
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.isConnected()) {
      throw new WalletError('Wallet not connected', 'NOT_CONNECTED', 'MetaMask');
    }

    console.log('[MetaMaskSolanaProvider] 🔄 Signing transaction...');

    try {
      // Method 1: Try direct Solana signing (if available)
      if (this.provider?.solana) {
        console.log('[MetaMaskSolanaProvider] 🟢 Using direct Solana signing');
        const signedTx = await this.provider.solana.signTransaction(transaction);
        console.log('[MetaMaskSolanaProvider] ✅ Transaction signed via direct method');
        return signedTx;
      }

      // Method 2: Try Snap-based signing
      if (this.provider?.request) {
        console.log('[MetaMaskSolanaProvider] 🔄 Attempting Snap-based signing');
        
        const snapId = 'npm:@drift-labs/snap-solana';
        
        // First, ensure we have the necessary permissions
        try {
          console.log('[MetaMaskSolanaProvider] 🔄 Requesting Drift Labs Snap installation/permissions...');
          const snapParams: Record<string, any> = {};
          snapParams[snapId] = { version: '0.3.0' };
          
          await this.provider.request({
            method: 'wallet_requestSnaps',
            params: snapParams
          });
          
          console.log('[MetaMaskSolanaProvider] ✅ Snap permissions granted');
        } catch (permError) {
          console.warn('[MetaMaskSolanaProvider] ⚠️ Permission request failed:', permError);
          // Continue anyway - permissions might already be granted
        }
        
        // Serialize transaction for MetaMask Snap
        const serializedTx = transaction.serialize({
          requireAllSignatures: false,
          verifySignatures: false
        });
        
        const signedTxData = await this.provider.request({
          method: 'wallet_invokeSnap',
          params: {
            snapId,
            request: {
              method: 'signTransaction',
              params: {
                transaction: serializedTx,
                isVersionedTransaction: false,
                serializeConfig: {
                  requireAllSignatures: false,
                  verifySignatures: false
                }
              }
            }
          }
        });

        // Reconstruct signed transaction (Drift Labs format)
        const signedTransaction = Transaction.from(
          Buffer.from(signedTxData.transaction.data)
        );
        
        console.log('[MetaMaskSolanaProvider] ✅ Transaction signed via Snap');
        return signedTransaction;
      }

      throw new WalletSigningError('MetaMask', 'No supported signing method available');
    } catch (error) {
      console.error('[MetaMaskSolanaProvider] ❌ Transaction signing failed:', error);
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
    // Check if we have a public key (primary indicator)
    if (!this.publicKey) {
      return false;
    }

    // If we have direct Solana support, check its connection status
    if (this.provider?.solana?.isConnected !== undefined) {
      return this.provider.solana.isConnected;
    }

    // If we have a public key but no direct Solana connection status, 
    // assume connected (for Snap-based or test connections)
    return true;
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
    
    // DEBUG: Log routing decision
    console.log("[WalletProviderFactory] 🐛 DEBUG - createPhantomProvider called");
    console.log("[WalletProviderFactory] 🐛 DEBUG - Device info:", deviceInfo);
    console.log("[WalletProviderFactory] 🐛 DEBUG - isPhantomApp:", deviceInfo.isPhantomApp);
    console.log("[WalletProviderFactory] 🐛 DEBUG - requiresDeepLinks:", deviceInfo.requiresDeepLinks);
    
    // CRITICAL: Check if user is already INSIDE Phantom app
    // If so, use the native provider instead of deep links
    if (typeof window !== 'undefined' && (window as any).phantom?.solana) {
      console.log("[WalletProviderFactory] 🐛 DEBUG - ✅ Using PhantomWalletProvider (ALREADY INSIDE Phantom app - native provider available)");
      return new PhantomWalletProvider();
    }
    
    // If user is on mobile but NOT in Phantom app, use deep links to open Phantom
    if (deviceInfo.requiresDeepLinks) {
      console.log("[WalletProviderFactory] 🐛 DEBUG - ✅ Using PhantomMobileProvider (mobile browser - deep links needed)");
      return new PhantomMobileProvider();
    }
    
    // Use standard browser extension provider for desktop
    console.log("[WalletProviderFactory] 🐛 DEBUG - ✅ Using PhantomWalletProvider (desktop/extension)");
    return new PhantomWalletProvider();
  }

  static createProvider(id: string): WalletProvider | null {
    const factory = this.providers.get(id);
    return factory ? factory() : null;
  }

  static getAvailableProviders(): WalletProvider[] {
    const deviceInfo = getDeviceInfo();
    const providers: WalletProvider[] = [];
    
    // DEBUG: Log device info
    console.log("[WalletProviderFactory] 🐛 DEBUG - getAvailableProviders called");
    console.log("[WalletProviderFactory] 🐛 DEBUG - Device Info:", deviceInfo);
    
    // DEBUG: Run comprehensive MetaMask debug
    if (typeof window !== 'undefined' && window.ethereum?.isMetaMask) {
      console.log("[WalletProviderFactory] 🐛 DEBUG - Running MetaMask environment debug:");
      console.log("[WalletProviderFactory] 🐛 DEBUG - window.ethereum keys:", Object.keys(window.ethereum || {}));
      console.log("[WalletProviderFactory] 🐛 DEBUG - MetaMask version:", (window.ethereum as any)?.version);
      console.log("[WalletProviderFactory] 🐛 DEBUG - Has request method:", !!(window.ethereum as any)?.request);
      console.log("[WalletProviderFactory] 🐛 DEBUG - Has solana object:", !!(window.ethereum as any)?.solana);
      console.log("[WalletProviderFactory] 🐛 DEBUG - Solana object details:", (window.ethereum as any)?.solana);
    }

    for (const [id, factory] of this.providers) {
      try {
        console.log(`[WalletProviderFactory] 🐛 DEBUG - Creating provider: ${id}`);
        const provider = factory();
        console.log(`[WalletProviderFactory] 🐛 DEBUG - Provider created:`, {
          id: provider.id,
          name: provider.name,
          constructor: provider.constructor.name,
          isAvailable: provider.isAvailable()
        });
        
        // Special handling for mobile-only providers
        if (provider.id === 'phantom-mobile' && !deviceInfo.requiresDeepLinks) {
          console.log(`[WalletProviderFactory] 🐛 DEBUG - ❌ Skipping phantom-mobile (not on mobile/no deep links needed)`);
          continue; // Skip mobile provider on desktop
        }
        
        // Special handling for desktop-only providers  
        if (provider.id === 'phantom' && provider.constructor.name === 'PhantomWalletProvider' && deviceInfo.requiresDeepLinks) {
          console.log(`[WalletProviderFactory] 🐛 DEBUG - ❌ Skipping phantom desktop (on mobile/deep links needed)`);
          continue; // Skip desktop provider on mobile
        }
        
        if (provider.isAvailable()) {
          console.log(`[WalletProviderFactory] 🐛 DEBUG - ✅ Adding available provider: ${provider.id}`);
          providers.push(provider);
        } else {
          console.log(`[WalletProviderFactory] 🐛 DEBUG - ❌ Provider not available: ${provider.id}`);
        }
      } catch (error) {
        console.warn(`Failed to create provider ${id}:`, error);
      }
    }

    console.log(`[WalletProviderFactory] 🐛 DEBUG - Final provider list:`, providers.map(p => ({ id: p.id, name: p.name })));

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
