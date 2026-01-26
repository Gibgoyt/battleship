/**
 * MetaMask Solana Integration Utilities
 *
 * Specialized utilities for MetaMask's Solana support including:
 * - MetaMask detection and capability checking
 * - Enhanced error handling for MetaMask-specific scenarios
 * - Network management and switching prompts
 * - MetaMask-specific transaction optimization
 */

import { PublicKey, Transaction, Connection } from '@solana/web3.js';

// MetaMask Solana capability detection
export interface MetaMaskSolanaCapabilities {
  isAvailable: boolean;
  hasMetaMask: boolean;
  hasSolanaSupport: boolean;
  version?: string;
  supportedFeatures: string[];
}

// MetaMask Solana provider extended interface
export interface MetaMaskSolanaProvider {
  // Core connection methods
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
  disconnect?(): Promise<void>;

  // Transaction signing
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions?(transactions: Transaction[]): Promise<Transaction[]>;

  // State properties
  publicKey?: { toString(): string };
  isConnected?: boolean;

  // Events (if supported)
  on?(event: string, callback: (...args: any[]) => void): void;
  removeListener?(event: string, callback: (...args: any[]) => void): void;
}

export interface MetaMaskEthereum {
  isMetaMask?: boolean;
  version?: string;
  solana?: MetaMaskSolanaProvider;

  // MetaMask-specific methods
  request?(args: { method: string; params?: any }): Promise<any>;
}

// Note: Window.ethereum interface is declared in wallet-providers.ts

// MetaMask-specific error codes and messages
export const METAMASK_ERROR_CODES = {
  // Connection errors
  USER_REJECTED_CONNECTION: 'user_rejected_connection',
  ALREADY_PENDING_CONNECTION: 'already_pending_connection',
  NO_SOLANA_SUPPORT: 'no_solana_support',
  OUTDATED_VERSION: 'outdated_version',

  // Wallet Standard specific errors
  NO_WALLET_STANDARD: 'no_wallet_standard_support',
  NO_SOLANA_ACCOUNTS: 'no_solana_accounts',
  SOLANA_FEATURES_MISSING: 'solana_features_missing',
  WALLET_STANDARD_CONNECTION_FAILED: 'wallet_standard_connection_failed',

  // Transaction errors
  USER_REJECTED_TRANSACTION: 'user_rejected_transaction',
  TRANSACTION_TOO_LARGE: 'transaction_too_large',
  INSUFFICIENT_FUNDS: 'insufficient_funds',

  // Network errors
  NETWORK_ERROR: 'network_error',
  RPC_ERROR: 'rpc_error',
  TIMEOUT: 'timeout',
} as const;

export const METAMASK_ERROR_MESSAGES = {
  [METAMASK_ERROR_CODES.USER_REJECTED_CONNECTION]: 'User rejected the connection request',
  [METAMASK_ERROR_CODES.ALREADY_PENDING_CONNECTION]: 'Another connection request is already pending',
  [METAMASK_ERROR_CODES.NO_SOLANA_SUPPORT]: 'This version of MetaMask does not support Solana',
  [METAMASK_ERROR_CODES.OUTDATED_VERSION]: 'Please update MetaMask to the latest version for Solana support',
  
  // Wallet Standard specific messages
  [METAMASK_ERROR_CODES.NO_WALLET_STANDARD]: 'Wallet Standard API not available. Please update MetaMask to the latest version.',
  [METAMASK_ERROR_CODES.NO_SOLANA_ACCOUNTS]: 'Your MetaMask wallet needs a Solana account to use this application. Please create a Solana account in MetaMask and try again.',
  [METAMASK_ERROR_CODES.SOLANA_FEATURES_MISSING]: 'MetaMask is missing required Solana features. Please update to the latest version.',
  [METAMASK_ERROR_CODES.WALLET_STANDARD_CONNECTION_FAILED]: 'Unable to connect using Wallet Standard. Please try refreshing the page or updating MetaMask.',
  
  [METAMASK_ERROR_CODES.USER_REJECTED_TRANSACTION]: 'User rejected the transaction',
  [METAMASK_ERROR_CODES.TRANSACTION_TOO_LARGE]: 'Transaction size exceeds MetaMask limits',
  [METAMASK_ERROR_CODES.INSUFFICIENT_FUNDS]: 'Insufficient funds to complete the transaction',
  [METAMASK_ERROR_CODES.NETWORK_ERROR]: 'Network connection error',
  [METAMASK_ERROR_CODES.RPC_ERROR]: 'RPC request failed',
  [METAMASK_ERROR_CODES.TIMEOUT]: 'Request timed out',
} as const;

// MetaMask-specific error class
export class MetaMaskError extends Error {
  constructor(
    public code: string,
    message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'MetaMaskError';
  }

