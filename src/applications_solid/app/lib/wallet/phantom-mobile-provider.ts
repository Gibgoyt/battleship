/**
 * Phantom Mobile Deep Link Provider
 * 
 * Implements the WalletProvider interface using Phantom's mobile deep link protocol.
 * This provider handles iOS/Android Phantom app communication via deep links instead
 * of the browser extension API.
 * 
 * Key Features:
 * - Deep link-based connection and transaction signing
 * - End-to-end encryption with Phantom mobile app
 * - Session management for persistent connections
 * - Automatic redirect handling and URL parsing
 */

// Import browser polyfills FIRST
import './browser-polyfills';
import { PublicKey, Transaction } from '@solana/web3.js';
import { createLogger } from 'src/lib/logger';
import type { 
  WalletProvider
} from './wallet-providers';
import { 
  WalletError, 
  WalletConnectionError, 
  WalletSigningError, 
  WalletNotFoundError 
} from './wallet-providers';
import { 
  phantomMobileCrypto, 
  Base58
} from './phantom-mobile-crypto';
import type { 
  PhantomMobileSession,
  PhantomConnectRequest,
  PhantomConnectResponse,
  PhantomSignRequest,
  PhantomSignResponse,
  PhantomEncryptedPayload,
  PhantomSignPayload
} from './phantom-mobile-crypto';
import { 
  iOSDebugger,
  logConnection,
  logTransaction,
  logEncryption,
  logDeepLink
} from './ios-debug-logger';

const logger = createLogger('[PhantomMobileProvider]');

// Deep link configuration
const PHANTOM_DEEP_LINK_BASE = 'https://phantom.app/ul/v1';
const APP_DOMAIN = typeof window !== 'undefined' ? window.location.origin : 'https://splitdo.com';

export interface PhantomMobileError {
  errorCode: string;
  errorMessage: string;
}

export class PhantomMobileProvider implements WalletProvider {
  readonly id = 'phantom-mobile';
  readonly name = 'Phantom Mobile';
  readonly icon = '📱';

  private session: PhantomMobileSession | null = null;
  private publicKey: PublicKey | null = null;
  private _isConnecting = false;
  private _isSigning = false;

  // Redirect promise resolvers for handling async deep link responses
  private connectResolver: ((value: { publicKey: PublicKey }) => void) | null = null;
  private connectRejecter: ((error: Error) => void) | null = null;
  private signResolver: ((value: Transaction) => void) | null = null;
  private signRejecter: ((error: Error) => void) | null = null;

  constructor() {
    logger.info('Initializing Phantom Mobile Provider with deep link support');
    this.setupRedirectHandlers();
  }

