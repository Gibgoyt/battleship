/**
 * Solana Mainnet RPC Client
 * Professional RPC client for Solana mainnet operations
 */

export interface SolanaRPCConfig {
  endpoint: string;
  commitment?: 'processed' | 'confirmed' | 'finalized';
  timeout?: number;
}

export interface TransactionSignature {
  signature: string;
  slot?: number;
  err?: any;
  memo?: string;
  blockTime?: number | null;
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
  type: 'exchange' | 'transfer' | 'account_creation' | 'unknown';
  fromAsset?: string;
  toAsset?: string;
  amount?: number;
  toAmount?: number;
}

export class SolanaMainnetRPC {
  private endpoint: string;
  private commitment: string;
  private timeout: number;

  constructor(config: SolanaRPCConfig = {}) {
    this.endpoint = config.endpoint || 'https://api.mainnet-beta.solana.com';
    this.commitment = config.commitment || 'confirmed';
    this.timeout = config.timeout || 10000;
  }

  /**
   * Make a JSON-RPC call to Solana mainnet
   */
  private async rpcCall(method: string, params: any[], id: number = 1): Promise<any> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id,
          method,
          params
        }),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`RPC error: ${data.error.message}`);
      }

      return data.result;
    } catch (error) {
      console.error(`RPC call failed for ${method}:`, error);
      throw error;
    }
  }

  /**
   * Get transaction signatures for a specific address
   */
  async getSignaturesForAddress(
    address: string,
    options: { limit?: number; before?: string; until?: string } = {}
  ): Promise<TransactionSignature[]> {
    const params = [
      address,
      {
        limit: options.limit || 10,
        commitment: this.commitment,
        ...options
      }
    ];

    return await this.rpcCall('getSignaturesForAddress', params);
  }

  /**
   * Get detailed transaction information
   */
  async getTransaction(signature: string): Promise<any> {
    const params = [
      signature,
      {
        encoding: 'jsonParsed',
        commitment: this.commitment,
        maxSupportedTransactionVersion: 0
      }
    ];

    return await this.rpcCall('getTransaction', params);
  }

  /**
   * Get account balance in SOL
   */
  async getBalance(address: string): Promise<number> {
    const params = [address, { commitment: this.commitment }];
    const balance = await this.rpcCall('getBalance', params);
    return balance?.value || 0;
  }

  /**
   * Get SPL token account balance
   */
  async getTokenAccountBalance(address: string): Promise<any> {
    const params = [address, { commitment: this.commitment }];
    return await this.rpcCall('getTokenAccountBalance', params);
  }

  /**
   * Analyze transaction to determine type and extract relevant information
   */
  private analyzeTransaction(tx: any): Partial<ProcessedTransaction> {
    const instructions = tx.transaction?.message?.instructions || [];
    const preTokenBalances = tx.meta?.preTokenBalances || [];
    const postTokenBalances = tx.meta?.postTokenBalances || [];

    // Check for account creation (CreateAccount instruction)
    const hasCreateAccount = instructions.some((inst: any) =>
      inst.program === 'system' &&
      inst.parsed?.type === 'createAccount'
    );

    if (hasCreateAccount) {
      return {
        type: 'account_creation',
        fromAsset: 'SOL',
        amount: tx.meta?.fee || 0
      };
    }

    // Check for SPL token transfers
    const tokenTransfers = instructions.filter((inst: any) =>
      inst.program === 'spl-token' &&
      (inst.parsed?.type === 'transfer' || inst.parsed?.type === 'transferChecked')
    );

    if (tokenTransfers.length > 0) {
      const transfer = tokenTransfers[0];
      const info = transfer.parsed?.info;

      if (info) {
        // Check if this involves SPLITDO tokens
        const isSplitdoTransfer = preTokenBalances.some((bal: any) =>
          bal.mint === 'your-splitdo-mint-address' // Replace with actual SPLITDO mint
        ) || postTokenBalances.some((bal: any) =>
          bal.mint === 'your-splitdo-mint-address'
        );

        if (isSplitdoTransfer) {
          return {
            type: 'exchange',
            fromAsset: 'SOL',
            toAsset: 'SPLITDO',
            amount: info.amount ? parseFloat(info.amount) / Math.pow(10, info.decimals || 9) : 0
          };
        } else {
          return {
            type: 'transfer',
            fromAsset: 'SPLITDO',
            amount: info.amount ? parseFloat(info.amount) / Math.pow(10, info.decimals || 9) : 0
          };
        }
      }
    }

    return {
      type: 'unknown'
    };
  }

  /**
   * Get comprehensive transaction history for an address
   */
  async getTransactionHistory(
    address: string,
    limit: number = 10
  ): Promise<{ success: boolean; transactions: ProcessedTransaction[]; error?: string }> {
    try {
      console.log(`[SolanaMainnetRPC] Fetching transaction history for: ${address}`);

      // Get transaction signatures
      const signatures = await this.getSignaturesForAddress(address, { limit });
      console.log(`[SolanaMainnetRPC] Found ${signatures.length} transaction signatures`);

      if (signatures.length === 0) {
        return {
          success: true,
          transactions: []
        };
      }

      // Fetch detailed transaction data
      const transactions: ProcessedTransaction[] = [];

      for (let i = 0; i < signatures.length; i++) {
        const signature = signatures[i].signature;
        console.log(`[SolanaMainnetRPC] Fetching transaction ${i + 1}/${signatures.length}: ${signature}`);

        try {
          const txData = await this.getTransaction(signature);

          if (txData) {
            const analysis = this.analyzeTransaction(txData);

            const processedTx: ProcessedTransaction = {
              signature: signature,
              slot: txData.slot || 0,
              blockTime: txData.blockTime ? new Date(txData.blockTime * 1000).toISOString() : null,
              fee: txData.meta?.fee || 0,
              success: txData.meta?.err === null,
              error: txData.meta?.err,
              preBalances: txData.meta?.preBalances || [],
              postBalances: txData.meta?.postBalances || [],
              preTokenBalances: txData.meta?.preTokenBalances || [],
              postTokenBalances: txData.meta?.postTokenBalances || [],
              instructions: txData.transaction?.message?.instructions || [],
              accounts: txData.transaction?.message?.accountKeys || [],
              type: analysis.type || 'unknown',
              fromAsset: analysis.fromAsset,
              toAsset: analysis.toAsset,
              amount: analysis.amount,
              toAmount: analysis.toAmount
            };

            transactions.push(processedTx);
          }

          // Rate limiting - small delay between requests
          if (i < signatures.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 150));
          }

        } catch (error) {
          console.warn(`[SolanaMainnetRPC] Failed to fetch transaction ${signature}:`, error);
          // Continue with other transactions even if one fails
        }
      }

      console.log(`[SolanaMainnetRPC] Successfully processed ${transactions.length} transactions`);

      return {
        success: true,
        transactions: transactions
      };

    } catch (error) {
      console.error('[SolanaMainnetRPC] Transaction history fetch failed:', error);
      return {
        success: false,
        transactions: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get real-time account information
   */
  async getAccountInfo(address: string): Promise<any> {
    const params = [address, { commitment: this.commitment, encoding: 'jsonParsed' }];
    return await this.rpcCall('getAccountInfo', params);
  }

  /**
   * Get current slot height
   */
  async getSlot(): Promise<number> {
    return await this.rpcCall('getSlot', [{ commitment: this.commitment }]);
  }

  /**
   * Get recent blockhash
   */
  async getLatestBlockhash(): Promise<any> {
    return await this.rpcCall('getLatestBlockhash', [{ commitment: this.commitment }]);
  }
}

// Create singleton instance
export const solanaRPC = new SolanaMainnetRPC({
  endpoint: 'https://api.mainnet-beta.solana.com',
  commitment: 'confirmed',
  timeout: 15000
});

export default solanaRPC;