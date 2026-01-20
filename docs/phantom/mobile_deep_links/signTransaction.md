# SignTransaction

Request Phantom to sign the prepared transaction and return the signature. After receiving the signature, your app can broadcast the transaction itself with [sendRawTransaction](https://solana-foundation.github.io/solana-web3.js/classes/Connection.html#sendRawTransaction) in web3.js, giving you full control over timing, batching, or custom error handling.

## Base URL

```
https://phantom.app/ul/v1/signTransaction
```

## Query string parameters

* `dapp_encryption_public_key` (required): The original encryption public key used from the app side for an existing [Connect](/phantom-deeplinks/provider-methods/connect) session.
* `nonce` (required): A nonce used for encrypting the request, encoded in base58.
* `redirect_link` (required): The URI where Phantom should redirect the user upon completion. For more details, see [Specify redirects](/phantom-deeplinks/specifying-redirects). URL-encoded.
* `payload` (required): An encrypted JSON string with the following fields:

  ```json  theme={null}
  {
    "transaction": "...", // serialized transaction, base58 encoded
    "session": "...", // token received from connect-method
  }
  ```

  * `transaction` (required): The [transaction](https://solana-foundation.github.io/solana-web3.js/classes/Transaction.html) that Phantom will sign, serialized and encoded in base58.
  * `session` (required): The session token received from the [Connect](/phantom-deeplinks/provider-methods/connect) method. For more details, see [Handle sessions](/phantom-deeplinks/handling-sessions).

## Returns

### Approve

* `nonce`: A nonce used for encrypting the response, encoded in base58.
* `data`: An encrypted JSON string. Refer to [Encryption](/phantom-deeplinks/encryption) to learn how apps can decrypt `data` using a shared secret. Encrypted bytes are encoded in base58.

  ```json  theme={null}
  // content of decrypted `data`-parameter
  {
      transaction: "...", // signed serialized transaction, base58 encoded
  }
  ```

  * `transaction`: The signed, serialized transaction that is base58 encoded. Phantom will not submit this transactions. An application can submit this transactions itself using `sendRawTransaction` in [web3.js](https://solana-foundation.github.io/solana-web3.js/classes/Connection.html#sendRawTransaction).

### Reject

An `errorCode` and `errorMessage` as query parameters. For a full list of possible error codes, see [Errors](/solana/errors).

```
{
  "errorCode": "...",
  "errorMessage": "..."
}
```

## Example

Refer to the [signTransaction](https://github.com/phantom-labs/deep-link-demo-app/blob/20f19f2154e98699f0d5a6b28bc4bb3d5acbcefd/App.tsx#L262) method implemented in our React Native demo application.


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.phantom.com/llms.txt
