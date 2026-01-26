import { getWallets } from '@wallet-standard/app';
import type { Wallet } from '@wallet-standard/base';
import { PublicKey } from '@solana/web3.js';

export interface MetaMaskWalletInfo {
  wallet: Wallet;
  hasSolanaSupport: boolean;
  solanaAccounts: Array<{
    address: string;
    chains: string[];
    publicKey: PublicKey;
  }>;
  supportedFeatures: string[];
}

export interface SolanaAccount {
  address: string;
  chains: string[];
  publicKey: PublicKey;
}

/**
 * Get MetaMask wallet information via Wallet Standard API
 * STAGE 1: DETECT MetaMask wallet
 * This is the clean way to detect MetaMask in mobile browser environments
 */
export async function getMetaMaskWalletInfo(): Promise<MetaMaskWalletInfo | null> {
  console.log('[WalletStandardUtils] 🔍 STAGE 1: Detecting MetaMask via Wallet Standard API');

  const wallets = getWallets();
  
  // Find MetaMask wallet - be flexible with naming
  const metaMaskWallet = wallets.get().find(wallet => 
    wallet.name === 'MetaMask' || 
    wallet.name.toLowerCase().includes('metamask')
  );
  
  if (!metaMaskWallet) {
    console.log('[WalletStandardUtils] ❌ MetaMask wallet not found via Wallet Standard');
    return null;
  }

  console.log('[WalletStandardUtils] ✅ MetaMask wallet found:', metaMaskWallet.name);

  // Check supported features
  const supportedFeatures = Object.keys(metaMaskWallet.features);
  console.log('[WalletStandardUtils] 📋 Supported features:', supportedFeatures);

  // Check for Solana support
  const hasSolanaSupport = supportedFeatures.some(feature => 
    feature.startsWith('solana:')
  );

  console.log('[WalletStandardUtils] 🟣 Has Solana support:', hasSolanaSupport);
  console.log('[WalletStandardUtils] 📊 Accounts BEFORE connection:', metaMaskWallet.accounts.length);

  return {
    wallet: metaMaskWallet,
    hasSolanaSupport,
    solanaAccounts: [], // Will be populated after connection
    supportedFeatures
  };
}

/**
 * STAGE 2: CONNECT to MetaMask wallet (triggers permission popup)
 * This is the CRITICAL missing step that populates the accounts array
 */
