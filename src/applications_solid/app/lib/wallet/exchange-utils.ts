/**
 * Exchange Utilities
 * 
 * Comprehensive utilities for SOL to SPLITDO token exchange functionality.
 * Handles device detection, exchange calculations, and transaction preparation.
 */

import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createLogger } from 'src/lib/logger';
import { middlewareFetch } from '../../middleware/endpoints';
import { SPLITDO_CONFIG } from './walletconnect-config';

const logger = createLogger('[ExchangeUtils]');

// ================================
// TYPE DEFINITIONS
// ================================

export interface ExchangeCalculation {
  solAmount: number;
  splitdoAmount: number;
  fees: number;
  totalCost: number;
  exchangeRate: number;
}

export interface ExchangeTransaction {
  transaction: Transaction;
  amount: ExchangeCalculation;
  vaultAddress: string;
  userAddress: string;
}

export interface VaultInfo {
  address: string;
  exchangeRate: number;
  isActive: boolean;
  lastUpdated: string;
}

export type DeviceType = 'mobile' | 'desktop';

export type MetaMaskConnectionStrategy = 'DESKTOP_EXTENSION' | 'METAMASK_BROWSER' | 'MOBILE_EXTERNAL' | 'NO_METAMASK';

export interface MetaMaskEnvironment {
  // Core connection states
  isDesktopExtension: boolean;
  isMobileExternal: boolean; 
  isMetaMaskBrowser: boolean;
  
  // Provider detection
  hasProvider: boolean;
  isMetaMaskProvider: boolean;
  
  // Platform details
  userAgent: string;
  isMobile: boolean;
  platform: 'Desktop' | 'iOS' | 'Android';
  
  // Connection strategy
  connectionStrategy: MetaMaskConnectionStrategy;
  
  // Additional context
  browserEnvironment: string;
  supportsSnaps: boolean;
  requiresWalletStandard: boolean;
}

export interface ExchangeError {
  type: 'user_rejected' | 'insufficient_balance' | 'network_error' | 'backend_error' | 'validation_error';
  message: string;
  details?: any;
  retryable: boolean;
}

export interface ExchangeProgress {
  stage: 'preparing' | 'signing' | 'submitting' | 'confirming' | 'complete' | 'error';
  message: string;
  progress: number; // 0-100
}

// ================================
// DEVICE DETECTION
// ================================

/**
 * Detect device type using comprehensive mobile detection
 * Leverages existing mobile detection utilities from the codebase
 */
export function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';
  
  // Use comprehensive mobile detection patterns from the codebase
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);
  
  // Check for touch support (more reliable for tablets)
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Check for mobile-specific features
  const isMobileScreen = window.innerWidth < 768;
  
  // Phantom mobile app detection
  const isPhantomMobile = userAgent.includes('phantom') && isMobileUA;
  
  // Final determination
  const isMobile = isMobileUA || (isTouchDevice && isMobileScreen) || isPhantomMobile;
  
  logger.debug('Device detection result:', {
    userAgent: userAgent.substring(0, 50) + '...',
    isMobileUA,
    isTouchDevice,
    isMobileScreen,
    isPhantomMobile,
    finalResult: isMobile ? 'mobile' : 'desktop'
  });
  
  return isMobile ? 'mobile' : 'desktop';
}

/**
 * Get detailed device information for enhanced exchange handling
 * Enhanced for iOS Phantom deep link detection
 */
