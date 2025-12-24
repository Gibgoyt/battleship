/**
 * SolidJS Reactive Wallet Store for SPLITDO
 * Fixed version with proper signal reactivity
 * Manages multi-wallet connections, ATA status, and wallet operations
 */

import {
  createSignal,
  createEffect,
  type Accessor
} from 'solid-js';

import { CONNECTION_CONFIG, ERROR_MESSAGES } from './walletconnect-config';
import { solanaService } from './solana-service';
import { walletConnectService } from './walletconnect-service';

export type ATAStatus = 'unknown' | 'checking' | 'exists' | 'not_found' | 'creating' | 'created' | 'error';

export interface ATAInfo {
  status: ATAStatus;
  address?: string;
  balance?: { uiAmount: number };
  error?: string;
}

export interface WalletInfo {
  address: string;
  name: string;
}

export interface SolanaBalance {
  sol: number;
}

// Global reactive signals - created at module level for proper reactivity
const [connectionStatus, setConnectionStatus] = createSignal<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
const [wallet, setWallet] = createSignal<WalletInfo | null>(null);
const [connectionError, setConnectionError] = createSignal<string | null>(null);
const [isModalOpen, setIsModalOpen] = createSignal(false);
const [solBalance, setSolBalance] = createSignal<SolanaBalance | null>(null);
const [splitdoATA, setSplitdoATA] = createSignal<ATAInfo>({ status: 'unknown' });

// Store Firebase token
let firebaseToken: string | undefined = undefined;

// Initialize store with Firebase token
export const initializeWalletStore = (token?: string) => {
  console.log('[ReactiveWalletStore] Initializing with Firebase token:', token ? 'Present' : 'None');
  firebaseToken = token;
};

// Phantom readiness verification interface
interface PhantomReadinessResult {
  ready: boolean;
  provider?: any;
  error?: string;
}

// Comprehensive Phantom extension verification
const verifyPhantomReadiness = async (): Promise<PhantomReadinessResult> => {
  console.log('[ReactiveWalletStore] Verifying Phantom readiness...');

  // 1. Check basic availability
  if (typeof window === 'undefined') {
    return { ready: false, error: 'Window not available (server-side context)' };
  }

  const phantom = (window as any).phantom;
  if (!phantom?.solana) {
    return {
      ready: false,
      error: 'Phantom wallet not installed. Please install Phantom from https://phantom.app/ and refresh the page.'
    };
  }

  // 2. Check extension properties
  const provider = phantom.solana;
  if (!provider.isPhantom) {
    return {
      ready: false,
      error: 'Phantom provider not properly initialized. Please refresh the page or restart your browser.'
    };
  }

  // 3. Test basic provider functionality
  try {
    const requiredMethods = ['connect', 'disconnect', 'signTransaction'];
    for (const method of requiredMethods) {
      if (typeof provider[method] !== 'function') {
        return {
          ready: false,
          error: `Phantom provider missing ${method} method. Please update your Phantom extension.`
        };
      }
    }

    console.log('[ReactiveWalletStore] Phantom verification successful', {
      isPhantom: provider.isPhantom,
      isConnected: provider.isConnected,
      hasPublicKey: !!provider.publicKey
    });

    return { ready: true, provider };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      ready: false,
      error: `Phantom provider verification failed: ${errorMessage}. Please restart Phantom and refresh the page.`
    };
  }
};

