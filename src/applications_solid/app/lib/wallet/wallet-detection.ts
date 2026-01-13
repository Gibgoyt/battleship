/**
 * Wallet Detection Utilities for SPLITDO
 *
 * Comprehensive wallet detection, capability checking, and installation guidance
 * Supports Phantom, MetaMask, Wallet Standard wallets, and future wallet integrations
 */

import { MetaMaskDetector, type MetaMaskSolanaCapabilities } from './metamask-solana';
import { walletStandardDiscovery, type WalletStandardWallet } from './wallet-standard-adapter';

// Wallet detection result interface
export interface WalletDetectionResult {
  id: string;
  name: string;
  icon: string;
  isInstalled: boolean;
  isAvailable: boolean;
  capabilities: string[];
  installUrl?: string;
  detectionMethod: 'window' | 'wallet-standard' | 'extension-api';
  version?: string;
  description: string;
}

// Browser capability detection
export interface BrowserCapabilities {
  hasWebCrypto: boolean;
  hasTextEncoder: boolean;
  hasSecureContext: boolean;
  hasCrypto: boolean;
  hasSubtleCrypto: boolean;
  userAgent: string;
  isMetaMaskBrowser: boolean;
  isPhantomBrowser: boolean;
}

// Detection configuration
export interface DetectionConfig {
  timeout: number; // Milliseconds to wait for wallet detection
  includeInactive: boolean; // Include wallets that are installed but inactive
  detectTestWallets: boolean; // Include test/dev wallets
  preferredWallets: string[]; // Preferred wallet order
}

const DEFAULT_CONFIG: DetectionConfig = {
  timeout: 3000,
  includeInactive: true,
  detectTestWallets: false,
  preferredWallets: ['metamask', 'phantom', 'solflare', 'backpack']
};

// Wallet installation URLs
const WALLET_INSTALL_URLS = {
  phantom: 'https://phantom.app',
  metamask: 'https://metamask.io',
  solflare: 'https://solflare.com',
  backpack: 'https://backpack.app',
  glow: 'https://glow.app',
  slope: 'https://slope.finance',
  trust: 'https://trustwallet.com',
  coinbase: 'https://wallet.coinbase.com',
  ledger: 'https://www.ledger.com/ledger-live',
  trezor: 'https://trezor.io'
} as const;

// Wallet descriptions
const WALLET_DESCRIPTIONS = {
  phantom: 'Popular Solana wallet with excellent user experience',
  metamask: 'Multi-chain wallet with Solana support (2025+)',
  solflare: 'Native Solana wallet with advanced features',
  backpack: 'Social-first multi-chain wallet',
  glow: 'Solana mobile wallet with staking features',
  slope: 'Solana DeFi-focused wallet',
  trust: 'Multi-chain mobile wallet',
  coinbase: 'Coinbase-integrated wallet',
  ledger: 'Hardware wallet support',
  trezor: 'Hardware wallet support'
} as const;

/**
 * Main wallet detection service
 */
export class WalletDetectionService {
  private config: DetectionConfig;
  private detectionPromise: Promise<WalletDetectionResult[]> | null = null;
  private lastDetection: WalletDetectionResult[] = [];

