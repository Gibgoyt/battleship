# Sign and send transactions

> Transaction signing and sending with Browser SDK

The Phantom Connect Browser SDK provides chain-specific transaction methods through dedicated interfaces (`sdk.solana` and `sdk.ethereum`) for optimal transaction handling.

<Warning>
  **Embedded wallet limitations**: The `signTransaction` and `signAllTransactions` methods **aren't supported** for embedded wallets. For embedded wallets, use only `signAndSendTransaction` that signs and broadcasts the transaction in a single step.
</Warning>

<Info>
  **Transaction security for embedded wallets**: All transactions signed for embedded wallets pass through Phantom's advanced simulation system before execution. This security layer automatically blocks malicious transactions and transactions from origins that have been reported as malicious, providing an additional layer of protection for your users' assets.
</Info>

## Chain-specific transaction methods

### Solana transactions (sdk.solana)

```typescript  theme={null}
// Sign and send transaction
const result = await sdk.solana.signAndSendTransaction(transaction);

// Just sign (without sending) - Note: Not supported for embedded wallets
const signedTx = await sdk.solana.signTransaction(transaction);
```

### Ethereum transactions (sdk.ethereum)

```typescript  theme={null}
// Send transaction
const result = await sdk.ethereum.sendTransaction({
  to: "0x...",
  value: "1000000000000000000",
  gas: "21000",
});
```

## Transaction examples

### Solana transaction examples

The SDK supports multiple Solana transaction libraries. Here are examples using both `@solana/web3.js` and `@solana/kit`:

#### Solana with @solana/web3.js

```typescript  theme={null}
import {
  VersionedTransaction,
  TransactionMessage,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
  Connection,
} from "@solana/web3.js";
import { BrowserSDK, AddressType } from "@phantom/browser-sdk";

const sdk = new BrowserSDK({
  providers: ["injected"],
  addressTypes: [AddressType.solana],
});

await sdk.connect({ provider: "injected" });

// Get recent blockhash
const connection = new Connection("https://api.mainnet-beta.solana.com");
const { blockhash } = await connection.getLatestBlockhash();

// Create transfer instruction
const fromAddress = await sdk.solana.getPublicKey();
const transferInstruction = SystemProgram.transfer({
  fromPubkey: new PublicKey(fromAddress),
  toPubkey: new PublicKey(toAddress),
  lamports: 0.001 * LAMPORTS_PER_SOL,
});

// Create VersionedTransaction
const messageV0 = new TransactionMessage({
  payerKey: new PublicKey(fromAddress),
  recentBlockhash: blockhash,
  instructions: [transferInstruction],
}).compileToV0Message();

const transaction = new VersionedTransaction(messageV0);

// Send transaction using chain-specific API
const result = await sdk.solana.signAndSendTransaction(transaction);
console.log("Transaction signature:", result.hash);
```

#### Solana with @solana/kit

```typescript  theme={null}
import {
  createSolanaRpc,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  address,
  compileTransaction,
} from "@solana/kit";
import { BrowserSDK, AddressType } from "@phantom/browser-sdk";

const sdk = new BrowserSDK({
  providers: ["injected"],
  addressTypes: [AddressType.solana],
});

await sdk.connect({ provider: "injected" });

// Create transaction with @solana/kit
const rpc = createSolanaRpc("https://api.mainnet-beta.solana.com");
const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

const userPublicKey = await sdk.solana.getPublicKey();
const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  tx => setTransactionMessageFeePayer(address(userPublicKey), tx),
  tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
);

const transaction = compileTransaction(transactionMessage);

// Send using chain-specific API
const result = await sdk.solana.signAndSendTransaction(transaction);
console.log("Transaction signature:", result.hash);
```

### Ethereum transaction examples

```typescript  theme={null}
import { BrowserSDK, AddressType } from "@phantom/browser-sdk";

const sdk = new BrowserSDK({
  providers: ["injected"],
  addressTypes: [AddressType.ethereum],
});

await sdk.connect({ provider: "injected" });

// Simple ETH transfer
const result = await sdk.ethereum.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b8D4C8db86fB5C4A7E",
  value: "1000000000000000000", // 1 ETH in wei
  gas: "21000",
  gasPrice: "20000000000", // 20 gwei
});

// EIP-1559 transaction with maxFeePerGas
const result2 = await sdk.ethereum.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b8D4C8db86fB5C4A7E",
  value: "1000000000000000000", // 1 ETH in wei
  data: "0x...", // contract call data
  gas: "50000",
  maxFeePerGas: "30000000000", // 30 gwei
  maxPriorityFeePerGas: "2000000000", // 2 gwei
});

console.log("Transaction hash:", result.hash);
```

#### Ethereum with viem

```typescript  theme={null}
import { parseEther, parseGwei, encodeFunctionData } from "viem";
import { BrowserSDK, AddressType } from "@phantom/browser-sdk";

const sdk = new BrowserSDK({
  providers: ["injected"],
  addressTypes: [AddressType.ethereum],
});

// Simple transfer with viem utilities
const result = await sdk.ethereum.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b8D4C8db86fB5C4A7E",
  value: parseEther("1").toString(), // 1 ETH
  gas: "21000",
  gasPrice: parseGwei("20").toString(), // 20 gwei
});

// Contract interaction
const result2 = await sdk.ethereum.sendTransaction({
  to: tokenContractAddress,
  data: encodeFunctionData({
    abi: tokenAbi,
    functionName: "transfer",
    args: [recipientAddress, parseEther("100")],
  }),
  gas: "50000",
  maxFeePerGas: parseGwei("30").toString(),
  maxPriorityFeePerGas: parseGwei("2").toString(),
});
```


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.phantom.com/llms.txt
