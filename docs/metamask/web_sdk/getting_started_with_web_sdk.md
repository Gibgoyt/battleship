# Getting Started with the Web SDK

> Embedded Wallets SDKs were previously marketed as Web3Auth Plug and Play SDKs. Package names and APIs remain Web3Auth (for example, @web3auth/modal).

Embedded Wallets SDKs were previously marketed as Web3Auth Plug and Play SDKs. Package names and APIs remain Web3Auth (for example, `@web3auth/modal`).


## Overview​

Embedded Wallets provide a seamless authentication experience for web applications with social logins, external wallets, and more. Using our JavaScript SDK, you can easily connect users to their preferred wallets and manage authentication state.


## Requirements​

- This is a frontend SDK and must be used in a browser environment.
- Basic knowledge of JavaScript.


## Installation​

Install the Web3Auth Modal SDK using npm or yarn:

```
npm install --save @web3auth/modal

```


## Setup​

Prerequisites Before you start, make sure you have registered on the [Web3Auth Dashboard](https://dashboard.web3auth.io/) and have set up your project. You can look into the [Dashboard Setup](https://docs.metamask.io/embedded-wallets/dashboard/) guide to learn more.


### 1. Configuration​

Create an instance of Web3Auth containing the basic needed configuration. These configuration will contain your Web3Auth Client ID and Network details from the [Web3Auth Dashboard](https://dashboard.web3auth.io/).

```
import { Web3Auth, WEB3AUTH_NETWORK } from '@web3auth/modal'

const web3auth = new Web3Auth({
  clientId: 'YOUR_WEB3AUTH_CLIENT_ID', // Pass your Web3Auth Client ID, ideally using an environment variable // Get your Client ID from Web3Auth Dashboard
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET, // or WEB3AUTH_NETWORK.SAPPHIRE_DEVNET
})

```


### 2. Initialize Web3Auth​

Initialize the Web3Auth instance before using any authentication methods:

```
await web3auth.init()

```


## Advanced Configuration​

The Web3Auth Modal SDK offers a rich set of advanced configuration options:

- **Smart Accounts**: Configure account abstraction parameters.
- **Custom Authentication**: Define authentication methods.
- **Whitelabeling & UI Customization**: Personalize the modal's appearance.
- **Multi-Factor Authentication (MFA)**: Set up and manage MFA.
- **Wallet Services**: Integrate additional wallet services.

Head over to the [Advanced Configuration](https://docs.metamask.io/embedded-wallets/sdk/js/advanced/) section to learn more about each configuration option.

```
import { Web3Auth, WEB3AUTH_NETWORK } from '@web3auth/modal'

const web3auth = new Web3Auth({
  clientId: 'YOUR_WEB3AUTH_CLIENT_ID', // Pass your Web3Auth Client ID, ideally using an environment variable
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET, // or WEB3AUTH_NETWORK.SAPPHIRE_DEVNET
})

```


## Blockchain Integration​

Web3Auth is blockchain agnostic, enabling integration with any blockchain network. Out of the box, Web3Auth offers robust support for both **Solana** and **Ethereum**, each with dedicated provider methods.


### Solana Integration​

To interact with Solana networks, you can get the provider from Web3Auth and use it with Solana libraries:

```
await web3auth.connect()
// Use with a Solana library
const solanaWallet = new SolanaWallet(web3auth.provider)

```


### Ethereum Integration​

For Ethereum integration, you can get the provider and use it with ethers or viem:

```
await web3auth.connect()
// Use with ethers.js
const ethProvider = new ethers.BrowserProvider(web3auth.provider)
// OR
// Use with viem
const walletClient = createWalletClient({
  chain: getViewChain(web3auth.provider),
  transport: custom(web3auth.provider),
})

```


## Troubleshooting​


### Bundler Issues: Missing Dependencies​

You might encounter errors related to missing dependencies in the browser environment:

- `Buffer is not defined`
- `process is not defined`
- Other Node.js-specific modules missing errors

These Node.js dependencies need to be polyfilled in your application. We've prepared detailed troubleshooting guides for popular bundlers:

- **Vite Troubleshooting Guide**
- **Svelte Troubleshooting Guide**
- **Nuxt Troubleshooting Guide**
- **Webpack 5 Troubleshooting Guide**


### JWT Errors​

When using Custom Authentication, you may encounter JWT errors:

- [Invalid JWT Verifiers ID field](https://docs.metamask.io/embedded-wallets/troubleshooting/jwt-errors/#invalid-jwt-verifiers-id-field)
- [Failed to verify JWS signature](https://docs.metamask.io/embedded-wallets/troubleshooting/jwt-errors/#failed-to-verify-jws-signature)
- [Duplicate Token](https://docs.metamask.io/embedded-wallets/troubleshooting/jwt-errors/#duplicate-token)
- [Expired Token](https://docs.metamask.io/embedded-wallets/troubleshooting/jwt-errors/#expired-token)
- [Mismatch JWT Validation field](https://docs.metamask.io/embedded-wallets/troubleshooting/jwt-errors/#mismatch-jwt-validation-field)