  static fromError(error: any): MetaMaskError {
    // MetaMask specific error handling
    if (error?.code === 4001) {
      return new MetaMaskError(
        METAMASK_ERROR_CODES.USER_REJECTED_CONNECTION,
        METAMASK_ERROR_MESSAGES[METAMASK_ERROR_CODES.USER_REJECTED_CONNECTION],
        error
      );
    }

    if (error?.code === -32002) {
      return new MetaMaskError(
        METAMASK_ERROR_CODES.ALREADY_PENDING_CONNECTION,
        METAMASK_ERROR_MESSAGES[METAMASK_ERROR_CODES.ALREADY_PENDING_CONNECTION],
        error
      );
    }

    // Network timeout
    if (error?.message?.includes('timeout') || error?.code === 'TIMEOUT') {
      return new MetaMaskError(
        METAMASK_ERROR_CODES.TIMEOUT,
        METAMASK_ERROR_MESSAGES[METAMASK_ERROR_CODES.TIMEOUT],
        error
      );
    }

    // Generic error fallback
    return new MetaMaskError(
      METAMASK_ERROR_CODES.NETWORK_ERROR,
      error?.message || 'Unknown MetaMask error',
      error
    );
  }
}

// MetaMask detection and capability checking
export class MetaMaskDetector {
  /**
   * Check if MetaMask is available and supports Solana
   */
  static async detectCapabilities(): Promise<MetaMaskSolanaCapabilities> {
    const capabilities: MetaMaskSolanaCapabilities = {
      isAvailable: false,
      hasMetaMask: false,
      hasSolanaSupport: false,
      supportedFeatures: []
    };

    // Check if running in browser
    if (typeof window === 'undefined') {
      console.log('[MetaMaskDetector] ❌ Not running in browser environment');
      return capabilities;
    }

    console.log('[MetaMaskDetector] 🔍 Detecting MetaMask capabilities...');

    // Check for MetaMask
    const ethereum = window.ethereum as MetaMaskEthereum | undefined;
    console.log('[MetaMaskDetector] 🔍 Ethereum object:', {
      exists: !!ethereum,
      isMetaMask: ethereum?.isMetaMask,
      version: ethereum?.version,
      hasRequest: !!ethereum?.request,
      hasSolana: !!ethereum?.solana
    });

    if (!ethereum?.isMetaMask) {
      console.log('[MetaMaskDetector] ❌ MetaMask not detected');
      return capabilities;
    }

    capabilities.hasMetaMask = true;
    capabilities.version = ethereum.version;
    console.log('[MetaMaskDetector] ✅ MetaMask detected, version:', capabilities.version);

    // Check for direct Solana support
    if (ethereum.solana) {
      console.log('[MetaMaskDetector] ✅ Direct Solana support detected');
      capabilities.hasSolanaSupport = true;
      capabilities.isAvailable = true;

      // Check supported features
      const solanaProvider = ethereum.solana;
      if (typeof solanaProvider.connect === 'function') capabilities.supportedFeatures.push('connect');
      if (typeof solanaProvider.signTransaction === 'function') capabilities.supportedFeatures.push('signTransaction');
      if (typeof solanaProvider.signAllTransactions === 'function') capabilities.supportedFeatures.push('signAllTransactions');
      if (typeof solanaProvider.disconnect === 'function') capabilities.supportedFeatures.push('disconnect');
    }

    // Check for Snap support (even if direct Solana isn't available)
    if (ethereum.request) {
      console.log('[MetaMaskDetector] ✅ MetaMask request method available (Snap support)');
      capabilities.supportedFeatures.push('snaps');
      
      // If we don't have direct Solana, we can still use Snaps
      if (!capabilities.hasSolanaSupport) {
        console.log('[MetaMaskDetector] ℹ️ No direct Solana, but Snaps available');
        capabilities.hasSolanaSupport = true;
        capabilities.isAvailable = true;
      }
    }

    // Check Wallet Standard support
    if (window.navigator && (window.navigator as any).wallets) {
      try {
        const wallets = (window.navigator as any).wallets.getWallets();
        const metaMaskWallet = wallets.find((wallet: any) => 
          wallet.name.toLowerCase().includes('metamask') && 
          wallet.chains && wallet.chains.some((chain: any) => chain.includes('solana'))
        );
        if (metaMaskWallet) {
          console.log('[MetaMaskDetector] ✅ MetaMask found via Wallet Standard');
          capabilities.supportedFeatures.push('walletStandard');
          capabilities.hasSolanaSupport = true;
          capabilities.isAvailable = true;
        }
      } catch (error) {
        console.log('[MetaMaskDetector] ℹ️ Wallet Standard not available:', error);
      }
    }

    console.log('[MetaMaskDetector] 📋 Final capabilities:', capabilities);
    return capabilities;
  }

