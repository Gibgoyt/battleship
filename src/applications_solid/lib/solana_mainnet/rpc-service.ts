/**
 * Solana Mainnet RPC Service
 * Handles all RPC calls to Solana mainnet for transaction history and blockchain data
 */

export interface SolanaRPCResponse<T = any> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
  };
}

export interface TransactionSignature {
  signature: string;
  slot: number;
  err: any;
  memo: string | null;
  blockTime: number | null;
}

export interface ProcessedTransaction {
  signature: string;
  slot: number;
  blockTime: string | null;
  fee: number;
  success: boolean;
  error: any;
  preBalances: number[];
  postBalances: number[];
  preTokenBalances: any[];
  postTokenBalances: any[];
  instructions: any[];
  accounts: any[];
  type?: 'exchange' | 'transfer' | 'account_creation' | 'unknown';
  fromAsset?: string;
  toAsset?: string;
  amount?: number;
  toAmount?: number;
}

export interface TransactionHistoryResult {
  success: boolean;
  transactions: ProcessedTransaction[];
  totalFound: number;
  message: string;
  error?: string;
}

class SolanaRPCService {
  // Use backend proxy as primary, fallback to CORS-enabled endpoints
  private readonly RPC_ENDPOINTS = [
    `${window.location.origin}/api/solana/rpc`, // Our backend proxy (PREFERRED)
    'https://rpc.ankr.com/solana',              // Ankr - supports CORS
    'https://solana-api.projectserum.com',     // Project Serum - supports CORS
    'https://solana-mainnet.rpc.extrnode.com', // Alternative endpoint
  ];

  private currentEndpointIndex = 0;
  private requestId = 1;

