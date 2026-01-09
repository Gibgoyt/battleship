#!/usr/bin/env node

async function getSPLTokenTransactionHistory(ataAddress, limit = 5) {
  const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';
  
  try {
    console.log(`Fetching transaction signatures for ATA: ${ataAddress}`);
    
    // Step 1: Get transaction signatures for the ATA address
    const signaturesResponse = await fetch(SOLANA_RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [
          ataAddress,
          {
            limit: limit,
            commitment: 'confirmed'
          }
        ]
      })
    });

    if (!signaturesResponse.ok) {
      throw new Error(`HTTP error! status: ${signaturesResponse.status}`);
    }

    const signaturesData = await signaturesResponse.json();
    
    if (signaturesData.error) {
      throw new Error(`RPC error: ${signaturesData.error.message}`);
    }

    const signatures = signaturesData.result;
    console.log(`Found ${signatures.length} transaction signatures`);

    if (signatures.length === 0) {
      return {
        success: true,
        transactions: [],
        message: 'No transactions found for this address'
      };
    }

    // Step 2: Get detailed transaction data for each signature
    const transactions = [];
    
    for (let i = 0; i < signatures.length; i++) {
      const signature = signatures[i].signature;
      console.log(`Fetching transaction ${i + 1}/${signatures.length}: ${signature}`);
      
      try {
        const transactionResponse = await fetch(SOLANA_RPC_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: i + 2,
            method: 'getTransaction',
            params: [
              signature,
              {
                encoding: 'jsonParsed',
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 0
              }
            ]
          })
        });

        if (!transactionResponse.ok) {
          console.warn(`Failed to fetch transaction ${signature}: HTTP ${transactionResponse.status}`);
          continue;
        }

        const transactionData = await transactionResponse.json();
        
        if (transactionData.error) {
          console.warn(`RPC error for transaction ${signature}: ${transactionData.error.message}`);
          continue;
        }

        if (transactionData.result) {
          // Extract useful information from the transaction
          const tx = transactionData.result;
          const processedTx = {
            signature: signature,
            slot: tx.slot,
            blockTime: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : null,
            fee: tx.meta?.fee || 0,
            success: tx.meta?.err === null,
            error: tx.meta?.err,
            preBalances: tx.meta?.preBalances || [],
            postBalances: tx.meta?.postBalances || [],
            preTokenBalances: tx.meta?.preTokenBalances || [],
            postTokenBalances: tx.meta?.postTokenBalances || [],
            instructions: tx.transaction?.message?.instructions || [],
            accounts: tx.transaction?.message?.accountKeys || []
          };
          
          transactions.push(processedTx);
        }
        
        // Add a small delay to avoid rate limiting
        if (i < signatures.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.warn(`Error fetching transaction ${signature}:`, error.message);
      }
    }

    return {
      success: true,
      transactions: transactions,
      totalFound: signatures.length,
      message: `Successfully retrieved ${transactions.length} out of ${signatures.length} transactions`
    };

  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return {
      success: false,
      error: error.message,
      transactions: []
    };
  }
}

// Example usage:
async function example() {
  const ataAddress = '6vdfHTgLiEXvoGVp8Ga2HaKQsPKj6DrUTee7526SCXoM';
  
  console.log('Fetching SPL token transaction history...');
  const result = await getSPLTokenTransactionHistory(ataAddress, 5);
  
  if (result.success) {
    console.log('Transaction history retrieved successfully!');
    console.log(`Message: ${result.message}`);
    console.log('Transactions:', result.transactions);
    
    // Display transaction summaries
    result.transactions.forEach((tx, index) => {
      console.log(`\nTransaction ${index + 1}:`);
      console.log(`  Signature: ${tx.signature}`);
      console.log(`  Date: ${tx.blockTime || 'Unknown'}`);
      console.log(`  Success: ${tx.success}`);
      console.log(`  Fee: ${tx.fee} lamports`);
      if (tx.error) {
        console.log(`  Error: ${JSON.stringify(tx.error)}`);
      }
    });
  } else {
    console.error('Failed to retrieve transaction history:', result.error);
  }
}

// Uncomment to run the example
example();
