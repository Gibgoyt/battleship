/**
 * Solana Mainnet Configuration
 * Centralized configuration for Solana mainnet operations
 */

export const SOLANA_CONFIG = {
  // RPC Endpoints
  MAINNET_RPC_URL: 'https://api.mainnet-beta.solana.com',
  BACKUP_RPC_URLS: [
    'https://solana-api.projectserum.com',
    'https://rpc.ankr.com/solana'
  ],

  // Commitment levels
  DEFAULT_COMMITMENT: 'confirmed' as const,
  FINALIZED_COMMITMENT: 'finalized' as const,

  // Timeouts
  DEFAULT_TIMEOUT: 15000, // 15 seconds
  FAST_TIMEOUT: 5000,     // 5 seconds for quick operations
  SLOW_TIMEOUT: 30000,    // 30 seconds for complex operations

  // Rate limiting
  RATE_LIMIT_DELAY: 150,  // milliseconds between requests
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,      // milliseconds

  // Transaction history
  DEFAULT_TX_LIMIT: 20,
  MAX_TX_LIMIT: 100,
  CACHE_TIMEOUT: 5 * 60 * 1000, // 5 minutes

  // SPLITDO specific
  SPLITDO_TOKEN_MINT: 'your-splitdo-mint-address', // Replace with actual mint address
  SPLITDO_PROGRAM_ID: 'your-splitdo-program-id',   // Replace with actual program ID

  // Explorer URLs
  EXPLORER_BASE_URL: 'https://explorer.solana.com',
  EXPLORER_CLUSTER: 'mainnet-beta',

  // Solscan URLs (alternative explorer)
  SOLSCAN_BASE_URL: 'https://solscan.io',

  // Common Solana constants
  LAMPORTS_PER_SOL: 1_000_000_000,
  ACCOUNT_RENT_EXEMPTION: 890880, // lamports for rent exemption
  TYPICAL_TX_FEE: 5000,           // lamports
} as const;

/**
 * Get explorer URL for a transaction
 */
export function getTransactionUrl(signature: string): string {
  return `${SOLANA_CONFIG.EXPLORER_BASE_URL}/tx/${signature}?cluster=${SOLANA_CONFIG.EXPLORER_CLUSTER}`;
}

/**
 * Get explorer URL for an account
 */
export function getAccountUrl(address: string): string {
  return `${SOLANA_CONFIG.EXPLORER_BASE_URL}/account/${address}?cluster=${SOLANA_CONFIG.EXPLORER_CLUSTER}`;
}

/**
 * Get Solscan URL for a transaction (alternative explorer)
 */
export function getSolscanTransactionUrl(signature: string): string {
  return `${SOLANA_CONFIG.SOLSCAN_BASE_URL}/tx/${signature}`;
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: number): number {
  return lamports / SOLANA_CONFIG.LAMPORTS_PER_SOL;
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * SOLANA_CONFIG.LAMPORTS_PER_SOL);
}

/**
 * Format SOL amount for display
 */
export function formatSol(lamports: number, decimals: number = 4): string {
  const sol = lamportsToSol(lamports);
  return `${sol.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })} SOL`;
}

/**
 * Validate Solana address format
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    // Basic validation - Solana addresses are base58 and 32-44 characters
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  } catch {
    return false;
  }
}

export default SOLANA_CONFIG;