  /**
   * Setup URL redirect handlers for deep link responses
   */
  private setupRedirectHandlers(): void {
    if (typeof window === 'undefined') return;

    // Listen for page visibility changes (when user returns from Phantom app)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.handleRedirectResponse();
      }
    });

    // Also handle immediate URL parsing on load
    this.handleRedirectResponse();
  }

  /**
   * Handle redirect response from Phantom mobile app
   */
  private handleRedirectResponse(): void {
    try {
      const url = new URL(window.location.href);
      const searchParams = url.searchParams;

      // Check for connect response
      if (this._isConnecting && this.connectResolver) {
        const phantomPublicKey = searchParams.get('phantom_encryption_public_key');
        const nonce = searchParams.get('nonce');
        const data = searchParams.get('data');
        const errorCode = searchParams.get('errorCode');
        const errorMessage = searchParams.get('errorMessage');

        if (errorCode || errorMessage) {
          const error = new WalletConnectionError('Phantom Mobile', { code: errorCode, message: errorMessage });
          this.connectRejecter?.(error);
          this.cleanupConnectPromise();
          return;
        }

        if (phantomPublicKey && nonce && data) {
          this.handleConnectResponse({ phantom_encryption_public_key: phantomPublicKey, nonce, data })
            .then((result) => {
              this.connectResolver?.(result);
              this.cleanupConnectPromise();
            })
            .catch((error) => {
              this.connectRejecter?.(error);
              this.cleanupConnectPromise();
            });
          return;
        }
      }

      // Check for sign response
      if (this._isSigning && this.signResolver) {
        const nonce = searchParams.get('nonce');
        const data = searchParams.get('data');
        const errorCode = searchParams.get('errorCode');
        const errorMessage = searchParams.get('errorMessage');

        if (errorCode || errorMessage) {
          const error = new WalletSigningError('Phantom Mobile', { code: errorCode, message: errorMessage });
          this.signRejecter?.(error);
          this.cleanupSignPromise();
          return;
        }

        if (nonce && data) {
          this.handleSignResponse({ nonce, data })
            .then((result) => {
              this.signResolver?.(result);
              this.cleanupSignPromise();
            })
            .catch((error) => {
              this.signRejecter?.(error);
              this.cleanupSignPromise();
            });
          return;
        }
      }

      // Clean up URL parameters after processing
      if (searchParams.has('phantom_encryption_public_key') || 
          searchParams.has('nonce') || 
          searchParams.has('errorCode')) {
        // Clear Phantom response parameters from URL
        const cleanUrl = url.protocol + '//' + url.host + url.pathname;
        window.history.replaceState(null, '', cleanUrl);
      }

    } catch (error) {
      logger.error('Error handling redirect response:', error);
    }
  }

  /**
   * Clean up connect promise resolvers
   */
  private cleanupConnectPromise(): void {
    this._isConnecting = false;
    this.connectResolver = null;
    this.connectRejecter = null;
  }

  /**
   * Clean up sign promise resolvers
   */
  private cleanupSignPromise(): void {
    this._isSigning = false;
    this.signResolver = null;
    this.signRejecter = null;
  }

  /**
   * Check if Phantom mobile app is available (always true for deep links)
   */
  isAvailable(): boolean {
    // Deep links work on any mobile device, no need to check for provider
    return true;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return !!this.session?.sessionToken && !!this.publicKey;
  }

  /**
   * Get current public key
   */
  getPublicKey(): PublicKey | null {
    return this.publicKey;
  }

  /**
   * Connect to Phantom mobile app via deep link
   */
  async connect(): Promise<{ publicKey: PublicKey }> {
    const startTime = Date.now();
    
    if (this._isConnecting) {
      throw new WalletError('Connection already in progress', 'CONNECTION_IN_PROGRESS', 'Phantom Mobile');
    }

    if (this.isConnected()) {
      return { publicKey: this.publicKey! };
    }

    try {
      this._isConnecting = true;
      logger.info('Starting Phantom mobile connection via deep link');

      // Initialize session and generate keypair
      logEncryption.start();
      this.session = await phantomMobileCrypto.initializeSession();
      logEncryption.success(true, 0);

      // Export our public key for Phantom
      const dappPublicKey = await phantomMobileCrypto.exportPublicKeyToBase58(
        this.session.dappKeyPair.publicKey
      );

      // Build connect deep link
      const connectUrl = this.buildConnectUrl(dappPublicKey);
      
      logger.debug('Opening Phantom connect deep link:', { url: connectUrl });
      logConnection.start(connectUrl);
      logDeepLink.generated(connectUrl, 'connect');

      // Open deep link and return promise that resolves on redirect
      logDeepLink.opened(connectUrl);
      window.location.href = connectUrl;

      // Return promise that will be resolved by redirect handler
      return new Promise((resolve, reject) => {
        this.connectResolver = resolve;
        this.connectRejecter = reject;

         // Set timeout for connection
        setTimeout(() => {
          if (this._isConnecting) {
            const duration = Date.now() - startTime;
            logConnection.failed('Connection timeout', duration);
            logDeepLink.timeout(60000);
            this.cleanupConnectPromise();
            reject(new WalletConnectionError('Phantom Mobile', 'Connection timeout'));
          }
        }, 60000); // 60 second timeout
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      this._isConnecting = false;
      this.session = null;
      logger.error('Failed to start Phantom mobile connection:', error);
      logConnection.failed(String(error) || 'Unknown error', duration);
      throw new WalletConnectionError('Phantom Mobile', error);
    }
  }

  /**
   * Build connect deep link URL
   */
  private buildConnectUrl(dappPublicKey: string): string {
    const params = new URLSearchParams({
      app_url: APP_DOMAIN,
      dapp_encryption_public_key: dappPublicKey,
      redirect_link: window.location.href,
      cluster: 'mainnet-beta'
    });

    return `${PHANTOM_DEEP_LINK_BASE}/connect?${params.toString()}`;
  }

  /**
   * Handle connect response from Phantom
   */
  private async handleConnectResponse(response: PhantomConnectResponse): Promise<{ publicKey: PublicKey }> {
    const startTime = Date.now();
    try {
      logger.info('Processing Phantom mobile connect response');
      logDeepLink.response(response);

      if (!this.session) {
        throw new Error('Session not initialized');
      }

      // Complete session with Phantom's public key
      await phantomMobileCrypto.completeSession(response.phantom_encryption_public_key);

      // Decrypt the response data
      logEncryption.start();
      const decryptedData = await phantomMobileCrypto.decryptFromPhantom({
        nonce: response.nonce,
        data: response.data
      });
      logEncryption.success(false, response.data?.length || 0);

      // Extract session token and public key
      const sessionData = decryptedData as { public_key: string; session: string };
      this.session.sessionToken = sessionData.session;
      this.session.walletPublicKey = sessionData.public_key;
      this.publicKey = new PublicKey(sessionData.public_key);

      const duration = Date.now() - startTime;
      logConnection.success(sessionData.public_key, duration);

      logger.info('Phantom mobile connection successful:', {
        publicKey: sessionData.public_key,
        hasSession: !!sessionData.session
      });

      return { publicKey: this.publicKey };

    } catch (error) {
      const duration = Date.now() - startTime;
      logEncryption.failed(String(error));
      logConnection.failed(String(error), duration);
      logger.error('Failed to handle connect response:', error);
      throw new WalletConnectionError('Phantom Mobile', error);
    }
  }

  /**
   * Sign transaction using Phantom mobile app
   */
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    const startTime = Date.now();
    
    if (this._isSigning) {
      throw new WalletError('Signing already in progress', 'SIGNING_IN_PROGRESS', 'Phantom Mobile');
    }

    if (!this.isConnected()) {
      throw new WalletError('Wallet not connected', 'NOT_CONNECTED', 'Phantom Mobile');
    }

    try {
      this._isSigning = true;
      logger.info('Starting Phantom mobile transaction signing');
      logTransaction.start(transaction);

      if (!this.session?.sessionToken) {
        throw new Error('Session token missing');
      }

      // Serialize transaction for signing
      const serializedTransaction = Base58.encode(transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      }));

      // Prepare sign request payload
      const payload: PhantomSignPayload = {
        transaction: serializedTransaction,
        session: this.session.sessionToken
      };

      // Encrypt payload
      logEncryption.start();
      const encryptedPayload = await phantomMobileCrypto.encryptForPhantom(payload);
      logEncryption.success(false, JSON.stringify(payload).length);

      // Get our public key for the request
      const dappPublicKey = await phantomMobileCrypto.exportPublicKeyToBase58(
        this.session.dappKeyPair.publicKey
      );

      // Build sign deep link
      const signUrl = this.buildSignUrl(dappPublicKey, encryptedPayload);
      
      logger.debug('Opening Phantom sign deep link:', { url: signUrl });
      logDeepLink.generated(signUrl, 'signTransaction');

      // Open deep link
      logDeepLink.opened(signUrl);
      window.location.href = signUrl;

      // Return promise that resolves on redirect
      return new Promise((resolve, reject) => {
        this.signResolver = resolve;
        this.signRejecter = reject;

        // Set timeout for signing
        setTimeout(() => {
          if (this._isSigning) {
            const duration = Date.now() - startTime;
            logTransaction.failed('Signing timeout', duration);
            logDeepLink.timeout(60000);
            this.cleanupSignPromise();
            reject(new WalletSigningError('Phantom Mobile', 'Signing timeout'));
          }
        }, 60000); // 60 second timeout
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      this._isSigning = false;
      logger.error('Failed to start transaction signing:', error);
      logTransaction.failed(String(error), duration);
      throw new WalletSigningError('Phantom Mobile', error);
    }
  }

  /**
   * Build sign transaction deep link URL
   */
  private buildSignUrl(dappPublicKey: string, encryptedPayload: PhantomEncryptedPayload): string {
    const params = new URLSearchParams({
      dapp_encryption_public_key: dappPublicKey,
      nonce: encryptedPayload.nonce,
      redirect_link: window.location.href,
      payload: encryptedPayload.data
    });

    return `${PHANTOM_DEEP_LINK_BASE}/signTransaction?${params.toString()}`;
  }

  /**
   * Handle sign response from Phantom
   */
  private async handleSignResponse(response: PhantomSignResponse): Promise<Transaction> {
    const startTime = Date.now();
    try {
      logger.info('Processing Phantom mobile sign response');
      logDeepLink.response(response);

      // Decrypt the response data
      logEncryption.start();
      const decryptedData = await phantomMobileCrypto.decryptFromPhantom({
        nonce: response.nonce,
        data: response.data
      });
      logEncryption.success(false, response.data?.length || 0);

      // Extract signed transaction
      const responseData = decryptedData as { transaction: string };
      const signedTransactionBase58 = responseData.transaction;

      // Decode and deserialize the signed transaction
      const signedTransactionBuffer = Base58.decode(signedTransactionBase58);
      const signedTransaction = Transaction.from(signedTransactionBuffer);

      const duration = Date.now() - startTime;
      logTransaction.signed(signedTransactionBase58.substring(0, 20) + '...', duration);

      logger.info('Transaction signed successfully by Phantom mobile');

      return signedTransaction;

    } catch (error) {
      const duration = Date.now() - startTime;
      logEncryption.failed(String(error));
      logTransaction.failed(String(error), duration);
      logger.error('Failed to handle sign response:', error);
      throw new WalletSigningError('Phantom Mobile', error);
    }
  }

  /**
   * Disconnect from Phantom mobile app
   */
  async disconnect(): Promise<void> {
    try {
      logger.info('Disconnecting Phantom mobile provider');

      // If we have an active session, we could send a disconnect deep link
      // For now, just clean up local state
      
      this.session = null;
      this.publicKey = null;
      this.cleanupConnectPromise();
      this.cleanupSignPromise();
      
      // Clear crypto session
      phantomMobileCrypto.clearSession();

      logger.info('Phantom mobile provider disconnected successfully');

    } catch (error) {
      logger.error('Error during Phantom mobile disconnect:', error);
      // Don't throw - always allow disconnect to succeed
    }
  }

  /**
   * Get current session information
   */
  getSession(): PhantomMobileSession | null {
    return this.session;
  }

  /**
   * Check if currently in connection process
   */
  isConnecting(): boolean {
    return this._isConnecting;
  }

  /**
   * Check if currently signing transaction
   */
  isSigning(): boolean {
    return this._isSigning;
  }
}

// Export provider instance
export const phantomMobileProvider = new PhantomMobileProvider();