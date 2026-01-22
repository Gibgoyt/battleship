/**
 * MetaMask Solana Exchange Transaction Builder
 * 
 * This module builds unsigned Solana transactions for SOL → SPLITDO exchange.
 * It constructs proper exchange transactions that MetaMask can sign with Solana Snaps.
 * 
 * Key Features:
 * - Builds SOL → SPLITDO exchange transactions
 * - Gets recent blockhash from our backend
 * - Calculates proper fees and exchange amounts  
 * - Uses MetaMask Solana keypair (NOT Ethereum!)
 * - Compatible with backend exchange endpoint
 */

import { 
	PublicKey, 
	Transaction, 
	SystemProgram,
	TransactionInstruction
} from '@solana/web3.js';
import { createLogger } from '../../../../../lib/logger';
import { GET as getRecentBlockhash } from '../../../middleware/endpoints/devbackend_noauth/_api/solana/network/recent-blockhash/GET';

const logger = createLogger('[MetaMask Solana Exchange Builder]');

// SPLITDO Token Mint Address (Solana Mainnet)
export const SPLITDO_TOKEN_MINT = 'CKfatsPMUf8SkiURsDXs7eK6GWb4Jsd6UDbs7twMCWxo';

// SPLITDO SOL Vault Address - This is where we send SOL for exchange
export const SPLITDO_SOL_VAULT_ADDRESS = 'F5bUwq7ttSzqgqVJEA1toXbc31BjPReCoSh9fqkLH62B';

/**
 * Exchange transaction building result interface
 */
export interface SplitdoExchangeTransactionResult {
	success: boolean;
	transaction?: Transaction;
	solAmount?: number;
	splitdoAmount?: number;
	exchangeRate?: number;
	fees?: number;
	error?: string;
	blockhash?: string;
}

/**
 * Exchange calculation parameters
 */
export interface ExchangeCalculation {
	solAmount: number;          // Amount of SOL to exchange (in SOL, not lamports)
	splitdoAmount: number;      // Expected SPLITDO tokens to receive
	exchangeRate: number;       // Current SOL → SPLITDO rate
	fees: number;              // Transaction fees (in SOL)
	totalCost: number;         // Total SOL cost including fees
}

/**
 * Build an unsigned transaction for SOL → SPLITDO exchange
 * 
 * @param ownerPublicKey - The wallet public key (Base58 string or PublicKey object)
 * @param solAmount - Amount of SOL to exchange (in SOL, not lamports)
 * @param exchangeParams - Exchange calculation parameters
 * @returns Promise<SplitdoExchangeTransactionResult>
 */
export async function buildSolToSplitdoExchangeTransaction(
	ownerPublicKey: string | PublicKey,
	solAmount: number,
	exchangeParams: ExchangeCalculation
): Promise<SplitdoExchangeTransactionResult> {
	try {
		logger.info('Building SOL → SPLITDO exchange transaction', {
			owner: typeof ownerPublicKey === 'string' ? ownerPublicKey : ownerPublicKey.toBase58(),
			solAmount,
			splitdoAmount: exchangeParams.splitdoAmount,
			exchangeRate: exchangeParams.exchangeRate,
			fees: exchangeParams.fees
		});

		// Convert string to PublicKey if needed
		const ownerPubkey = typeof ownerPublicKey === 'string' 
			? new PublicKey(ownerPublicKey) 
			: ownerPublicKey;

		const splitdoMintPubkey = new PublicKey(SPLITDO_TOKEN_MINT);
		const exchangeProgramPubkey = new PublicKey(SPLITDO_SOL_VAULT_ADDRESS);

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
		
		logger.debug('Recent blockhash retrieved for exchange', {
			blockhash: blockhash,
			cached: blockhashResult.data.cached || false
		});

		// Create the exchange transaction
		const transaction = new Transaction({
			recentBlockhash: blockhash,
			feePayer: ownerPubkey
		});

		// Convert SOL amount to lamports for the instruction
		const lamportsAmount = Math.floor(solAmount * 1_000_000_000);
		const feeLamports = Math.floor(exchangeParams.fees * 1_000_000_000);

		logger.debug('Exchange amounts calculated', {
			solAmount,
			lamportsAmount,
			splitdoAmount: exchangeParams.splitdoAmount,
			feeLamports
		});

		// Create a simple transfer instruction to the SOL vault
		// The backend handles the SPLITDO token exchange after receiving SOL
		const transferInstruction = SystemProgram.transfer({
			fromPubkey: ownerPubkey,
			toPubkey: exchangeProgramPubkey, // SOL vault receives the SOL
			lamports: lamportsAmount + feeLamports // SOL amount + fees
		});

		// Add the instruction to the transaction
		transaction.add(transferInstruction);

		// Set the fee payer explicitly (MetaMask needs this)
		transaction.feePayer = ownerPubkey;

		logger.info('Exchange transaction built successfully', {
			owner: ownerPubkey.toBase58(),
			solAmount: solAmount,
			splitdoAmount: exchangeParams.splitdoAmount,
			exchangeRate: exchangeParams.exchangeRate,
			totalLamports: lamportsAmount + feeLamports,
			blockhash: blockhash,
			instructionsCount: transaction.instructions.length
		});

		return {
			success: true,
			transaction,
			solAmount,
			splitdoAmount: exchangeParams.splitdoAmount,
			exchangeRate: exchangeParams.exchangeRate,
			fees: exchangeParams.fees,
			blockhash: blockhash
		};

	} catch (error) {
		logger.error('Failed to build SOL → SPLITDO exchange transaction', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			owner: typeof ownerPublicKey === 'string' ? ownerPublicKey : ownerPublicKey?.toBase58(),
			solAmount
		});

		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred while building exchange transaction'
		};
	}
}

/**
 * Calculate exchange parameters (rate, fees, etc.)
 * 
 * @param solAmount - Amount of SOL to exchange
 * @param currentRate - Current SOL → SPLITDO exchange rate (SPLITDO per SOL)
 * @returns ExchangeCalculation with all calculated values
 */
export function calculateExchangeAmounts(solAmount: number, currentRate: number): ExchangeCalculation {
	const baseFee = 0.000005; // Base Solana transaction fee
	const exchangeFee = solAmount * 0.001; // 0.1% exchange fee
	const totalFees = baseFee + exchangeFee;
	
	const splitdoAmount = solAmount * currentRate;
	const totalCost = solAmount + totalFees;

	logger.debug('Exchange calculation completed', {
		solAmount,
		currentRate,
		splitdoAmount,
		baseFee,
		exchangeFee,
		totalFees,
		totalCost
	});

	return {
		solAmount,
		splitdoAmount,
		exchangeRate: currentRate,
		fees: totalFees,
		totalCost
	};
}

/**
 * Serialize exchange transaction to base64 for backend submission
 * 
 * @param transaction - The signed Transaction object
 * @returns string - Base64 encoded transaction
 */
export function serializeExchangeTransactionToBase64(transaction: Transaction): string {
	try {
		const serialized = transaction.serialize();
		return Buffer.from(serialized).toString('base64');
	} catch (error) {
		logger.error('Failed to serialize exchange transaction to base64', {
			error: error instanceof Error ? error.message : 'Unknown error'
		});
		throw error;
	}
}

/**
 * Estimate exchange transaction fee
 * 
 * @param solAmount - Amount of SOL being exchanged
 * @returns number - Estimated fee in SOL
 */
export function estimateExchangeFee(solAmount: number): number {
	const baseFee = 0.000005; // Base Solana transaction fee
	const exchangeFee = solAmount * 0.001; // 0.1% exchange fee
	return baseFee + exchangeFee;
}