export async function connectToMetaMaskWallet(walletInfo: MetaMaskWalletInfo): Promise<void> {
  console.log('[WalletStandardUtils] 🔌 STAGE 2: Connecting to MetaMask wallet...');

  // Check if wallet has connect feature
  const connectFeature = walletInfo.wallet.features['standard:connect'];
  if (!connectFeature) {
    throw new Error('MetaMask does not support standard:connect feature. Please update MetaMask.');
  }

  try {
    // THIS IS THE CRITICAL MISSING STEP!
    // This triggers the MetaMask permission popup
    console.log('[WalletStandardUtils] 🔄 Calling wallet.connect() - this will trigger MetaMask popup...');
    await (connectFeature as any).connect();
    
    console.log('[WalletStandardUtils] ✅ Connection successful - MetaMask connected!');
    console.log('[WalletStandardUtils] 📊 Accounts AFTER connection:', walletInfo.wallet.accounts.length);
    
  } catch (error) {
    console.error('[WalletStandardUtils] ❌ Connection failed:', error);
    
    if (error && (error as any).code === 4001) {
      throw new Error('User rejected the connection request. Please try again and approve the connection in MetaMask.');
    }
    
    throw new Error(`Failed to connect to MetaMask: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * STAGE 3: EXTRACT Solana accounts (AFTER connection)
 * Now that we're connected, the accounts array will be populated
 */
export async function extractSolanaAccounts(walletInfo: MetaMaskWalletInfo): Promise<void> {
  console.log('[WalletStandardUtils] 🔍 STAGE 3: Extracting Solana accounts after connection...');

  const solanaAccounts: SolanaAccount[] = [];
  
  console.log('[WalletStandardUtils] 🔄 Processing', walletInfo.wallet.accounts.length, 'total accounts...');
  
  for (const account of walletInfo.wallet.accounts) {
    console.log('[WalletStandardUtils] 🔍 Checking account:', account.address);
    console.log('[WalletStandardUtils] 📋 Account chains:', account.chains);
    
    const solanaChains = account.chains.filter(chain => chain.startsWith('solana:'));
    
    if (solanaChains.length > 0) {
      try {
        const publicKey = new PublicKey(account.address);
        solanaAccounts.push({
          address: account.address,
          chains: solanaChains,
          publicKey
        });
        console.log('[WalletStandardUtils] ✅ Solana account found:', account.address);
        console.log('[WalletStandardUtils] 🌐 Supported chains:', solanaChains);
      } catch (error) {
        console.warn('[WalletStandardUtils] ⚠️ Invalid Solana address:', account.address, error);
      }
    }
  }

  console.log('[WalletStandardUtils] 📊 Total Solana accounts found:', solanaAccounts.length);
  
  // Update the wallet info with extracted accounts
  walletInfo.solanaAccounts = solanaAccounts;
}

/**
 * Validate that MetaMask has proper Solana support for our application
 */
export function validateMetaMaskSolanaSupport(walletInfo: MetaMaskWalletInfo): void {
  console.log('[WalletStandardUtils] 🔍 Validating Solana support requirements');

  if (!walletInfo.hasSolanaSupport) {
    console.error('[WalletStandardUtils] ❌ No Solana features detected');
    throw new Error('This application requires Solana support. Please ensure your MetaMask wallet supports Solana transactions.');
  }

  if (walletInfo.solanaAccounts.length === 0) {
    console.error('[WalletStandardUtils] ❌ No Solana accounts found');
    throw new Error('No Solana accounts found in your MetaMask wallet. Please create a Solana account in MetaMask and try again.');
  }

  // Check for required Solana features
  const requiredFeatures = ['solana:signTransaction', 'solana:signAndSendTransaction'];
  const missingFeatures = requiredFeatures.filter(feature => 
    !walletInfo.supportedFeatures.includes(feature)
  );

  if (missingFeatures.length > 0) {
    console.error('[WalletStandardUtils] ❌ Missing required Solana features:', missingFeatures);
    throw new Error(`MetaMask is missing required Solana features: ${missingFeatures.join(', ')}. Please update MetaMask to the latest version.`);
  }

  console.log('[WalletStandardUtils] ✅ Solana support validation passed');
}

/**
 * Get the best Solana account to use (first mainnet, then devnet, then first available)
 */
export function getBestSolanaAccount(walletInfo: MetaMaskWalletInfo): SolanaAccount {
  if (walletInfo.solanaAccounts.length === 0) {
    throw new Error('No Solana accounts available');
  }

  // Prefer mainnet accounts
  const mainnetAccount = walletInfo.solanaAccounts.find(account =>
    account.chains.includes('solana:mainnet')
  );

  if (mainnetAccount) {
    console.log('[WalletStandardUtils] 🎯 Using Solana mainnet account:', mainnetAccount.address);
    return mainnetAccount;
  }

  // Fallback to devnet
  const devnetAccount = walletInfo.solanaAccounts.find(account =>
    account.chains.includes('solana:devnet')
  );

  if (devnetAccount) {
    console.log('[WalletStandardUtils] 🎯 Using Solana devnet account:', devnetAccount.address);
    return devnetAccount;
  }

  // Use first available
  const firstAccount = walletInfo.solanaAccounts[0];
  console.log('[WalletStandardUtils] 🎯 Using first available Solana account:', firstAccount.address);
  return firstAccount;
}

/**
 * Debug function to log detailed wallet information
 */
export function debugWalletStandardInfo(): void {
  console.group('🔍 Wallet Standard Debug Information');
  
  const wallets = getWallets();
  const allWallets = wallets.get();
  
  console.log('Total wallets detected:', allWallets.length);
  
  allWallets.forEach((wallet, index) => {
    console.group(`Wallet ${index + 1}: ${wallet.name}`);
    console.log('Icon:', wallet.icon);
    console.log('Chains:', wallet.chains);
    console.log('Features:', Object.keys(wallet.features));
    console.log('Accounts:', wallet.accounts.length);
    
    wallet.accounts.forEach((account, accountIndex) => {
      console.log(`Account ${accountIndex + 1}:`, {
        address: account.address,
        chains: account.chains,
        features: account.features ? Object.keys(account.features) : 'none'
      });
    });
    
    console.groupEnd();
  });
  
  console.groupEnd();
}