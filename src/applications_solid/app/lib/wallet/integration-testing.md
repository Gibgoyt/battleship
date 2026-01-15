# MetaMask + Solana Integration Testing Guide

## Overview
This document provides comprehensive testing procedures for the MetaMask + Solana integration with SPLITDO token ATA creation functionality.

## Pre-Test Setup

### 1. Development Environment
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 2. Backend API Verification
```typescript
// Test program info endpoint
import { middlewareFetch } from '../middleware/endpoints'

const programInfoResult = await middlewareFetch.Endpoints._Api.SplitdoToken.Program.Info.GET()

if (programInfoResult.status === 200) {
  console.log('Token Mint:', programInfoResult.data.data.utility_token_mint)
  // Expected: "6vdfHTgLiEXvoGVp8Ga2HaKQsPKj6DrUTee7526SCXoM"
} else {
  console.error('Failed to get program info:', programInfoResult.data.message)
}

// Old curl command (replaced):
// curl -X GET https://devbackend.splitdo.app:8443/api/splitdo-token/program/info
```

### 3. MetaMask Setup Requirements
- MetaMask extension version 11.0+ (2025 version with Solana support)
- Solana network enabled in MetaMask
- Test SOL balance (for transaction fees)
- Firebase authentication token for backend API

## Test Cases

### TC001: Wallet Detection
**Objective**: Verify MetaMask is properly detected with Solana capabilities

**Steps**:
1. Open `/app/wallet` page
2. Open browser console
3. Check wallet detection logs

**Expected Results**:
- MetaMask appears in available wallets list
- `isAvailable: true` for MetaMask
- `hasSolanaSupport: true` in capabilities

**Verification Code**:
```javascript
// Browser console
import { walletDetection } from '/src/lib/wallet/wallet-detection';
const wallets = await walletDetection.detectWallets();
console.log('Detected wallets:', wallets);
console.log('MetaMask wallet:', wallets.find(w => w.id === 'metamask'));
```

### TC002: MetaMask Connection
**Objective**: Verify MetaMask connects successfully for Solana

**Steps**:
1. Click "Swap" button on wallet page
2. Select "MetaMask" from wallet modal
3. Approve connection in MetaMask
4. Verify connection status

**Expected Results**:
- MetaMask prompts for Solana account connection
- Connection succeeds without errors
- Wallet context shows connected state
- SOL balance displays correctly

**Debug Commands**:
```javascript
// Check connection state
import { walletConnectService } from '/src/lib/wallet/walletconnect-service';
console.log('Connection state:', walletConnectService.getState());
console.log('Current provider:', walletConnectService.getCurrentWallet());
```

### TC003: ATA Creation Transaction
**Objective**: Verify ATA creation transaction works with MetaMask

**Prerequisites**:
- MetaMask connected
- Firebase authentication token available
- Minimum 0.01 SOL balance

**Steps**:
1. Ensure MetaMask is connected
2. Call ATA creation function
3. Approve transaction in MetaMask
4. Verify backend submission

**Expected Results**:
- Transaction creation succeeds
- MetaMask displays Solana transaction for approval
- Transaction signs successfully
- Backend API accepts signed transaction
- ATA created on Solana blockchain

**Verification Code**:
```javascript
// Test ATA creation
import { useWallet } from '/src/lib/wallet/wallet-context';
const { createSplitdoATA } = useWallet();
const result = await createSplitdoATA();
console.log('ATA creation result:', result);
```

### TC004: Backend API Integration
**Objective**: Verify backend accepts MetaMask-signed transactions

**Prerequisites**:
- Valid Firebase JWT token
- MetaMask-signed transaction

**API Test**:
```typescript
// Test with actual signed transaction (replace values)
import { middlewareFetch } from '../middleware/endpoints'

const createAccountResult = await middlewareFetch.Endpoints._Api.SplitdoToken.Accounts.Create.POST({
  wallet_address: "YOUR_WALLET_ADDRESS",
  token_account_address: "YOUR_ATA_ADDRESS",
  signed_transaction: "YOUR_BASE64_SIGNED_TX"
})

if (createAccountResult.status === 200) {
  console.log('Account created successfully:', createAccountResult.data.data.transaction_signature)
} else if (createAccountResult.status === 409) {
  console.log('Account already exists for this wallet')
} else {
  console.error('Failed to create account:', createAccountResult.data.message)
}

// Old curl command (replaced):
// curl -X POST https://devbackend.splitdo.app:8443/api/splitdo-token/accounts/create \
//   -H "Authorization: Bearer YOUR_FIREBASE_JWT" \
//   -H "Content-Type: application/json" \
//   -d '{ ... }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "transaction_signature": "...",
    "user_id": "...",
    "token_account_pubkey": "...",
    "balance_tokens": 0
  }
}
```

### TC005: Error Handling
**Objective**: Verify proper error handling across scenarios

**Test Scenarios**:

#### 5.1: MetaMask Not Installed
- Hide MetaMask extension
- Attempt connection
- Verify "Not installed" badge appears

#### 5.2: User Rejection
- Start connection flow
- Reject in MetaMask popup
- Verify graceful error handling

#### 5.3: Insufficient SOL Balance
- Empty SOL balance
- Attempt ATA creation
- Verify appropriate error message

#### 5.4: Network Issues
- Disconnect internet
- Attempt operations
- Verify network error handling

### TC006: Multi-Wallet Functionality
**Objective**: Verify MetaMask works alongside Phantom

**Steps**:
1. Install both MetaMask and Phantom
2. Connect to MetaMask first
3. Switch to Phantom
4. Switch back to MetaMask
5. Verify each wallet maintains separate state

