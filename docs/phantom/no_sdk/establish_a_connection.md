# Establish a connection

Once an application has [detected the provider](/solana/detecting-the-provider), it can then request to connect to Phantom. This connection request will prompt the user for permission to share their public key, indicating that they are willing to interact further. Users must approve a connection request before the app can make additional requests such as [signing a message](/solana/signing-a-message) or [sending a transaction](/solana/sending-a-transaction).

Once permission is established for the first time, the web application's domain will be whitelisted for future connection requests. After a connection is established, it is possible to terminate the connection from both the application and the user side.

## Connect

The **recommended** and **easiest** way to connect to Phantom is by calling `window.phantom.solana.connect()`. However, the provider also exposes a `request` JSON RPC interface.

### connect()

```javascript  theme={null}
const provider = getProvider(); // see "Detecting the Provider"
try {
    const resp = await provider.connect();
    console.log(resp.publicKey.toString());
    // 26qv4GCcx98RihuK3c4T6ozB3J7L6VwCuFVc7Ta2A3Uo 
} catch (err) {
    // { code: 4001, message: 'User rejected the request.' }
}
```

### request()

```javascript  theme={null}
const provider = getProvider(); // see "Detecting the Provider"
try {
    const resp = await provider.request({ method: "connect" });
    console.log(resp.publicKey.toString());
    // 26qv4GCcx98RihuK3c4T6ozB3J7L6VwCuFVc7Ta2A3Uo 
} catch (err) {
    // { code: 4001, message: 'User rejected the request.' }
}
```

The `connect()` call will return a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) that resolves when the user accepts the connection request, and reject (throw when awaited) when the user declines the request or closes the pop-up. See [Errors](errors) for a breakdown of error messages Phantom may emit.

When the user accepts the request to connect, the provider will also emit a `connect` event.

```javascript  theme={null}
provider.on("connect", () => console.log("connected!"));
```

Once the web application is connected to Phantom, it will be able to read the connected account's public key and prompt the user for additional transactions. It also exposes a convenience `isConnected` boolean.

```javascript  theme={null}
console.log(provider.publicKey.toString());
// 26qv4GCcx98RihuK3c4T6ozB3J7L6VwCuFVc7Ta2A3Uo 
console.log(provider.isConnected);
// true
```

## Eagerly connecting

After a web application connects to Phantom for the first time, it becomes trusted. Once trusted, it's possible for the application to automatically connect to Phantom on subsequent visits or page refreshes, without prompting the user for permission. This is referred to as "eagerly connecting".

To implement this, applications should pass an `onlyIfTrusted` option into the `connect()` call.

### connect()

```javascript  theme={null}
provider.connect({ onlyIfTrusted: true });
```

### request()

```javascript  theme={null}
window.solana.request({ method: "connect", params: { onlyIfTrusted: true }});
```

If this flag is present, Phantom will only eagerly connect and emit a `connect` event if the application is trusted. If the application is not trusted, Phantom will throw a [4001 error](/solana/errors) and remain disconnected until the user is prompted to connect without an `onlyIfTrusted` flag. In either case, Phantom will not open a pop-up window, making this convenient to use on all page loads.

The following is an example of how a React application can eagerly connect to Phantom.

```javascript  theme={null}
import { useEffect } from "react";

useEffect(() => {
    // Will either automatically connect to Phantom, or do nothing.
    provider.connect({ onlyIfTrusted: true })
        .then(({ publicKey }) => {
            // Handle successful eager connection
        })
        .catch(() => {
            // Handle connection failure as usual
        })
}, []);
```

For a live demo, refer to the [handleConnect](https://github.com/phantom/sandbox/blob/b57fdd0e65ce4f01290141a01e33d17fd2f539b9/src/App.tsx#L263) function in our sandbox.

If a wallet disconnects from a trusted app and then attempts to reconnect at a later time, Phantom will still eagerly connect. Once an app is trusted, Phantom will only require the user to approve a connection request if the user revokes the app from within their **Trusted Apps** settings.

## Disconnect

Disconnecting mirrors the same process as connecting. However, it is also possible for the wallet to initiate the disconnection, rather than the application itself.

### disconnect()

```javascript  theme={null}
provider.disconnect();
```

### request()

```javascript  theme={null}
provider.request({ method: "disconnect" });
```

The following is an example of how a React application can [gracefully handle](https://github.com/phantom-labs/sandbox/blob/b57fdd0e65ce4f01290141a01e33d17fd2f539b9/src/App.tsx#L107) a `disconnect` event.

```javascript  theme={null}
import { useState, useEffect } from "react";

const [pubKey, setPubKey] = useState(null);

useEffect(() => {
  // Store user's public key once they connect
  provider.on("connect", (publicKey) => {
    setPubKey(publicKey);
  });

  // Forget user's public key once they disconnect
  provider.on("disconnect", () => {
    setPubKey(null);
  });
}, [provider]);
```

## Change accounts

Phantom allows users to seamlessly manage multiple accounts (such as [keypairs](https://solana-foundation.github.io/solana-web3.js/classes/Keypair.html)) from within a single extension or mobile app. Whenever a user switches accounts, Phantom will emit an `accountChanged` event.

If a user changes accounts while already connected to an application, and the new account had already whitelisted that application, then the user will stay connected and Phantom will pass the [PublicKey](https://solana-foundation.github.io/solana-web3.js/classes/PublicKey.html) of the new account:

```javascript  theme={null}
provider.on('accountChanged', (publicKey) => {
    if (publicKey) {
        // Set new public key and continue as usual
        console.log(`Switched to account ${publicKey.toBase58()}`);
    } 
});
```

If Phantom does not pass the public key of the new account, an application can either do nothing or attempt to reconnect:

```javascript  theme={null}
provider.on('accountChanged', (publicKey) => {
    if (publicKey) {
      // Set new public key and continue as usual
      console.log(`Switched to account ${publicKey.toBase58()}`);
    } else {
      // Attempt to reconnect to Phantom
      provider.connect().catch((error) => {
        // Handle connection failure
      });
    }
});
```


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.phantom.com/llms.txt
