/**
 * MetaMask Solana Provider Enhancement
 * 
 * This module enhances the existing MetaMask provider with Solana-specific functionality.
 * It integrates with the MetaMask Solana Snaps to provide:
 * - Solana keypair derivation (NOT Ethereum!)
 * - Transaction signing for Solana
 * - Account creation and management
 * - Integration with the existing wallet infrastructure
 */

import { Transaction, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { createLogger } from '../../../../../lib/logger';
import { 
	buildCreateSplitdoATATransaction,
	getSplitdoATAAddress,
	serializeTransactionToBase64,
	estimateATACreationFee,
	isValidSolanaPublicKey,
	type SplitdoTransactionResult
} from './solana-transaction-builder';
import { POST as createAccountWithSend } from '../../../middleware/endpoints/devbackend/_api/testing/usockets/token-account/create/withSend/POST';

const logger = createLogger('[MetaMask Solana Provider]');

export interface MetaMaskSolanaAccount {
	publicKey: string;          // Base58 encoded public key
	address: string;           // Same as publicKey for compatibility
}

export interface MetaMaskSolanaCapabilities {
	solana: boolean;
	snapsEnabled: boolean;
	snapId: string | null;
}

export interface SolanaTransactionSignResult {
	success: boolean;
	signedTransaction?: Transaction;
	signature?: string;
	error?: string;
}

export interface CreateAccountResult {
	success: boolean;
	tokenAccount?: string;
	transactionSignature?: string;
	error?: string;
}

/**
 * Enhanced MetaMask Provider for Solana Operations
 * 
 * This class provides Solana-specific functionality on top of the existing
 * MetaMask provider infrastructure.
 */
export class MetaMaskSolanaProvider {
	private ethereum: any;
	private snapId = 'npm:@metamask/solana-wallet-snap';
	private currentAccount: MetaMaskSolanaAccount | null = null;

	constructor(ethereumProvider: any) {
		this.ethereum = ethereumProvider;
		logger.debug('MetaMaskSolanaProvider initialized', {
			hasProvider: !!ethereumProvider,
			isMetaMask: ethereumProvider?.isMetaMask || false
		});
	}

	/**
	 * Check if MetaMask supports Solana Snaps
	 */
	async checkSolanaCapabilities(): Promise<MetaMaskSolanaCapabilities> {
		try {
			if (!this.ethereum) {
				return { solana: false, snapsEnabled: false, snapId: null };
			}

			// Check if Snaps are available
			const snapsEnabled = typeof this.ethereum.request === 'function';

			logger.debug('Checking Solana capabilities', {
				snapsEnabled,
				snapId: this.snapId
			});

			return {
				solana: snapsEnabled,
				snapsEnabled,
				snapId: snapsEnabled ? this.snapId : null
			};
		} catch (error) {
			logger.error('Failed to check Solana capabilities', {
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			return { solana: false, snapsEnabled: false, snapId: null };
		}
	}

	/**
	 * Connect to MetaMask Solana Snap
	 */
	async connect(): Promise<MetaMaskSolanaAccount> {
		try {
			logger.info('Connecting to MetaMask Solana Snap...');

			// Request snap installation/connection
			await this.ethereum.request({
				method: 'wallet_requestSnaps',
				params: {
					[this.snapId]: {}
				}
			});

			// Get the Solana public key
			const result = await this.ethereum.request({
				method: 'wallet_invokeSnap',
				params: {
					snapId: this.snapId,
					request: {
						method: 'solana_getPublicKey'
					}
				}
			});

			if (!result || !result.publicKey) {
				throw new Error('Failed to get public key from MetaMask Solana Snap');
			}

			// Validate the public key
			if (!isValidSolanaPublicKey(result.publicKey)) {
				throw new Error('Invalid Solana public key received from MetaMask');
			}

			this.currentAccount = {
				publicKey: result.publicKey,
				address: result.publicKey
			};

			logger.info('Successfully connected to MetaMask Solana', {
				publicKey: result.publicKey
			});

			return this.currentAccount;

		} catch (error) {
			logger.error('Failed to connect to MetaMask Solana', {
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			throw new Error(`MetaMask Solana connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Get current Solana account
	 */
	getCurrentAccount(): MetaMaskSolanaAccount | null {
		return this.currentAccount;
	}

	/**
	 * Sign a Solana transaction using MetaMask Snaps
	 */
	async signTransaction(transaction: Transaction): Promise<SolanaTransactionSignResult> {
		try {
			if (!this.currentAccount) {
				throw new Error('No account connected. Please connect first.');
			}

			logger.info('Signing transaction with MetaMask Solana', {
				feePayer: transaction.feePayer?.toBase58(),
				instructionsCount: transaction.instructions.length
			});

			// Serialize the transaction for signing
			const serializedTransaction = transaction.serializeMessage();

			// Request signature from MetaMask Solana Snap
			const result = await this.ethereum.request({
				method: 'wallet_invokeSnap',
				params: {
					snapId: this.snapId,
					request: {
						method: 'solana_signTransaction',
						params: {
							transaction: Buffer.from(serializedTransaction).toString('base64')
						}
					}
				}
			});

			if (!result || !result.signature) {
				throw new Error('Failed to get signature from MetaMask Solana Snap');
			}

			// Add the signature to the transaction
			transaction.addSignature(
				new PublicKey(this.currentAccount.publicKey),
				Buffer.from(result.signature, 'base64')
			);

			logger.info('Transaction signed successfully', {
				signature: result.signature,
				publicKey: this.currentAccount.publicKey
			});

			return {
				success: true,
				signedTransaction: transaction,
				signature: result.signature
			};

		} catch (error) {
			logger.error('Failed to sign transaction', {
				error: error instanceof Error ? error.message : 'Unknown error',
				account: this.currentAccount?.publicKey
			});

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error occurred during signing'
			};
		}
	}

	/**
	 * Create SPLITDO Associated Token Account
	 * 
	 * This method builds the transaction, signs it with MetaMask, and submits it
	 * to the backend for broadcasting to Solana mainnet.
	 */
	async createSplitdoATA(): Promise<CreateAccountResult> {
		try {
			if (!this.currentAccount) {
				throw new Error('No account connected. Please connect first.');
			}

			logger.info('Creating SPLITDO ATA for MetaMask account', {
				publicKey: this.currentAccount.publicKey
			});

			// Step 1: Build the unsigned transaction
			const transactionResult = await buildCreateSplitdoATATransaction(this.currentAccount.publicKey);

			if (!transactionResult.success || !transactionResult.transaction || !transactionResult.tokenAccountAddress) {
				throw new Error(transactionResult.error || 'Failed to build transaction');
			}

			const { transaction, tokenAccountAddress } = transactionResult;

			// Step 2: Sign the transaction with MetaMask
			const signResult = await this.signTransaction(transaction);

			if (!signResult.success || !signResult.signedTransaction) {
				throw new Error(signResult.error || 'Failed to sign transaction');
			}

			// Step 3: Serialize the signed transaction for backend
			const serializedTransaction = serializeTransactionToBase64(signResult.signedTransaction);

			// Step 4: Submit to backend for broadcasting
			const backendResult = await createAccountWithSend({
				signed_transaction: serializedTransaction,
				user_wallet: this.currentAccount.publicKey,
				token_account_pubkey: tokenAccountAddress
			});

			if (backendResult.status === 201) {
				// Success!
				logger.info('SPLITDO ATA created successfully', {
					tokenAccount: backendResult.data.data.token_account_pubkey,
					transactionSignature: backendResult.data.tx_signature,
					userId: backendResult.data.data.user_id
				});

				return {
					success: true,
					tokenAccount: backendResult.data.data.token_account_pubkey,
					transactionSignature: backendResult.data.tx_signature
				};

			} else if (backendResult.status === 409) {
				// Account already exists
				logger.info('SPLITDO ATA already exists', {
					tokenAccount: backendResult.data.token_account_pubkey,
					userWallet: backendResult.data.user_wallet
				});

				return {
					success: true,
					tokenAccount: backendResult.data.token_account_pubkey || tokenAccountAddress
				};

			} else {
				// Other error
				const errorMessage = (backendResult.data as any).message || (backendResult.data as any).error || 'Unknown backend error';
				throw new Error(`Backend error: ${errorMessage}`);
			}

		} catch (error) {
			logger.error('Failed to create SPLITDO ATA', {
				error: error instanceof Error ? error.message : 'Unknown error',
				account: this.currentAccount?.publicKey
			});

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error occurred during account creation'
			};
		}
	}

	/**
	 * Get SPLITDO ATA address for current account
	 */
	async getSplitdoATAAddress(): Promise<string | null> {
		if (!this.currentAccount) {
			return null;
		}

		try {
			return await getSplitdoATAAddress(this.currentAccount.publicKey);
		} catch (error) {
			logger.error('Failed to get SPLITDO ATA address', {
				error: error instanceof Error ? error.message : 'Unknown error',
				account: this.currentAccount?.publicKey
			});
			return null;
		}
	}

	/**
	 * Get estimated fee for ATA creation
	 */
	getEstimatedFee(): number {
		return estimateATACreationFee();
	}

	/**
	 * Disconnect from MetaMask Solana
	 */
	disconnect(): void {
		this.currentAccount = null;
		logger.info('Disconnected from MetaMask Solana');
	}

	/**
	 * Check if currently connected
	 */
	isConnected(): boolean {
		return this.currentAccount !== null;
	}
}