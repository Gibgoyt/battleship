/**
 * WalletConnect v2 Provider for SPLITDO
 *
 * Implements WalletConnect v2 protocol for connecting mobile Solana wallets
 * via QR code scanning or deep linking. Supports all major Solana mobile wallets.
 */

// Import browser polyfills FIRST
import '../browser-polyfills';

import { PublicKey, Transaction } from '@solana/web3.js';
import SignClient from '@walletconnect/sign-client';
import QRCode from 'qrcode';
import type { SignClientTypes, SessionTypes, ProposalTypes } from '@walletconnect/types';
import { getSdkError } from '@walletconnect/utils';

// Import config and provider interface
import {
  WalletProvider,
  WalletError,
  WalletNotFoundError,
  WalletConnectionError,
  WalletSigningError
} from '../wallet-providers';
import {
  WALLETCONNECT_CONFIG,
  ERROR_MESSAGES,
  SUPPORTED_WALLETS
} from '../walletconnect-config';

// WalletConnect specific error classes
export class WalletConnectError extends WalletError {
  constructor(message: string, code: string, originalError?: any) {
    super(
      `WalletConnect: ${message}${originalError ? ` (${originalError.message})` : ''}`,
      code,
      'walletconnect'
    );
  }
}

export class WalletConnectInitError extends WalletConnectError {
  constructor(originalError?: any) {
    super('Failed to initialize WalletConnect client', 'INIT_FAILED', originalError);
  }
}

export class WalletConnectSessionError extends WalletConnectError {
  constructor(message: string, originalError?: any) {
    super(message, 'SESSION_ERROR', originalError);
  }
}

export class WalletConnectNetworkError extends WalletConnectError {
  constructor(originalError?: any) {
    super('Network connection failed. Please check your internet connection and try again.', 'NETWORK_ERROR', originalError);
  }
}

export class WalletConnectTimeoutError extends WalletConnectError {
  constructor(operation: string, originalError?: any) {
    super(`${operation} timed out. Please try again.`, 'TIMEOUT_ERROR', originalError);
  }
}

export class WalletConnectProjectIdError extends WalletConnectError {
  constructor() {
    super('Invalid WalletConnect project ID. Please check your configuration.', 'INVALID_PROJECT_ID');
  }
}

// WalletConnect session state
export interface WalletConnectSessionData {
  topic: string;
  accounts: string[];
  publicKey: PublicKey;
  peerMetadata: SessionTypes.Metadata;
}

// QR Code data interface
export interface WalletConnectQRData {
  uri: string;
  qrCodeDataURL: string;
  expired: boolean;
}

// Event handlers for WalletConnect state changes
export interface WalletConnectEvents {
  onQRCodeGenerated?: (qrData: WalletConnectQRData) => void;
  onSessionProposal?: (proposal: ProposalTypes.Struct) => void;
  onSessionConnected?: (session: WalletConnectSessionData) => void;
  onSessionDisconnected?: () => void;
  onSessionExpired?: () => void;
  onError?: (error: WalletConnectError) => void;
}

/**
 * WalletConnect v2 Provider Implementation
 *
 * Provides QR code-based connection to mobile Solana wallets
 * using the WalletConnect v2 protocol.
 */
export class WalletConnectProvider implements WalletProvider {
  readonly id = 'walletconnect';
  readonly name = 'WalletConnect';
  readonly icon = '🔗';

  // WalletConnect client and session management
  private signClient: SignClient | null = null;
  private currentSession: SessionTypes.Struct | null = null;
  private publicKey: PublicKey | null = null;
  private connecting = false;
  private initialized = false;

  // Event handlers and state
  private eventHandlers: WalletConnectEvents = {};
  private qrData: WalletConnectQRData | null = null;
  private connectionPromise: Promise<{ publicKey: PublicKey }> | null = null;

  constructor(eventHandlers?: WalletConnectEvents) {
    this.eventHandlers = eventHandlers || {};
    this.initializeClient().catch(error => {
      console.error('Failed to initialize WalletConnect:', error);
      this.eventHandlers.onError?.(new WalletConnectInitError(error));
    });
  }

  /**
   * Enhanced error handler with automatic retry for recoverable errors
   */
  private async handleErrorWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = WALLETCONNECT_CONFIG.connectionConfig.retryAttempts
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        const isRetryableError = this.isRetryableError(error as Error);

        console.warn(`[WalletConnect] ${operationName} attempt ${attempt} failed:`, error);

        if (!isRetryableError || attempt === maxRetries) {
          throw this.classifyError(error as Error, operationName);
        }

