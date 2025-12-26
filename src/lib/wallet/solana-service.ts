/**
 * Enhanced Solana Service for SPLITDO
 * Handles all Solana blockchain interactions with multi-wallet support
 * Supports Phantom, MetaMask, and Wallet Standard wallets
 */

// Import browser polyfills FIRST to ensure Buffer is available
import './browser-polyfills';

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import type {
  Commitment,
  ConfirmOptions,
  SendOptions,
  TransactionSignature
} from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError
} from '@solana/spl-token';
import { SPLITDO_CONFIG, ERROR_MESSAGES, BACKEND_SOLANA_API } from './walletconnect-config';
import { SolanaBrowserError } from './solana-browser-safe';
import type { WalletProvider } from './wallet-providers';

// Wallet-agnostic transaction creation and signing interface
export interface WalletTransactionRequest {
  provider: WalletProvider;
  transaction: Transaction;
  options?: {
    skipPreflight?: boolean;
    preflightCommitment?: Commitment;
    maxRetries?: number;
  };
}

export interface WalletTransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
  provider?: WalletProvider;
}

export interface SolanaBalance {
  sol: number;
  lamports: number;
}

export interface TokenBalance {
  address: string;
  amount: string;
  decimals: number;
  uiAmount: number | null;
}

export interface TokenAccount {
  address: string;
  mint: string;
  owner: string;
  balance: TokenBalance;
  isAssociated: boolean;
}

export interface ProgramInfo {
  exchange_rate: number;
  last_updated: string;
  program_authority: string;
  program_vault_usdc: string;
  total_collateral_usdc: number;
  total_supply_tokens: number;
  usdc_mint_address: string;
  utility_token_mint: string;
}

export interface CreateATATransactionRequest {
  walletAddress: string;
  tokenMint: string;
  payer?: string;
}

export interface CreateATATransactionResult {
  transaction: Transaction;
  associatedTokenAddress: string;
  needsCreation: boolean;
}

// API Response Types
export interface APISuccessResponse<T = any> {
  success: true;
  data: T;
}

export interface APIErrorResponse {
  success: false;
  message?: string;
  error?: string;
}

export type APIResponse<T = any> = APISuccessResponse<T> | APIErrorResponse;

// Specific API data types
export interface CreateATAApiData {
  transaction_signature: string;
}

export interface TokenBalanceApiData {
  balance_tokens: number;
}

export interface ProgramInfoApiResponse {
  success: boolean;
  data: ProgramInfo;
  message?: string;
}

export class EnhancedSolanaService {
  private programInfo: ProgramInfo | null = null;
  private programInfoCache: { data: ProgramInfo; timestamp: number } | null = null;
  private blockhashCache: { blockhash: string; timestamp: number } | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly BLOCKHASH_CACHE_TTL = 30 * 1000; // 30 seconds

  constructor() {
    // No longer need to initialize Connection - using backend API
    console.debug('[SolanaService] Initialized with backend API integration');
  }

