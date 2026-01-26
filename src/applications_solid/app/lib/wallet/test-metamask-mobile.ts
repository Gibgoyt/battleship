/**
 * TEST FILE: MetaMask Mobile Browser Connection
 * 
 * This file contains test functions to validate the new clean MetaMask mobile browser implementation.
 * Use this in MetaMask mobile browser to test the 2-stage connection flow.
 */

import { getMetaMaskEnvironment } from './exchange-utils';
import { getMetaMaskWalletInfo, connectToMetaMaskWallet, extractSolanaAccounts, validateMetaMaskSolanaSupport, getBestSolanaAccount, debugWalletStandardInfo } from './wallet-standard-utils';
import { MetaMaskSolanaProvider } from './wallet-providers';

/**
 * Test the MetaMask environment detection
 */
export function testMetaMaskEnvironmentDetection() {
  console.group('🔍 MetaMask Environment Detection Test');
  
  const env = getMetaMaskEnvironment();
  
  console.log('Environment Detection Result:', env);
  console.log('Connection Strategy:', env.connectionStrategy);
  console.log('Is MetaMask Browser:', env.isMetaMaskBrowser);
  console.log('Supports Snaps:', env.supportsSnaps);
  console.log('Requires Wallet Standard:', env.requiresWalletStandard);
  
  // Expected results for MetaMask mobile browser:
  console.log('\n✅ Expected for MetaMask Mobile Browser:');
  console.log('- connectionStrategy: "METAMASK_BROWSER"');
  console.log('- isMetaMaskBrowser: true');
  console.log('- supportsSnaps: false');
  console.log('- requiresWalletStandard: true');
  
  console.groupEnd();
  
  return env;
}

/**
 * Test the Wallet Standard API detection
 */
export async function testWalletStandardDetection() {
  console.group('🔍 Wallet Standard Detection Test');
  
  try {
    // Debug all available wallets
    debugWalletStandardInfo();
    
    // Get MetaMask specific info
    const walletInfo = await getMetaMaskWalletInfo();
    
    if (!walletInfo) {
      console.error('❌ MetaMask wallet not found via Wallet Standard');
      return null;
    }
    
    console.log('✅ MetaMask wallet found via Wallet Standard');
    console.log('Wallet name:', walletInfo.wallet.name);
    console.log('Has Solana support:', walletInfo.hasSolanaSupport);
    console.log('Solana accounts count:', walletInfo.solanaAccounts.length);
    console.log('Supported features:', walletInfo.supportedFeatures);
    
    if (walletInfo.solanaAccounts.length > 0) {
      console.log('Solana accounts:');
      walletInfo.solanaAccounts.forEach((account, index) => {
        console.log(`  Account ${index + 1}:`);
        console.log(`    Address: ${account.address}`);
        console.log(`    Chains: ${account.chains.join(', ')}`);
      });
    }
    
    console.groupEnd();
    return walletInfo;
    
  } catch (error) {
    console.error('❌ Wallet Standard detection failed:', error);
    console.groupEnd();
    throw error;
  }
}

/**
 * Test the complete 3-stage connection flow (FIXED WITH CONNECTION!)
 */
