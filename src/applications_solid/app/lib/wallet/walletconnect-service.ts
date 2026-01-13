/**
 * Enhanced Multi-Wallet Service for SPLITDO
 * Supports Phantom, MetaMask, and Wallet Standard wallets
 */

// Import browser polyfills FIRST to ensure Buffer is available
import './browser-polyfills';
import { Transaction, PublicKey } from '@solana/web3.js';
import { ERROR_MESSAGES } from './walletconnect-config';
import {
  type WalletProvider,
  WalletProviderFactory,
  MultiWalletService,
  type WalletConnectionResult,
  type WalletEvent,
  PhantomWalletProvider,
  MetaMaskSolanaProvider
} from './wallet-providers';
import {
  walletStandardDiscovery,
  WalletStandardProvider,
  type WalletStandardWallet
} from './wallet-standard-adapter';
import { MetaMaskDetector, MetaMaskUtils } from './metamask-solana';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WalletInfo {
  address: string;
  name: string;
  provider: WalletProvider;
  publicKey: PublicKey;
}

export interface ConnectionState {
  status: ConnectionStatus;
  wallet: WalletInfo | null;
  error: string | null;
  isModalOpen: boolean;
  availableWallets: AvailableWallet[];
  connectedProviderId: string | null;
}

export interface AvailableWallet {
  id: string;
  name: string;
  icon: string;
  isAvailable: boolean;
  description?: string;
}

export interface TransactionResult {
  signature: string;
  success: boolean;
  error?: string;
}

export type SolanaWalletEventCallback = (state: ConnectionState) => void;

// Enhanced wallet service with multi-wallet support
export class EnhancedWalletService {
  private multiWalletService: MultiWalletService;
  private state: ConnectionState = {
    status: 'disconnected',
    wallet: null,
    error: null,
    isModalOpen: false,
    availableWallets: [],
    connectedProviderId: null
  };
  private eventCallbacks: Set<SolanaWalletEventCallback> = new Set();
  private walletEventUnsubscribe: (() => void) | null = null;

  constructor() {
    this.multiWalletService = new MultiWalletService();
    this.initializeWalletDiscovery();
    this.setupWalletEvents();
  }

  private async initializeWalletDiscovery() {
    // Discover available wallets
    await this.updateAvailableWallets();

    // Set up wallet standard discovery events
    if (walletStandardDiscovery.isSupported()) {
      walletStandardDiscovery.addEventListener(() => {
        this.updateAvailableWallets();
      });
    }
  }

  private async updateAvailableWallets() {
    const availableWallets: AvailableWallet[] = [];

    // Add built-in providers
    const builtinProviders = WalletProviderFactory.getAvailableProviders();
    for (const provider of builtinProviders) {
      availableWallets.push({
        id: provider.id,
        name: provider.name,
        icon: provider.icon,
        isAvailable: provider.isAvailable(),
        description: this.getWalletDescription(provider.id)
      });
    }

    // Add Wallet Standard wallets
    if (walletStandardDiscovery.isSupported()) {
      const standardProviders = walletStandardDiscovery.getWalletProviders();
      for (const provider of standardProviders) {
        availableWallets.push({
          id: provider.id,
          name: provider.name,
          icon: provider.icon,
          isAvailable: provider.isAvailable(),
          description: 'Wallet Standard compatible'
        });
      }
    }

    this.updateState({ availableWallets });
  }

  private getWalletDescription(providerId: string): string {
    switch (providerId) {
      case 'phantom':
        return 'Popular Solana wallet';
      case 'metamask':
        return 'Multi-chain wallet with Solana support';
      default:
        return 'Solana wallet';
    }
  }

  private setupWalletEvents() {
    this.walletEventUnsubscribe = this.multiWalletService.onWalletEvent((event: WalletEvent) => {
      switch (event.type) {
        case 'connecting':
          this.updateState({
            status: 'connecting',
            error: null,
            connectedProviderId: event.providerId
          });
          break;

        case 'connected':
          this.updateState({
            status: 'connected',
            wallet: {
              address: event.wallet.address,
              name: event.wallet.provider.name,
              provider: event.wallet.provider,
              publicKey: event.wallet.publicKey
            },
            error: null,
            connectedProviderId: event.providerId,
            isModalOpen: false
          });
          break;

        case 'disconnected':
          this.updateState({
            status: 'disconnected',
            wallet: null,
            error: null,
            connectedProviderId: null,
            isModalOpen: false
          });
          break;

        case 'error':
          this.updateState({
            status: 'error',
            error: event.error,
            connectedProviderId: null
          });
          break;
      }
    });
  }

