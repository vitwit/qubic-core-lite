// Direct Qubic node connector (Node.js TCP)
// This module provides a singleton connector that talks directly to the Qubic node
// using the QubicConnector class (TCP). No custom RPC server or Next.js API routes are used.

import { QubicConnector } from '@qubic-lib/qubic-ts-library/dist/QubicConnector';

// Environment variables – should be defined in .env.local (NEXT_PUBLIC_ prefix for client side)
const NODE_IP = process.env.NEXT_PUBLIC_QUBIC_NODE_IP || '127.0.0.1';
const NODE_PORT = process.env.NEXT_PUBLIC_QUBIC_NODE_PORT || '21841';

// Initialise the connector with the node IP and then connect using the node port.
export const connector = new QubicConnector(NODE_IP);
connector.connect(NODE_PORT);

/**
 * Ensure the connector is ready before using it.
 */
export async function ensureConnected(): Promise<void> {
    return new Promise((resolve) => {
        // QubicConnector emits onReady when the socket is established.
        if ((connector as any).ready) {
            resolve();
        } else {
            (connector as any).onReady = resolve;
        }
    });
}

/**
 * Broadcast a transaction directly via the node.
 * @param txData Uint8Array containing the encoded transaction.
 * @returns Promise<string> transaction ID returned by the node.
 */
export async function broadcastTransaction(txData: Uint8Array): Promise<string> {
    await ensureConnected();
    // sendPackage returns a Uint8Array response; we assume it contains the transaction ID as UTF‑8.
    const response = await (connector as any).sendPackage(txData);
    return Buffer.from(response).toString('utf-8');
}


