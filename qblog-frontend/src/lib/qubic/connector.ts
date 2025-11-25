// RPC Helper for transaction broadcasting
// Note: QubicConnectorNode uses Node.js 'net' module which doesn't work in browser
// We use RPC server for broadcasting transactions instead

import { API_URL } from './node-service';

/**
 * Broadcast transaction via internal API
 */
async function broadcastTransactionViaRPC(txData: Uint8Array): Promise<string> {
    try {
        const response = await fetch(`${API_URL}/broadcast-transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                encodedTransaction: Buffer.from(txData).toString('base64'),
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        return json.transactionId || '';
    } catch (error) {
        console.error('Error broadcasting transaction via RPC:', error);
        throw error;
    }
}

export { broadcastTransactionViaRPC };