  /**
   * Get recent blockhash from backend API (no rate limits)
   */
  private async getRecentBlockhash(): Promise<string> {
    // Check cache first
    if (this.blockhashCache && (Date.now() - this.blockhashCache.timestamp) < this.BLOCKHASH_CACHE_TTL) {
      return this.blockhashCache.blockhash;
    }

    try {
      const response = await fetch(`${BACKEND_SOLANA_API.baseUrl}${BACKEND_SOLANA_API.endpoints.recentBlockhash}`);

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.blockhash) {
        throw new Error('Invalid response from backend blockhash API');
      }

      // Cache the blockhash
      this.blockhashCache = {
        blockhash: data.blockhash,
        timestamp: Date.now()
      };

      return data.blockhash;
    } catch (error) {
      console.error('[SolanaService] Failed to get recent blockhash:', error);
      throw new Error('Failed to get recent blockhash from backend API');
    }
  }

  /**
   * Check network health via backend API
   */
  private async checkNetworkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${BACKEND_SOLANA_API.baseUrl}${BACKEND_SOLANA_API.endpoints.networkHealth}`);

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.success && data.health?.status === 'ok';
    } catch (error) {
      console.error('[SolanaService] Network health check failed:', error);
      return false;
    }
  }

  /**
   * Get wallet balance via backend API
   */
  async getWalletBalance(walletAddress: string): Promise<number> {
    try {
      const endpoint = BACKEND_SOLANA_API.endpoints.walletBalance.replace(':pubkey', walletAddress);
      const response = await fetch(`${BACKEND_SOLANA_API.baseUrl}${endpoint}`);

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('Failed to get wallet balance from backend API');
      }

      return data.balance || 0;
    } catch (error) {
      console.error('[SolanaService] Failed to get wallet balance:', error);
      throw new Error('Failed to get wallet balance');
    }
  }

  /**
   * Check backend API connectivity (replaces RPC connection initialization)
   */
  private async checkBackendConnectivity(): Promise<boolean> {
    try {
      const isHealthy = await this.checkNetworkHealth();
      if (isHealthy) {
        console.debug('[SolanaService] Backend API connectivity verified');
        return true;
      } else {
        console.warn('[SolanaService] Backend API health check failed');
        return false;
      }
    } catch (error) {
      console.error('[SolanaService] Backend API connectivity check failed:', error);
      return false;
    }
  }

  /**
   * Ensure backend API is available (replaces connection check)
   */
  private async ensureBackendAvailable(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('Backend API not available in server-side environment');
    }

    const isAvailable = await this.checkBackendConnectivity();
    if (!isAvailable) {
      throw new Error('Backend API is not available');
    }
  }

  /**
   * Get SOL balance for a wallet address (via backend API)
   */
  async getSolBalance(walletAddress: string): Promise<SolanaBalance> {
    try {
      await this.ensureBackendAvailable();
      const lamports = await this.getWalletBalance(walletAddress);

      return {
        sol: lamports / LAMPORTS_PER_SOL,
        lamports
      };
    } catch (error) {
      console.error('Error getting SOL balance:', error);
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
  }

  /**
   * Get token balance for a specific token account (via backend API)
   */
  async getTokenBalance(tokenAccountAddress: string): Promise<TokenBalance> {
    try {
      await this.ensureBackendAvailable();

      // For now, we'll use the SPLITDO balance endpoint which already exists
      // In a full implementation, we'd add a generic token balance endpoint
      throw new Error('Generic token balance not implemented - use checkSplitdoBalance instead');
    } catch (error) {
      console.error('Error getting token balance:', error);
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
  }

  /**
   * Get the Associated Token Account address for a wallet and mint
   */
  async getAssociatedTokenAddress(walletAddress: string, mintAddress: string): Promise<string> {
    try {
      const wallet = new PublicKey(walletAddress);
      const mint = new PublicKey(mintAddress);

      const ataAddress = getAssociatedTokenAddressSync(
        mint,
        wallet,
        false, // allowOwnerOffCurve
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      return ataAddress.toBase58();
    } catch (error) {
      console.error('Error deriving ATA address:', error);
      throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
    }
  }

  /**
   * Check if an Associated Token Account exists for SPLITDO (via backend API)
   * For other tokens, use the respective backend endpoints
   */
  async checkSplitdoATAExists(walletAddress: string, firebaseToken: string): Promise<{
    exists: boolean;
    address: string;
    balance?: number;
  }> {
    try {
      const ataAddress = await this.getAssociatedTokenAddress(walletAddress, await this.getSplitdoMint());
      const balanceCheck = await this.checkSplitdoBalance(firebaseToken);

      return {
        exists: balanceCheck.hasAccount,
        address: ataAddress,
        balance: balanceCheck.balance
      };
    } catch (error) {
      console.error('Error checking SPLITDO ATA existence:', error);
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
  }

  /**
   * Create a transaction to create an Associated Token Account
   */
  async createATATransaction({
    walletAddress,
    tokenMint,
    payer
  }: CreateATATransactionRequest): Promise<CreateATATransactionResult> {
    try {
      await this.ensureBackendAvailable();
      const wallet = new PublicKey(walletAddress);
      const mint = new PublicKey(tokenMint);
      const payerKey = payer ? new PublicKey(payer) : wallet;

      // Get the ATA address
      const associatedTokenAddress = getAssociatedTokenAddressSync(
        mint,
        wallet,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Note: For ATA creation, we'll assume it needs creation and let the backend handle existence checks
      // This simplifies the frontend and avoids additional RPC calls

      // Create the transaction
      const transaction = new Transaction();

      // Add create ATA instruction
      const createATAInstruction = createAssociatedTokenAccountInstruction(
        payerKey,        // payer
        associatedTokenAddress,  // associatedToken
        wallet,          // owner
        mint,            // mint
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      transaction.add(createATAInstruction);

      // Get recent blockhash from backend API (no rate limits)
      const blockhash = await this.getRecentBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = payerKey;

      return {
        transaction,
        associatedTokenAddress: associatedTokenAddress.toBase58(),
        needsCreation: true
      };
    } catch (error) {
      console.error('Error creating ATA transaction:', error);
      throw new Error(ERROR_MESSAGES.TRANSACTION_FAILED);
    }
  }

  /**
   * Create and sign SPLITDO ATA transaction with wallet provider
   */
  async createSplitdoATA(provider: WalletProvider): Promise<{
    success: boolean;
    signature?: string;
    ataAddress?: string;
    error?: string;
  }> {
    try {
      if (!provider.isConnected()) {
        throw new Error('Wallet not connected');
      }

      const publicKey = provider.getPublicKey();
      if (!publicKey) {
        throw new Error('Wallet public key not available');
      }

      const walletAddress = publicKey.toString();

      // Pre-flight balance check via backend API
      console.debug('[SolanaService] Performing pre-flight balance check...');
      const balance = await this.getWalletBalance(walletAddress);
      if (balance < SPLITDO_CONFIG.minSolBalance) {
        throw new Error(`Insufficient SOL balance for transaction fees. Required: ${SPLITDO_CONFIG.minSolBalance / LAMPORTS_PER_SOL} SOL, Available: ${balance / LAMPORTS_PER_SOL} SOL`);
      }
      console.debug('[SolanaService] Pre-flight balance check passed', { balance, required: SPLITDO_CONFIG.minSolBalance });

      // Get SPLITDO mint from backend API
      const programInfo = await this.getProgramInfo();
      const mintAddress = programInfo.utility_token_mint;

      // Create ATA transaction
      const result = await this.createATATransaction({
        walletAddress,
        tokenMint: mintAddress
      });

      if (!result.needsCreation) {
        // ATA already exists
        return {
          success: true,
          ataAddress: result.associatedTokenAddress
        };
      }

      // Sign transaction with wallet provider (MetaMask/Phantom)
      console.debug('[SolanaService] Requesting wallet signature for ATA creation...');
      const signedTransaction = await provider.signTransaction(result.transaction);

      // Serialize transaction for backend submission
      const serializedTransaction = signedTransaction.serialize({ requireAllSignatures: false }).toString('base64');

      // Submit to backend API (we need Firebase token for this)
      // This method will be called from the wallet context where we have the token
      return {
        success: true,
        ataAddress: result.associatedTokenAddress,
        signature: serializedTransaction
      };
    } catch (error) {
      console.error('Error creating SPLITDO ATA:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Submit signed ATA transaction to backend (requires Firebase token)
   */
  async submitSignedATATransaction(
    firebaseToken: string,
    walletAddress: string,
    ataAddress: string,
    signedTransaction: string
  ): Promise<{
    success: boolean;
    transactionSignature?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${SPLITDO_CONFIG.apiBaseUrl}/splitdo-token/accounts/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firebaseToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          token_account_address: ataAddress,
          signed_transaction: signedTransaction
        })
      });

      const result = await response.json() as APIResponse<CreateATAApiData>;

      if (response.ok && result.success) {
        return {
          success: true,
          transactionSignature: result.data.transaction_signature
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to create token account'
        };
      }
    } catch (error) {
      console.error('Error submitting signed ATA transaction:', error);
      return {
        success: false,
        error: ERROR_MESSAGES.NETWORK_ERROR
      };
    }
  }

  /**
   * Get SPLITDO program information from the backend API
   */
  async getProgramInfo(forceRefresh = false): Promise<ProgramInfo> {
    try {
      // Check cache first
      if (
        !forceRefresh &&
        this.programInfoCache &&
        (Date.now() - this.programInfoCache.timestamp) < this.CACHE_TTL
      ) {
        return this.programInfoCache.data;
      }

      const response = await fetch(`${SPLITDO_CONFIG.apiBaseUrl}/splitdo-token/program/info`);

      if (!response.ok) {
        throw new Error(`Failed to fetch program info: ${response.status}`);
      }

      const result = await response.json() as ProgramInfoApiResponse;

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch program info');
      }

      const programInfo = result.data;

      // Update cache
      this.programInfoCache = {
        data: programInfo,
        timestamp: Date.now()
      };

      this.programInfo = programInfo;
      return programInfo;
    } catch (error) {
      console.error('Error fetching program info:', error);
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
  }

  /**
   * Get SPLITDO token mint address
   */
  async getSplitdoMint(): Promise<string> {
    const programInfo = await this.getProgramInfo();
    return programInfo.utility_token_mint;
  }

  /**
   * Check if a wallet has a SPLITDO token account via backend API
   */
  async checkSplitdoBalance(firebaseToken: string): Promise<{
    hasAccount: boolean;
    balance?: number;
    error?: string;
  }> {
    try {
      const response = await fetch(`${SPLITDO_CONFIG.apiBaseUrl}/splitdo-token/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${firebaseToken}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json() as APIResponse<TokenBalanceApiData>;

      if (response.ok && result.success) {
        return {
          hasAccount: true,
          balance: result.data.balance_tokens
        };
      } else if (result.error === 'ACCOUNT_NOT_FOUND') {
        return {
          hasAccount: false
        };
      } else {
        return {
          hasAccount: false,
          error: result.message || 'Unknown error'
        };
      }
    } catch (error) {
      console.error('Error checking SPLITDO balance:', error);
      return {
        hasAccount: false,
        error: ERROR_MESSAGES.NETWORK_ERROR
      };
    }
  }

  /**
   * Submit a signed transaction to create SPLITDO token account via backend API
   */
  async submitATACreation(
    firebaseToken: string,
    walletAddress: string,
    tokenAccountAddress: string,
    signedTransaction: string
  ): Promise<{
    success: boolean;
    transactionSignature?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${SPLITDO_CONFIG.apiBaseUrl}/splitdo-token/accounts/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firebaseToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          token_account_address: tokenAccountAddress,
          signed_transaction: signedTransaction
        })
      });

      const result = await response.json() as APIResponse<CreateATAApiData>;

      if (response.ok && result.success) {
        return {
          success: true,
          transactionSignature: result.data.transaction_signature
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to create token account'
        };
      }
    } catch (error) {
      console.error('Error submitting ATA creation:', error);
      return {
        success: false,
        error: ERROR_MESSAGES.NETWORK_ERROR
      };
    }
  }

  /**
   * Get estimated transaction fee (backend API handles this)
   */
  getEstimatedTransactionFee(): number {
    // Return the standard ATA creation fee
    // Backend handles actual fee calculation
    return SPLITDO_CONFIG.priorityFee || 5000; // lamports
  }

  /**
   * Check if wallet has sufficient SOL for transaction fees
   */
  async checkSufficientBalance(walletAddress: string, requiredLamports = SPLITDO_CONFIG.minSolBalance): Promise<boolean> {
    try {
      const balance = await this.getSolBalance(walletAddress);
      return balance.lamports >= requiredLamports;
    } catch (error) {
      console.error('Error checking wallet balance:', error);
      return false;
    }
  }

  /**
   * Get network info via backend API
   */
  async getNetworkInfo(): Promise<{
    cluster: string;
    healthy: boolean;
  }> {
    try {
      const isHealthy = await this.checkNetworkHealth();
      return {
        cluster: 'mainnet', // SPLITDO runs on mainnet
        healthy: isHealthy
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    // Clear cache
    this.programInfoCache = null;
    this.programInfo = null;

    // Note: Connection doesn't have a direct disconnect method
    // but we can nullify our reference if needed
  }
}

// Legacy class for backward compatibility
export class SolanaService extends EnhancedSolanaService {
  constructor() {
    super();
    console.warn('SolanaService is deprecated. Use EnhancedSolanaService instead.');
  }

  // Legacy methods that used the old wallet system
  async submitATACreation(
    firebaseToken: string,
    walletAddress: string,
    tokenAccountAddress: string,
    signedTransaction: string
  ) {
    return await this.submitSignedATATransaction(
      firebaseToken,
      walletAddress,
      tokenAccountAddress,
      signedTransaction
    );
  }
}

// Export enhanced service as default
export const solanaService = new EnhancedSolanaService();

// Export legacy service for backward compatibility
export { solanaService as legacySolanaService };