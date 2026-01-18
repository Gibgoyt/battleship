/**
 * Mobile Detection Service for SPLITDO Wallet Integration
 * Provides platform-aware mobile device detection and app store URL generation
 */

export interface MobileDetectionResult {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  platform: 'ios' | 'android' | 'desktop';
  userAgent: string;
}

/**
 * Detects the current mobile platform using user agent analysis
 * Following patterns from browser-polyfills.ts for consistency
 */
export function detectMobilePlatform(): MobileDetectionResult {
  // Server-side safety check
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      platform: 'desktop',
      userAgent: ''
    };
  }

  const userAgent = navigator.userAgent.toLowerCase();

  // iOS detection - covers Safari, Chrome, Firefox on iOS
  const isIOS = /ipad|iphone|ipod/.test(userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // Android detection - covers Chrome, Firefox, Samsung Internet on Android
  const isAndroid = /android/.test(userAgent);

  const isMobile = isIOS || isAndroid;

  let platform: 'ios' | 'android' | 'desktop';
  if (isIOS) {
    platform = 'ios';
  } else if (isAndroid) {
    platform = 'android';
  } else {
    platform = 'desktop';
  }

  return {
    isMobile,
    isIOS,
    isAndroid,
    platform,
    userAgent: navigator.userAgent
  };
}

/**
 * Simple boolean check for mobile device
 * Useful for conditional rendering and quick checks
 */
export function isMobileDevice(): boolean {
  return detectMobilePlatform().isMobile;
}

/**
 * Gets the appropriate mobile app store URL for a given wallet and platform
 * Integrates with app-store-urls.ts for centralized URL management
 */
export function getMobileAppStoreUrl(walletId: string, platform: 'ios' | 'android'): string {
  // Import here to avoid circular dependency issues
  const { getWalletStoreUrl } = require('./app-store-urls');
  return getWalletStoreUrl(walletId, platform);
}

/**
 * Checks if the current environment supports mobile wallet detection
 * Used for error boundary and fallback scenarios
 */
export function isMobileDetectionSupported(): boolean {
  return typeof window !== 'undefined' &&
         typeof navigator !== 'undefined' &&
         typeof navigator.userAgent === 'string';
}

/**
 * Enhanced mobile detection with additional context
 * Useful for debugging and detailed platform information
 */
export function getDetailedMobileInfo(): MobileDetectionResult & {
  isInApp: boolean;
  browserName: string;
  supportsStoreRedirect: boolean;
} {
  const detection = detectMobilePlatform();
  const userAgent = detection.userAgent.toLowerCase();

  // Detect if running in app webview
  const isInApp = /wv|webview/.test(userAgent) ||
                 /instagram|facebook|twitter|line|whatsapp/.test(userAgent);

  // Basic browser detection
  let browserName = 'unknown';
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    browserName = 'safari';
  } else if (userAgent.includes('chrome')) {
    browserName = 'chrome';
  } else if (userAgent.includes('firefox')) {
    browserName = 'firefox';
  } else if (userAgent.includes('samsung')) {
    browserName = 'samsung';
  }

  // Check if platform supports direct app store redirects
  const supportsStoreRedirect = detection.isMobile && !isInApp;

  return {
    ...detection,
    isInApp,
    browserName,
    supportsStoreRedirect
  };
}

/**
 * Generates a platform-appropriate installation message
 * Used for user-friendly error messages and prompts
 */
export function getInstallationMessage(walletName: string, platform: 'ios' | 'android' | 'desktop'): string {
  switch (platform) {
    case 'ios':
      return `Install ${walletName} from the App Store to continue`;
    case 'android':
      return `Install ${walletName} from Google Play to continue`;
    default:
      return `Please install ${walletName} extension to continue`;
  }
}

/**
 * Opens the app store for a specific wallet on the current platform
 * Integrates with app-store-urls.ts for centralized URL management
 */
export function openAppStoreForWallet(walletId: string): void {
  const { platform } = detectMobilePlatform();

  if (platform === 'desktop') {
    console.warn('[MobileDetection] Cannot open mobile app store on desktop platform');
    return;
  }

  // Import here to avoid circular dependency issues
  const { openAppStore } = require('./app-store-urls');
  openAppStore(walletId, platform);
}

/**
 * Debug utility for development and troubleshooting
 * Console logs detailed mobile detection information
 */
export function logMobileDetection(): void {
  if (process.env.NODE_ENV !== 'production') {
    const detection = getDetailedMobileInfo();
    console.log('[MobileDetection] Platform detection results:', detection);
  }
}