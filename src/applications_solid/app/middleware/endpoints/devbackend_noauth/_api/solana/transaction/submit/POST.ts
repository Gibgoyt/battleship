/**
 * Transaction submission endpoint for mobile Solana transaction handling
 * Routes raw transactions through backend to avoid 403 errors from public RPC
 *
 * Mobile Flow Fix:
 * Mobile -> signTransaction() -> sendRawTransaction() via backend -> Solana network
 * This avoids the 403 Forbidden errors from api.mainnet-beta.solana.com
 */

export interface TransactionSubmitParams {
    serializedTransaction: string; // Base64 encoded serialized transaction bytes
}

interface Response200 {
    status: 200;
    data: {
        signature: string;
        success: true;
    };
}

interface Response400 {
    status: 400;
    data: {
        error: string;
        message: string;
        success: false;
    };
}

interface Response500 {
    status: 500;
    data: {
        error: string;
        message: string;
        success: false;
    };
}

export type PostResponse = Response200 | Response400 | Response500;

export async function POST(params: TransactionSubmitParams): Promise<PostResponse> {
    try {
        console.log('[TransactionSubmit] Mobile transaction submission request received');

        // Validate parameters
        if (!params.serializedTransaction || typeof params.serializedTransaction !== 'string') {
            return {
                status: 400,
                data: {
                    error: 'invalid_transaction',
                    message: 'serializedTransaction is required and must be a base64 string',
                    success: false
                }
            };
        }

        // Submit transaction to backend API
        const url = 'https://devbackend.splitdo.app:8443/api/solana/transaction/submit';

        const fetchConfig: RequestInit = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
                // No User-Agent header to avoid CORS issues on mobile browsers
            },
            body: JSON.stringify({
                serialized_transaction: params.serializedTransaction
            })
        };

        console.log('[TransactionSubmit] Sending transaction to backend...');

        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
            throw new Error('Transaction submission not available in server-side environment');
        }

        const response = await fetch(url, fetchConfig);

        switch (response.status) {
            case 200: {
                const data = await response.json();
                console.log('[TransactionSubmit] ✅ Transaction submitted successfully:', data.signature);
                return {
                    status: 200,
                    data: {
                        signature: data.signature,
                        success: true
                    }
                };
            }

            case 400: {
                const errorData = await response.json();
                console.error('[TransactionSubmit] ❌ Bad request:', errorData);
                return {
                    status: 400,
                    data: {
                        error: 'bad_request',
                        message: errorData.message || 'Invalid transaction data',
                        success: false
                    }
                };
            }

            case 500: {
                const errorData = await response.json();
                console.error('[TransactionSubmit] ❌ Server error:', errorData);
                return {
                    status: 500,
                    data: {
                        error: 'server_error',
                        message: errorData.message || 'Internal server error',
                        success: false
                    }
                };
            }

            default: {
                console.error('[TransactionSubmit] ❌ Unexpected response status:', response.status);
                return {
                    status: 500,
                    data: {
                        error: 'unexpected_error',
                        message: `Unexpected response status: ${response.status}`,
                        success: false
                    }
                };
            }
        }
    } catch (error) {
        console.error('[TransactionSubmit] ❌ Network error:', error);
        return {
            status: 500,
            data: {
                error: 'network_error',
                message: error instanceof Error ? error.message : 'Unknown network error',
                success: false
            }
        };
    }
}