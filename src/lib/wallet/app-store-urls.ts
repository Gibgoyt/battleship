/**
 * App Store URLs Configuration for SPLITDO Wallet Integration
 * Centralized management of mobile wallet app store links
 */

export interface WalletStoreUrls {
  ios: string;
  android: string;
}

/**
 * Phantom wallet app store URLs
 * Official Phantom mobile app links verified as of 2026
 */
export const PHANTOM_STORE_URLS: WalletStoreUrls = {
  ios: 'https://apps.apple.com/app/phantom-solana-wallet/id1598432977',
  android: 'https://play.google.com/store/apps/details?id=app.phantom'
};

/**
 * Comprehensive wallet store URLs mapping
 * Extensible for future wallet integrations
 */
export const WALLET_STORE_URLS: Record<string, WalletStoreUrls> = {
  phantom: PHANTOM_STORE_URLS,
  // Future wallet integrations can be added here
  metamask: {
    ios: 'https://apps.apple.com/app/metamask/id1438144202',
    android: 'https://play.google.com/store/apps/details?id=io.metamask'
  },
  solflare: {
    ios: 'https://apps.apple.com/app/solflare/id1580902717',
    android: 'https://play.google.com/store/apps/details?id=com.solflare.mobile'
  }
};

/**
 * Gets the appropriate app store URL for a given wallet and platform
 * Returns the official store URL or fallback to wallet's main website
 */
export function getWalletStoreUrl(walletId: string, platform: 'ios' | 'android'): string {
  const walletUrls = WALLET_STORE_URLS[walletId.toLowerCase()];

  if (!walletUrls) {
    console.warn(`[AppStoreUrls] No store URLs found for wallet: ${walletId}`);
    // Fallback to Phantom for unknown wallets (primary use case)
    return getWalletStoreUrl('phantom', platform);
  }

  const storeUrl = walletUrls[platform];

  if (!storeUrl) {
    console.warn(`[AppStoreUrls] No ${platform} store URL found for wallet: ${walletId}`);
    // Return the other platform as fallback
    return platform === 'ios' ? walletUrls.android : walletUrls.ios;
  }

  return storeUrl;
}

/**
 * Validates if a wallet has mobile app store URLs configured
 * Useful for feature detection and conditional rendering
 */
export function hasWalletStoreUrls(walletId: string): boolean {
  const walletUrls = WALLET_STORE_URLS[walletId.toLowerCase()];
  return !!(walletUrls?.ios && walletUrls?.android);
}

/**
 * Gets all supported wallets that have mobile apps
 * Useful for wallet selection and feature availability
 */
export function getSupportedMobileWallets(): string[] {
  return Object.keys(WALLET_STORE_URLS).filter(walletId =>
    hasWalletStoreUrls(walletId)
  );
}

/**
 * Generates a direct app store link that opens the native store app
 * Uses platform-specific URL schemes for better UX
 */
export function getDirectStoreLink(walletId: string, platform: 'ios' | 'android'): string {
  const storeUrl = getWalletStoreUrl(walletId, platform);

  // For iOS, use iTunes URL scheme for direct App Store opening
  if (platform === 'ios' && storeUrl.includes('apps.apple.com')) {
    const appId = storeUrl.match(/id(\d+)/)?.[1];
    if (appId) {
      return `itms-apps://apps.apple.com/app/id${appId}`;
    }
  }

  // For Android, use market URL scheme for direct Play Store opening
  if (platform === 'android' && storeUrl.includes('play.google.com')) {
    const packageName = storeUrl.match(/id=([^&]+)/)?.[1];
    if (packageName) {
      return `market://details?id=${packageName}`;
    }
  }

  // Fallback to standard HTTPS URL
  return storeUrl;
}

/**
 * Utility function to open app store with fallback handling
 * Attempts direct store app opening, falls back to browser if needed
 */
export function openAppStore(walletId: string, platform: 'ios' | 'android'): void {
  if (typeof window === 'undefined') {
    console.warn('[AppStoreUrls] Cannot open app store in server environment');
    return;
  }

  const directLink = getDirectStoreLink(walletId, platform);
  const fallbackLink = getWalletStoreUrl(walletId, platform);

  // Try to open native store app first
  const link = document.createElement('a');
  link.href = directLink;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  // Add fallback for browsers that don't support custom URL schemes
  link.onclick = (event) => {
    // Set a timeout to open fallback if native app doesn't respond
    setTimeout(() => {
      window.open(fallbackLink, '_blank', 'noopener,noreferrer');
    }, 500);
  };

  link.click();
}

/**
 * Debug utility for development
 * Logs all available wallet store URLs
 */
export function logWalletStoreUrls(): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[AppStoreUrls] Available wallet store URLs:', WALLET_STORE_URLS);
    console.log('[AppStoreUrls] Supported mobile wallets:', getSupportedMobileWallets());
  }
}