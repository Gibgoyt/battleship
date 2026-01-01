/**
 * Mobile Wallet Deep Link Connector for SPLITDO
 * Handles mobile wallet connections via deep links instead of browser extension detection
 * Leverages existing deep link infrastructure from wallet-detection.ts
 */

import { detectMobilePlatform, getDetailedMobileInfo } from './mobile-detection';
import { hasWalletStoreUrls, getWalletStoreUrl } from './app-store-urls';
import { WalletUtils } from './wallet-detection';

export interface MobileWalletConnectionResult {
  success: boolean;
  method: 'deeplink' | 'walletstandard' | 'installed' | 'error';
  deepLinkUrl?: string;
  error?: string;
  requiresInstallation?: boolean;
  appStoreUrl?: string;
}

/**
 * Attempts to connect to a mobile wallet using deep links
 * This is the primary function for iOS Safari and Android Chrome connections
 */
export function attemptMobileWalletConnection(walletId: string): MobileWalletConnectionResult {
  const mobileInfo = getDetailedMobileInfo();

  // Only proceed if we're on a mobile device
  if (!mobileInfo.isMobile) {
    return {
      success: false,
      method: 'error',
      error: 'Not a mobile device - use browser extension detection instead'
    };
  }

  console.log('[MobileWalletConnector] Attempting mobile wallet connection:', {
    walletId,
    platform: mobileInfo.platform,
    browser: mobileInfo.browserName,
    isInApp: mobileInfo.isInApp,
    supportsStoreRedirect: mobileInfo.supportsStoreRedirect
  });

  // Step 1: Try Wallet Standard first (if supported by wallet)
  const walletStandardResult = tryWalletStandard(walletId);
  if (walletStandardResult.success) {
    return walletStandardResult;
  }

  // Step 2: Generate and validate deep link
  const deepLinkUrl = generateWalletDeepLink(walletId);
  if (!deepLinkUrl) {
    return {
      success: false,
      method: 'error',
      error: `No deep link configuration found for wallet: ${walletId}`,
      requiresInstallation: true,
      appStoreUrl: hasWalletStoreUrls(walletId)
        ? getWalletStoreUrl(walletId, mobileInfo.platform)
        : undefined
    };
  }

  // Step 3: Check if wallet app might be available
  const availabilityResult = detectMobileWalletAvailability(walletId, mobileInfo);

  return {
    success: true,
    method: 'deeplink',
    deepLinkUrl,
    requiresInstallation: !availabilityResult.likelyInstalled,
    appStoreUrl: hasWalletStoreUrls(walletId)
      ? getWalletStoreUrl(walletId, mobileInfo.platform)
      : undefined
  };
}

/**
 * Generates a wallet deep link using existing infrastructure
 * Leverages generateWalletDeepLink from wallet-detection.ts
 */
export function generateWalletDeepLink(walletId: string): string | null {
  try {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://app.splitdo.com';
    const deepLink = WalletUtils.generateWalletDeepLink(walletId, currentUrl);

    console.log('[MobileWalletConnector] Generated deep link:', {
      walletId,
      currentUrl,
      deepLink
    });

    return deepLink !== currentUrl ? deepLink : null; // Return null if no deep link was generated
  } catch (error) {
    console.error('[MobileWalletConnector] Error generating deep link:', error);
    return null;
  }
}

/**
 * Attempts to detect if a mobile wallet is available via Wallet Standard
 * Uses existing wallet-standard-adapter.ts infrastructure
 */
function tryWalletStandard(walletId: string): MobileWalletConnectionResult {
  try {
    // Check if Wallet Standard is supported in this environment
    if (typeof window === 'undefined' || !window.navigator) {
      return {
        success: false,
        method: 'error',
        error: 'Wallet Standard not supported in this environment'
      };
    }

    // Look for wallets in the Wallet Standard registry
    const wallets = (window.navigator as any).wallets;
    if (!wallets || typeof wallets.get !== 'function') {
      console.log('[MobileWalletConnector] Wallet Standard not available');
      return {
        success: false,
        method: 'error',
        error: 'Wallet Standard registry not available'
      };
    }

    // Check for specific wallet
    const availableWallets = Array.from(wallets.get());
    const targetWallet = availableWallets.find((wallet: any) =>
      wallet.name.toLowerCase().includes(walletId.toLowerCase())
    );

    if (targetWallet) {
      console.log('[MobileWalletConnector] Found wallet via Wallet Standard:', targetWallet.name);
      return {
        success: true,
        method: 'walletstandard'
      };
    }

    return {
      success: false,
      method: 'error',
      error: `Wallet ${walletId} not found in Wallet Standard registry`
    };
  } catch (error) {
    console.error('[MobileWalletConnector] Error checking Wallet Standard:', error);
    return {
      success: false,
      method: 'error',
      error: 'Failed to check Wallet Standard'
    };
  }
}

