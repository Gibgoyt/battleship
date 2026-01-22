/**
 * MetaMask Solana Transaction Builder
 * 
 * This module builds unsigned Solana transactions for SPLITDO token account creation.
 * It uses the Solana web3.js library to construct proper ATA (Associated Token Account) transactions.
 * 
 * Key Features:
 * - Builds createAssociatedTokenAccount transactions
 * - Gets recent blockhash from our backend
 * - Calculates proper fees and instructions
 * - Supports MetaMask Solana Snaps signing
 */

import { 
	PublicKey, 
	Transaction, 
	SystemProgram,
	SYSVAR_RENT_PUBKEY,
	TransactionInstruction
} from '@solana/web3.js';
import { 
	ASSOCIATED_TOKEN_PROGRAM_ID,
	TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { createLogger } from '../../../../../lib/logger';
import { GET as getRecentBlockhash } from '../../../middleware/endpoints/devbackend_noauth/_api/solana/network/recent-blockhash/GET';

const logger = createLogger('[MetaMask Solana Transaction Builder]');

// SPLITDO Token Mint Address (Solana Mainnet)
export const SPLITDO_TOKEN_MINT = 'CKfatsPMUf8SkiURsDXs7eK6GWb4Jsd6UDbs7twMCWxo';

/**
 * Calculate Associated Token Account address manually
 * This is compatible with older versions of @solana/spl-token
 */
async function findAssociatedTokenAddress(
	walletAddress: PublicKey,
	tokenMintAddress: PublicKey
): Promise<PublicKey> {
	return await PublicKey.findProgramAddress(
		[
			walletAddress.toBuffer(),
			TOKEN_PROGRAM_ID.toBuffer(),
			tokenMintAddress.toBuffer(),
		],
		ASSOCIATED_TOKEN_PROGRAM_ID
	).then(([address]) => address);
}

/**
 * Create Associated Token Account instruction manually
 * This is compatible with older versions of @solana/spl-token
 */
function createAssociatedTokenAccountInstructionManual(
	payer: PublicKey,
	associatedToken: PublicKey,
	owner: PublicKey,
	mint: PublicKey
): TransactionInstruction {
	const keys = [
		{ pubkey: payer, isSigner: true, isWritable: true },
		{ pubkey: associatedToken, isSigner: false, isWritable: true },
		{ pubkey: owner, isSigner: false, isWritable: false },
		{ pubkey: mint, isSigner: false, isWritable: false },
		{ pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
		{ pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
		{ pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
	];

	return new TransactionInstruction({
		keys,
		programId: ASSOCIATED_TOKEN_PROGRAM_ID,
		data: Buffer.alloc(0), // ATA instruction has no data
	});
}

/**
 * Transaction building result interface
 */
export interface SplitdoTransactionResult {
	success: boolean;
	transaction?: Transaction;
	tokenAccountAddress?: string;
	error?: string;
	blockhash?: string;
	lastValidBlockHeight?: number;
}

/**
 * Build an unsigned transaction for creating a SPLITDO Associated Token Account
 * 
 * @param ownerPublicKey - The wallet public key (Base58 string or PublicKey object)
 * @returns Promise<SplitdoTransactionResult>
 */
export async function buildCreateSplitdoATATransaction(
	ownerPublicKey: string | PublicKey
): Promise<SplitdoTransactionResult> {
	try {
		logger.info('Building SPLITDO ATA creation transaction', {
			owner: typeof ownerPublicKey === 'string' ? ownerPublicKey : ownerPublicKey.toBase58()
		});

		// Convert string to PublicKey if needed
		const ownerPubkey = typeof ownerPublicKey === 'string' 
			? new PublicKey(ownerPublicKey) 
			: ownerPublicKey;

		const splitdoMintPubkey = new PublicKey(SPLITDO_TOKEN_MINT);

		// Calculate the Associated Token Account address
		const associatedTokenAddress = await findAssociatedTokenAddress(
			ownerPubkey,
			splitdoMintPubkey
		);

		logger.debug('ATA address calculated', {
			owner: ownerPubkey.toBase58(),
			mint: splitdoMintPubkey.toBase58(),
			ata: associatedTokenAddress.toBase58()
		});

		// Get recent blockhash from our backend
		const blockhashResult = await getRecentBlockhash();
		
		if (blockhashResult.status !== 200) {
			logger.error('Failed to get recent blockhash', {
				status: blockhashResult.status,
				error: blockhashResult.data
			});
			return {
				success: false,
				error: `Failed to get recent blockhash: ${blockhashResult.data.error || 'Unknown error'}`
			};
		}

		const { blockhash } = blockhashResult.data;
		
		logger.debug('Recent blockhash retrieved', {
			blockhash: blockhash,
			cached: blockhashResult.data.cached || false
		});

		// Create the transaction
		const transaction = new Transaction({
			recentBlockhash: blockhash,
			feePayer: ownerPubkey
		});

		// Create the Associated Token Account instruction
		const createATAInstruction = createAssociatedTokenAccountInstructionManual(
			ownerPubkey,        // payer
			associatedTokenAddress, // associatedToken
			ownerPubkey,        // owner
			splitdoMintPubkey   // mint
		);

		// Add the instruction to the transaction
		transaction.add(createATAInstruction);

		// Set the fee payer explicitly (MetaMask needs this)
		transaction.feePayer = ownerPubkey;

		logger.info('Transaction built successfully', {
			owner: ownerPubkey.toBase58(),
			tokenAccount: associatedTokenAddress.toBase58(),
			mint: splitdoMintPubkey.toBase58(),
			blockhash: blockhash,
			instructionsCount: transaction.instructions.length,
			estimatedFee: '~0.001 SOL' // ATA creation typically costs around 0.001 SOL
		});

		return {
			success: true,
			transaction,
			tokenAccountAddress: associatedTokenAddress.toBase58(),
			blockhash: blockhash
		};

	} catch (error) {
		logger.error('Failed to build SPLITDO ATA transaction', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			owner: typeof ownerPublicKey === 'string' ? ownerPublicKey : ownerPublicKey?.toBase58()
		});

		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred while building transaction'
		};
	}
}

/**
 * Validate if a public key string is valid for Solana
 * 
 * @param publicKeyString - Base58 public key string
 * @returns boolean indicating if the key is valid
 */
export function isValidSolanaPublicKey(publicKeyString: string): boolean {
	try {
		new PublicKey(publicKeyString);
		return true;
	} catch {
		return false;
	}
}

/**
 * Get the Associated Token Account address for a given owner and SPLITDO token
 * 
 * @param ownerPublicKey - The wallet public key (Base58 string or PublicKey object)
 * @returns Promise<string> - The ATA address as Base58 string
 */
export async function getSplitdoATAAddress(ownerPublicKey: string | PublicKey): Promise<string> {
	try {
		const ownerPubkey = typeof ownerPublicKey === 'string' 
			? new PublicKey(ownerPublicKey) 
			: ownerPublicKey;

		const splitdoMintPubkey = new PublicKey(SPLITDO_TOKEN_MINT);

		const associatedTokenAddress = await findAssociatedTokenAddress(
			ownerPubkey,
			splitdoMintPubkey
		);

		return associatedTokenAddress.toBase58();
	} catch (error) {
		logger.error('Failed to calculate SPLITDO ATA address', {
			error: error instanceof Error ? error.message : 'Unknown error',
			owner: typeof ownerPublicKey === 'string' ? ownerPublicKey : ownerPublicKey?.toBase58()
		});
		throw error;
	}
}

/**
 * Serialize transaction to base64 for backend submission
 * 
 * @param transaction - The signed Transaction object
 * @returns string - Base64 encoded transaction
 */
export function serializeTransactionToBase64(transaction: Transaction): string {
	try {
		const serialized = transaction.serialize();
		return Buffer.from(serialized).toString('base64');
	} catch (error) {
		logger.error('Failed to serialize transaction to base64', {
			error: error instanceof Error ? error.message : 'Unknown error'
		});
		throw error;
	}
}

/**
 * Estimate transaction fee for ATA creation (informational only)
 * 
 * @returns number - Estimated fee in SOL
 */
export function estimateATACreationFee(): number {
	// ATA creation typically costs:
	// - Transaction fee: ~0.000005 SOL
	// - Account rent: ~0.00203928 SOL
	// Total: ~0.002044 SOL
	return 0.002044;
}