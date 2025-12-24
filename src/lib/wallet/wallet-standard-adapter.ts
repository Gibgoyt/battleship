/**
 * Wallet Standard Protocol Adapter for SPLITDO
 *
 * Implements the Wallet Standard (CAIP-25) for universal wallet compatibility.
 * Provides automatic wallet discovery and standardized interaction patterns.
 * Compatible with MetaMask, Phantom, and other standard-compliant wallets.
 */

// Import browser polyfills FIRST to ensure Buffer is available
import './browser-polyfills';
import { PublicKey, Transaction } from '@solana/web3.js';
import type { WalletProvider } from './wallet-providers';

// Wallet Standard types (based on @wallet-standard packages)
export interface WalletStandardEvents {
  change(properties: { accounts?: readonly WalletAccount[] }): void;
}

export interface WalletAccount {
  address: string;
  publicKey: Uint8Array;
  chains: readonly string[];
  features: readonly string[];
  label?: string;
  icon?: string;
}

export interface WalletStandardFeature {
  [feature: string]: unknown;
}

export interface StandardConnect extends WalletStandardFeature {
  connect(options?: { silent?: boolean }): Promise<{ accounts: readonly WalletAccount[] }>;
}

export interface StandardDisconnect extends WalletStandardFeature {
  disconnect(): Promise<void>;
}

export interface StandardSignTransaction extends WalletStandardFeature {
  signTransaction(
    ...inputs: readonly {
      account: WalletAccount;
      transaction: Transaction;
      options?: { minContextSlot?: number };
    }[]
  ): Promise<readonly { signedTransaction: Transaction }[]>;
}

export interface WalletStandardWallet {
  readonly version: string;
  readonly name: string;
  readonly icon: string;
  readonly chains: readonly string[];
  readonly features: Readonly<{
    [StandardConnect['name']]: StandardConnect;
    [StandardDisconnect['name']]?: StandardDisconnect;
    [StandardSignTransaction['name']]: StandardSignTransaction;
  } & { [feature: string]: WalletStandardFeature }>;
  readonly accounts: readonly WalletAccount[];

  addEventListener<E extends keyof WalletStandardEvents>(
    type: E,
    listener: WalletStandardEvents[E]
  ): void;

  removeEventListener<E extends keyof WalletStandardEvents>(
    type: E,
    listener: WalletStandardEvents[E]
  ): void;
}

// Wallet Standard registry interface
export interface WalletStandardRegistry {
  readonly wallets: readonly WalletStandardWallet[];
  addEventListener(type: 'register', listener: (event: { wallet: WalletStandardWallet }) => void): void;
  addEventListener(type: 'unregister', listener: (event: { wallet: WalletStandardWallet }) => void): void;
  removeEventListener(type: 'register', listener: (event: { wallet: WalletStandardWallet }) => void): void;
  removeEventListener(type: 'unregister', listener: (event: { wallet: WalletStandardWallet }) => void): void;
}

declare global {
  interface Window {
    navigator: Navigator & {
      wallets?: WalletStandardRegistry;
    };
  }
}

// Wallet Standard feature identifiers
export const WALLET_STANDARD_FEATURES = {
  STANDARD_CONNECT: 'standard:connect',
  STANDARD_DISCONNECT: 'standard:disconnect',
  SOLANA_SIGN_TRANSACTION: 'solana:signTransaction',
  SOLANA_SIGN_AND_SEND_TRANSACTION: 'solana:signAndSendTransaction',
  SOLANA_SIGN_MESSAGE: 'solana:signMessage',
} as const;

// Solana chain identifiers
export const SOLANA_CHAINS = {
  MAINNET: 'solana:mainnet',
  DEVNET: 'solana:devnet',
  TESTNET: 'solana:testnet',
} as const;

// Wallet Standard provider implementation
export class WalletStandardProvider implements WalletProvider {
  private standardWallet: WalletStandardWallet;
  private connectedAccount: WalletAccount | null = null;

  constructor(standardWallet: WalletStandardWallet) {
    this.standardWallet = standardWallet;
  }

