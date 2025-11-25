// Transaction Building and Broadcasting (direct node connection)

import { QubicTransaction } from '@qubic-lib/qubic-ts-library/dist/qubic-types/QubicTransaction';
import { QubicDefinitions } from '@qubic-lib/qubic-ts-library/dist/QubicDefinitions';
import { PublicKey } from '@qubic-lib/qubic-ts-library/dist/qubic-types/PublicKey';
import { Long } from '@qubic-lib/qubic-ts-library/dist/qubic-types/Long';
import { DynamicPayload } from '@qubic-lib/qubic-ts-library/dist/qubic-types/DynamicPayload';
import { Signature } from '@qubic-lib/qubic-ts-library/dist/qubic-types/Signature';
import { ensureConnected, broadcastTransaction } from './connector';

// ---------------------------------------------------------------------------
// Helper: get current tick (fallback to timestamp based calculation)
// ---------------------------------------------------------------------------
/**
 * Returns the current network tick. If the node does not provide a tick via an
 * event, we fall back to the timestamp‑based calculation used previously.
 */
export async function getCurrentTick(): Promise<number> {
    const QUBIC_EPOCH = new Date('2024-04-03T12:00:00Z').getTime();
    const now = Date.now();
    return Math.floor((now - QUBIC_EPOCH) / 1000);
}

// ---------------------------------------------------------------------------
// Transaction builder
// ---------------------------------------------------------------------------
export const CONTRACT_INDEX = parseInt(process.env.NEXT_PUBLIC_QBLOG_CONTRACT_INDEX || '20');

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
    tx.amount = new Long(0);
    tx.tick = currentTick + 10;
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
// Signing with MetaMask Snap (unchanged)
// ---------------------------------------------------------------------------
export const signWithSnap = async (tx: QubicTransaction): Promise<void> => {
    if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask not found');
    }

    const SNAP_ID = 'npm:@qubic-lib/qubic-mm-snap';

    const sourcePubkeyBytes = Array.from((tx.sourcePublicKey as any).getPackageData());
    const destPubkeyBytes = Array.from((tx.destinationPublicKey as any).getPackageData());

    const txData = {
        sourcePublicKey: sourcePubkeyBytes,
        destinationPublicKey: destPubkeyBytes,
        amount: tx.amount.toString(),
        tick: tx.tick,
        inputType: tx.inputType,
        inputSize: tx.inputSize,
        payload: Array.from(tx.payload.getPackageData()),
    };

    const signatureHex = await (window.ethereum as any).request({
        method: 'wallet_invokeSnap',
        params: {
            snapId: SNAP_ID,
            request: {
                method: 'signTransaction',
                params: { transaction: txData },
            },
        },
    }) as string;

    const signatureBytes = new Uint8Array(
        signatureHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );
    tx.signature = new Signature(signatureBytes);
};

// ---------------------------------------------------------------------------
// Broadcast transaction via direct connector
// ---------------------------------------------------------------------------
export const broadcastTransactionViaNode = async (tx: QubicTransaction): Promise<string> => {
    try {
        await ensureConnected();
        const txData = tx.getPackageData();
        const txId = await broadcastTransaction(txData);
        console.log('Transaction broadcast successfully');
        console.log('Target tick:', tx.tick);
        return txId;
    } catch (error) {
        console.error('Error broadcasting transaction:', error);
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