  /**
   * Wait for MetaMask to be available (with timeout)
   */
  static async waitForMetaMask(timeout: number = 3000): Promise<boolean> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const checkMetaMask = () => {
        if (window.ethereum?.isMetaMask && window.ethereum?.solana) {
          resolve(true);
          return;
        }

        if (Date.now() - startTime > timeout) {
          resolve(false);
          return;
        }

        setTimeout(checkMetaMask, 100);
      };

      checkMetaMask();
    });
  }

  /**
   * Check if MetaMask needs to be updated for Solana support
   */
  static needsUpdate(): boolean {
    const ethereum = window.ethereum;
    return !!(ethereum?.isMetaMask && !ethereum?.solana);
  }
}

// Enhanced MetaMask Solana connection manager
export class MetaMaskSolanaConnection {
  private provider: MetaMaskSolanaProvider | null = null;
  private publicKey: PublicKey | null = null;
  private isConnecting = false;

  constructor() {
    this.provider = window.ethereum?.solana || null;
  }

  /**
   * Connect to MetaMask with enhanced error handling
   */
  async connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: PublicKey }> {
    if (this.isConnecting) {
      throw new MetaMaskError(
        METAMASK_ERROR_CODES.ALREADY_PENDING_CONNECTION,
        METAMASK_ERROR_MESSAGES[METAMASK_ERROR_CODES.ALREADY_PENDING_CONNECTION]
      );
    }

    const capabilities = await MetaMaskDetector.detectCapabilities();

    if (!capabilities.isAvailable) {
      if (!capabilities.hasMetaMask) {
        throw new MetaMaskError(
          METAMASK_ERROR_CODES.NO_SOLANA_SUPPORT,
          'MetaMask is not installed. Please install MetaMask from metamask.io'
        );
      } else if (!capabilities.hasSolanaSupport) {
        throw new MetaMaskError(
          METAMASK_ERROR_CODES.OUTDATED_VERSION,
          METAMASK_ERROR_MESSAGES[METAMASK_ERROR_CODES.OUTDATED_VERSION]
        );
      }
    }

    this.isConnecting = true;

    try {
      const response = await this.provider!.connect(options);
      this.publicKey = new PublicKey(response.publicKey.toString());

      return { publicKey: this.publicKey };
    } catch (error) {
      throw MetaMaskError.fromError(error);
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Sign transaction with MetaMask-specific optimizations
   */
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.provider || !this.publicKey) {
      throw new MetaMaskError(
        METAMASK_ERROR_CODES.USER_REJECTED_CONNECTION,
        'Wallet not connected'
      );
    }

    try {
      // Validate transaction size (MetaMask may have limits)
      const serializedSize = transaction.serialize().length;
      if (serializedSize > 1232) { // Standard Solana transaction limit
        throw new MetaMaskError(
          METAMASK_ERROR_CODES.TRANSACTION_TOO_LARGE,
          `Transaction size (${serializedSize} bytes) exceeds limits`
        );
      }

      return await this.provider.signTransaction(transaction);
    } catch (error) {
      throw MetaMaskError.fromError(error);
    }
  }

  /**
   * Disconnect from MetaMask
   */
  async disconnect(): Promise<void> {
    if (this.provider?.disconnect) {
      try {
        await this.provider.disconnect();
      } catch (error) {
        console.warn('Error disconnecting MetaMask:', error);
      }
    }
    this.publicKey = null;
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return !!(this.provider?.isConnected && this.publicKey);
  }

  /**
   * Get current public key
   */
  getPublicKey(): PublicKey | null {
    return this.publicKey;
  }

  /**
   * Setup event listeners (if MetaMask supports them)
   */
  setupEventListeners(callbacks: {
    onAccountChanged?: (accounts: string[]) => void;
    onDisconnect?: () => void;
  }) {
    if (!this.provider?.on) return;

    if (callbacks.onAccountChanged) {
      this.provider.on('accountsChanged', callbacks.onAccountChanged);
    }

    if (callbacks.onDisconnect) {
      this.provider.on('disconnect', callbacks.onDisconnect);
    }
  }

  /**
   * Remove event listeners
   */
  removeEventListeners(callbacks: {
    onAccountChanged?: (accounts: string[]) => void;
    onDisconnect?: () => void;
  }) {
    if (!this.provider?.removeListener) return;

    if (callbacks.onAccountChanged) {
      this.provider.removeListener('accountsChanged', callbacks.onAccountChanged);
    }

    if (callbacks.onDisconnect) {
      this.provider.removeListener('disconnect', callbacks.onDisconnect);
    }
  }
}