export function getDeviceInfo() {
  const deviceType = detectDeviceType();
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Enhanced iOS detection
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);
  const isAndroid = /android/i.test(userAgent);
  
  // Phantom app detection (in-app browser)
  const isPhantomApp = userAgent.includes('phantom');
  const isPhantomMobile = isPhantomApp && (isIOS || isAndroid);
  const isPhantomiOS = isPhantomApp && isIOS;
  
  // CRITICAL: Check if native Phantom provider is available (user is inside Phantom app)
  const hasNativePhantomProvider = typeof window !== 'undefined' && !!(window as any)?.phantom?.solana;
  
  // Browser detection
  const isInAppBrowser = /instagram|facebook|whatsapp|line|wechat|tiktok/i.test(userAgent);
  const isSafari = /safari/i.test(userAgent) && !/chrome/i.test(userAgent);
  const isChrome = /chrome/i.test(userAgent);
  
  // Wallet capabilities based on environment
  const supportsSignAndSend = deviceType === 'desktop' && !isPhantomMobile;
  
  // FIXED LOGIC: Only require deep links if on mobile BUT NOT already in Phantom app
  const requiresDeepLinks = (isIOS || isAndroid) && !hasNativePhantomProvider;
  
  const preferredFlow = requiresDeepLinks ? 'deepLink' : 
                       hasNativePhantomProvider ? 'nativeProvider' :
                       (deviceType === 'desktop' ? 'signAndSendTransaction' : 'signTransaction');
  
  const deviceInfo = {
    type: deviceType,
    platform: isIOS ? 'iOS' : (isAndroid ? 'Android' : 'Desktop'),
    
    // Phantom detection
    isPhantomMobile,
    isPhantomiOS,
    isPhantomApp,
    hasNativePhantomProvider,
    
    // Browser detection  
    isInAppBrowser,
    isSafari,
    isChrome,
    
    // Wallet capabilities
    supportsSignAndSend,
    requiresDeepLinks,
    preferredFlow,
    
    // Backend endpoint routing
    backendEndpoint: hasNativePhantomProvider ? 
      '/api/testing/usockets/exchange-new/solana/splitdo' :  // Use desktop endpoint when in Phantom app
      (requiresDeepLinks ? 
        '/api/testing/usockets/exchange/solana/splitdo' : 
        '/api/testing/usockets/exchange-new/solana/splitdo')
  };
  
  logger.debug('Enhanced device info:', deviceInfo);
  
  return deviceInfo;
}

// ================================
// METAMASK BROWSER DETECTION
// ================================

/**
 * Enterprise-grade MetaMask environment detection
 * Provides reliable detection of desktop extension vs mobile browser vs external mobile browser
 * 
 * CRITICAL FIX: This solves the MetaMask mobile browser connection failures by properly
 * detecting when to use Snaps (desktop only) vs Wallet Standard API (mobile browser)
 */
export function getMetaMaskEnvironment(): MetaMaskEnvironment {
  // Early return for SSR
  if (typeof window === 'undefined') {
    return {
      isDesktopExtension: false,
      isMobileExternal: true,
      isMetaMaskBrowser: false,
      hasProvider: false,
      isMetaMaskProvider: false,
      userAgent: '',
      isMobile: false,
      platform: 'Desktop',
      connectionStrategy: 'NO_METAMASK',
      browserEnvironment: 'ssr',
      supportsSnaps: false,
      requiresWalletStandard: false
    };
  }

  // Get user agent and provider info
  const userAgent = navigator.userAgent || '';
  const userAgentLower = userAgent.toLowerCase();
  
  // Mobile detection - be very specific
  const isMobile = /android|iphone|ipad|ipod|mobile/i.test(userAgent);
  
  // MetaMask User Agent detection - case insensitive for reliability
  const isMetaMaskUA = /metamask/i.test(userAgent);
  
  // Provider detection
  const hasProvider = typeof window.ethereum !== 'undefined';
  const isMetaMaskProvider = hasProvider && (window.ethereum as any)?.isMetaMask === true;

  // Platform detection
  const platform: 'Desktop' | 'iOS' | 'Android' = 
    isMobile ? (userAgent.includes('iPhone') || userAgent.includes('iPad') ? 'iOS' : 'Android') : 'Desktop';

  // Browser environment detection
  const browserEnvironment = getBrowserEnvironment(userAgentLower);

  // Connection strategy determination
  const connectionStrategy = getMetaMaskConnectionStrategy(isMobile, isMetaMaskUA, hasProvider, isMetaMaskProvider);

  // Capabilities determination
  const supportsSnaps = connectionStrategy === 'DESKTOP_EXTENSION';
  const requiresWalletStandard = connectionStrategy === 'METAMASK_BROWSER';

  const environment: MetaMaskEnvironment = {
    // Core states
    isDesktopExtension: connectionStrategy === 'DESKTOP_EXTENSION',
    isMobileExternal: connectionStrategy === 'MOBILE_EXTERNAL',
    isMetaMaskBrowser: connectionStrategy === 'METAMASK_BROWSER',
    
    // Provider detection  
    hasProvider,
    isMetaMaskProvider,
    
    // Platform details
    userAgent: userAgentLower,
    isMobile,
    platform,
    
    // Connection strategy
    connectionStrategy,
    
    // Additional context
    browserEnvironment,
    supportsSnaps,
    requiresWalletStandard
  };

  logger.debug('🦊 MetaMask Environment Detection:', {
    platform,
    connectionStrategy,
    isMetaMaskUA,
    hasProvider: hasProvider,
    isMetaMaskProvider,
    userAgentSnippet: userAgent.substring(0, 100) + '...'
  });

  return environment;
}

