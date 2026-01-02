/**
 * Mobile Transaction Return URL Handler for SPLITDO
 * Handles transactions returned from mobile wallet apps via URL parameters or callbacks
 * Supports Phantom, Solflare, and other mobile wallet return patterns
 */

export interface MobileTransactionReturn {
  success: boolean;
  signature?: string;
  publicKey?: string;
  error?: string;
  errorCode?: string;
  walletId?: string;
}

export interface MobileTransactionListener {
  id: string;
  callback: (result: MobileTransactionReturn) => void;
  timeout?: number;
  walletId?: string;
}

// Global listener registry
const transactionListeners: Map<string, MobileTransactionListener> = new Map();
let isListenerSetup = false;
let listenerCleanupTimeout: NodeJS.Timeout | null = null;

/**
 * Parses mobile wallet return URL for transaction data
 * Supports various mobile wallet return URL patterns
 */
export function parseMobileReturnUrl(url: string = window.location.href): MobileTransactionReturn {
  try {
    const parsedUrl = new URL(url);
    const params = parsedUrl.searchParams;
    const hash = parsedUrl.hash;

    console.log('[MobileTransactionHandler] Parsing return URL:', {
      url,
      searchParams: Object.fromEntries(params.entries()),
      hash
    });

    // Phantom mobile app return patterns
    if (params.has('phantom_encryption_public_key') || params.has('phantom_signature')) {
      return parsePhantomReturnUrl(params);
    }

    // Solflare mobile app return patterns
    if (params.has('solflare_signature') || params.has('solflare_success')) {
      return parseSolflareReturnUrl(params);
    }

    // Generic success/error patterns
    if (params.has('signature')) {
      return {
        success: true,
        signature: params.get('signature') || undefined,
        publicKey: params.get('publicKey') || params.get('public_key') || undefined,
        walletId: params.get('wallet') || 'unknown'
      };
    }

    // Error patterns
    if (params.has('error') || params.has('error_code')) {
      return {
        success: false,
        error: params.get('error') || params.get('error_description') || 'Transaction failed',
        errorCode: params.get('error_code') || undefined,
        walletId: params.get('wallet') || 'unknown'
      };
    }

    // Hash-based parameters (some wallets use hash instead of search params)
    if (hash && hash.length > 1) {
      return parseHashParameters(hash);
    }

    // No transaction data found in URL
    return {
      success: false,
      error: 'No transaction data found in return URL'
    };

  } catch (error) {
    console.error('[MobileTransactionHandler] Error parsing return URL:', error);
    return {
      success: false,
      error: `Failed to parse return URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Parses Phantom-specific return URL patterns
 */
function parsePhantomReturnUrl(params: URLSearchParams): MobileTransactionReturn {
  console.log('[MobileTransactionHandler] Parsing Phantom return URL');

  // Check for Phantom-specific error patterns
  if (params.has('phantom_error')) {
    return {
      success: false,
      error: params.get('phantom_error') || 'Phantom transaction failed',
      errorCode: params.get('phantom_error_code') || undefined,
      walletId: 'phantom'
    };
  }

  // Check for successful transaction
  const signature = params.get('phantom_signature') || params.get('signature');
  const publicKey = params.get('phantom_encryption_public_key') ||
                   params.get('phantom_public_key') ||
                   params.get('publicKey');

  if (signature || publicKey) {
    return {
      success: true,
      signature: signature || undefined,
      publicKey: publicKey || undefined,
      walletId: 'phantom'
    };
  }

  // Phantom-specific user rejection
  if (params.get('phantom_cancelled') === 'true' || params.get('phantom_rejected') === 'true') {
    return {
      success: false,
      error: 'Transaction cancelled by user',
      errorCode: 'user_rejected',
      walletId: 'phantom'
    };
  }

  return {
    success: false,
    error: 'Unknown Phantom return URL format',
    walletId: 'phantom'
  };
}

/**
 * Parses Solflare-specific return URL patterns
 */
function parseSolflareReturnUrl(params: URLSearchParams): MobileTransactionReturn {
  console.log('[MobileTransactionHandler] Parsing Solflare return URL');

  const success = params.get('solflare_success') === 'true';
  const signature = params.get('solflare_signature') || params.get('signature');
  const error = params.get('solflare_error');
  const publicKey = params.get('solflare_public_key') || params.get('publicKey');

  if (success && signature) {
    return {
      success: true,
      signature,
      publicKey: publicKey || undefined,
      walletId: 'solflare'
    };
  }

  if (error) {
    return {
      success: false,
      error,
      errorCode: params.get('solflare_error_code') || undefined,
      walletId: 'solflare'
    };
  }

  return {
    success: false,
    error: 'Unknown Solflare return URL format',
    walletId: 'solflare'
  };
}

/**
 * Parses hash-based parameters (for wallets that use URL fragments)
 */
function parseHashParameters(hash: string): MobileTransactionReturn {
  try {
    // Remove the # and split by &
    const hashParams = new URLSearchParams(hash.substring(1));

    console.log('[MobileTransactionHandler] Parsing hash parameters:', Object.fromEntries(hashParams.entries()));

    const signature = hashParams.get('signature');
    const publicKey = hashParams.get('publicKey') || hashParams.get('public_key');
    const error = hashParams.get('error');
    const walletId = hashParams.get('wallet') || 'unknown';

    if (signature) {
      return {
        success: true,
        signature,
        publicKey: publicKey || undefined,
        walletId
      };
    }

    if (error) {
      return {
        success: false,
        error,
        errorCode: hashParams.get('error_code') || undefined,
        walletId
      };
    }

    return {
      success: false,
      error: 'No transaction data found in hash parameters'
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to parse hash parameters: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Sets up mobile wallet return listener
 * Should be called when a mobile wallet connection is initiated
 */
export function setupMobileReturnListener(): void {
  if (typeof window === 'undefined' || isListenerSetup) {
    return;
  }

  console.log('[MobileTransactionHandler] Setting up mobile return listener');

  // Listen for URL changes (back navigation from wallet app)
  const handlePopState = () => {
    console.log('[MobileTransactionHandler] Pop state event detected');
    handlePotentialReturn();
  };

  // Listen for focus events (returning to browser from wallet app)
  const handleWindowFocus = () => {
    console.log('[MobileTransactionHandler] Window focus event detected');
    setTimeout(() => handlePotentialReturn(), 500); // Small delay to ensure URL is updated
  };

  // Listen for visibility changes
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      console.log('[MobileTransactionHandler] Visibility change - page became visible');
      setTimeout(() => handlePotentialReturn(), 500);
    }
  };

  window.addEventListener('popstate', handlePopState);
  window.addEventListener('focus', handleWindowFocus);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  isListenerSetup = true;

  // Cleanup function to remove listeners
  const cleanup = () => {
    window.removeEventListener('popstate', handlePopState);
    window.removeEventListener('focus', handleWindowFocus);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    isListenerSetup = false;
    console.log('[MobileTransactionHandler] Removed mobile return listeners');
  };

  // Auto-cleanup after 10 minutes of no activity
  if (listenerCleanupTimeout) {
    clearTimeout(listenerCleanupTimeout);
  }
  listenerCleanupTimeout = setTimeout(cleanup, 10 * 60 * 1000);
}

/**
 * Adds a transaction listener for mobile wallet returns
 */
export function addMobileTransactionListener(
  id: string,
  callback: (result: MobileTransactionReturn) => void,
  options: { timeout?: number; walletId?: string } = {}
): void {
  console.log('[MobileTransactionHandler] Adding transaction listener:', { id, ...options });

  // Remove existing listener with same ID
  removeMobileTransactionListener(id);

  const listener: MobileTransactionListener = {
    id,
    callback,
    timeout: options.timeout || 300000, // 5 minutes default
    walletId: options.walletId
  };

  transactionListeners.set(id, listener);

  // Set timeout for automatic cleanup
  if (listener.timeout) {
    setTimeout(() => {
      removeMobileTransactionListener(id);
      callback({
        success: false,
        error: 'Transaction timeout - no response from mobile wallet',
        errorCode: 'timeout'
      });
    }, listener.timeout);
  }

  // Setup listeners if not already done
  setupMobileReturnListener();
}

/**
 * Removes a mobile transaction listener
 */
export function removeMobileTransactionListener(id: string): void {
  if (transactionListeners.delete(id)) {
    console.log('[MobileTransactionHandler] Removed transaction listener:', id);
  }
}

/**
 * Handles potential return from mobile wallet app
 */
function handlePotentialReturn(): void {
  const result = parseMobileReturnUrl();

  console.log('[MobileTransactionHandler] Potential return detected:', result);

  // Check if we should handle this as a wallet connection (not transaction)
  const shouldCheckWalletConnection = result.error === 'No transaction data found in return URL' &&
                                     transactionListeners.size > 0;

  if (shouldCheckWalletConnection) {
    console.log('[MobileTransactionHandler] Checking for wallet connection after return from mobile app');

    // Check if wallet is now connected (after user approved in mobile app)
    const walletConnected = checkWalletConnectionAfterReturn();

    if (walletConnected.success) {
      console.log('[MobileTransactionHandler] Wallet connection detected after mobile return');

      // Notify listeners of successful connection
      const connectionResult: MobileTransactionReturn = {
        success: true,
        publicKey: walletConnected.publicKey,
        walletId: walletConnected.walletId
      };

      notifyListeners(connectionResult);
      return;
    } else {
      console.log('[MobileTransactionHandler] No wallet connection detected after mobile return');
    }
  }

  // Process if we have explicit transaction data or error
  if (result.success || result.error !== 'No transaction data found in return URL') {
    notifyListeners(result);
  }
}

/**
 * Check if wallet is connected after returning from mobile app
 */
function checkWalletConnectionAfterReturn(): { success: boolean; publicKey?: string; walletId?: string } {
  try {
    // Check for Phantom connection
    const phantom = (window as any).phantom;
    if (phantom?.solana?.isConnected && phantom.solana.publicKey) {
      return {
        success: true,
        publicKey: phantom.solana.publicKey.toString(),
        walletId: 'phantom'
      };
    }

    // Check for other wallets via Wallet Standard
    const wallets = (window.navigator as any)?.wallets;
    if (wallets && typeof wallets.get === 'function') {
      const availableWallets = Array.from(wallets.get());
      for (const wallet of availableWallets) {
        if (wallet.accounts && wallet.accounts.length > 0) {
          return {
            success: true,
            publicKey: wallet.accounts[0].address,
            walletId: wallet.name.toLowerCase()
          };
        }
      }
    }

    return { success: false };
  } catch (error) {
    console.error('[MobileTransactionHandler] Error checking wallet connection:', error);
    return { success: false };
  }
}

/**
 * Notify relevant listeners of transaction/connection result
 */
function notifyListeners(result: MobileTransactionReturn): void {
  const listenersToNotify = Array.from(transactionListeners.values()).filter(listener => {
    return !listener.walletId || !result.walletId || listener.walletId === result.walletId;
  });

  console.log('[MobileTransactionHandler] Notifying listeners:', listenersToNotify.length);

  listenersToNotify.forEach(listener => {
    try {
      listener.callback(result);
      removeMobileTransactionListener(listener.id); // Auto-remove after successful callback
    } catch (error) {
      console.error('[MobileTransactionHandler] Error in listener callback:', error);
    }
  });

  // Clean up URL if we processed transaction data
  if (result.success && typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    const hasTransactionParams = ['signature', 'phantom_signature', 'solflare_signature', 'error'].some(param =>
      url.searchParams.has(param)
    );

    if (hasTransactionParams) {
      // Remove transaction parameters from URL
      ['signature', 'publicKey', 'error', 'error_code', 'wallet',
       'phantom_signature', 'phantom_encryption_public_key', 'phantom_error',
       'solflare_signature', 'solflare_success', 'solflare_error'].forEach(param => {
        url.searchParams.delete(param);
      });

      window.history.replaceState({}, document.title, url.toString());
      console.log('[MobileTransactionHandler] Cleaned transaction parameters from URL');
    }
  }
}

/**
 * Manual trigger for checking return data (useful for testing)
 */
export function checkMobileWalletReturn(): MobileTransactionReturn {
  return parseMobileReturnUrl();
}

/**
 * Debug utility for development
 */
export function logMobileTransactionState(): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[MobileTransactionHandler] Current state:', {
      isListenerSetup,
      activeListeners: Array.from(transactionListeners.keys()),
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
      parsedReturn: typeof window !== 'undefined' ? parseMobileReturnUrl() : 'N/A'
    });
  }
}