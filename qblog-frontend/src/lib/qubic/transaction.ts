// Transaction Building and Broadcasting (via API routes)

import { QubicTransaction } from '@qubic-lib/qubic-ts-library/dist/qubic-types/QubicTransaction';
import { QubicDefinitions } from '@qubic-lib/qubic-ts-library/dist/QubicDefinitions';
import { PublicKey } from '@qubic-lib/qubic-ts-library/dist/qubic-types/PublicKey';
import { Long } from '@qubic-lib/qubic-ts-library/dist/qubic-types/Long';
import { DynamicPayload } from '@qubic-lib/qubic-ts-library/dist/qubic-types/DynamicPayload';
import { Signature } from '@qubic-lib/qubic-ts-library/dist/qubic-types/Signature';

// ---------------------------------------------------------------------------
// Helper: get current tick from node via API route
// ---------------------------------------------------------------------------
/**
 * Returns the current network tick by querying the Qubic node via our API route.
 */
export async function getCurrentTick(): Promise<number> {
    try {
        const response = await fetch('/api/tick');
        const data = await response.json();

        if (data.success && data.tick) {
            return data.tick;
        }

        // Fallback to timestamp-based calculation if API fails
        console.warn('Failed to get tick from API, using fallback');
        const QUBIC_EPOCH = new Date('2024-04-03T12:00:00Z').getTime();
        const now = Date.now();
        return Math.floor((now - QUBIC_EPOCH) / 1000);
    } catch (error) {
        console.error('Error getting current tick:', error);
        // Fallback to timestamp-based calculation
        const QUBIC_EPOCH = new Date('2024-04-03T12:00:00Z').getTime();
        const now = Date.now();
        return Math.floor((now - QUBIC_EPOCH) / 1000);
    }
}

// ---------------------------------------------------------------------------
// Transaction builder
// ---------------------------------------------------------------------------
export const CONTRACT_INDEX = parseInt(process.env.NEXT_PUBLIC_QBLOG_CONTRACT_INDEX || '19');

export interface TransactionParams {
    sourcePublicKey: Uint8Array;
    destPublicKey: Uint8Array;
    amount: bigint;
    tick: number;
    inputType: number;
    inputSize: number;
}

/** Build a transaction for the QBlog contract */
export const buildTransaction = async (
    sourcePublicKey: Uint8Array,
    contractIndex: number,
    procedureIndex: number,
    inputData: Uint8Array,
    privateKey?: Uint8Array
): Promise<QubicTransaction> => {
    const currentTick = await getCurrentTick();

    const contractPublicKeyBytes = new Uint8Array(32);
    contractPublicKeyBytes[0] = contractIndex;

    const sourcePk = new PublicKey(sourcePublicKey);
    const destPk = new PublicKey(contractPublicKeyBytes);

    const payload = new DynamicPayload(inputData.length);
    payload.setPayload(inputData);

    const tx = new QubicTransaction();
    tx.sourcePublicKey = sourcePk;
    tx.destinationPublicKey = destPk;
    tx.amount = new Long(1000000);
    tx.tick = currentTick + 20;
    tx.inputType = procedureIndex;
    tx.inputSize = inputData.length;
    tx.payload = payload;

    if (privateKey) {
        const seedString = new TextDecoder().decode(privateKey);
        await tx.build(seedString);
    }

    return tx;
};


// ---------------------------------------------------------------------------
// Broadcast transaction via API route (which uses server-side connector)
// ---------------------------------------------------------------------------
export const broadcastTransactionViaNode = async (tx: QubicTransaction): Promise<string> => {
    try {
        const txData = Array.from(tx.getPackageData());

        console.log('[Transaction] Broadcasting transaction...');
        console.log('[Transaction] Source:', tx.sourcePublicKey);
        console.log('[Transaction] Destination:', tx.destinationPublicKey);
        console.log('[Transaction] Tick:', tx.tick);
        console.log('[Transaction] Input Type:', tx.inputType);
        console.log('[Transaction] Input Size:', tx.inputSize);
        console.log('[Transaction] Package data length:', txData.length);
        console.log('[Transaction] Signature present:', tx.signature ? 'Yes' : 'No');
        if (tx.signature) {
            const sigBytes = (tx.signature as any).bytes;
            console.log('[Transaction] Signature length:', sigBytes?.length || 'unknown');
            if (sigBytes) {
                console.log('[Transaction] Signature (first 32 bytes):', Array.from(sigBytes.slice(0, 32)));
            }
        }
        console.log('[Transaction] First 100 bytes of package:', Array.from(txData.slice(0, 100)));

        const response = await fetch('/api/broadcast', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ txData }),
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to broadcast transaction');
        }

        console.log('[Transaction] Broadcast successful');
        console.log('[Transaction] Target tick:', tx.tick);
        console.log('[Transaction] Transaction ID:', data.txId);

        return data.txId;
    } catch (error) {
        console.error('[Transaction] Error broadcasting:', error);
        throw error;
    }
};

// ---------------------------------------------------------------------------
// Utility helpers (unchanged)
// ---------------------------------------------------------------------------
export const encodeString = (str: string, maxLength: number): Uint8Array => {
    const bytes = new Uint8Array(maxLength);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str.slice(0, maxLength));
    bytes.set(encoded);
    return bytes;
};

export const encodeUint32 = (value: number): Uint8Array => {
    const bytes = new Uint8Array(4);
    bytes[0] = value & 0xff;
    bytes[1] = (value >> 8) & 0xff;
    bytes[2] = (value >> 16) & 0xff;
    bytes[3] = (value >> 24) & 0xff;
    return bytes;
};

export const concatBytes = (...arrays: Uint8Array[]): Uint8Array => {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
};