/**
 * Determine browser environment from user agent
 */
function getBrowserEnvironment(userAgent: string): string {
  if (userAgent.includes('metamask')) return 'metamask-browser';
  if (userAgent.includes('phantom')) return 'phantom-browser';
  if (/instagram|facebook|whatsapp|line|wechat|tiktok/i.test(userAgent)) return 'social-app-browser';
  if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return 'safari';
  if (/chrome/i.test(userAgent)) return 'chrome';
  if (/firefox/i.test(userAgent)) return 'firefox';
  return 'unknown';
}

/**
 * Core strategy determination logic
 * This is the enterprise-grade detection that fixes the mobile browser issues
 */
function getMetaMaskConnectionStrategy(
  isMobile: boolean, 
  isMetaMaskUA: boolean, 
  hasProvider: boolean, 
  isMetaMaskProvider: boolean
): MetaMaskConnectionStrategy {
  
  // STATE 1: Desktop with MetaMask extension
  // - Desktop environment + MetaMask provider = Extension with Snaps support
  if (!isMobile && isMetaMaskProvider) {
    return 'DESKTOP_EXTENSION'; // ✅ Use Snaps for Solana
  }
  
  // STATE 3: MetaMask mobile browser (inside MetaMask app)  
  // - Mobile + MetaMask in user agent + has provider = MetaMask mobile browser
  // CRITICAL: This is where the fix happens - NO Snaps on mobile browser!
  if (isMobile && isMetaMaskUA && hasProvider) {
    return 'METAMASK_BROWSER'; // ✅ Use Wallet Standard API - NO Snaps!
  }
  
  // STATE 2: Mobile external browser (regular mobile browser)
  // - Mobile but not MetaMask browser = needs deeplink to MetaMask app
  if (isMobile && !isMetaMaskUA) {
    return 'MOBILE_EXTERNAL'; // ✅ Use deeplinks to open MetaMask app
  }
  
  // STATE 4: No MetaMask detected
  return 'NO_METAMASK';
}

/**
 * Debug logging function for browser detection troubleshooting
 * Call this during development to verify detection is working correctly
 */
export function logMetaMaskDetectionDebug() {
  if (typeof window === 'undefined') return;
  
  const env = getMetaMaskEnvironment();
  
  console.group('🔍 MetaMask Browser Detection Debug');
  console.log('User Agent:', navigator.userAgent);
  console.log('Window.ethereum available:', typeof window.ethereum !== 'undefined');
  console.log('Window.ethereum.isMetaMask:', (window.ethereum as any)?.isMetaMask);
  console.log('Environment Detection Result:', env);
  console.table({
    'Desktop Extension (Snaps)': env.connectionStrategy === 'DESKTOP_EXTENSION',
    'MetaMask Browser (Wallet Standard)': env.connectionStrategy === 'METAMASK_BROWSER', 
    'Mobile External (Deeplinks)': env.connectionStrategy === 'MOBILE_EXTERNAL',
    'No MetaMask': env.connectionStrategy === 'NO_METAMASK',
    'Supports Snaps': env.supportsSnaps,
    'Requires Wallet Standard': env.requiresWalletStandard,
    'Platform': env.platform,
    'Browser Environment': env.browserEnvironment
  });
  console.groupEnd();
}

/**
 * Validation function for browser detection
 * Returns test results for common scenarios
 */
