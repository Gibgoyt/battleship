# Advanced Configuration

The Web3Auth SDK provides extensive configuration options that allow you to customize authentication flows, UI appearance, blockchain integrations, and security features to meet your application's specific requirements.


## Configuration Structure​

When setting up Web3Auth, you'll pass in the options to the constructor. This consists of:

```
import { Component } from "@angular/core";
import { Web3Auth, WEB3AUTH_NETWORK } from "@web3auth/modal";

const web3auth = new Web3Auth({
  clientId: "YOUR_WEB3AUTH_CLIENT_ID", // Pass your Web3Auth Client ID, ideally using an environment variable // Get your Client ID from Web3Auth Dashboard
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET, // or WEB3AUTH_NETWORK.SAPPHIRE_DEVNET
  // Core and advanced options go here
});

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {

  async ngOnInit() {
    const init = async () => {
      await web3auth.init();
    };

    init();
  }
  ...
}

```


### Web3AuthOptions​

| Parameter | Description |
| --- | --- |
| clientId | [Mandatory] Client Id for web3auth. You can obtain your client id from the web3auth developer dashboard. |
| web3AuthNetwork | [Mandatory] Web3Auth Network to use for the session & the issued idToken. Default is sapphire_mainnet. |
| enableLogging? | Setting to true will enable logs. Default is false. |
| sessionTime? | Session Time (in seconds) for idToken issued by Web3Auth for server side verification. Default is 7 days (7 * 86400). Max value can be 30 days (86400 * 30) and min can be 1 sec (1) |
| useSFAKey? | Uses Single Factor Auth SDK key with web3auth provider. Default is false. |
| storageType? | Setting to local will persist social login session across browser tabs. Default is local. |
| defaultChainId? | Default chain Id to use. Your first chain will be used as default. |
| multiInjectedProviderDiscovery? | Whether to enable discovery of injected wallets in the browser. Default is true. |


## Session Management​

Control how long users stay authenticated and how sessions persist.

**Key Configuration Options:**

- `sessionTime` - Session duration in seconds. Controls how long users remain authenticated before
needing to log in again.

Minimum: 1 second (`1`).
Maximum: 30 days (`86400 * 30`).
Default: 7 days (`86400 * 7`).
- `storageType` - Storage location for authentication state. Options:

`"local"`: Persists across browser tabs and browser restarts (localStorage)
`"session"`: Persists only in current tab, cleared when tab closes (sessionStorage)

- Minimum: 1 second (`1`).
- Maximum: 30 days (`86400 * 30`).
- Default: 7 days (`86400 * 7`).

- `"local"`: Persists across browser tabs and browser restarts (localStorage)
- `"session"`: Persists only in current tab, cleared when tab closes (sessionStorage)

```
const web3AuthOptions = {
  clientId: 'YOUR_WEB3AUTH_CLIENT_ID', // Pass your Web3Auth Client ID, ideally using an environment variable
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,

  // Session configuration
  sessionTime: 86400 * 7, // 7 days (in seconds)
  storageType: 'local', // 'local' (persistent across tabs) or 'session' (single tab only)
}

```


## Multi-Factor Authentication (MFA)​

Add additional security layers to protect user accounts with two-factor authentication. For detailed
configuration options and implementation examples, see the [Multi-Factor Authentication](https://docs.metamask.io/embedded-wallets/sdk/js/advanced/mfa/)
section.

**Key Configuration Options:**

- `mfaSettings` - Configure MFA settings for different authentication flows
- `mfaLevel` - Control when users are prompted to set up MFA


## Custom Authentication Methods​

Control the login options presented to your users and how they're displayed in the modal. For
detailed configuration options and implementation examples, see the
[Custom Authentication](https://docs.metamask.io/embedded-wallets/sdk/js/advanced/custom-authentication/) section.

**Key Configuration Options:**

- `modalConfig` - Define which authentication methods are available and customize their appearance


## UI Customization​

Create a seamless brand experience by customizing the Web3Auth Modal to match your application's
design. For complete customization options, refer to the
[Whitelabeling & UI Customization](https://docs.metamask.io/embedded-wallets/sdk/js/advanced/whitelabel/) section.

**Key Configuration Options:**

- `uiConfig` - Personalize the modal's look and feel with custom colors, logos, themes, and more
- `modalConfig` - Control the visibility and arrangement of authentication options


## Smart Accounts (Account Abstraction)​

Improve user experience with gasless transactions and advanced account features. Learn more in the
[Smart Accounts](https://docs.metamask.io/embedded-wallets/sdk/js/advanced/smart-accounts/) documentation.

**Key Configuration Options:**

- `accountAbstractionConfig` - Fine-tune parameters for smart account implementation
- `useAAWithExternalWallet` - Enable account abstraction functionality even when users connect with
external wallets


## Wallet Services​

Extend your application with enhanced wallet functionality. See the
[Wallet Services](https://docs.metamask.io/embedded-wallets/sdk/js/advanced/wallet-services/) documentation for complete configuration options.

**Key Configuration Options:**

- `walletServicesConfig` - Integrate additional wallet services and features