/**
 * Heuristic detection of mobile wallet availability
 * Cannot definitively detect if app is installed, but provides educated guess
 */
export function detectMobileWalletAvailability(walletId: string, mobileInfo?: any): {
  likelyInstalled: boolean;
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
} {
  const info = mobileInfo || getDetailedMobileInfo();

  // If we're in a wallet app's webview, the wallet is definitely available
  if (info.isInApp) {
    const userAgent = info.userAgent.toLowerCase();
    if (userAgent.includes(walletId.toLowerCase())) {
      return {
        likelyInstalled: true,
        confidence: 'high',
        reasoning: `Running inside ${walletId} app webview`
      };
    }
  }

  // For iOS, we can't reliably detect installed apps due to sandbox restrictions
  if (info.isIOS) {
    return {
      likelyInstalled: false, // Assume not installed, let deep link attempt determine
      confidence: 'low',
      reasoning: 'iOS sandbox prevents app detection - will attempt deep link'
    };
  }

  // For Android, slightly better detection possible but still limited
  if (info.isAndroid) {
    return {
      likelyInstalled: false, // Assume not installed, let intent attempt determine
      confidence: 'low',
      reasoning: 'Android intent detection limited - will attempt deep link'
    };
  }

  return {
    likelyInstalled: false,
    confidence: 'low',
    reasoning: 'Unable to detect wallet app installation on this platform'
  };
}

/**
 * Executes a mobile wallet deep link with proper error handling
 * Returns promise that resolves when navigation completes or fails
 */
export async function executeMobileWalletDeepLink(
  connectionResult: MobileWalletConnectionResult
): Promise<{ success: boolean; error?: string }> {
  if (!connectionResult.success || !connectionResult.deepLinkUrl) {
    return {
      success: false,
      error: 'Invalid connection result or missing deep link URL'
    };
  }

  try {
    console.log('[MobileWalletConnector] Executing deep link:', connectionResult.deepLinkUrl);

    // Set up deep link failure detection
    const deepLinkTimeout = setTimeout(() => {
      console.log('[MobileWalletConnector] Deep link timeout - app may not be installed');
    }, 3000);

    // Attempt to navigate to deep link
    window.location.href = connectionResult.deepLinkUrl;

    // Clear timeout if navigation succeeds
    clearTimeout(deepLinkTimeout);

    return { success: true };
  } catch (error) {
    console.error('[MobileWalletConnector] Deep link execution failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deep link execution failed'
    };
  }
}

/**
 * Checks if mobile wallet connections are supported in the current environment
 */
export function isMobileWalletConnectionSupported(): boolean {
  const mobileInfo = getDetailedMobileInfo();

  return mobileInfo.isMobile &&
         !mobileInfo.isInApp && // Not in a social media app webview
         mobileInfo.supportsStoreRedirect; // Can redirect to app stores if needed
}

/**
 * Gets supported wallet IDs for mobile connections
 */
export function getSupportedMobileWallets(): string[] {
  return ['phantom', 'solflare', 'glow', 'trust']; // Based on deep link configurations
}

/**
 * Debug utility for development and troubleshooting
 */
export function logMobileWalletConnectionInfo(walletId: string): void {
  if (process.env.NODE_ENV !== 'production') {
    const mobileInfo = getDetailedMobileInfo();
    const connectionResult = attemptMobileWalletConnection(walletId);
    const availability = detectMobileWalletAvailability(walletId, mobileInfo);

    console.log('[MobileWalletConnector] Connection info:', {
      walletId,
      mobileInfo,
      connectionResult,
      availability,
      isSupported: isMobileWalletConnectionSupported()
    });
  }
}