export function validateMetaMaskDetection() {
  const env = getMetaMaskEnvironment();
  
  const testCases = [
    {
      name: 'Desktop Chrome + Extension',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      expected: 'DESKTOP_EXTENSION',
      shouldUseSnaps: true
    },
    {
      name: 'MetaMask Mobile Browser (iOS)',
      userAgent: 'Mozilla/5.0 (iPhone...) WebView MetaMaskMobile',
      expected: 'METAMASK_BROWSER',
      shouldUseSnaps: false
    },
    {
      name: 'iPhone Safari',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS...) Safari',
      expected: 'MOBILE_EXTERNAL',
      shouldUseSnaps: false
    }
  ];
  
  const currentTest = testCases.find(test => {
    const isCurrentEnvironment = 
      (test.expected === 'DESKTOP_EXTENSION' && env.isDesktopExtension) ||
      (test.expected === 'METAMASK_BROWSER' && env.isMetaMaskBrowser) ||
      (test.expected === 'MOBILE_EXTERNAL' && env.isMobileExternal);
    return isCurrentEnvironment;
  });
  
  const isValid = env.connectionStrategy !== 'NO_METAMASK' && 
    ((env.supportsSnaps && env.connectionStrategy === 'DESKTOP_EXTENSION') ||
     (env.requiresWalletStandard && env.connectionStrategy === 'METAMASK_BROWSER') ||
     (env.connectionStrategy === 'MOBILE_EXTERNAL'));
  
  console.log('🧪 MetaMask Detection Validation:', {
    currentStrategy: env.connectionStrategy,
    detectedCorrectly: isValid,
    matchedTestCase: currentTest?.name || 'Unknown environment',
    userAgent: navigator.userAgent.substring(0, 50) + '...',
    recommendations: {
      shouldUseSnaps: env.supportsSnaps,
      shouldUseWalletStandard: env.requiresWalletStandard,
      shouldUseDeeplinks: env.connectionStrategy === 'MOBILE_EXTERNAL'
    }
  });
  
  return { isValid, currentTest, environment: env };
}

// ================================
// EXCHANGE CALCULATIONS
// ================================

/**
 * Calculate exchange amounts with fees and validation
 */
export function calculateExchangeAmount(
  solAmount: number,
  exchangeRate: number,
  includeNetworkFee: boolean = true
): ExchangeCalculation {
  // Validate inputs
  if (solAmount <= 0) {
    throw new Error('SOL amount must be greater than zero');
  }
  
  if (exchangeRate <= 0) {
    throw new Error('Exchange rate must be greater than zero');
  }
  
  // Calculate SPLITDO amount (rate is SPLITDO per SOL)
  const splitdoAmount = Math.floor((solAmount * exchangeRate) * 100) / 100; // Round to 2 decimals
  
  // Calculate fees
  const priorityFee = SPLITDO_CONFIG.priorityFee / LAMPORTS_PER_SOL; // Convert lamports to SOL
  const networkFee = includeNetworkFee ? 0.000005 : 0; // Base transaction fee
  const totalFees = priorityFee + networkFee;
  
  // Total cost (SOL amount + fees)
  const totalCost = solAmount + totalFees;
  
  // Validate minimum amounts
  if (solAmount < SPLITDO_CONFIG.minSolBalance / LAMPORTS_PER_SOL) {
    throw new Error(`Minimum exchange amount is ${SPLITDO_CONFIG.minSolBalance / LAMPORTS_PER_SOL} SOL`);
  }
  
  logger.debug('Exchange calculation:', {
    solAmount,
    exchangeRate,
    splitdoAmount,
    totalFees,
    totalCost
  });
  
  return {
    solAmount,
    splitdoAmount,
    fees: totalFees,
    totalCost,
    exchangeRate
  };
}

/**
 * Validate exchange parameters before transaction creation
 */
