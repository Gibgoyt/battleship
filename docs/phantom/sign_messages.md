# Sign messages

> Message signing with Browser SDK

The Phantom Connect Browser SDK provides chain-specific message signing methods through dedicated interfaces (`sdk.solana` and `sdk.ethereum`).

## Chain-specific message signing

### Solana message signing

```typescript  theme={null}
// Sign a message with Solana wallet
const signature = await sdk.solana.signMessage("Hello Solana!");
// Returns: { signature: string, rawSignature: string }
```

### Ethereum message signing

```typescript  theme={null}
// Sign personal message
const signature = await sdk.ethereum.signPersonalMessage("Hello Ethereum!", address);

// Sign EIP-712 typed data
const typedDataSignature = await sdk.ethereum.signTypedData(typedData, address);
```

## Complete examples

### Solana message signing

```typescript  theme={null}
import { BrowserSDK, AddressType } from "@phantom/browser-sdk";

const sdk = new BrowserSDK({
  providers: ["injected"],
  addressTypes: [AddressType.solana],
});

await sdk.connect({ provider: "injected" });

// Sign a message
const signature = await sdk.solana.signMessage("Hello Solana!");
console.log("Signature:", signature.signature);
console.log("Raw signature:", signature.rawSignature);
```

### Ethereum message signing

```typescript  theme={null}
import { BrowserSDK, AddressType } from "@phantom/browser-sdk";

const sdk = new BrowserSDK({
  providers: ["injected"],
  addressTypes: [AddressType.ethereum],
});

await sdk.connect({ provider: "injected" });
const accounts = await sdk.ethereum.getAccounts();

// Sign personal message
const message = "Hello Ethereum!";
const signature = await sdk.ethereum.signPersonalMessage(message, accounts[0]);
console.log("Signature:", signature.signature);
```

### EIP-712 typed data signing

```typescript  theme={null}
const typedData = {
  types: {
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" }
    ],
    Mail: [
      { name: "from", type: "string" },
      { name: "to", type: "string" },
      { name: "contents", type: "string" }
    ]
  },
  primaryType: "Mail",
  domain: {
    name: "Ether Mail",
    version: "1",
    chainId: 1,
    verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
  },
  message: {
    from: "Alice",
    to: "Bob",
    contents: "Hello!"
  }
};

const accounts = await sdk.ethereum.getAccounts();
const signature = await sdk.ethereum.signTypedData(typedData, accounts[0]);
console.log("Typed data signature:", signature.signature);
```


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.phantom.com/llms.txt