**Expected Results**:
- Both wallets detected correctly
- Switching works without conflicts
- Each wallet signs transactions independently

## Performance Testing

### Load Test: Wallet Detection
```javascript
// Performance test
const iterations = 100;
const times = [];

for (let i = 0; i < iterations; i++) {
  const start = performance.now();
  await walletDetection.detectWallets(true); // Force refresh
  times.push(performance.now() - start);
}

console.log('Average detection time:', times.reduce((a, b) => a + b) / times.length, 'ms');
```

### Memory Leak Test
```javascript
// Check for memory leaks during repeated connections
const initialMemory = performance.memory.usedJSHeapSize;

for (let i = 0; i < 50; i++) {
  await walletConnectService.connectWallet('metamask');
  await walletConnectService.disconnect();
}

const finalMemory = performance.memory.usedJSHeapSize;
console.log('Memory change:', finalMemory - initialMemory, 'bytes');
```

## Security Testing

### 1. Transaction Integrity
- Verify signed transactions match intended operations
- Check transaction cannot be modified after signing
- Validate ATA address derivation accuracy

### 2. Authentication Security
- Test with invalid Firebase tokens
- Verify CORS restrictions
- Test authorization header validation

### 3. Input Validation
- Test with malformed wallet addresses
- Test with invalid transaction data
- Verify proper input sanitization

## Browser Compatibility

Test on the following browsers with MetaMask installed:

### Desktop Browsers
- [ ] Chrome 120+ (Primary)
- [ ] Firefox 120+ (Secondary)
- [ ] Edge 120+ (Secondary)
- [ ] Safari 17+ (Tertiary - MetaMask availability varies)

### Mobile Browsers
- [ ] MetaMask Mobile App (Primary)
- [ ] Chrome Mobile with MetaMask
- [ ] Firefox Mobile with MetaMask

## Network Testing

Test on different Solana networks:

### Mainnet
- [ ] Program info retrieval
- [ ] ATA creation transactions
- [ ] Backend API integration

### Devnet (Optional)
- [ ] Switch MetaMask to Solana Devnet
- [ ] Test with devnet backend
- [ ] Verify network detection

## Debug Tools

### Console Debugging
```javascript
// Enable debug logging
localStorage.setItem('debug-wallet', 'true');

// Check wallet provider status
window.walletDebug = {
  metamask: window.ethereum,
  phantom: window.solana,
  walletStandard: window.navigator?.wallets
};

console.log('Wallet providers:', window.walletDebug);
```

### Network Monitoring
```javascript
// Monitor API calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0].includes('/api/splitdo-token/')) {
    console.log('API Call:', args);
  }
  return originalFetch.apply(this, args);
};
```

### Error Tracking
```javascript
// Track wallet errors
window.addEventListener('error', (e) => {
  if (e.error?.message?.includes('wallet') || e.error?.message?.includes('metamask')) {
    console.error('Wallet Error:', e.error);
  }
});

window.addEventListener('unhandledrejection', (e) => {
  if (e.reason?.message?.includes('wallet') || e.reason?.message?.includes('metamask')) {
    console.error('Wallet Promise Rejection:', e.reason);
  }
});
```

## Deployment Verification

### Pre-Deployment Checklist
- [ ] All tests pass in development
- [ ] No console errors during normal flow
- [ ] Memory usage remains stable
- [ ] Network requests work correctly
- [ ] Error handling covers edge cases

### Post-Deployment Verification
- [ ] Production build works correctly
- [ ] CORS headers allow frontend domain
- [ ] SSL certificates valid
- [ ] API endpoints respond correctly
- [ ] Firebase authentication works

### Monitoring Setup
```javascript
// Production monitoring
window.walletAnalytics = {
  connectionAttempts: 0,
  successfulConnections: 0,
  errors: [],

  logConnection: (provider, success, error) => {
    this.connectionAttempts++;
    if (success) {
      this.successfulConnections++;
    } else {
      this.errors.push({ provider, error, timestamp: Date.now() });
    }
  }
};
```

## Troubleshooting Guide

### Common Issues

#### MetaMask Not Detected
**Symptoms**: MetaMask doesn't appear in wallet list
**Solutions**:
1. Check MetaMask version (must be 11.0+)
2. Verify Solana support enabled
3. Refresh page after MetaMask installation

#### Connection Fails
**Symptoms**: Connection attempts fail with errors
**Solutions**:
1. Check browser console for errors
2. Verify MetaMask is unlocked
3. Try switching MetaMask accounts
4. Clear browser cache and try again

#### Transaction Fails
**Symptoms**: Transaction signing fails or backend rejects
**Solutions**:
1. Check SOL balance for fees
2. Verify Firebase authentication
3. Check network connectivity
4. Validate transaction format

#### Backend API Errors
**Symptoms**: API returns 4xx/5xx errors
**Solutions**:
1. Verify CORS configuration
2. Check Firebase token validity
3. Validate request payload format
4. Check backend API logs

## Success Criteria

### Functional Requirements
- [x] MetaMask detects and connects successfully
- [x] ATA creation transactions work end-to-end
- [x] Backend API accepts MetaMask signatures
- [x] Error handling provides clear user feedback
- [x] Multi-wallet functionality works correctly

### Non-Functional Requirements
- [x] Wallet detection completes within 3 seconds
- [x] No memory leaks during repeated operations
- [x] Works across supported browsers
- [x] Secure transaction handling
- [x] Production-ready error handling

## Conclusion

This integration testing guide provides comprehensive verification of the MetaMask + Solana integration with SPLITDO. Follow all test cases to ensure a robust, production-ready implementation.

For additional support or to report issues, refer to:
- MetaMask Solana documentation
- SPLITDO development team
- Browser developer tools for debugging