export function validateExchangeParams(
  solAmount: number,
  userBalance: number,
  exchangeRate: number
): { isValid: boolean; error?: ExchangeError } {
  try {
    // Calculate exchange amounts
    const calculation = calculateExchangeAmount(solAmount, exchangeRate);
    
    // Check user balance
    if (userBalance < calculation.totalCost) {
      return {
        isValid: false,
        error: {
          type: 'insufficient_balance',
          message: `Insufficient balance. Required: ${calculation.totalCost.toFixed(6)} SOL, Available: ${userBalance.toFixed(6)} SOL`,
          details: { required: calculation.totalCost, available: userBalance },
          retryable: false
        }
      };
    }
    
    // Validate exchange rate
    if (exchangeRate < 100 || exchangeRate > 10000) {
      return {
        isValid: false,
        error: {
          type: 'validation_error',
          message: 'Exchange rate appears to be invalid. Please refresh and try again.',
          details: { exchangeRate },
          retryable: true
        }
      };
    }
    
    return { isValid: true };
    
  } catch (error) {
    return {
      isValid: false,
      error: {
        type: 'validation_error',
        message: error instanceof Error ? error.message : 'Invalid exchange parameters',
        details: error,
        retryable: false
      }
    };
  }
}

// ================================
// VAULT MANAGEMENT
// ================================

/**
 * Get vault information with HARDCODED receiving address
 */
export async function getVaultInfo(): Promise<VaultInfo> {
  try {
    logger.info('Using HARDCODED vault information...');
    
    // HARDCODED VAULT ADDRESS AS REQUIRED
    const vaultInfo: VaultInfo = {
      address: 'F5bUwq7ttSzqgqVJEA1toXbc31BjPReCoSh9fqkLH62B', // HARDCODED RECEIVING ADDRESS
      exchangeRate: 1173, // Default rate
      isActive: true,
      lastUpdated: new Date().toISOString()
    };
    
    logger.info('HARDCODED vault information:', vaultInfo);
    return vaultInfo;
    
  } catch (error) {
    logger.error('Error with hardcoded vault information:', error);
    
    // Even in error case, return the hardcoded address
    return {
      address: 'F5bUwq7ttSzqgqVJEA1toXbc31BjPReCoSh9fqkLH62B',
      exchangeRate: 1173,
      isActive: true,
      lastUpdated: new Date().toISOString()
    };
  }
}

// ================================
// TRANSACTION CREATION
// ================================

/**
 * Create SOL transfer transaction for exchange
 */
