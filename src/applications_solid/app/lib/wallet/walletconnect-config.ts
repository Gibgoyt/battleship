/**
 * Solana Wallet Adapter Configuration for SPLITDO
 * Supports Solana wallets including Phantom, Solflare, Backpack, etc.
 */

export interface SolanaWalletConfig {
  network: string;
  endpoint: string;
  commitment: string;
  supportedWallets: string[];
}

// Solana network configuration
export const SOLANA_NETWORKS = {
  devnet: "https://api.devnet.solana.com",
  testnet: "https://api.testnet.solana.com",
  mainnet: "https://api.mainnet-beta.solana.com"
} as const;

// Current network - MAINNET for production
export const CURRENT_NETWORK = "mainnet" as keyof typeof SOLANA_NETWORKS;

// Supported wallet configurations
export const SUPPORTED_WALLETS = [
  {
    id: "phantom",
    name: "Phantom",
    icon: "🟣",
    description: "Popular Solana wallet with DeFi support",
    popular: true,
    downloadUrl: "https://phantom.app/",
    deepLink: "phantom://",
    universalLink: "https://phantom.app/ul/"
  },
  {
    id: "solflare",
    name: "Solflare",
    icon: "☀️",
    description: "Native Solana wallet with staking",
    popular: false,
    downloadUrl: "https://solflare.com/",
    deepLink: "solflare://",
    universalLink: "https://solflare.com/ul/"
  },
  {
    id: "backpack",
    name: "Backpack",
    icon: "🎒",
    description: "Multi-chain wallet by Mad Lads",
    popular: false,
    downloadUrl: "https://www.backpack.app/",
    deepLink: "backpack://",
    universalLink: "https://www.backpack.app/ul/"
  },
  {
    id: "glow",
    name: "Glow",
    icon: "✨",
    description: "Solana mobile wallet with yield",
    popular: false,
    downloadUrl: "https://glow.app/",
    deepLink: "glow://",
    universalLink: "https://glow.app/ul/"
  },
  {
    id: "slope",
    name: "Slope",
    icon: "📈",
    description: "Solana DeFi wallet with trading",
    popular: false,
    downloadUrl: "https://slope.finance/",
    deepLink: "slope://",
    universalLink: "https://slope.finance/ul/"
  }
] as const;

// QR Code configuration for desktop connections
export const QR_CODE_CONFIG = {
  size: 300,
  bgColor: "#ffffff",
  fgColor: "#000000",
  level: "M" as const,
  includeMargin: true
};

// Connection timeouts and retry configuration
export const CONNECTION_CONFIG = {
  timeoutMs: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelayMs: 2000, // 2 seconds
  keepAlive: true
};

// Backend Solana API configuration (no rate limits)
export const BACKEND_SOLANA_API = {
  baseUrl: typeof window !== 'undefined'
    ? (window.location.hostname === 'localhost'
        ? `http://localhost:8444`
        : `https://devbackend.splitdo.app:8443`)
    : `https://devbackend.splitdo.app:8443`,

  endpoints: {
    // Solana network endpoints
    recentBlockhash: "/api/solana/network/recent-blockhash",
    networkHealth: "/api/solana/network/health",
    fees: "/api/solana/network/fees",
    slot: "/api/solana/network/slot",

    // Wallet endpoints
    walletBalance: "/api/solana/wallet/:pubkey/balance",

    // SPLITDO token endpoints
    splitdoTokenInfo: "/api/splitdo-token/program/info",
    splitdoBalance: "/api/splitdo-token/balance",
    createAccount: "/api/splitdo-token/accounts/create"
  }
} as const;

// SPLITDO specific configuration
export const SPLITDO_CONFIG = {
  // Backend API endpoints (for SPLITDO operations)
  apiBaseUrl: BACKEND_SOLANA_API.baseUrl + "/api",

  // Token information
  tokenMint: "6vdfHTgLiEXvoGVp8Ga2HaKQsPKj6DrUTee7526SCXoM", // Will be fetched from API

  // Note: No longer using direct RPC - using backend API instead
  // This eliminates 403 Forbidden errors from rate limiting

  // Transaction confirmation settings
  commitment: "confirmed" as const,
  preflightCommitment: "processed" as const,
  maxRetries: 3,

  // Fee configuration
  priorityFee: 5000, // 0.000005 SOL
  computeUnitLimit: 200000,

  // ATA creation parameters
  ataRentExempt: 2039280, // Rent-exempt amount for token accounts (in lamports)
  minSolBalance: 10000000 // 0.01 SOL minimum for transactions
};

// Error messages for user feedback
export const ERROR_MESSAGES = {
  CONNECTION_FAILED: "Failed to connect to wallet. Please try again.",
  TRANSACTION_FAILED: "Transaction failed. Please check your wallet and try again.",
  INSUFFICIENT_FUNDS: "Insufficient SOL balance for transaction fees.",
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  WALLET_NOT_FOUND: "Wallet not found. Please install a supported Solana wallet.",
  USER_REJECTED: "Transaction was rejected by the user.",
  TIMEOUT: "Connection timed out. Please try again.",
  INVALID_ADDRESS: "Invalid Solana address provided.",
  TOKEN_ACCOUNT_EXISTS: "SPLITDO token account already exists for this wallet.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please contact support."
} as const;

export type SupportedWalletId = typeof SUPPORTED_WALLETS[number]['id'];
export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;