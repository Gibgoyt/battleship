# SignAllTransactions

Once an app is connected, it is also possible to sign multiple transactions at once. Phantom will not submit these transactions to the network. Applications can submit signed transactions using [sendRawTransaction](https://solana-foundation.github.io/solana-web3.js/classes/Connection.html#sendrawtransaction) in web3.js.

## Base URL

```[expandable]  theme={null}
https://phantom.app/ul/v1/signAllTransactions
```

## Query string parameters

* `dapp_encryption_public_key` (required): The original encryption public key used from the app side for an existing [Connect](/phantom-deeplinks/provider-methods/connect) session.
* `nonce` (required): A nonce used for encrypting the request, encoded in base58.
* `redirect_link` (required): The URI where Phantom should redirect the user upon completion. For more details, see [Specify redirects](../specifying-redirects). URL-encoded.
* `payload` (required): An encrypted JSON string with the following fields:

  ```json  theme={null}
  {
    "transactions": [
      "...", // serialized transaction, bs58-encoded
      "...", // serialized transaction, bs58-encoded
    ],
    "session": "...", // token received from connect-method
  }
  ```

  * `transactions` (required): An array of [transactions](https://solana-foundation.github.io/solana-web3.js/classes/Transaction.html) that Phantom will sign, serialized and encoded in base58.
  * `session` (required): The session token received from the [Connect](/phantom-deeplinks/provider-methods/connect) method. For more details, see [Handle sessions](../handling-sessions).

## Returns

### Approve

* `nonce`: A nonce used for encrypting the response, encoded in base58.
* `data`: An encrypted JSON string. Refer to [Encryption](../encryption) to learn how apps can decrypt `data` using a shared secret. Encrypted bytes are encoded in base58.

  ```json  theme={null}
  // content of decrypted `data`-parameter
  {
      transactions: [
          "...", // signed serialized transaction, bs58-encoded
          "...", // signed serialized transaction, bs58-encoded
      ] 
  }
  ```

  * `transactions`: An array of signed, serialized transactions that are base58 encoded. Phantom will not submit these transactions. Applications can submit these transactions themselves using [sendRawTransaction](https://solana-foundation.github.io/solana-web3.js/classes/Connection.html#sendRawTransaction) in web3.js.

### Reject

An `errorCode` and `errorMessage` as query parameters. For a full list of possible error codes, see [Errors](../../solana/errors).

```
{
  "errorCode": "...",
  "errorMessage": "..."
}
```

## Example

Refer to the [signAllTransactions](https://github.com/phantom-labs/deep-link-demo-app/blob/20f19f2154e98699f0d5a6b28bc4bb3d5acbcefd/App.tsx#L229) method implemented in our React Native demo application.


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.phantom.com/llms.txt:1