export async function createSolTransferTransaction(
  fromAddress: string,
  toAddress: string,
  amount: number,
  memo?: string
): Promise<Transaction> {
  try {
    logger.info('Creating SOL transfer transaction:', {
      from: fromAddress,
      to: toAddress,
      amount: amount,
      memo: memo || 'No memo'
    });
    
    // Convert SOL to lamports
    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
    
    // Create transfer instruction
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: new PublicKey(fromAddress),
      toPubkey: new PublicKey(toAddress),
      lamports
    });
    
    // Create transaction
    const transaction = new Transaction();
    transaction.add(transferInstruction);
    
    // Add memo instruction if provided
    if (memo) {
      // TODO: Add memo instruction if needed
      // const memoInstruction = new TransactionInstruction({...});
      // transaction.add(memoInstruction);
    }
    
    // Set fee payer
    transaction.feePayer = new PublicKey(fromAddress);
    
    logger.debug('SOL transfer transaction created successfully');
    return transaction;
    
  } catch (error) {
    logger.error('Error creating SOL transfer transaction:', error);
    throw new Error(`Failed to create transfer transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create complete exchange transaction with vault info and calculations
 */
export async function createExchangeTransaction(
  walletAddress: string,
  solAmount: number
): Promise<ExchangeTransaction> {
  try {
    logger.info('Creating complete exchange transaction:', {
      walletAddress,
      solAmount
    });
    
    // Get vault information
    const vaultInfo = await getVaultInfo();
    
    // Calculate exchange amounts
    const calculation = calculateExchangeAmount(solAmount, vaultInfo.exchangeRate);
    
    // Create the SOL transfer transaction
    const transaction = await createSolTransferTransaction(
      walletAddress,
      vaultInfo.address,
      solAmount,
      'SPLITDO Exchange'
    );
    
    const exchangeTransaction: ExchangeTransaction = {
      transaction,
      amount: calculation,
      vaultAddress: vaultInfo.address,
      userAddress: walletAddress
    };
    
    logger.info('Exchange transaction created successfully:', {
      vaultAddress: vaultInfo.address,
      solAmount: calculation.solAmount,
      splitdoAmount: calculation.splitdoAmount,
      fees: calculation.fees
    });
    
    return exchangeTransaction;
    
  } catch (error) {
    logger.error('Error creating exchange transaction:', error);
    throw error; // Re-throw to preserve error details
  }
}

// ================================
// PROGRESS TRACKING
// ================================

/**
 * Get progress messages for different exchange stages
 */
export function getExchangeProgress(stage: ExchangeProgress['stage'], deviceType: DeviceType): ExchangeProgress {
  const progressMap: Record<ExchangeProgress['stage'], { message: string; progress: number }> = {
    preparing: {
      message: 'Preparing exchange transaction...',
      progress: 20
    },
    signing: {
      message: deviceType === 'mobile' ? 'Sign transaction in your wallet app' : 'Please sign the transaction in your wallet',
      progress: 40
    },
    submitting: {
      message: 'Submitting transaction to network...',
      progress: 60
    },
    confirming: {
      message: 'Confirming transaction on blockchain...',
      progress: 80
    },
    complete: {
      message: 'Exchange completed successfully!',
      progress: 100
    },
    error: {
      message: 'Exchange failed. Please try again.',
      progress: 0
    }
  };
  
  const progressInfo = progressMap[stage] || progressMap.error;
  
  return {
    stage,
    message: progressInfo.message,
    progress: progressInfo.progress
  };
}

// ================================
// ERROR HANDLING
// ================================

/**
 * Create standardized exchange error
 */
export function createExchangeError(
  type: ExchangeError['type'],
  message: string,
  details?: any,
  retryable: boolean = true
): ExchangeError {
  return {
    type,
    message,
    details,
    retryable
  };
}

/**
 * Parse wallet error into standardized format with iOS support
 */
export function parseWalletError(error: any): ExchangeError {
  const deviceInfo = getDeviceInfo();
  
  // Use iOS-specific error handling for Phantom mobile
  if (deviceInfo.isPhantomMobile || deviceInfo.requiresDeepLinks) {
    try {
      // Import iOS error handler dynamically
      const { PhantomMobileErrorHandler } = require('./phantom-mobile-errors');
      const iosError = PhantomMobileErrorHandler.parseError(error);
      
      return {
        type: iosError.retryable ? 'network_error' : 'validation_error',
        message: iosError.message,
        details: {
          ...error,
          iosErrorInfo: iosError
        },
        retryable: iosError.retryable
      };
    } catch (importError) {
      logger.warn('Failed to import iOS error handler, using fallback:', importError);
    }
  }

  // Fallback to standard error parsing
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  
  // User rejected transaction
  if (errorMessage.includes('rejected') || errorMessage.includes('denied') || errorMessage.includes('cancelled')) {
    return createExchangeError(
      'user_rejected',
      'Transaction was cancelled by user',
      error,
      true
    );
  }
  
  // Insufficient balance
  if (errorMessage.includes('insufficient') || errorMessage.includes('balance')) {
    return createExchangeError(
      'insufficient_balance',
      'Insufficient balance for transaction',
      error,
      false
    );
  }
  
  // Network error
  if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('connection')) {
    return createExchangeError(
      'network_error',
      'Network error occurred. Please check your connection and try again.',
      error,
      true
    );
  }
  
  // Default to backend error
  return createExchangeError(
    'backend_error',
    'An error occurred during the exchange. Please try again.',
    error,
    true
  );
}

// ================================
// EXPORT UTILITIES
// ================================

export const ExchangeUtils = {
  // Device detection
  detectDeviceType,
  getDeviceInfo,
  
  // MetaMask browser detection (NEW)
  getMetaMaskEnvironment,
  logMetaMaskDetectionDebug,
  validateMetaMaskDetection,
  
  // Calculations
  calculateExchangeAmount,
  validateExchangeParams,
  
  // Vault management
  getVaultInfo,
  
  // Transaction creation
  createSolTransferTransaction,
  createExchangeTransaction,
  
  // Progress tracking
  getExchangeProgress,
  
  // Error handling
  createExchangeError,
  parseWalletError
};

export default ExchangeUtils;