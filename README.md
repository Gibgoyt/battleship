# TODOS

## /app/ page

./src/pages/app/index.astro looks for a Firebase Auth JWT token
If the user is not logged in they are redirected to /auth/sign-in

## /auth/sign-in page

This page uses FirebaseLoginForm at ./src/components-svelte/auth/FirebaseLoginForm.svelte

It requires the following .env:

```text
PUBLIC_FIREBASE_ACCOUNT_CONFIG_API_KEY=AIzaSyBQ2AuI6sg1p1wpaOzJRV37u5Z0M1JNabs
PUBLIC_FIREBASE_ACCOUNT_CONFIG_AUTH_DOMAIN=com-splitdo-app.firebaseapp.com
PUBLIC_FIREBASE_ACCOUNT_CONFIG_PROJECT_ID=com-splitdo-app
PUBLIC_FIREBASE_ACCOUNT_CONFIG_STORAGE_BUCKET=com-splitdo-app.firebasestorage.app
PUBLIC_FIREBASE_ACCOUNT_CONFIG_MESSAGE_SENDER_ID=1042504407113
PUBLIC_FIREBASE_ACCOUNT_CONFIG_APP_ID=1:1042504407113:web:85d390f6e71c1728cbc798
``` 

## Logging In Credentials

```json
{
	"username/email": "testuser1@example.com",
	"password": "Broskikiller1!"
}
```

## /app/wallet page

This page currently has two fucked up and unnecessary buttons at the top:



## /app/wallet page

### Remove Unnecssary Fucked Buttons

This page currently has two fucked up and unnecessary buttons at the top:

1. Test Modal: State (Open/Closed) green button
2. Connect Wallet blue button

These two can be removed completely

### Fix Up Exchange

Currently Only SOLANA to SPLITDO works
For now Phantom will be just fine

POST https://devbackend.splitdo.app:8443/api/splitdo-token/exchange/solana

```json
{
	"Headers" : {
		"Authorization": "Bearer <FireabaseJWT>",
		"Content-Type": "application/json"
	},
	"Body": {
		"sol_amount": "<LAMPORTS>",
		"signed_transaction: "mock_base64_sig" 
	}
}
```

The signed tx needs the user's private key, hence Phantom, so Phantom working
Alles is gut!!

#### Exchange Works Like DooDoo

Button has Phantom and MetaMask
Add MetaMask support coming soon
Add proper Phantom logo please

#### MODAL FORM VALIDATION

Re-add minimum 0.005 (or maybe 0.01) SOLANA for the exchange please
Please properly convert in the UI how much SPLITDO the user will be getting

```text
[opc@vm-redis astro]$ curl \
-X GET \
https://devbackend.splitdo.app:8443/api/splitdo-token/program/info \
| jq
{
  "data": {
    "exchange_rate": 0.11,
    "last_updated": "1766768557",
    "program_authority": "FiFESTs6KzV8We3bMJzkFTTQJsrRQJbPNdL5tkim66DW",
    "program_vault_usdc": "EHzoCNDedTpVHywmedUwNbg5gYRrLtcahza6C9t5LeKS",
    "sol_vault_address": "6zrBrg4WK787TNDPeRhbWKu2iQYPoYR5TFW5CqMgjMgz",
    "total_collateral_usdc": 0,
    "total_supply_tokens": 100000000,
    "usdc_mint_address": "vYXmyYbwNEUm31JLASjvEpKhhZAJCpbZefbF8qreufn",
    "utility_token_mint": "6vdfHTgLiEXvoGVp8Ga2HaKQsPKj6DrUTee7526SCXoM"
  },
  "success": true
}
```

# PLEASE MAKE /app/wallet LOOK LIKE A PRESALE SITE

# /app/counter does not need to be there POES it 

# /app/profile must show user's FIREBASE information please

Currently has bullshit "Debug: Extracted email: testuser1@example.com"
Clearly Firebase JWT has useful claims to display in the UI
Please actually display it inside the UI