// Debug utility for MetaMask investigation
export class MetaMaskDebugUtils {
  /**
   * Comprehensive debugging of MetaMask availability and capabilities
   */
  static debugMetaMaskEnvironment(): void {
    console.log('🔍 === MetaMask Environment Debug ===');
    
    if (typeof window === 'undefined') {
      console.log('❌ Not in browser environment');
      return;
    }

    // Check window.ethereum
    console.log('🔍 window.ethereum:', {
      exists: !!window.ethereum,
      isMetaMask: window.ethereum?.isMetaMask,
      version: (window.ethereum as any)?.version,
      hasRequest: !!(window.ethereum as any)?.request,
      hasSolana: !!(window.ethereum as any)?.solana,
      keys: window.ethereum ? Object.keys(window.ethereum) : []
    });

    // Check for multiple providers
    if (window.ethereum && (window.ethereum as any).providers) {
      console.log('🔍 Multiple providers detected:', (window.ethereum as any).providers);
    }

    // Check window.solana (Phantom)
    console.log('🔍 window.solana:', {
      exists: !!(window as any).solana,
      isPhantom: (window as any).solana?.isPhantom,
      keys: (window as any).solana ? Object.keys((window as any).solana) : []
    });

    // Check Wallet Standard
    console.log('🔍 Wallet Standard:', {
      exists: !!(window.navigator as any)?.wallets,
      walletsCount: (window.navigator as any)?.wallets?.getWallets?.()?.length || 0
    });

    // Try to get all available objects
    console.log('🔍 All window wallet objects:', {
      ethereum: !!window.ethereum,
      solana: !!(window as any).solana,
      phantom: !!(window as any).phantom,
      metamask: !!(window as any).metamask,
      web3: !!(window as any).web3
    });

    console.log('🔍 === End Debug ===');
  }

  /**
   * Test MetaMask connectivity
   */
  static async testMetaMaskConnectivity(): Promise<void> {
    console.log('🧪 === Testing MetaMask Connectivity ===');
    
    const ethereum = window.ethereum as MetaMaskEthereum | undefined;
    
    if (!ethereum?.isMetaMask) {
      console.log('❌ MetaMask not available');
      return;
    }

    console.log('✅ MetaMask detected');

    // Test basic connectivity
    if (ethereum.request) {
      try {
        console.log('🧪 Testing eth_accounts...');
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        console.log('✅ eth_accounts result:', accounts);
      } catch (error) {
        console.log('❌ eth_accounts failed:', error);
      }

      try {
        console.log('🧪 Testing eth_chainId...');
        const chainId = await ethereum.request({ method: 'eth_chainId' });
        console.log('✅ eth_chainId result:', chainId);
      } catch (error) {
        console.log('❌ eth_chainId failed:', error);
      }

      // Test Snap capabilities
      try {
        console.log('🧪 Testing wallet_getSnaps...');
        const snaps = await ethereum.request({ method: 'wallet_getSnaps' });
        console.log('✅ wallet_getSnaps result:', snaps);
      } catch (error) {
        console.log('❌ wallet_getSnaps failed:', error);
      }
    }

    console.log('🧪 === End Connectivity Test ===');
  }
}

// Utility functions for MetaMask integration
export class MetaMaskUtils {
  /**
   * Get user-friendly error message for MetaMask errors
   */
  static getErrorMessage(error: any): string {
    if (error instanceof MetaMaskError) {
      return error.message;
    }

    // Handle common MetaMask error codes
    switch (error?.code) {
      case 4001:
        return METAMASK_ERROR_MESSAGES[METAMASK_ERROR_CODES.USER_REJECTED_CONNECTION];
      case -32002:
        return METAMASK_ERROR_MESSAGES[METAMASK_ERROR_CODES.ALREADY_PENDING_CONNECTION];
      case -32603:
        return 'Internal MetaMask error. Please try again.';
      default:
        return error?.message || 'Unknown error occurred';
    }
  }

  /**
   * Generate installation/update prompts for users
   */
  static getInstallationPrompt(): string {
    const capabilities = MetaMaskDetector.detectCapabilities();

    if (!capabilities) {
      return 'MetaMask is not installed. Please install MetaMask from metamask.io and refresh the page.';
    }

    return 'MetaMask detected but Solana support is not available. Please update MetaMask to the latest version.';
  }

  /**
   * Format wallet addresses for display
   */
  static formatAddress(address: string, length: number = 8): string {
    if (address.length <= length * 2) return address;
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  }

  /**
   * Validate Solana network compatibility
   */
  static async validateNetwork(connection: Connection): Promise<boolean> {
    try {
      const genesisHash = await connection.getGenesisHash();
      // Add network validation logic here if needed
      return true;
    } catch (error) {
      console.warn('Network validation failed:', error);
      return false;
    }
  }
}

// Export default connection instance
export const metaMaskSolana = new MetaMaskSolanaConnection();