# Web3Auth Events & Status

This page documents the key properties and lifecycle events available from a Web3Auth instance. These allow you to track the connection status, react to changes, and build responsive user experiences.


## connected​

Returns `true` if a wallet is connected, otherwise `false`.


#### Interface​

```
get connected(): boolean;

```


#### Usage​

```
const isConnected = web3auth.connected

```


## provider​

Returns the current provider instance if connected.


#### Interface​

```
get provider(): IProvider | null;

```


#### Usage​

```
const provider = web3auth.provider

```


## connectedConnectorName​

Name of the currently connected wallet connector, or `null` if not connected.


#### Interface​

```
connectedConnectorName: WALLET_CONNECTOR_TYPE | null

```

| Event | Description |
| --- | --- |
| AUTH | Web3Auth connector. |
| WALLET_CONNECT_V2 | Wallet Connect V2 connector. |
| COINBASE | Coinbase connector. |
| METAMASK | MetaMask connector. |


#### Usage​

```
const connectorName = web3auth.connectedConnectorName

```


## status​

Current status of the Web3Auth instance. Emits status change events.


#### Interface​

```
status: CONNECTOR_STATUS_TYPE

```

| Event | Description |
| --- | --- |
| NOT_READY | Triggered when the connector is not ready. |
| READY | Triggered when the connector is ready. |
| CONNECTING | Triggered when a connection is being established. |
| CONNECTED | Triggered when a wallet is successfully connected. |
| DISCONNECTING | Triggered when the wallet is in the process of disconnecting. |
| DISCONNECTED | Triggered when the wallet is disconnected. |
| ERRORED | Triggered when an error occurs during the connection lifecycle. |


#### Usage​

```
const status = web3auth.status

```


## currentChain​

Returns the current chain configuration if connected.


#### Interface​

```
get currentChain(): CustomChainConfig | undefined;

```


#### chainConfig​

```
const chainConfig = {
  chainId: "0x1", // Please use 0x1 for Mainnet
  rpcTarget: "https://rpc.ethereum.org",
  displayName: "Ethereum Mainnet",
  blockExplorerUrl: "https://etherscan.io/",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://images.toruswallet.io/eth.svg",
};

```

| Parameter | Description |
| --- | --- |
| chainNamespace | Namespace of the chain |
| chainId | Chain ID of the chain |
| rpcTarget | RPC target URL for the chain |
| wsTarget? | Web socket target URL for the chain |
| displayName? | Display name for the chain |
| blockExplorerUrl? | URL of the block explorer |
| ticker? | Default currency ticker of the network |
| tickerName? | Name for currency ticker |
| decimals? | Number of decimals for the currency |
| logo? | Logo for the token |
| isTestnet? | Whether the network is testnet or not |


#### Usage​

```
const chain = web3auth.currentChain

```


## connectedConnector​

Returns the connector instance for the connected wallet, or `null`.


#### Interface​

```
get connectedConnector(): IConnector<unknown> | null;

```


#### Usage​

```
const connector = web3auth.connectedConnector

```


## accountAbstractionProvider​

Returns the account abstraction provider if available.


#### Interface​

```
get accountAbstractionProvider(): AccountAbstractionProvider | null;

```


#### Usage​

```
const aaProvider = web3auth.accountAbstractionProvider

```


## getConnector​

Returns a connector instance for a given connector name and chain namespace.


#### Interface​

```
getConnector(connectorName: WALLET_CONNECTOR_TYPE, chainNamespace?: ChainNamespaceType): IConnector<unknown> | null;

export type WALLET_CONNECTOR_TYPE = (typeof WALLET_CONNECTORS)[keyof typeof WALLET_CONNECTORS];
export declare const WALLET_CONNECTORS: {
  readonly AUTH: "auth";
  readonly WALLET_CONNECT_V2: "wallet-connect-v2";
  readonly COINBASE: "coinbase";
  readonly METAMASK: "metamask";
};
export type ChainNamespaceType = (typeof CHAIN_NAMESPACES)[keyof typeof CHAIN_NAMESPACES];

```


#### Usage​

```
const connector = web3auth.getConnector('WALLET_CONNECT_V2', 'eip155')

```


## getPlugin​

Returns a plugin instance by name, or `null` if not found.


#### Interface​

```
getPlugin(name: string): IPlugin | null;

export interface IPlugin extends SafeEventEmitter {
  name: string;
  status: PLUGIN_STATUS_TYPE;
  SUPPORTED_CONNECTORS: WALLET_CONNECTOR_TYPE[];
  pluginNamespace: PluginNamespace;
  initWithWeb3Auth(web3auth: IWeb3AuthCore, whiteLabel?: WhiteLabelData): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  cleanup(): Promise<void>;
}

```


#### Usage​

```
const plugin = web3auth.getPlugin('walletServices')

```


