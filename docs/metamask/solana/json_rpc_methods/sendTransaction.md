# sendTransaction

Submits a pre-signed transaction to the cluster for processing. This method uses [160 credits](https://docs.metamask.io/services/get-started/pricing/) from your daily balance.


## Parameters​

- `transaction`: (string) *[required]* - The transaction as an encoded string.
- `config`: (object) *[optional]*  - Configuration object with the following options:

`encoding`: (string) *[optional]* - The encoding format to use. Can be one of `base58` (deprecated) or `base64`.
`minContextSlot`: *[optional]* - The minimum slot to use for the query.
`skipPreflight`: (boolean) *[optional]* - If `true`, skips the preflight check. The default is `false`.
`preflightCommitment`: (string) *[optional]*  - The commitment level to use for the preflight check. The default is `finalized`. Possible values are:

`finalized` - Queries the most recent block confirmed by a super majority of the cluster as having
reached maximum lockout, meaning the cluster has recognized this block as finalized.
`confirmed` - Queries the most recent block that has been voted on by a super majority of the cluster.
`processed` - Queries its most recent block. The block may still be skipped by the cluster.


`maxRetries`: (integer) *[optional]* - The maximum number of retries for the transaction. If this parameter
is not provided, the RPC node will retry the transaction until it is finalized or until the block hash expires.

- `encoding`: (string) *[optional]* - The encoding format to use. Can be one of `base58` (deprecated) or `base64`.
- `minContextSlot`: *[optional]* - The minimum slot to use for the query.
- `skipPreflight`: (boolean) *[optional]* - If `true`, skips the preflight check. The default is `false`.
- `preflightCommitment`: (string) *[optional]*  - The commitment level to use for the preflight check. The default is `finalized`. Possible values are:

`finalized` - Queries the most recent block confirmed by a super majority of the cluster as having
reached maximum lockout, meaning the cluster has recognized this block as finalized.
`confirmed` - Queries the most recent block that has been voted on by a super majority of the cluster.
`processed` - Queries its most recent block. The block may still be skipped by the cluster.
- `maxRetries`: (integer) *[optional]* - The maximum number of retries for the transaction. If this parameter
is not provided, the RPC node will retry the transaction until it is finalized or until the block hash expires.

- `finalized` - Queries the most recent block confirmed by a super majority of the cluster as having
reached maximum lockout, meaning the cluster has recognized this block as finalized.
- `confirmed` - Queries the most recent block that has been voted on by a super majority of the cluster.
- `processed` - Queries its most recent block. The block may still be skipped by the cluster.


## Returns​

`result` (string) - The first transaction signature embedded in the transaction, as a `base58` encoded string (transaction ID).


### Request​

```
curl https://solana-testnet.infura.io/v3/<YOUR-API-KEY> \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "sendTransaction", "params": ["4hXTCkRzt9WyecNzV1XPgCDfGAZzQKNxLXgynz5QDuWWPSAZBZSHptvWRL3BjCvzUXRdKvHL2b7yGrRQcWyaqsaBCncVG7BFggS8w9snUts67BSh3EqKpXLUm5UMHfD7ZBe9GhARjbNQMLJ1QD3Spr6oMTBU6EhdB4RD8CP2xUxr2u3d6fos36PD98XS6oX8TQjLpsMwncs5DAMiD4nNnR8NBfyghGCWvCVifVwvA8B8TJxE1aiyiv2L429BCWfyzAme5sZW8rDb14NeCQHhZbtNqfXhcp2tAnaAT"]}'

```


### Response​

```
{
  "jsonrpc":"2.0",
  "result": "2id3YC2jK9G5Wo2phDx4gJVAew8DcY5NAojnVuao8rkxwPYPe8cSwE5GzhEgJA2y8fVjDEo6iR6ykBvDxrTQrtpb",
  "id": 1
}

```