// Enhanced error message function for Phantom-specific issues
const enhancePhantomError = (originalError: string): string => {
  console.log('[ReactiveWalletStore] Enhancing error message:', originalError);

  if (originalError.includes('not installed') || originalError.includes('not found')) {
    return 'Phantom wallet not found. Please install Phantom from https://phantom.app/ and refresh the page.';
  }

  if (originalError.includes('not ready') || originalError.includes('not properly initialized')) {
    return 'Phantom wallet is not ready. Please ensure Phantom is unlocked and refresh the page.';
  }

  if (originalError.includes('popup') || originalError.includes('timed out')) {
    return 'Connection timed out. Please check for a Phantom popup window. If no popup appears, try refreshing the page or restarting Phantom.';
  }

  if (originalError.includes('cancelled') || originalError.includes('rejected') || originalError.includes('User rejected')) {
    return 'Connection was cancelled. Please try again and approve the connection in Phantom when the popup appears.';
  }

  if (originalError.includes('Maximum retry') || originalError.includes('retry attempts exceeded')) {
    return 'Unable to establish connection after multiple attempts. Please restart Phantom and refresh the page.';
  }

  if (originalError.includes('No popup appears') || originalError.includes('popup failed')) {
    return 'Phantom popup failed to appear. This may be due to a popup blocker or browser issue. Please check your popup settings and try again.';
  }

  // Return enhanced error or fallback to original
  return originalError || ERROR_MESSAGES.CONNECTION_FAILED;
};

// Check for popup blockers and browser restrictions
const checkPopupCapability = (): void => {
  console.log('[ReactiveWalletStore] Checking popup capability...');

  // Test if we can open a popup window (will be blocked by popup blocker)
  const testPopup = window.open('', '', 'width=1,height=1');
  if (testPopup) {
    console.log('[ReactiveWalletStore] ✅ Popup capability: ALLOWED');
    testPopup.close();
  } else {
    console.log('[ReactiveWalletStore] ❌ Popup capability: BLOCKED - Browser is blocking popups');
  }

  // Check user gesture context
  console.log('[ReactiveWalletStore] User gesture context check:', {
    hasUserActivation: !!(navigator as any).userActivation?.isActive,
    documentHidden: document.hidden,
    windowFocused: document.hasFocus(),
    timestamp: Date.now()
  });
};

// Immediate popup connection - for user gesture compliance
const connectWithImmediatePopup = async (provider: any): Promise<any> => {
  console.log('[ReactiveWalletStore] IMMEDIATE popup trigger - connecting now...');

  // Check browser popup capability first
  checkPopupCapability();

  // Trigger connection immediately - this MUST happen in the user gesture context
  const startTime = Date.now();

  // Monitor for any popup windows that might open
  let popupOpened = false;
  const originalOpen = window.open;
  window.open = function(...args) {
    console.log('[ReactiveWalletStore] 🚀 Popup window attempted to open:', args);
    popupOpened = true;
    return originalOpen.apply(window, args);
  };

  try {
    console.log('[ReactiveWalletStore] Calling provider.connect()...');

    // Direct connection call with basic timeout - no complex detection logic
    const connectionPromise = provider.connect();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        console.log('[ReactiveWalletStore] ⏰ Connection timeout after 10s - popup opened?', popupOpened);
        reject(new Error('Immediate connection timeout - popup may not have appeared'));
      }, 10000); // Shorter timeout for immediate detection
    });

    const response = await Promise.race([connectionPromise, timeoutPromise]);
    const duration = Date.now() - startTime;

    console.log('[ReactiveWalletStore] ✅ IMMEDIATE connection succeeded in', duration + 'ms', { popupOpened });
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.log('[ReactiveWalletStore] ❌ IMMEDIATE connection failed after', duration + 'ms:', errorMessage, { popupOpened });

    // Check if this looks like a popup blocker issue
    if (!popupOpened) {
      throw new Error('No popup window opened - this could be due to popup blocker or Phantom extension issue. Please check your browser settings.');
    }

    if (duration < 1000 && (errorMessage.includes('timeout') || errorMessage.includes('user'))) {
      throw new Error('Popup may be blocked. Please check your browser popup settings and try again.');
    }

    throw error;
  } finally {
    // Restore original window.open
    window.open = originalOpen;
  }
};