  constructor(config: Partial<DetectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Detect all available wallets
   */
  async detectWallets(forceRefresh = false): Promise<WalletDetectionResult[]> {
    if (!forceRefresh && this.detectionPromise) {
      return await this.detectionPromise;
    }

    this.detectionPromise = this.performDetection();
    this.lastDetection = await this.detectionPromise;
    return this.lastDetection;
  }

  /**
   * Get previously detected wallets (cached)
   */
  getCachedWallets(): WalletDetectionResult[] {
    return [...this.lastDetection];
  }

  /**
   * Detect specific wallet by ID
   */
  async detectWallet(walletId: string): Promise<WalletDetectionResult | null> {
    const allWallets = await this.detectWallets();
    return allWallets.find(w => w.id === walletId) || null;
  }

  /**
   * Check if any Solana wallets are available
   */
  async hasSolanaWallets(): Promise<boolean> {
    const wallets = await this.detectWallets();
    return wallets.some(w => w.isAvailable && w.capabilities.includes('solana'));
  }

  /**
   * Get recommended wallet for user
   */
  async getRecommendedWallet(): Promise<WalletDetectionResult | null> {
    const wallets = await this.detectWallets();
    const availableWallets = wallets.filter(w => w.isAvailable);

    if (availableWallets.length === 0) {
      return null;
    }

    // Find preferred wallet that's available
    for (const preferredId of this.config.preferredWallets) {
      const wallet = availableWallets.find(w => w.id === preferredId);
      if (wallet) {
        return wallet;
      }
    }

    // Return first available wallet
    return availableWallets[0];
  }

  /**
   * Get browser capabilities for wallet compatibility
   */
  getBrowserCapabilities(): BrowserCapabilities {
    if (typeof window === 'undefined') {
      return {
        hasWebCrypto: false,
        hasTextEncoder: false,
        hasSecureContext: false,
        hasCrypto: false,
        hasSubtleCrypto: false,
        userAgent: '',
        isMetaMaskBrowser: false,
        isPhantomBrowser: false
      };
    }

    const userAgent = navigator.userAgent.toLowerCase();

    return {
      hasWebCrypto: 'crypto' in window,
      hasTextEncoder: 'TextEncoder' in window,
      hasSecureContext: window.isSecureContext || location.protocol === 'https:',
      hasCrypto: 'crypto' in window && 'getRandomValues' in window.crypto,
      hasSubtleCrypto: 'crypto' in window && 'subtle' in window.crypto,
      userAgent: navigator.userAgent,
      isMetaMaskBrowser: userAgent.includes('metamask'),
      isPhantomBrowser: userAgent.includes('phantom')
    };
  }

  /**
   * Check wallet compatibility with current browser
   */
  async checkWalletCompatibility(walletId: string): Promise<{
    compatible: boolean;
    issues: string[];
    warnings: string[];
  }> {
    const browserCaps = this.getBrowserCapabilities();
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check basic requirements
    if (!browserCaps.hasWebCrypto) {
      issues.push('WebCrypto API not available');
    }

    if (!browserCaps.hasSecureContext) {
      issues.push('Secure context (HTTPS) required');
    }

    if (!browserCaps.hasTextEncoder) {
      issues.push('TextEncoder not available');
    }

    // Wallet-specific checks
    switch (walletId) {
      case 'metamask':
        const metamaskCaps = await MetaMaskDetector.detectCapabilities();
        if (metamaskCaps.hasMetaMask && !metamaskCaps.hasSolanaSupport) {
          issues.push('MetaMask installed but lacks Solana support');
          warnings.push('Update MetaMask to latest version');
        }
        break;

      case 'phantom':
        if (browserCaps.isMetaMaskBrowser) {
          warnings.push('Phantom may conflict with MetaMask in-app browser');
        }
        break;
    }

    return {
      compatible: issues.length === 0,
      issues,
      warnings
    };
  }

  /**
   * Generate installation guide for wallet
   */
  getInstallationGuide(walletId: string): {
    title: string;
    description: string;
    steps: string[];
    downloadUrl: string;
    estimatedTime: string;
  } {
    const baseSteps = [
      'Click the download link below',
      'Follow the installation prompts',
      'Create or import your wallet',
      'Return to this page and refresh'
    ];

    const guides: Record<string, any> = {
      phantom: {
        title: 'Install Phantom Wallet',
        description: 'Phantom is a user-friendly Solana wallet with excellent security.',
        steps: [
          'Visit phantom.app',
          'Click "Download for Browser"',
          'Add to your browser as an extension',
          'Create a new wallet or import existing',
          'Refresh this page to connect'
        ],
        downloadUrl: WALLET_INSTALL_URLS.phantom,
        estimatedTime: '2-3 minutes'
      },
      metamask: {
        title: 'Install MetaMask with Solana Support',
        description: 'MetaMask now supports Solana alongside Ethereum. Make sure to install the latest version.',
        steps: [
          'Visit metamask.io',
          'Download the latest version (2025+)',
          'Install the browser extension',
          'Create or import your wallet',
          'Ensure Solana support is enabled',
          'Refresh this page to connect'
        ],
        downloadUrl: WALLET_INSTALL_URLS.metamask,
        estimatedTime: '3-5 minutes'
      },
      solflare: {
        title: 'Install Solflare Wallet',
        description: 'Solflare is a native Solana wallet with advanced features for power users.',
        steps: baseSteps,
        downloadUrl: WALLET_INSTALL_URLS.solflare,
        estimatedTime: '2-3 minutes'
      }
    };

    return guides[walletId] || {
      title: `Install ${walletId} Wallet`,
      description: `${walletId} wallet supports Solana transactions.`,
      steps: baseSteps,
      downloadUrl: WALLET_INSTALL_URLS[walletId as keyof typeof WALLET_INSTALL_URLS] || '#',
      estimatedTime: '2-3 minutes'
    };
  }

  /**
   * Perform the actual wallet detection
   */
  private async performDetection(): Promise<WalletDetectionResult[]> {
    const results: WalletDetectionResult[] = [];

    // Wait for wallets to initialize
    await this.waitForWallets();

    // Detect window-based wallets
    results.push(...await this.detectWindowWallets());

    // Detect Wallet Standard wallets
    results.push(...await this.detectWalletStandardWallets());

    // Detect additional extension-based wallets
    results.push(...await this.detectExtensionWallets());

    // Sort by preference and availability
    return this.sortWalletResults(results);
  }

  /**
   * Wait for wallet providers to initialize
   */
  private async waitForWallets(): Promise<void> {
    if (typeof window === 'undefined') return;

    return new Promise<void>((resolve) => {
      const startTime = Date.now();
      const checkInterval = 100;

      const checkWallets = () => {
        const elapsed = Date.now() - startTime;

        // Check if major wallets have loaded
        const hasPhantom = window.solana?.isPhantom;
        const hasMetaMask = window.ethereum?.isMetaMask;

        if ((hasPhantom || hasMetaMask) || elapsed >= this.config.timeout) {
          resolve();
        } else {
          setTimeout(checkWallets, checkInterval);
        }
      };

      setTimeout(checkWallets, checkInterval);
    });
  }

  /**
   * Detect window-based wallet providers
   */
  private async detectWindowWallets(): Promise<WalletDetectionResult[]> {
    if (typeof window === 'undefined') return [];

    const results: WalletDetectionResult[] = [];

    // Phantom detection
    if (window.solana?.isPhantom) {
      results.push({
        id: 'phantom',
        name: 'Phantom',
        icon: '🟣',
        isInstalled: true,
        isAvailable: true,
        capabilities: ['solana', 'signTransaction', 'signMessage'],
        detectionMethod: 'window',
        description: WALLET_DESCRIPTIONS.phantom
      });
    }

    // MetaMask detection
    if (window.ethereum?.isMetaMask) {
      const metamaskCaps = await MetaMaskDetector.detectCapabilities();
      results.push({
        id: 'metamask',
        name: 'MetaMask',
        icon: '🦊',
        isInstalled: true,
        isAvailable: metamaskCaps.hasSolanaSupport,
        capabilities: metamaskCaps.hasSolanaSupport
          ? ['ethereum', 'solana', 'signTransaction', 'multichain']
          : ['ethereum', 'signTransaction'],
        detectionMethod: 'window',
        version: metamaskCaps.version,
        description: WALLET_DESCRIPTIONS.metamask,
        installUrl: metamaskCaps.hasSolanaSupport ? undefined : WALLET_INSTALL_URLS.metamask
      });
    }

    return results;
  }

  /**
   * Detect Wallet Standard compatible wallets
   */
  private async detectWalletStandardWallets(): Promise<WalletDetectionResult[]> {
    if (!walletStandardDiscovery.isSupported()) {
      return [];
    }

    const standardWallets = walletStandardDiscovery.getAvailableWallets();
    return standardWallets.map(wallet => ({
      id: `standard:${wallet.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: wallet.name,
      icon: wallet.icon || '💼',
      isInstalled: true,
      isAvailable: wallet.chains.some(chain => chain.startsWith('solana:')),
      capabilities: ['solana', 'wallet-standard', ...Object.keys(wallet.features)],
      detectionMethod: 'wallet-standard' as const,
      description: `${wallet.name} via Wallet Standard`
    }));
  }

  /**
   * Detect extension-based wallets (future expansion)
   */
  private async detectExtensionWallets(): Promise<WalletDetectionResult[]> {
    // Future: Can be extended to detect other wallet extensions
    // by checking for specific extension APIs or DOM modifications
    return [];
  }

  /**
   * Sort wallet results by preference and availability
   */
  private sortWalletResults(results: WalletDetectionResult[]): WalletDetectionResult[] {
    return results.sort((a, b) => {
      // Available wallets first
      if (a.isAvailable !== b.isAvailable) {
        return a.isAvailable ? -1 : 1;
      }

      // Preferred wallets first
      const aIndex = this.config.preferredWallets.indexOf(a.id);
      const bIndex = this.config.preferredWallets.indexOf(b.id);

      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      // Alphabetical by name
      return a.name.localeCompare(b.name);
    });
  }
}

/**
 * Utility functions
 */
export class WalletUtils {
  /**
   * Format wallet address for display
   */
  static formatAddress(address: string, startLength = 6, endLength = 4): string {
    if (address.length <= startLength + endLength) {
      return address;
    }
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
  }

  /**
   * Validate Solana address format
   */
  static isValidSolanaAddress(address: string): boolean {
    // Basic validation for Solana base58 address
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(address);
  }

  /**
   * Get wallet type from provider
   */
  static getWalletType(provider: any): string {
    if (provider?.isPhantom) return 'phantom';
    if (provider?.isMetaMask) return 'metamask';
    if (provider?.isSolflare) return 'solflare';
    if (provider?.isBackpack) return 'backpack';
    return 'unknown';
  }

  /**
   * Check if running in wallet's in-app browser
   */
  static isInWalletBrowser(): {
    isWalletBrowser: boolean;
    walletName: string | null;
  } {
    if (typeof window === 'undefined') {
      return { isWalletBrowser: false, walletName: null };
    }

    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('metamask')) {
      return { isWalletBrowser: true, walletName: 'MetaMask' };
    }

    if (userAgent.includes('phantom')) {
      return { isWalletBrowser: true, walletName: 'Phantom' };
    }

    if (userAgent.includes('trust')) {
      return { isWalletBrowser: true, walletName: 'Trust Wallet' };
    }

    return { isWalletBrowser: false, walletName: null };
  }

  /**
   * Generate wallet connection deep link (mobile)
   */
  static generateWalletDeepLink(walletId: string, dappUrl: string): string {
    const encodedUrl = encodeURIComponent(dappUrl);

    const deepLinks: Record<string, string> = {
      phantom: `phantom://browse/${encodedUrl}`,
      solflare: `solflare://v1/browse/${encodedUrl}`,
      glow: `glow://browse?url=${encodedUrl}`,
      trust: `trust://open_url?coin_id=501&url=${encodedUrl}` // 501 is Solana's coin ID
    };

    return deepLinks[walletId] || dappUrl;
  }
}

/**
 * Export default detection service instance
 */
export const walletDetection = new WalletDetectionService();

/**
 * Quick detection functions for convenience
 */
export const detectWallets = () => walletDetection.detectWallets();
export const detectWallet = (id: string) => walletDetection.detectWallet(id);
export const getRecommendedWallet = () => walletDetection.getRecommendedWallet();
export const hasSolanaWallets = () => walletDetection.hasSolanaWallets();