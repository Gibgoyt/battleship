# Sign a message

When a web application is connected to Phantom, it can also request that the user signs a given message. Applications are free to write their own messages which will be displayed to users from within Phantom's signature prompt. Message signatures do not involve network fees and are a convenient way for apps to verify ownership of an address.

In order to send a message for the user to sign, a web application must:

1. Provide a **hex** or **UTF-8** encoded string as a Uint8Array.
2. Request that the encoded message is signed via the user's Phantom wallet.

For an example of signing a message, refer to [handleSignMessage](https://github.com/phantom-labs/sandbox/blob/b57fdd0e65ce4f01290141a01e33d17fd2f539b9/src/App.tsx#L242) in our sandbox.

<Info>
  Phantom uses Ed25519 signatures for Solana message signatures. To verify a message signature, you can use the [tweetnacl](https://www.npmjs.com/package/tweetnacl) npm package.
</Info>

## signMessage()

```javascript  theme={null}
const provider = getProvider(); // see "Detecting the Provider"
const message = `To avoid digital dognappers, sign below to authenticate with CryptoCorgis`;
const encodedMessage = new TextEncoder().encode(message);
const signedMessage = await provider.signMessage(encodedMessage, "utf8");
```

## request()

```javascript  theme={null}
const provider = getProvider(); // see "Detecting the Provider"
const message = `To avoid digital dognappers, sign below to authenticate with CryptoCorgis`;
const encodedMessage = new TextEncoder().encode(message);
const signedMessage = await provider.request({
    method: "signMessage",
    params: {
         message: encodedMessage,
         display: "hex",
    },
});
```

## Sign-In with Solana (SIWS)

Developers who use `signMessage` to authenticate users can now take advantage of Phantom's new [Sign-In with Solana](https://github.com/phantom/sign-in-with-solana) feature. For more information, refer to our [specification](https://github.com/phantom/sign-in-with-solana)  on GitHub.

## Support for other "Sign-In with" Standards

Phantom supports a range of "Sign-In with" (SIW) message standards. You can read more about them in [Sign a message](/developer-powertools/signing-a-message).


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.phantom.com/llms.txt
