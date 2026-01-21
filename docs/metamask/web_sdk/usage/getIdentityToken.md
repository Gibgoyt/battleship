# getIdentityToken

Function to retrieve the identity token from Web3Auth.

This function will only return information based on the connected adapter. These details are not stored anywhere and are fetched from the adapter during the connection and remain in the session.


### Usage​

```
// Later in your code:
try {
  const idToken = await web3auth.getIdentityToken()
  console.log(idToken)
} catch (error) {
  console.error('Error authenticating user:', error)
}

```


### Return Type​

```
getIdentityToken(): Promise<UserAuthInfo>

type UserAuthInfo = { idToken: string };

```


### Response Format​

The `idToken` is a JWT that can be decoded to get user information.

| Parameter | Type | Description |
| --- | --- | --- |
| iat | number | The "iat" (issued at) claim identifies the time at which the JWT was issued. |
| aud | string | The "aud" (audience) claim identifies the recipients that the JWT is intended for. (Here, it's the dapp client_id) |
| iss | string | The "iss" (issuer) claim identifies who issued the JWT. (Here, it's Web3Auth https://api.openlogin.com/) |
| email | string | The email address of the user (optional) |
| name | string | The name of the user (optional) |
| profileImage | string | The profile image of the user (optional) |
| verifier | string | Web3Auth's verifier used while user login |
| verifierId | string | Unique user id given by OAuth login provider |
| aggregateVerifier | string | Name of the verifier if you are using a single id verifier (aggregateVerifier) (optional) |
| exp | number | The "exp" (expiration time) claim identifies the expiration time on or after which the JWT MUST NOT be accepted for processing. |
| wallets | array | list of wallets for which this token is issued: curve "secp256k1" (default) or "ed25519"  You can specify which curve you want use for the encoded public key in the login parameterstype "web3auth_key" incase of social loginspublic_key compressed public key derived based on the specified curve |

- `curve` "secp256k1" (default) or "ed25519" 
 You can specify which curve you want use for the encoded public key in the login parameters
- `type` "web3auth_key" incase of social logins
- `public_key` compressed public key derived based on the specified curve


#### Sample Response​

```
{
  "iat": 1655835494,
  "aud": "BCtbnOamqh0cJFEUYA0NB5YkvBECZ3HLZsKfvSRBvew2EiiKW3UxpyQASSR0artjQkiUOCHeZ_ZeygXpYpxZjOs",
  "iss": "https://api.openlogin.com/",
  "email": "xyz@xyz.com",
  "name": "John Doe",
  "profileImage": "https://lh3.googleusercontent.com/a/AATXAJx3lnGmHiM4K97uLo9Rb0AxOceH-dQCBSRqGbck=s96-c",
  "verifier": "torus",
  "verifierId": "xyz@xyz.com",
  "aggregateVerifier": "tkey-google-lrc",
  "exp": 1655921894,
  "wallets": [
    {
      "public_key": "035143318b83eb5d31611f8c03582ab1200494f66f5e11a67c34f5581f48c1b70b",
      "type": "web3auth_key",
      "curve": "secp256k1"
    }
  ]
}

```


### Error Handling​

```
try {
  const userInfo = await web3auth.getIdentityToken()
  // Use the token
} catch (error) {
  // Handle errors (e.g., user not connected, network issues)
  console.error('Authentication failed:', error)
}

```


