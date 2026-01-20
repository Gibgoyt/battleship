# Error messages and codes

When making requests to Phantom in [establishing a connection](/solana/establishing-a-connection), [sending a transaction](/solana/sending-a-transaction), or [signing a message](/solana/signing-a-message), Phantom may respond with an error. The following is a list of all possible error codes and their meanings. These error messages are inspired by Ethereum's [EIP-1474](https://eips.ethereum.org/EIPS/eip-1474#error-codes) and [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193#provider-errors).

| Code   | Title                            | Description                                                                                                                                                                                                                                                                          |
| ------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 4900   | Disconnected                     | Phantom could not connect to the network.                                                                                                                                                                                                                                            |
| 4100   | Unauthorized                     | The requested method and/or account has not been authorized by the user.                                                                                                                                                                                                             |
| 4001   | User Rejected Request            | The user rejected the request through Phantom.                                                                                                                                                                                                                                       |
| -32000 | Invalid Input                    | Missing or invalid parameters.                                                                                                                                                                                                                                                       |
| -32002 | Requested resource not available | This error occurs when a dapp attempts to submit a new transaction while Phantom's approval dialog is already open for a previous transaction. Only one approve window can be open at a time. Users should  approve or reject their transaction before initiating a new transaction. |
| -32003 | Transaction Rejected             | Phantom does not recognize a valid transaction.                                                                                                                                                                                                                                      |
| -32601 | Method Not Found                 | Phantom does not recognize the method.                                                                                                                                                                                                                                               |
| -32603 | Internal Error                   | Something went wrong within Phantom.                                                                                                                                                                                                                                                 |

Typically, these errors will be easily parseable and have both a code and an explanation. For example:

```javascript  theme={null}
try {
  await window.solana.signMessage();
} catch (err) {
  //  {code: 4100, message: 'The requested method and/or account has not been authorized by the user.'}
}
```


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.phantom.com/llms.txt
