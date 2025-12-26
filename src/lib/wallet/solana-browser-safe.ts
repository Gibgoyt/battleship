/**
 * Browser-Safe Solana Library Wrapper
 * Safely imports Solana libraries with proper polyfills and error handling
 */

// Import polyfills first
import './browser-polyfills';
import { isBrowser, checkBrowserSupport, getEnvironmentInfo } from './browser-polyfills';

// Browser-safe Solana imports with dynamic loading
let SolanaWeb3: typeof import('@solana/web3.js') | null = null;
let SolanaSplToken: typeof import('@solana/spl-token') | null = null;

/**
 * Lazy load Solana Web3.js library
 */
export async function getSolanaWeb3() {
  if (!isBrowser) {
    throw new Error('Solana Web3.js is not available in server-side environment');
  }

  // Check browser support first
  const support = checkBrowserSupport();
  if (!support.supported) {
    throw new Error(`Browser missing required features: ${support.missingFeatures.join(', ')}`);
  }

  if (!SolanaWeb3) {
    try {
      SolanaWeb3 = await import('@solana/web3.js');
      console.debug('[SolanaBrowserSafe] Solana Web3.js loaded successfully');
    } catch (error) {
      console.error('[SolanaBrowserSafe] Failed to load Solana Web3.js:', error);
      throw new Error(`Failed to load Solana Web3.js: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return SolanaWeb3;
}

/**
 * Lazy load Solana SPL Token library
 */
export async function getSolanaSplToken() {
  if (!isBrowser) {
    throw new Error('Solana SPL Token is not available in server-side environment');
  }

  // Check browser support first
  const support = checkBrowserSupport();
  if (!support.supported) {
    throw new Error(`Browser missing required features: ${support.missingFeatures.join(', ')}`);
  }

  if (!SolanaSplToken) {
    try {
      SolanaSplToken = await import('@solana/spl-token');
      console.debug('[SolanaBrowserSafe] Solana SPL Token loaded successfully');
    } catch (error) {
      console.error('[SolanaBrowserSafe] Failed to load Solana SPL Token:', error);
      throw new Error(`Failed to load Solana SPL Token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return SolanaSplToken;
}

/**
 * Browser-safe Connection creation
 */
export async function createConnection(endpoint: string, options?: any) {
  const Web3 = await getSolanaWeb3();
  return new Web3.Connection(endpoint, options);
}

/**
 * Browser-safe PublicKey creation
 */
export async function createPublicKey(value: string | number[] | Uint8Array) {
  const Web3 = await getSolanaWeb3();
  return new Web3.PublicKey(value);
}

/**
 * Browser-safe Transaction creation
 */
export async function createTransaction() {
  const Web3 = await getSolanaWeb3();
  return new Web3.Transaction();
}

/**
 * Browser-safe SystemProgram access
 */
export async function getSystemProgram() {
  const Web3 = await getSolanaWeb3();
  return Web3.SystemProgram;
}

/**
 * Browser-safe getAssociatedTokenAddressSync
 */
export async function getAssociatedTokenAddressSync(
  mint: any,
  owner: any,
  allowOwnerOffCurve?: boolean,
  programId?: any,
  associatedTokenProgramId?: any
) {
  const SplToken = await getSolanaSplToken();
  return SplToken.getAssociatedTokenAddressSync(
    mint,
    owner,
    allowOwnerOffCurve,
    programId,
    associatedTokenProgramId
  );
}

/**
 * Browser-safe createAssociatedTokenAccountInstruction
 */
export async function createAssociatedTokenAccountInstruction(
  payer: any,
  associatedToken: any,
  owner: any,
  mint: any,
  programId?: any,
  associatedTokenProgramId?: any
) {
  const SplToken = await getSolanaSplToken();
  return SplToken.createAssociatedTokenAccountInstruction(
    payer,
    associatedToken,
    owner,
    mint,
    programId,
    associatedTokenProgramId
  );
}

/**
 * Browser-safe getAccount
 */
export async function getAccount(connection: any, address: any, commitment?: any, programId?: any) {
  const SplToken = await getSolanaSplToken();
  return SplToken.getAccount(connection, address, commitment, programId);
}

/**
 * Browser-safe TOKEN_PROGRAM_ID
 */
export async function getTokenProgramId() {
  const SplToken = await getSolanaSplToken();
  return SplToken.TOKEN_PROGRAM_ID;
}

/**
 * Browser-safe ASSOCIATED_TOKEN_PROGRAM_ID
 */
export async function getAssociatedTokenProgramId() {
  const SplToken = await getSolanaSplToken();
  return SplToken.ASSOCIATED_TOKEN_PROGRAM_ID;
}

/**
 * Browser-safe LAMPORTS_PER_SOL
 */
export async function getLamportsPerSol() {
  const Web3 = await getSolanaWeb3();
  return Web3.LAMPORTS_PER_SOL;
}

/**
 * Check if Solana libraries can be loaded safely
 */
export async function checkSolanaSupport(): Promise<{
  supported: boolean;
  error?: string;
  environmentInfo: ReturnType<typeof getEnvironmentInfo>;
}> {
  const environmentInfo = getEnvironmentInfo();

  if (!isBrowser) {
    return {
      supported: false,
      error: 'Not in browser environment',
      environmentInfo
    };
  }

  const browserSupport = checkBrowserSupport();
  if (!browserSupport.supported) {
    return {
      supported: false,
      error: `Browser missing features: ${browserSupport.missingFeatures.join(', ')}`,
      environmentInfo
    };
  }

  try {
    // Try to load both libraries
    await getSolanaWeb3();
    await getSolanaSplToken();

    return {
      supported: true,
      environmentInfo
    };
  } catch (error) {
    return {
      supported: false,
      error: error instanceof Error ? error.message : 'Unknown error loading Solana libraries',
      environmentInfo
    };
  }
}

// Export error types
export class SolanaBrowserError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'SolanaBrowserError';
  }
}

export class BrowserUnsupportedError extends SolanaBrowserError {
  constructor(missingFeatures: string[]) {
    super(`Browser missing required features: ${missingFeatures.join(', ')}`);
    this.name = 'BrowserUnsupportedError';
  }
}

export class SolanaLoadError extends SolanaBrowserError {
  constructor(library: string, cause: Error) {
    super(`Failed to load ${library}`, cause);
    this.name = 'SolanaLoadError';
  }
}