# Disconnect

After an initial [Connect](/phantom-deeplinks/provider-methods/connect) event has taken place, an app may disconnect from Phantom at anytime. Once disconnected, Phantom will reject all signature requests until another connection is established.

## Base URL

```
https://phantom.app/ul/v1/disconnect
```

## Query string parameters

* `dapp_encryption_public_key` (required): The original encryption public key used from the app side for an existing [Connect](/phantom-deeplinks/provider-methods/connect) session.
* `nonce` (required): A nonce used for encrypting the request, encoded in base58.
* `redirect_link` (required): The URI where Phantom should redirect the user upon completion. For more details, see [Specify redirects](../specifying-redirects). URL-encoded.
* `payload` (required): An encrypted JSON string with the following fields:

  ```json  theme={null}
  {
      "session": "...", // token received from the connect method
  }
  ```

  * `session` (required): The session token received from the [Connect](/phantom-deeplinks/provider-methods/connect) method. For more details, see [Handle sessions](../handling-sessions).

## Returns

### Approve

No query params returned.

### Reject

An `errorCode` and `errorMessage` as query parameters. For a full list of possible error codes, see [Errors](../../solana/errors).

```
{
  "errorCode": "...",
  "errorMessage": "..."
}
```

## Example

Refer to the [disconnect](https://github.com/phantom-labs/deep-link-demo-app/blob/20f19f2154e98699f0d5a6b28bc4bb3d5acbcefd/App.tsx#L187) method implemented in our React Native demo application.


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.phantom.com/llms.txt