  get id(): string {
    return `standard:${this.standardWallet.name.toLowerCase().replace(/\s+/g, '-')}`;
  }

  get name(): string {
    return this.standardWallet.name;
  }

  get icon(): string {
    return this.standardWallet.icon;
  }

  isAvailable(): boolean {
    return this.hasSolanaSupport();
  }

  private hasSolanaSupport(): boolean {
    const hasSolanaChain = this.standardWallet.chains.some(chain =>
      chain.startsWith('solana:')
    );

    const hasRequiredFeatures =
      WALLET_STANDARD_FEATURES.STANDARD_CONNECT in this.standardWallet.features &&
      WALLET_STANDARD_FEATURES.SOLANA_SIGN_TRANSACTION in this.standardWallet.features;

    return hasSolanaChain && hasRequiredFeatures;
  }

  async connect(): Promise<{ publicKey: PublicKey }> {
    if (!this.isAvailable()) {
      throw new Error(`${this.name} does not support Solana`);
    }

    try {
      const connectFeature = this.standardWallet.features[WALLET_STANDARD_FEATURES.STANDARD_CONNECT];
      const { accounts } = await connectFeature.connect();

      // Find the first Solana account
      const solanaAccount = accounts.find(account =>
        account.chains.some(chain => chain.startsWith('solana:'))
      );

      if (!solanaAccount) {
        throw new Error('No Solana account available');
      }

      this.connectedAccount = solanaAccount;
      const publicKey = new PublicKey(solanaAccount.publicKey);

      return { publicKey };
    } catch (error) {
      throw new Error(`Failed to connect to ${this.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.connectedAccount) {
      throw new Error('Wallet not connected');
    }

    try {
      const signFeature = this.standardWallet.features[WALLET_STANDARD_FEATURES.SOLANA_SIGN_TRANSACTION];

      const [{ signedTransaction }] = await signFeature.signTransaction({
        account: this.connectedAccount,
        transaction,
      });

      return signedTransaction;
    } catch (error) {
      throw new Error(`Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    const disconnectFeature = this.standardWallet.features[WALLET_STANDARD_FEATURES.STANDARD_DISCONNECT];

    if (disconnectFeature) {
      try {
        await disconnectFeature.disconnect();
      } catch (error) {
        console.warn(`Error disconnecting ${this.name}:`, error);
      }
    }

    this.connectedAccount = null;
  }

  isConnected(): boolean {
    return this.connectedAccount !== null;
  }

  getPublicKey(): PublicKey | null {
    if (!this.connectedAccount) {
      return null;
    }

    try {
      return new PublicKey(this.connectedAccount.publicKey);
    } catch (error) {
      console.error('Error creating PublicKey from account:', error);
      return null;
    }
  }

  // Get the underlying standard wallet for advanced usage
  getStandardWallet(): WalletStandardWallet {
    return this.standardWallet;
  }

  // Check if wallet supports specific features
  supportsFeature(feature: string): boolean {
    return feature in this.standardWallet.features;
  }

  // Get supported Solana chains
  getSolanaChains(): string[] {
    return this.standardWallet.chains.filter(chain => chain.startsWith('solana:'));
  }
}

// Wallet Standard discovery and management
export class WalletStandardDiscovery {
  private registry: WalletStandardRegistry | null = null;
  private discoveredWallets: Map<string, WalletStandardWallet> = new Map();
  private eventCallbacks: Set<(event: WalletDiscoveryEvent) => void> = new Set();

  constructor() {
    this.initializeRegistry();
  }

  private initializeRegistry() {
    if (typeof window === 'undefined') {
      return;
    }

    // Try to access the wallet standard registry
    this.registry = window.navigator?.wallets || null;

    if (this.registry) {
      this.setupRegistryEvents();
      this.discoverExistingWallets();
    }
  }

  private setupRegistryEvents() {
    if (!this.registry) return;

    const onRegister = (event: { wallet: WalletStandardWallet }) => {
      this.discoveredWallets.set(event.wallet.name, event.wallet);
      this.emitEvent({ type: 'walletRegistered', wallet: event.wallet });
    };

    const onUnregister = (event: { wallet: WalletStandardWallet }) => {
      this.discoveredWallets.delete(event.wallet.name);
      this.emitEvent({ type: 'walletUnregistered', wallet: event.wallet });
    };

    this.registry.addEventListener('register', onRegister);
    this.registry.addEventListener('unregister', onUnregister);
  }

  private discoverExistingWallets() {
    if (!this.registry) return;

    for (const wallet of this.registry.wallets) {
      this.discoveredWallets.set(wallet.name, wallet);
    }
  }

  /**
   * Get all discovered Wallet Standard wallets with Solana support
   */
  getAvailableWallets(): WalletStandardWallet[] {
    return Array.from(this.discoveredWallets.values()).filter(wallet =>
      wallet.chains.some(chain => chain.startsWith('solana:'))
    );
  }

  /**
   * Get wallet providers for all discovered wallets
   */
  getWalletProviders(): WalletStandardProvider[] {
    return this.getAvailableWallets().map(wallet => new WalletStandardProvider(wallet));
  }

  /**
   * Find wallet by name
   */
  getWalletByName(name: string): WalletStandardWallet | null {
    return this.discoveredWallets.get(name) || null;
  }

  /**
   * Check if Wallet Standard is supported
   */
  isSupported(): boolean {
    return this.registry !== null;
  }

  /**
   * Wait for a specific wallet to be available
   */
  async waitForWallet(name: string, timeout: number = 5000): Promise<WalletStandardWallet | null> {
    const existingWallet = this.getWalletByName(name);
    if (existingWallet) {
      return existingWallet;
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        this.removeEventListener(onWalletRegistered);
        resolve(null);
      }, timeout);

      const onWalletRegistered = (event: WalletDiscoveryEvent) => {
        if (event.type === 'walletRegistered' && event.wallet.name === name) {
          clearTimeout(timeoutId);
          this.removeEventListener(onWalletRegistered);
          resolve(event.wallet);
        }
      };

      this.addEventListener(onWalletRegistered);
    });
  }

  /**
   * Event handling
   */
  addEventListener(callback: (event: WalletDiscoveryEvent) => void): () => void {
    this.eventCallbacks.add(callback);
    return () => this.eventCallbacks.delete(callback);
  }

  removeEventListener(callback: (event: WalletDiscoveryEvent) => void) {
    this.eventCallbacks.delete(callback);
  }

  private emitEvent(event: WalletDiscoveryEvent) {
    for (const callback of this.eventCallbacks) {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in wallet discovery event callback:', error);
      }
    }
  }
}