        // Wait before retrying with exponential backoff
        const delay = WALLETCONNECT_CONFIG.connectionConfig.retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw this.classifyError(lastError!, operationName);
  }

  /**
   * Classifies errors into specific WalletConnect error types
   */
  private classifyError(error: Error, operationName: string): WalletConnectError {
    const message = error.message.toLowerCase();

    // Network-related errors
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return new WalletConnectNetworkError(error);
    }

    // Project ID errors
    if (message.includes('project id') || message.includes('projectid') || message.includes('unauthorized')) {
      return new WalletConnectProjectIdError();
    }

    // Session-related errors
    if (message.includes('session') || message.includes('pairing')) {
      return new WalletConnectSessionError(`${operationName} failed`, error);
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return new WalletConnectTimeoutError(operationName, error);
    }

    // Generic WalletConnect error
    return new WalletConnectError(`${operationName} failed`, 'UNKNOWN_ERROR', error);
  }

  /**
   * Determines if an error is recoverable and worth retrying
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();

    // Network errors are usually retryable
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return true;
    }

    // Rate limiting errors are retryable
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return true;
    }

    // Temporary service errors are retryable
    if (message.includes('service unavailable') || message.includes('internal server error')) {
      return true;
    }

    // User rejection and invalid project ID are not retryable
    if (message.includes('rejected') || message.includes('unauthorized') || message.includes('project id')) {
      return false;
    }

    return false;
  }

  /**
   * Initialize WalletConnect Sign Client with enhanced error handling
   */
  private async initializeClient(): Promise<void> {
    if (this.signClient || this.initialized) {
      return;
    }

    // Check project ID configuration
    if (!WALLETCONNECT_CONFIG.projectId || WALLETCONNECT_CONFIG.projectId === 'your-project-id-here') {
      throw new WalletConnectProjectIdError();
    }

    await this.handleErrorWithRetry(async () => {
      this.signClient = await SignClient.init({
        projectId: WALLETCONNECT_CONFIG.projectId,
        metadata: WALLETCONNECT_CONFIG.metadata,
      });

      // Restore existing sessions
      const activeSessions = this.signClient.session.getAll();
      if (activeSessions.length > 0) {
        // Use the most recent session
        const session = activeSessions[activeSessions.length - 1];
        await this.restoreSession(session);
      }

      // Set up event listeners
      this.setupEventListeners();
      this.initialized = true;
    }, 'WalletConnect initialization');
  }

  /**
   * Set up WalletConnect event listeners
   */
  private setupEventListeners(): void {
    if (!this.signClient) return;

    // Session proposal event
    this.signClient.on('session_proposal', async (proposal: ProposalTypes.Struct) => {
      try {
        this.eventHandlers.onSessionProposal?.(proposal);

        // Auto-approve session if it matches our requirements
        const { acknowledged } = await this.signClient!.approve({
          id: proposal.id,
          namespaces: this.buildSessionNamespaces(proposal.params.requiredNamespaces),
        });

        const session = await acknowledged();
        await this.onSessionConnected(session);

      } catch (error) {
        console.error('Session proposal error:', error);
        this.eventHandlers.onError?.(new WalletConnectSessionError('Failed to approve session', error));
      }
    });

    // Session update event
    this.signClient.on('session_update', (update: SessionTypes.Event) => {
      console.log('Session updated:', update);
      this.currentSession = this.signClient!.session.get(update.topic);
    });

    // Session delete event
    this.signClient.on('session_delete', (deleteEvent: SessionTypes.Event) => {
      console.log('Session deleted:', deleteEvent);
      this.onSessionDisconnected();
    });

    // Session expire event
    this.signClient.on('session_expire', (expireEvent: SessionTypes.Event) => {
      console.log('Session expired:', expireEvent);
      this.eventHandlers.onSessionExpired?.();
      this.onSessionDisconnected();
    });
  }

  /**
   * Build session namespaces for Solana
   */
  private buildSessionNamespaces(requiredNamespaces: ProposalTypes.RequiredNamespaces): SessionTypes.Namespaces {
    const supportedChains = WALLETCONNECT_CONFIG.namespaces.solana.chains;
    const supportedMethods = WALLETCONNECT_CONFIG.namespaces.solana.methods;
    const supportedEvents = WALLETCONNECT_CONFIG.namespaces.solana.events;

    return {
      solana: {
        accounts: supportedChains.map(chain => `${chain}:11111111111111111111111111111111`), // Placeholder
        methods: supportedMethods,
        events: supportedEvents,
      },
    };
  }

  /**
   * Handle successful session connection
   */
  private async onSessionConnected(session: SessionTypes.Struct): Promise<void> {
    this.currentSession = session;

    // Extract the first Solana account
    const solanaAccounts = session.namespaces.solana?.accounts || [];
    if (solanaAccounts.length === 0) {
      throw new WalletConnectSessionError('No Solana accounts found in session');
    }

    // Parse account from CAIP-10 format: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:accountAddress"
    const firstAccount = solanaAccounts[0];
    const accountParts = firstAccount.split(':');
    if (accountParts.length < 3) {
      throw new WalletConnectSessionError('Invalid account format in session');
    }

    const accountAddress = accountParts[2];
    this.publicKey = new PublicKey(accountAddress);

    // Notify event handlers
    const sessionData: WalletConnectSessionData = {
      topic: session.topic,
      accounts: solanaAccounts,
      publicKey: this.publicKey,
      peerMetadata: session.peer.metadata,
    };

    this.eventHandlers.onSessionConnected?.(sessionData);
    this.connecting = false;
  }

  /**
   * Handle session disconnection
   */
  private onSessionDisconnected(): void {
    this.currentSession = null;
    this.publicKey = null;
    this.qrData = null;
    this.connecting = false;
    this.connectionPromise = null;
    this.eventHandlers.onSessionDisconnected?.();
  }

  /**
   * Restore existing session
   */
  private async restoreSession(session: SessionTypes.Struct): Promise<void> {
    try {
      // Ping session to check if it's still active
      await this.signClient!.ping({ topic: session.topic });
      await this.onSessionConnected(session);
    } catch (error) {
      console.warn('Failed to restore WalletConnect session:', error);
      // Clean up invalid session
      try {
        await this.signClient!.disconnect({
          topic: session.topic,
          reason: getSdkError('USER_DISCONNECTED')
        });
      } catch (disconnectError) {
        console.warn('Failed to clean up invalid session:', disconnectError);
      }
    }
  }

  /**
   * Generate QR code for connection
   */
  private async generateQRCode(uri: string): Promise<WalletConnectQRData> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(uri, {
        width: WALLETCONNECT_CONFIG.qrCodeConfig.size,
        color: {
          dark: WALLETCONNECT_CONFIG.qrCodeConfig.darkColor,
          light: WALLETCONNECT_CONFIG.qrCodeConfig.lightColor,
        },
        margin: WALLETCONNECT_CONFIG.qrCodeConfig.quietZone / 10, // Convert pixels to margin units
      });

      const qrData: WalletConnectQRData = {
        uri,
        qrCodeDataURL,
        expired: false,
      };

      this.qrData = qrData;
      this.eventHandlers.onQRCodeGenerated?.(qrData);

      // Set expiry timer for QR code
      setTimeout(() => {
        if (this.qrData?.uri === uri) {
          this.qrData.expired = true;
        }
      }, WALLETCONNECT_CONFIG.connectionConfig.pairingTimeout);

      return qrData;

    } catch (error) {
      throw new WalletConnectError('Failed to generate QR code', 'QR_GENERATION_FAILED', error);
    }
  }

  // WalletProvider interface implementation

  isAvailable(): boolean {
    // WalletConnect is always "available" as it doesn't depend on browser extensions
    return true;
  }

  async connect(): Promise<{ publicKey: PublicKey }> {
    // Prevent multiple simultaneous connections
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Return existing connection if already connected
    if (this.isConnected() && this.publicKey) {
      return { publicKey: this.publicKey };
    }

    this.connecting = true;

    this.connectionPromise = this.performConnection();

    try {
      const result = await this.connectionPromise;
      return result;
    } finally {
      this.connectionPromise = null;
    }
  }

  private async performConnection(): Promise<{ publicKey: PublicKey }> {
    if (!this.initialized) {
      await this.initializeClient();
    }

    if (!this.signClient) {
      throw new WalletConnectInitError();
    }

    return await this.handleErrorWithRetry(async () => {
      // Create session proposal
      const { uri, approval } = await this.signClient!.connect({
        requiredNamespaces: WALLETCONNECT_CONFIG.sessionConfig.requiredNamespaces,
        optionalNamespaces: WALLETCONNECT_CONFIG.sessionConfig.optionalNamespaces,
      });

      if (!uri) {
        throw new WalletConnectError('Failed to generate connection URI', 'URI_GENERATION_FAILED');
      }

      // Generate QR code
      await this.generateQRCode(uri);

      // Wait for session approval with enhanced timeout handling
      const connectionPromise = new Promise<{ publicKey: PublicKey }>((resolve, reject) => {
        const sessionTimeout = setTimeout(() => {
          this.connecting = false;
          reject(new WalletConnectTimeoutError('Connection'));
        }, WALLETCONNECT_CONFIG.connectionConfig.connectionTimeout);

        approval().then(async (session) => {
          clearTimeout(sessionTimeout);

          try {
            await this.onSessionConnected(session);

            if (!this.publicKey) {
              throw new WalletConnectSessionError('Failed to extract public key from session');
            }

            resolve({ publicKey: this.publicKey });
          } catch (sessionError) {
            reject(sessionError);
          }
        }).catch((approvalError) => {
          clearTimeout(sessionTimeout);
          this.connecting = false;

          if (approvalError.message.includes('rejected')) {
            reject(new WalletConnectError(ERROR_MESSAGES.WALLETCONNECT_SESSION_REJECTED, 'SESSION_REJECTED', approvalError));
          } else {
            reject(new WalletConnectSessionError('Session approval failed', approvalError));
          }
        });
      });

      return await connectionPromise;
    }, 'WalletConnect connection', 2); // Limit connection retries to 2
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.isConnected()) {
      throw new WalletError(ERROR_MESSAGES.WALLETCONNECT_NO_SESSION, 'NOT_CONNECTED', 'walletconnect');
    }

    if (!this.signClient || !this.currentSession) {
      throw new WalletConnectSessionError('No active WalletConnect session');
    }

    return await this.handleErrorWithRetry(async () => {
      // Serialize transaction for WalletConnect
      const serializedTx = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      const result = await this.signClient!.request({
        topic: this.currentSession!.topic,
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', // Mainnet
        request: {
          method: 'solana_signTransaction',
          params: {
            transaction: Buffer.from(serializedTx).toString('base64'),
          },
        },
      });

      // Validate response
      if (!result || !result.transaction) {
        throw new WalletConnectError('Invalid signing response from wallet', 'INVALID_RESPONSE');
      }

      try {
        // Parse the signed transaction result
        const signedTxBuffer = Buffer.from(result.transaction, 'base64');
        const signedTransaction = Transaction.from(signedTxBuffer);

        return signedTransaction;
      } catch (parseError) {
        throw new WalletConnectError('Failed to parse signed transaction', 'PARSE_ERROR', parseError);
      }
    }, 'Transaction signing', 1); // Don't retry transaction signing (user might reject multiple times)
  }

  /**
   * Override error classification for transaction signing
   */
  private classifySigningError(error: Error): WalletConnectError {
    const message = error.message.toLowerCase();

    // User rejection - not retryable
    if (message.includes('rejected') || message.includes('denied') || message.includes('cancelled')) {
      return new WalletError(ERROR_MESSAGES.USER_REJECTED, 'USER_REJECTED', 'walletconnect') as any;
    }

    // Unsupported method - not retryable
    if (message.includes('unsupported') || message.includes('not supported')) {
      return new WalletError(ERROR_MESSAGES.WALLETCONNECT_UNSUPPORTED_METHOD, 'UNSUPPORTED_METHOD', 'walletconnect') as any;
    }

    // Session expired
    if (message.includes('session') && (message.includes('expired') || message.includes('invalid'))) {
      return new WalletConnectSessionError('Session expired. Please reconnect.', error);
    }

    // Generic signing error
    return new WalletSigningError('WalletConnect', error) as any;
  }

  async disconnect(): Promise<void> {
    if (this.signClient && this.currentSession) {
      try {
        await this.signClient.disconnect({
          topic: this.currentSession.topic,
          reason: getSdkError('USER_DISCONNECTED'),
        });
      } catch (error) {
        console.warn('Error disconnecting WalletConnect session:', error);
      }
    }

    this.onSessionDisconnected();
  }

  isConnected(): boolean {
    return !!(this.currentSession && this.publicKey && !this.connecting);
  }

  getPublicKey(): PublicKey | null {
    return this.publicKey;
  }

  // Additional WalletConnect-specific methods

  /**
   * Get current QR code data
   */
  getQRData(): WalletConnectQRData | null {
    return this.qrData;
  }

  /**
   * Get current session data
   */
  getSessionData(): WalletConnectSessionData | null {
    if (!this.currentSession || !this.publicKey) {
      return null;
    }

    return {
      topic: this.currentSession.topic,
      accounts: this.currentSession.namespaces.solana?.accounts || [],
      publicKey: this.publicKey,
      peerMetadata: this.currentSession.peer.metadata,
    };
  }

  /**
   * Check if currently connecting
   */
  isConnecting(): boolean {
    return this.connecting;
  }

  /**
   * Get list of supported mobile wallets for display
   */
  getSupportedMobileWallets() {
    return SUPPORTED_WALLETS.filter(wallet =>
      wallet.deepLink && wallet.universalLink
    );
  }

  /**
   * Generate deep link for a specific mobile wallet
   */
  generateMobileWalletLink(walletId: string): string | null {
    const wallet = SUPPORTED_WALLETS.find(w => w.id === walletId);
    if (!wallet || !this.qrData) {
      return null;
    }

    // Create universal link with encoded WalletConnect URI
    const encodedUri = encodeURIComponent(this.qrData.uri);
    return `${wallet.universalLink}?uri=${encodedUri}`;
  }

  /**
   * Update event handlers
   */
  updateEventHandlers(handlers: Partial<WalletConnectEvents>): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.signClient) {
      this.signClient.removeAllListeners();
    }
    this.onSessionDisconnected();
  }
}