# Connect

In order to start interacting with Phantom, an app must first establish a connection. This connection request will prompt the user for permission to share their public key, indicating that they are willing to interact further.

Once a user connects to Phantom, Phantom will return a `session` param that should be used on all subsequent methods. For more information on sessions, see [Handle sessions](../handling-sessions).

## Base URL

```
https://phantom.app/ul/v1/connect
```

## Query string parameters

* `app_url` (required): A URL that is stored in the session token for validation purposes. This URL is used during session validation and can be checked against the blocklist. URL-encoded.
* `dapp_encryption_public_key` (required): A public key used for end-to-end encryption. This will be used to generate a shared secret. For more information on how Phantom handles shared secrets, see [Encryption](../encryption).
* `redirect_link` (required): The URI where Phantom should redirect the user upon connection. This URL is also used to fetch app metadata (such as title, icon, and favicon) for display in the connection approval dialog, using the same properties found in [Display your app](../../best-practices/displaying-your-app). The origin from this URL is also used for trusted app management. For more details, see [Specify redirects](../specifying-redirects). URL-encoded.
* `cluster` (optional): The network that should be used for subsequent interactions. Can be either: `mainnet-beta`, `testnet`, or `devnet`. Defaults to `mainnet-beta`.

<Note>
  **Important distinction between `redirect_link` and `app_url`**:

  * `redirect_link` is used to fetch app metadata (title, icon, favicon) for display in the connection approval dialog and for trusted app management. This is what users see when approving the connection.

  * `app_url` is stored in the session token for validation purposes and is not used for fetching metadata or display purposes.

  **Redirect link behavior**:

  * **HTTPS URLs**: App metadata (logo, title, favicon) displays correctly in the connection dialog, but the redirect opens in the mobile browser instead of redirecting back to your app.

  * **Custom scheme URIs**: Properly redirects back to your mobile app, but app metadata is not displayed in the connection dialog.

  For more details on choosing a redirect link type, see [Specify redirects](../specifying-redirects).
</Note>

## Returns

### Approve

* `phantom_encryption_public_key`: An encryption public key used by Phantom for the construction of a shared secret between the connecting app and Phantom, encoded in base58.
* `nonce`: A nonce used for encrypting the response, encoded in base58.
* `data`: An encrypted JSON string. Refer to [Encryption](../encryption) to learn how apps can decrypt `data` using a shared secret. Encrypted bytes are encoded in base58.

  ```json  theme={null}
  // content of decrypted `data`-parameter
  {
    // base58 encoding of user public key
    "public_key": "BSFtCudCd4pR4LSFqWPjbtXPKSNVbGkc35gRNdnqjMCU",

    // session token for subsequent signatures and messages
    // dapps should send this with any other deeplinks after connect
    "session": "..."
  }
  ```

  * `public_key`: The public key of the user, represented as a base58-encoded string.
  * `session`: A string encoded in base58. This should be treated as opaque by the connecting app, as it only needs to be passed alongside other parameters. Sessions do not expire. For more details, see [Handle sessions](../handling-sessions).

### Reject

An `errorCode` and `errorMessage` as query parameters. For a full list of possible error codes, see [Errors](../../solana/errors).

```
{
  "errorCode": "...",
  "errorMessage": "..."
}
```

## Example

Refer to the [connect](https://github.com/phantom-labs/deep-link-demo-app/blob/20f19f2154e98699f0d5a6b28bc4bb3d5acbcefd/App.tsx#L175) method implemented in our React Native demo application.


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.phantom.com/llms.txt