// Wallet discovery event types
export type WalletDiscoveryEvent =
  | { type: 'walletRegistered'; wallet: WalletStandardWallet }
  | { type: 'walletUnregistered'; wallet: WalletStandardWallet };

// Utility functions for Wallet Standard integration
export class WalletStandardUtils {
  /**
   * Check if a wallet supports all required Solana features
   */
  static validateSolanaSupport(wallet: WalletStandardWallet): boolean {
    const requiredFeatures = [
      WALLET_STANDARD_FEATURES.STANDARD_CONNECT,
      WALLET_STANDARD_FEATURES.SOLANA_SIGN_TRANSACTION,
    ];

    return requiredFeatures.every(feature => feature in wallet.features) &&
           wallet.chains.some(chain => chain.startsWith('solana:'));
  }

  /**
   * Get wallet capabilities summary
   */
  static getWalletCapabilities(wallet: WalletStandardWallet): {
    name: string;
    chains: string[];
    features: string[];
    solanaSupport: boolean;
  } {
    return {
      name: wallet.name,
      chains: [...wallet.chains],
      features: Object.keys(wallet.features),
      solanaSupport: this.validateSolanaSupport(wallet),
    };
  }

  /**
   * Format wallet name for display
   */
  static formatWalletName(name: string): string {
    return name.replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get wallet icon or fallback
   */
  static getWalletIcon(wallet: WalletStandardWallet, fallback: string = '💼'): string {
    return wallet.icon || fallback;
  }
}

// Export default discovery instance
export const walletStandardDiscovery = new WalletStandardDiscovery();