// Enhanced connection with popup detection and retry logic
const connectWithPopupDetection = async (provider: any, maxRetries: number = CONNECTION_CONFIG.retryAttempts): Promise<any> => {
  const logConnectionAttempt = (stage: string, details: any = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [ReactiveWalletStore] ${stage}:`, {
      phantomDetected: !!(window as any).phantom?.solana,
      phantomReady: !!(window as any).phantom?.solana?.isPhantom,
      alreadyConnected: !!(window as any).phantom?.solana?.isConnected,
      ...details
    });
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    logConnectionAttempt(`Connection attempt ${attempt}/${maxRetries}`, { attempt, maxRetries });

    try {
      let popupDetected = false;
      let connectionResult: any = null;
      let connectionError: Error | null = null;

      // Connection promise with enhanced error handling
      const connectionPromise = provider.connect().then((result: any) => {
        logConnectionAttempt('Connection successful', { publicKey: result.publicKey?.toString() });
        connectionResult = result;
        return result;
      }).catch((error: Error) => {
        logConnectionAttempt('Connection failed', { error: error.message });
        connectionError = error;
        throw error;
      });

      // Popup detection promise
      const popupDetectionPromise = new Promise<void>((resolve) => {
        let visibilityCheckDone = false;

        // Method 1: Monitor for document visibility change (popup opening)
        const handleVisibilityChange = () => {
          if (!visibilityCheckDone && (document.hidden || document.visibilityState === 'hidden')) {
            logConnectionAttempt('Popup detected via visibility change');
            popupDetected = true;
            visibilityCheckDone = true;
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            resolve();
          }
        };

        // Method 2: Monitor for window focus/blur events
        const handleWindowBlur = () => {
          if (!visibilityCheckDone) {
            logConnectionAttempt('Popup detected via window blur');
            popupDetected = true;
            visibilityCheckDone = true;
            window.removeEventListener('blur', handleWindowBlur);
            resolve();
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);

        // Fallback: assume popup opened after short delay if nothing detected
        setTimeout(() => {
          if (!visibilityCheckDone && !popupDetected && !connectionResult && !connectionError) {
            logConnectionAttempt('Popup detection timeout - assuming popup opened');
            popupDetected = true;
          }
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          window.removeEventListener('blur', handleWindowBlur);
          resolve();
        }, 1500); // 1.5 second fallback
      });

      // Wait for either popup detection or immediate success/failure
      await Promise.race([connectionPromise, popupDetectionPromise]);

      // If popup was detected but connection not resolved yet, wait with user feedback
      if (popupDetected && !connectionResult && !connectionError) {
        logConnectionAttempt('Popup detected, waiting for user action', { timeoutMs: CONNECTION_CONFIG.timeoutMs });

        // Wait for connection completion with configured timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(
              'Connection timed out. Please check the Phantom popup window and click "Connect". ' +
              'If you don\'t see a popup, your browser may be blocking it.'
            ));
          }, CONNECTION_CONFIG.timeoutMs);
        });

        connectionResult = await Promise.race([connectionPromise, timeoutPromise]);
      }

      if (connectionResult) {
        logConnectionAttempt('Connection completed successfully', { address: connectionResult.publicKey?.toString() });
        return connectionResult;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logConnectionAttempt(`Attempt ${attempt} failed`, { error: errorMessage });

      // Categorize error for retry strategy
      if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected') || errorMessage.includes('cancelled')) {
        // User explicitly rejected - don't retry
        throw new Error('Connection cancelled by user. Please try again when ready to approve.');
      }

      if (attempt === maxRetries) {
        // Final attempt failed - check if popup never appeared
        if (errorMessage.includes('timed out') || errorMessage.includes('timeout')) {
          throw new Error('No popup appears - Phantom may not be responding. Please refresh the page or restart Phantom.');
        }
        throw new Error(
          `Failed to connect after ${maxRetries} attempts. Last error: ${errorMessage}. ` +
          'Please ensure Phantom is running and try refreshing the page.'
        );
      }

      // Wait before retry with exponential backoff
      const delayMs = CONNECTION_CONFIG.retryDelayMs * Math.pow(2, attempt - 1);
      logConnectionAttempt(`Retrying in ${delayMs}ms`, { delayMs, nextAttempt: attempt + 1 });
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw new Error('Maximum retry attempts exceeded');
};

// REAL wallet connection
const connectWallet = async (walletId: string, preTriggeredConnectionPromise?: Promise<any>) => {
  try {
    console.log('[ReactiveWalletStore] REAL wallet connection attempt:', walletId);
    setConnectionStatus('connecting');
    setConnectionError(null);

    let walletProvider: any = null;
    let walletAddress: string = '';

    if (walletId === 'phantom') {
      // Handle pre-triggered connection promise from WalletModal
      if (preTriggeredConnectionPromise) {
        console.log('[ReactiveWalletStore] Using pre-triggered Phantom connection promise...');

        walletProvider = (window as any).phantom?.solana;
        if (!walletProvider?.isPhantom) {
          throw new Error('Phantom wallet not ready. Please refresh the page and try again.');
        }

        console.log('[ReactiveWalletStore] Waiting for pre-triggered connection to complete...');

        try {
          // Create a much shorter timeout since this should resolve quickly if working
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              console.log('[ReactiveWalletStore] ⏰ Pre-triggered connection timeout - Phantom not responding');
              console.log('[ReactiveWalletStore] Phantom might be locked, unresponsive, or popup blocked');
              reject(new Error(
                'Phantom is not responding. Please ensure Phantom is unlocked and running. ' +
                'You may need to refresh the page or restart your browser.'
              ));
            }, 10000); // Shorter 10 second timeout
          });

          // Wait for the connection promise that was triggered in the click handler
          const response = await Promise.race([
            preTriggeredConnectionPromise,
            timeoutPromise
          ]);

          if (!response?.publicKey) {
            throw new Error('Invalid response from Phantom - missing public key');
          }

          walletAddress = response.publicKey.toString();
          console.log('[ReactiveWalletStore] ✅ Pre-triggered Phantom connection successful:', walletAddress);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Connection failed';
          console.error('[ReactiveWalletStore] ❌ Pre-triggered connection failed:', errorMessage);

          // Add specific diagnostic for hanging promises
          if (errorMessage.includes('timeout') || errorMessage.includes('not responding')) {
            console.log('[ReactiveWalletStore] 🔍 DIAGNOSTIC: Phantom connection hanging');
            console.log('[ReactiveWalletStore] Possible causes:');
            console.log('[ReactiveWalletStore] 1. Phantom wallet is locked');
            console.log('[ReactiveWalletStore] 2. Phantom extension crashed or unresponsive');
            console.log('[ReactiveWalletStore] 3. Browser popup blocker active');
            console.log('[ReactiveWalletStore] 4. User needs to restart Phantom or browser');
          }

          throw error;
        }
      } else {
        // Fallback to old logic if no pre-triggered promise
        console.log('[ReactiveWalletStore] No pre-triggered promise, using fallback connection...');

        // Step 1: Basic synchronous verification (no await to avoid delays)
        if (typeof window === 'undefined' || !(window as any).phantom?.solana) {
          throw new Error('Phantom wallet not installed. Please install Phantom from https://phantom.app/ and refresh the page.');
        }

        walletProvider = (window as any).phantom.solana;
        if (!walletProvider.isPhantom) {
          throw new Error('Phantom wallet not ready. Please refresh the page and try again.');
        }

        console.log('[ReactiveWalletStore] Phantom detected, checking connection status...', {
          isPhantom: walletProvider.isPhantom,
          isConnected: walletProvider.isConnected,
          hasPublicKey: !!walletProvider.publicKey
        });

        // Step 2: Check if already connected
        if (walletProvider.isConnected && walletProvider.publicKey) {
          console.log('[ReactiveWalletStore] Phantom already connected:', walletProvider.publicKey.toString());
          walletAddress = walletProvider.publicKey.toString();
        } else {
          // Step 3: Try immediate connection as fallback
          console.log('[ReactiveWalletStore] Triggering fallback Phantom connection...');

          try {
            // Direct connect call - no async delays before this point
            const response = await connectWithImmediatePopup(walletProvider);
            walletAddress = response.publicKey.toString();
          } catch (error) {
            // If immediate connection fails, fall back to enhanced detection
            console.warn('[ReactiveWalletStore] Immediate connection failed, trying enhanced detection:', error);
            const response = await connectWithPopupDetection(walletProvider);
            walletAddress = response.publicKey.toString();
          }
        }
      }
    } else if (walletId === 'metamask') {
      // Real MetaMask connection (for Solana, we need MetaMask with Solana support)
      if (typeof window !== 'undefined' && (window as any).ethereum?.isMetaMask) {
        walletProvider = (window as any).ethereum;
        console.log('[ReactiveWalletStore] MetaMask detected, requesting account access...');

        const accounts = await walletProvider.request({ method: 'eth_requestAccounts' });
        walletAddress = accounts[0]; // Ethereum address for now

        console.log('[ReactiveWalletStore] MetaMask connected successfully:', walletAddress);

        // Note: For full Solana support, MetaMask needs Solana integration
        // This would require checking for MetaMask's Solana provider
      } else {
        throw new Error('MetaMask wallet not installed. Please install MetaMask from https://metamask.io/');
      }
    }

    if (!walletAddress) {
      throw new Error('Failed to get wallet address');
    }

    const realWallet: WalletInfo = {
      address: walletAddress,
      name: walletId === 'phantom' ? 'Phantom' : 'MetaMask'
    };

    setWallet(realWallet);
    setConnectionStatus('connected');

    console.log('[ReactiveWalletStore] REAL wallet connected successfully:', realWallet.address);

    // Get real balance (would need real RPC calls)
    setSolBalance({ sol: 0.0 }); // Start with 0, will be updated by real balance check

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Connection failed';
    console.error('[ReactiveWalletStore] REAL wallet connection failed:', errorMessage);

    // Enhanced error handling with user-friendly messages
    const enhancedErrorMessage = walletId === 'phantom'
      ? enhancePhantomError(errorMessage)
      : errorMessage;

    setConnectionStatus('error');
    setConnectionError(enhancedErrorMessage);

    // Log the enhanced error for debugging
    console.log('[ReactiveWalletStore] Enhanced error message:', enhancedErrorMessage);

    // Throw enhanced error for upper layers
    throw new Error(enhancedErrorMessage);
  }
};

const disconnectWallet = () => {
  console.log('[ReactiveWalletStore] Disconnecting wallet');
  setWallet(null);
  setConnectionStatus('disconnected');
  setConnectionError(null);
  setSolBalance(null);
  setSplitdoATA({ status: 'unknown' });
};

const checkSplitdoBalance = async () => {
  const currentWallet = wallet();
  if (!currentWallet || !firebaseToken) {
    console.log('[ReactiveWalletStore] Skipping SPLITDO balance check - no wallet or token');
    return;
  }

  try {
    console.log('[ReactiveWalletStore] Checking SPLITDO ATA status');
    setSplitdoATA({ status: 'checking' });

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock "not found" response for testuser1
    setSplitdoATA({
      status: 'not_found'
    });

    console.log('[ReactiveWalletStore] SPLITDO ATA check complete: not_found');
  } catch (error) {
    console.error('[ReactiveWalletStore] SPLITDO ATA check failed:', error);
    setSplitdoATA({
      status: 'error',
      error: error instanceof Error ? error.message : 'Network error'
    });
  }
};

const refreshBalances = async () => {
  const currentWallet = wallet();
  if (!currentWallet) {
    console.log('[ReactiveWalletStore] Skipping balance refresh - no wallet connected');
    return;
  }

  console.log('[ReactiveWalletStore] Refreshing wallet balances');
  // Mock balance update
  setSolBalance({ sol: 0.05 });
};

// Real SPLITDO ATA creation function
const createSplitdoATA = async (): Promise<{ success: boolean; signature?: string; error?: string }> => {
  const currentWallet = wallet();
  const token = firebaseToken;

  if (!currentWallet) {
    return { success: false, error: 'No wallet connected' };
  }

  if (!token) {
    return { success: false, error: 'No authentication token available' };
  }

  // Get the current wallet provider
  const provider = walletConnectService.getCurrentWallet();
  if (!provider) {
    return { success: false, error: 'No wallet provider available' };
  }

  setSplitdoATA(prev => ({ ...prev, status: 'creating' }));

  try {
    console.log('[ReactiveWalletStore] Creating SPLITDO ATA with real provider...');

    // Use the enhanced solana service with wallet provider
    const ataResult = await solanaService.createSplitdoATA(provider);

    if (!ataResult.success) {
      setSplitdoATA(prev => ({
        ...prev,
        status: 'error',
        error: ataResult.error
      }));
      return {
        success: false,
        error: ataResult.error
      };
    }

    if (!ataResult.signature) {
      // ATA already exists
      setSplitdoATA({
        status: 'exists',
        address: ataResult.ataAddress
      });
      return { success: true, signature: 'already_exists' };
    }

    // Submit signed transaction to backend
    const submitResult = await solanaService.submitSignedATATransaction(
      token,
      currentWallet.address,
      ataResult.ataAddress!,
      ataResult.signature
    );

    if (submitResult.success) {
      setSplitdoATA({
        status: 'created',
        address: ataResult.ataAddress,
        balance: {
          uiAmount: 0
        }
      });

      // Refresh balances after creation
      setTimeout(() => refreshBalances(), 2000);

      return {
        success: true,
        signature: submitResult.transactionSignature
      };
    } else {
      setSplitdoATA(prev => ({
        ...prev,
        status: 'error',
        error: submitResult.error
      }));
      return {
        success: false,
        error: submitResult.error
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
    setSplitdoATA(prev => ({
      ...prev,
      status: 'error',
      error: errorMessage
    }));
    return {
      success: false,
      error: errorMessage
    };
  }
};

const openModal = () => {
  console.log('[ReactiveWalletStore] Opening wallet selection modal');
  setIsModalOpen(true);
  console.log('[ReactiveWalletStore] Modal state after opening:', isModalOpen());
};

const closeModal = () => {
  console.log('[ReactiveWalletStore] Closing wallet selection modal');
  setIsModalOpen(false);
};

// Export individual hooks for components
export const useWallet = () => {
  return {
    connectionStatus,
    wallet,
    connectionError
  };
};

export const useWalletModal = () => {
  return {
    isModalOpen,
    openModal,
    closeModal
  };
};

export const useWalletConnection = () => {
  return {
    connectWallet,
    disconnectWallet
  };
};

export const useWalletBalances = () => {
  return {
    solBalance,
    refreshBalances
  };
};

export const useSplitdoATA = () => {
  return {
    splitdoATA,
    checkSplitdoBalance,
    createSplitdoATA
  };
};

export const useMultiWallet = () => {
  const [detectedWallets, setDetectedWallets] = createSignal<any[]>([]);

  // Real wallet detection on first call
  const availableWallets = () => {
    if (typeof window === 'undefined') return [];

    // Basic wallet detection
    const wallets = [];

    // Detect Phantom with better validation
    const phantomDetected = !!(window as any).phantom?.solana?.isPhantom;
    wallets.push({
      id: 'phantom',
      name: 'Phantom',
      icon: '🟣',
      description: phantomDetected
        ? 'Popular Solana wallet with DeFi support'
        : 'Install Phantom to connect your Solana wallet',
      detected: phantomDetected,
      installUrl: 'https://phantom.app/'
    });

    // Detect MetaMask
    const metamaskDetected = !!(window as any).ethereum?.isMetaMask;
    wallets.push({
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: metamaskDetected
        ? 'Most popular Ethereum wallet'
        : 'Install MetaMask to connect your Ethereum wallet',
      detected: metamaskDetected,
      installUrl: 'https://metamask.io/'
    });

    console.log('[ReactiveWalletStore] Wallet detection results:',
      wallets.map(w => ({ name: w.name, detected: w.detected })));
    console.log('[ReactiveWalletStore] Full detection details:', wallets);

    return wallets;
  };

  return {
    availableWallets
  };
};