/**
 * Phantom Signing Adapter
 * Unified interface for Phantom wallet signing on desktop and mobile
 *
 * Desktop: Uses signAndSendTransaction (deprecated on mobile)
 * Mobile: Uses signTransaction + sendRawTransaction (new mobile-compatible flow)
 */

import { Transaction } from '@solana/web3.js';
import { detectMobilePlatform } from './mobile-detection';
import { solanaService } from './solana-service';
import type { PhantomWalletProvider } from './wallet-providers';

export interface SigningResult {
  signature: string;
  success: boolean;
  error?: string;
}

export interface SigningOptions {
  timeout?: number; // Default: 30000ms
}

/**
 * Unified signing interface that automatically selects the appropriate flow
 * based on device type (mobile vs desktop)
 */
export class PhantomSigningAdapter {
  private provider: PhantomWalletProvider;

  constructor(provider: PhantomWalletProvider) {
    this.provider = provider;
  }

  /**
   * Sign and send transaction using the appropriate method for the current device
   * @param transaction The transaction to sign and send
   * @param options Signing options including timeout
   * @returns Promise<SigningResult>
   */
  async signAndSendTransaction(
    transaction: Transaction,
    options: SigningOptions = {}
  ): Promise<SigningResult> {
    const { timeout = 30000 } = options;

    try {
      // Detect device type
      const mobileDetection = detectMobilePlatform();
      const isMobilePhantom = mobileDetection.isMobile;

      console.log('[PhantomSigningAdapter] Device detection:', {
        isMobile: isMobilePhantom,
        platform: mobileDetection.platform
      });

      // Set up timeout
      let timeoutId: NodeJS.Timeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          console.log('[PhantomSigningAdapter] ⏰ Transaction timeout - Phantom not responding');
          reject(new Error('Transaction signing and sending timed out. Check for Phantom popup window.'));
        }, timeout);
      });

      let result: { signature: string };

      try {
        if (isMobilePhantom) {
          // MOBILE FLOW: signTransaction -> sendRawTransaction
          console.log('[PhantomSigningAdapter] 📱 Using mobile flow: signTransaction + sendRawTransaction');

          const mobileSigningPromise = async (): Promise<{ signature: string }> => {
            // Step 1: Sign transaction (mobile compatible)
            console.log('[PhantomSigningAdapter] Step 1: Signing transaction on mobile...');
            const signedTransaction = await this.provider.signTransaction(transaction);

            // Step 2: Serialize transaction
            console.log('[PhantomSigningAdapter] Step 2: Serializing signed transaction...');
            const rawTransaction = signedTransaction.serialize({ requireAllSignatures: false });

            // Step 3: Send to network using our Solana connection
            console.log('[PhantomSigningAdapter] Step 3: Sending raw transaction to Solana network...');
            const networkResult = await solanaService.sendRawTransaction(rawTransaction);

            return { signature: networkResult.signature };
          };

          result = await Promise.race([
            mobileSigningPromise(),
            timeoutPromise
          ]);
        } else {
          // DESKTOP FLOW: signAndSendTransaction (existing flow)
          console.log('[PhantomSigningAdapter] 🖥️ Using desktop flow: signAndSendTransaction');

          result = await Promise.race([
            this.provider.signAndSendTransaction(transaction),
            timeoutPromise
          ]);
        }

        // Clear timeout on success
        clearTimeout(timeoutId!);

        console.log('[PhantomSigningAdapter] ✅ Transaction signed and sent successfully');
        console.log('[PhantomSigningAdapter] Transaction signature:', result.signature);

        return {
          signature: result.signature,
          success: true
        };
      } catch (error) {
        // Clear timeout on error
        clearTimeout(timeoutId!);
        throw error;
      }
    } catch (error) {
      console.error('[PhantomSigningAdapter] Transaction failed:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown signing error';

      return {
        signature: '',
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Sign transaction only (no sending to network)
   * Works on both desktop and mobile
   */
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    console.log('[PhantomSigningAdapter] Signing transaction only (no network submission)');
    return await this.provider.signTransaction(transaction);
  }

  /**
   * Check if the provider is mobile-compatible
   */
  isMobileDevice(): boolean {
    return detectMobilePlatform().isMobile;
  }

  /**
   * Get the current signing flow type
   */
  getSigningFlowType(): 'mobile' | 'desktop' {
    return this.isMobileDevice() ? 'mobile' : 'desktop';
  }

  /**
   * Check if provider is connected and ready
   */
  isReady(): boolean {
    return this.provider.isConnected() && !!this.provider.getPublicKey();
  }
}

/**
 * Factory function to create a PhantomSigningAdapter
 */
export function createPhantomSigningAdapter(provider: PhantomWalletProvider): PhantomSigningAdapter {
  return new PhantomSigningAdapter(provider);
}

/**
 * Convenience function to sign and send a transaction with automatic flow detection
 */
export async function signAndSendTransactionUnified(
  provider: PhantomWalletProvider,
  transaction: Transaction,
  options?: SigningOptions
): Promise<SigningResult> {
  const adapter = createPhantomSigningAdapter(provider);
  return await adapter.signAndSendTransaction(transaction, options);
}