  private async makeRPCCall<T>(method: string, params: any[]): Promise<SolanaRPCResponse<T>> {
    let lastError: Error | null = null;

    // Try each RPC endpoint until one works
    for (let i = 0; i < this.RPC_ENDPOINTS.length; i++) {
      const endpoint = this.RPC_ENDPOINTS[this.currentEndpointIndex];

      try {
        console.log(`[SolanaRPC] Attempting ${method} with endpoint: ${endpoint}`);

        const isOurProxy = endpoint.includes('/api/solana/rpc');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        // Only add Origin header for external endpoints
        if (!isOurProxy) {
          headers['Origin'] = window.location.origin;
        }

        const requestBody = isOurProxy
          ? { method, params, id: this.requestId++ } // Simplified for our proxy
          : { jsonrpc: '2.0', id: this.requestId++, method, params }; // Standard RPC format

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} from ${endpoint}`);
        }

        const result = await response.json();
        console.log(`[SolanaRPC] Success with endpoint: ${endpoint}`);
        return result;

      } catch (error) {
        console.warn(`[SolanaRPC] Failed with ${endpoint}:`, error);
        lastError = error as Error;

        // Try next endpoint
        this.currentEndpointIndex = (this.currentEndpointIndex + 1) % this.RPC_ENDPOINTS.length;
      }
    }

    // All endpoints failed
    console.error(`[SolanaRPC] All RPC endpoints failed for ${method}`);
    throw lastError || new Error('All RPC endpoints failed');
  }

  /**
   * Get transaction signatures for an address
   */
  async getSignaturesForAddress(address: string, limit: number = 10): Promise<TransactionSignature[]> {
    const response = await this.makeRPCCall<TransactionSignature[]>('getSignaturesForAddress', [
      address,
      {
        limit,
        commitment: 'confirmed'
      }
    ]);

    if (response.error) {
      throw new Error(`RPC error: ${response.error.message}`);
    }

    return response.result || [];
  }

  /**
   * Get detailed transaction information
   */
  async getTransaction(signature: string): Promise<any> {
    const response = await this.makeRPCCall('getTransaction', [
      signature,
      {
        encoding: 'jsonParsed',
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      }
    ]);

    if (response.error) {
      throw new Error(`RPC error: ${response.error.message}`);
    }

    return response.result;
  }

  /**
   * Analyze transaction to determine its type and extract relevant information
   */
  private analyzeTransaction(tx: any): Partial<ProcessedTransaction> {
    const instructions = tx.transaction?.message?.instructions || [];
    const preTokenBalances = tx.meta?.preTokenBalances || [];
    const postTokenBalances = tx.meta?.postTokenBalances || [];

    // Check for account creation (usually has System Program instruction)
    const hasSystemProgram = instructions.some((inst: any) =>
      inst.programId === '11111111111111111111111111111111'
    );

    // Check for token transfers (SPL Token Program)
    const hasTokenProgram = instructions.some((inst: any) =>
      inst.programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
    );

    // Analyze token balance changes
    let type: ProcessedTransaction['type'] = 'unknown';
    let fromAsset: string | undefined;
    let toAsset: string | undefined;
    let amount: number | undefined;
    let toAmount: number | undefined;

    if (hasSystemProgram && preTokenBalances.length === 0 && postTokenBalances.length > 0) {
      // Account creation - no pre-token balance but has post-token balance
      type = 'account_creation';
      fromAsset = 'SOL';
      amount = tx.meta?.fee || 0;
    } else if (hasTokenProgram && preTokenBalances.length > 0 && postTokenBalances.length > 0) {
      // Token operation (transfer or exchange)
      const preBalance = preTokenBalances[0];
      const postBalance = postTokenBalances[0];

      if (preBalance && postBalance) {
        const preAmount = parseFloat(preBalance.uiTokenAmount?.uiAmountString || '0');
        const postAmount = parseFloat(postBalance.uiTokenAmount?.uiAmountString || '0');

        if (postAmount > preAmount) {
          // Token increase - likely an exchange (SOL -> SPLITDO)
          type = 'exchange';
          fromAsset = 'SOL';
          toAsset = 'SPLITDO';
          toAmount = postAmount - preAmount;

          // Estimate SOL amount from fee and balance changes
          const solPreBalance = tx.meta?.preBalances?.[0] || 0;
          const solPostBalance = tx.meta?.postBalances?.[0] || 0;
          amount = (solPreBalance - solPostBalance) / 1000000000; // Convert lamports to SOL
        } else if (preAmount > postAmount) {
          // Token decrease - likely a transfer
          type = 'transfer';
          fromAsset = 'SPLITDO';
          amount = preAmount - postAmount;
        }
      }
    }

    return {
      type,
      fromAsset,
      toAsset,
      amount,
      toAmount
    };
  }

  /**
   * Get comprehensive transaction history for an address with analysis
   */
  async getTransactionHistory(address: string, limit: number = 10): Promise<TransactionHistoryResult> {
    try {
      console.log(`Fetching transaction signatures for address: ${address}`);

      // Step 1: Get transaction signatures
      const signatures = await this.getSignaturesForAddress(address, limit);
      console.log(`Found ${signatures.length} transaction signatures`);

      if (signatures.length === 0) {
        return {
          success: true,
          transactions: [],
          totalFound: 0,
          message: 'No transactions found for this address'
        };
      }

      // Step 2: Get detailed transaction data
      const transactions: ProcessedTransaction[] = [];

      for (let i = 0; i < signatures.length; i++) {
        const signature = signatures[i].signature;
        console.log(`Fetching transaction ${i + 1}/${signatures.length}: ${signature}`);

        try {
          const tx = await this.getTransaction(signature);

          if (tx) {
            // Analyze transaction to determine type
            const analysis = this.analyzeTransaction(tx);

            const processedTx: ProcessedTransaction = {
              signature,
              slot: tx.slot,
              blockTime: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : null,
              fee: tx.meta?.fee || 0,
              success: tx.meta?.err === null,
              error: tx.meta?.err,
              preBalances: tx.meta?.preBalances || [],
              postBalances: tx.meta?.postBalances || [],
              preTokenBalances: tx.meta?.preTokenBalances || [],
              postTokenBalances: tx.meta?.postTokenBalances || [],
              instructions: tx.transaction?.message?.instructions || [],
              accounts: tx.transaction?.message?.accountKeys || [],
              ...analysis
            };

            transactions.push(processedTx);
          }

          // Add delay to avoid rate limiting
          if (i < signatures.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

        } catch (error) {
          console.warn(`Error fetching transaction ${signature}:`, error);
          // Continue with other transactions even if one fails
        }
      }

      return {
        success: true,
        transactions,
        totalFound: signatures.length,
        message: `Successfully retrieved ${transactions.length} out of ${signatures.length} transactions`
      };

    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        transactions: [],
        totalFound: 0,
        message: 'Failed to fetch transaction history'
      };
    }
  }
}

// Create singleton instance
export const solanaRPCService = new SolanaRPCService();

export default solanaRPCService;