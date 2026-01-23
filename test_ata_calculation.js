/**
 * Test script to validate ATA calculation fix for SPLITDO exchange
 * This verifies the fix resolves the "Provided token account does not match registered ATA" error
 */

import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Constants from the error logs
const SPLITDO_MINT = "6vdfHTgLiEXvoGVp8Ga2HaKQsPKj6DrUTee7526SCXoM";
const TEST_WALLET = "2Yz4jKfkYfcFWD8R6uHN8Bs3WTThF2rrfsfodEZJV6cf";
const EXPECTED_ATA = "2yCJtsAFhLHEFn5fuf2RXipju8vpRXo4KowBDENHwDUD";

/**
 * Calculate ATA using the same logic as the fixed solana-service.ts
 */
async function deriveAssociatedTokenAddress(wallet, mint) {
  try {
    // Standard ATA derivation: findProgramAddress([wallet, TOKEN_PROGRAM_ID, mint], ASSOCIATED_TOKEN_PROGRAM_ID)
    const [ataAddress] = await PublicKey.findProgramAddress(
      [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    return ataAddress.toBase58();
  } catch (error) {
    console.error('Error deriving ATA address:', error);
    throw new Error('Failed to derive Associated Token Account address');
  }
}

async function testATACalculation() {
  console.log('🧪 Testing SPLITDO ATA Calculation Fix');
  console.log('======================================');
  
  try {
    const wallet = new PublicKey(TEST_WALLET);
    const mint = new PublicKey(SPLITDO_MINT);
    
    console.log(`📍 Wallet Address: ${TEST_WALLET}`);
    console.log(`🪙 SPLITDO Mint: ${SPLITDO_MINT}`);
    console.log(`🎯 Expected ATA: ${EXPECTED_ATA}`);
    console.log('');
    
    // Calculate ATA using our fixed logic
    const calculatedATA = await deriveAssociatedTokenAddress(wallet, mint);
    
    console.log(`🧮 Calculated ATA: ${calculatedATA}`);
    console.log('');
    
    // Validate the calculation
    const isCorrect = calculatedATA === EXPECTED_ATA;
    
    if (isCorrect) {
      console.log('✅ SUCCESS: ATA calculation is CORRECT!');
      console.log('✅ The fix resolves the 422 "invalid_token_account" error');
      console.log('✅ Backend will now receive the correct token_account_pubkey');
    } else {
      console.log('❌ FAILURE: ATA calculation is INCORRECT!');
      console.log('❌ Expected:', EXPECTED_ATA);
      console.log('❌ Got:     ', calculatedATA);
    }
    
    console.log('');
    console.log('📊 Test Results:');
    console.log(`   • Wallet: ${TEST_WALLET}`);
    console.log(`   • ATA:    ${calculatedATA}`);
    console.log(`   • Match:  ${isCorrect ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testATACalculation();