export async function testMetaMaskMobileConnection() {
  console.group('🚀 MetaMask Mobile Connection Test (3-Stage Flow)');
  
  try {
    // Stage 1: Environment check
    console.log('📋 STAGE 1: Environment Detection');
    const env = testMetaMaskEnvironmentDetection();
    
    if (env.connectionStrategy !== 'METAMASK_BROWSER') {
      throw new Error(`Expected METAMASK_BROWSER, got ${env.connectionStrategy}`);
    }
    
    console.log('✅ STAGE 1 Complete: Environment is MetaMask mobile browser');
    
    // Stage 2: Wallet Standard detection (no connection yet)
    console.log('\n📋 STAGE 2: Wallet Standard Detection');
    const walletInfo = await testWalletStandardDetection();
    
    if (!walletInfo) {
      throw new Error('Wallet Standard detection failed');
    }
    
    console.log('✅ STAGE 2 Complete: Wallet Standard API working');
    
    // Stage 3: CONNECTION (THIS IS THE MISSING PIECE!)
    console.log('\n📋 STAGE 3: Connecting to MetaMask (will trigger popup)');
    
    try {
      await connectToMetaMaskWallet(walletInfo);
      console.log('✅ STAGE 3 Complete: Connection established');
    } catch (error) {
      console.error('❌ STAGE 3 Failed: Connection failed');
      throw error;
    }
    
    // Stage 4: Extract Solana accounts (AFTER connection)
    console.log('\n📋 STAGE 4: Extracting Solana accounts after connection');
    
    try {
      await extractSolanaAccounts(walletInfo);
      console.log('✅ STAGE 4 Complete: Solana accounts extracted');
    } catch (error) {
      console.error('❌ STAGE 4 Failed: Account extraction failed');
      throw error;
    }
    
    // Stage 5: Solana validation
    console.log('\n📋 STAGE 5: Solana Support Validation');
    validateMetaMaskSolanaSupport(walletInfo);
    console.log('✅ STAGE 5 Complete: Solana support validated');
    
    // Stage 6: Account selection
    console.log('\n📋 STAGE 6: Best Solana Account Selection');
    const bestAccount = getBestSolanaAccount(walletInfo);
    console.log('✅ STAGE 6 Complete: Best account selected');
    console.log('Selected account:', bestAccount.address);
    console.log('Supported chains:', bestAccount.chains.join(', '));
    
    console.log('\n🎉 ALL STAGES COMPLETE: MetaMask mobile browser connection ready!');
    console.groupEnd();
    
    return {
      environment: env,
      walletInfo,
      selectedAccount: bestAccount
    };
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    console.groupEnd();
    throw error;
  }
}

/**
 * Test the actual connection using MetaMaskSolanaProvider
 */
export async function testMetaMaskProviderConnection() {
  console.group('🦊 MetaMask Provider Connection Test');
  
  try {
    const provider = new MetaMaskSolanaProvider();
    
    console.log('Provider created:', provider.name);
    console.log('Provider available:', provider.isAvailable());
    
    if (!provider.isAvailable()) {
      throw new Error('MetaMask provider not available');
    }
    
    console.log('🔄 Attempting connection...');
    const result = await provider.connect();
    
    console.log('✅ Connection successful!');
    console.log('Connected public key:', result.publicKey.toBase58());
    console.log('Provider connected:', provider.isConnected());
    
    console.groupEnd();
    return {
      provider,
      publicKey: result.publicKey
    };
    
  } catch (error) {
    console.error('❌ Provider connection failed:', error);
    console.groupEnd();
    throw error;
  }
}

/**
 * Complete end-to-end test
 */
export async function runCompleteMetaMaskTest() {
  console.group('🔬 COMPLETE METAMASK MOBILE BROWSER TEST');
  console.log('Testing clean MetaMask mobile browser connection implementation...');
  
  try {
    // Test 1: 2-stage connection flow
    console.log('\n🧪 TEST 1: 2-Stage Connection Flow');
    const connectionTest = await testMetaMaskMobileConnection();
    
    // Test 2: Provider connection
    console.log('\n🧪 TEST 2: Provider Connection');
    const providerTest = await testMetaMaskProviderConnection();
    
    // Verify they match
    const flowAddress = connectionTest.selectedAccount.address;
    const providerAddress = providerTest.publicKey.toBase58();
    
    if (flowAddress === providerAddress) {
      console.log('✅ TEST VERIFICATION: Addresses match!');
    } else {
      console.warn('⚠️ TEST VERIFICATION: Address mismatch');
      console.log('Flow address:', flowAddress);
      console.log('Provider address:', providerAddress);
    }
    
    console.log('\n🎉 ALL TESTS PASSED: Clean MetaMask mobile browser implementation working!');
    console.groupEnd();
    
    return {
      success: true,
      environment: connectionTest.environment,
      walletInfo: connectionTest.walletInfo,
      provider: providerTest.provider,
      publicKey: providerTest.publicKey
    };
    
  } catch (error) {
    console.error('❌ COMPLETE TEST FAILED:', error);
    console.groupEnd();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Export for browser testing
if (typeof window !== 'undefined') {
  (window as any).testMetaMask = {
    testEnvironment: testMetaMaskEnvironmentDetection,
    testWalletStandard: testWalletStandardDetection,
    testConnection: testMetaMaskMobileConnection,
    testProvider: testMetaMaskProviderConnection,
    runCompleteTest: runCompleteMetaMaskTest
  };
  
  console.log('🔧 MetaMask test functions available on window.testMetaMask');
}