  /**
   * Connect to a specific wallet provider
   */
  async connectWallet(providerId: string): Promise<WalletConnectionResult> {
    try {
      const result = await this.multiWalletService.connectWallet(providerId);

      if (!result.success && result.error) {
        // Enhance error messages for better UX
        const enhancedError = this.enhanceErrorMessage(providerId, result.error);
        this.updateState({ error: enhancedError });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const enhancedError = this.enhanceErrorMessage(providerId, errorMessage);
      this.updateState({
        status: 'error',
        error: enhancedError
      });
      throw error;
    }
  }

  /**
   * Backward compatibility: Connect to first available wallet (legacy)
   */
  async connect(): Promise<void> {
    const availableWallets = this.getAvailableWallets().filter(w => w.isAvailable);

    if (availableWallets.length === 0) {
      throw new Error('No wallets available');
    }

    // Prefer Phantom for backward compatibility, then MetaMask
    const preferredWallet = availableWallets.find(w => w.id === 'phantom') ||
                           availableWallets.find(w => w.id === 'metamask') ||
                           availableWallets[0];

    const result = await this.connectWallet(preferredWallet.id);
    if (!result.success) {
      throw new Error(result.error);
    }
  }

  /**
   * Switch between connected wallets
   */
  async switchWallet(providerId: string): Promise<WalletConnectionResult> {
    return await this.multiWalletService.switchWallet(providerId);
  }

  /**
   * Disconnect current wallet
   */
  async disconnect(): Promise<void> {
    await this.multiWalletService.disconnectWallet();
  }

  /**
   * Sign a transaction with the connected wallet
   */
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.isConnected()) {
      throw new Error('No wallet connected');
    }

    try {
      return await this.multiWalletService.signTransaction(transaction);
    } catch (error: any) {
      const providerId = this.state.connectedProviderId || 'unknown';
      const enhancedError = this.enhanceErrorMessage(providerId, error.message);
      throw new Error(enhancedError);
    }
  }

  /**
   * Get available wallets
   */
  getAvailableWallets(): AvailableWallet[] {
    return [...this.state.availableWallets];
  }

  /**
   * Get currently connected wallet
   */
  getCurrentWallet(): WalletProvider | null {
    return this.multiWalletService.getCurrentWallet();
  }

  /**
   * Get current state
   */
  getState(): ConnectionState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: SolanaWalletEventCallback): () => void {
    this.eventCallbacks.add(callback);
    return () => this.eventCallbacks.delete(callback);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state.status === 'connected' && this.state.wallet !== null;
  }

  /**
   * Get wallet address
   */
  getWalletAddress(): string | null {
    return this.state.wallet?.address || null;
  }

  /**
   * Get wallet public key
   */
  getWalletPublicKey(): PublicKey | null {
    return this.state.wallet?.publicKey || null;
  }

  /**
   * Open wallet selection modal
   */
  async openModal(): Promise<void> {
    await this.updateAvailableWallets(); // Refresh wallet list
    this.updateState({ isModalOpen: true });
  }

  /**
   * Close wallet selection modal
   */
  async closeModal(): Promise<void> {
    this.updateState({ isModalOpen: false });
  }

  /**
   * Check if a specific wallet is available
   */
  isWalletAvailable(providerId: string): boolean {
    const wallet = this.state.availableWallets.find(w => w.id === providerId);
    return wallet?.isAvailable ?? false;
  }

  /**
   * Get installation prompt for unavailable wallets
   */
  getInstallationPrompt(providerId: string): string {
    switch (providerId) {
      case 'phantom':
        return 'Phantom wallet not found. Please install Phantom from phantom.app';
      case 'metamask':
        return MetaMaskUtils.getInstallationPrompt();
      default:
        return `${providerId} wallet not found. Please install the wallet and refresh the page.`;
    }
  }

  /**
   * Enhanced error messages for better user experience
   */
  private enhanceErrorMessage(providerId: string, originalError: string): string {
    // MetaMask-specific error enhancement
    if (providerId === 'metamask') {
      return MetaMaskUtils.getErrorMessage({ message: originalError });
    }

    // Generic error enhancements
    if (originalError.includes('User rejected')) {
      return 'Connection cancelled by user';
    }

    if (originalError.includes('not found')) {
      return this.getInstallationPrompt(providerId);
    }

    return originalError || ERROR_MESSAGES.CONNECTION_FAILED;
  }

  /**
   * Update state and notify subscribers
   */
  private updateState(updates: Partial<ConnectionState>): void {
    this.state = { ...this.state, ...updates };

    this.eventCallbacks.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('Error in callback:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.walletEventUnsubscribe) {
      this.walletEventUnsubscribe();
    }
    this.eventCallbacks.clear();
  }
}

// Legacy class for backward compatibility
export class SolanaWalletService extends EnhancedWalletService {
  constructor() {
    super();
    console.warn('SolanaWalletService is deprecated. Use EnhancedWalletService instead.');
  }
}

// Export enhanced service as default
export const walletConnectService = new EnhancedWalletService();

// Export legacy service for backward compatibility
export { walletConnectService as walletService };