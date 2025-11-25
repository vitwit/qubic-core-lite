// Transaction Building and Broadcasting
import { QubicTransaction } from '@qubic-lib/qubic-ts-library/dist/qubic-types/QubicTransaction';
import { QubicDefinitions } from '@qubic-lib/qubic-ts-library/dist/QubicDefinitions';
import { PublicKey } from '@qubic-lib/qubic-ts-library/dist/qubic-types/PublicKey';
import { Long } from '@qubic-lib/qubic-ts-library/dist/qubic-types/Long';
import { DynamicPayload } from '@qubic-lib/qubic-ts-library/dist/qubic-types/DynamicPayload';
import { getCurrentTick, API_URL } from './node-service';

const CONTRACT_INDEX = parseInt(process.env.NEXT_PUBLIC_QBLOG_CONTRACT_INDEX || '20');

export interface TransactionParams {
    sourcePublicKey: Uint8Array;
    destPublicKey: Uint8Array;
    amount: bigint;
    tick: number;
    inputType: number;
    inputSize: number;
}

/**
 * Build a transaction for QBlog contract
 */
/**
 * Build a transaction for QBlog contract
 */
export const buildTransaction = async (
    sourcePublicKey: Uint8Array,
    contractIndex: number,
    procedureIndex: number,
    inputData: Uint8Array,
    privateKey?: Uint8Array
): Promise<QubicTransaction> => {
    // Get current tick from RPC
    const currentTick = await getCurrentTick();

    // Contract public key (derived from contract index)
    const contractPublicKeyBytes = new Uint8Array(32);
    contractPublicKeyBytes[0] = contractIndex;

    const sourcePk = new PublicKey(sourcePublicKey);
    const destPk = new PublicKey(contractPublicKeyBytes);

    // Create payload using DynamicPayload
    const payload = new DynamicPayload(inputData.length);
    payload.setPayload(inputData);

    const tx = new QubicTransaction();
    tx.sourcePublicKey = sourcePk;
    tx.destinationPublicKey = destPk;
    tx.amount = new Long(0); // No QU transfer, just contract call
    tx.tick = currentTick + 10; // Target tick slightly in future (as per official docs)
    tx.inputType = procedureIndex; // Procedure index
    tx.inputSize = inputData.length;
    tx.payload = payload;

    if (privateKey) {
        // converting Uint8Array to string (assuming it might be a seed)
        const seedString = new TextDecoder().decode(privateKey);
        await tx.build(seedString);
    }

    return tx;
};

import { Signature } from '@qubic-lib/qubic-ts-library/dist/qubic-types/Signature';

export const signWithSnap = async (tx: QubicTransaction): Promise<void> => {
    if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask not found');
    }

    const SNAP_ID = 'npm:@qubic-lib/qubic-mm-snap';

    // Get raw bytes from the transaction object or reconstruct them
    // We can't access private 'identity' of PublicKey.
    // However, we can get the package data of the public key if it implements IQubicBuildPackage
    // Or we can rely on the fact that we passed these values in buildTransaction.
    // But here we only have 'tx'.

    // Workaround: Accessing private fields via casting to any if necessary, 
    // OR better: use getPackageData() if available on PublicKey.
    // Assuming PublicKey has getPackageData().
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

    const signatureHex = await window.ethereum.request({
        method: 'wallet_invokeSnap',
        params: {
            snapId: SNAP_ID,
            request: {
                method: 'signTransaction',
                params: {
                    transaction: txData
                }
            },
        },
    }) as string;

    // Apply signature to tx
    const signatureBytes = new Uint8Array(signatureHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
    tx.signature = new Signature(signatureBytes);
};

/**
 * Broadcast a signed transaction using RPC server
 * Note: Browser can't use QubicConnectorNode (requires Node.js net module)
 */
export const broadcastTransaction = async (
    tx: QubicTransaction
): Promise<string> => {
    try {
        // Get transaction package data
        const txData = tx.getPackageData();

        // Broadcast via Next.js API route (which connects directly to node)
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
        console.log('Transaction broadcast successfully');
        console.log('Target tick:', tx.tick);

        return json.transactionId || tx.id || '';
    } catch (error) {
        console.error('Error broadcasting transaction:', error);
        throw error;
    }
};

/**
 * Encode string to fixed-size byte array
 */
export const encodeString = (str: string, maxLength: number): Uint8Array => {
    const bytes = new Uint8Array(maxLength);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str.slice(0, maxLength));
    bytes.set(encoded);
    return bytes;
};

/**
 * Encode uint32 to bytes (little-endian)
 */
export const encodeUint32 = (value: number): Uint8Array => {
    const bytes = new Uint8Array(4);
    bytes[0] = value & 0xff;
    bytes[1] = (value >> 8) & 0xff;
    bytes[2] = (value >> 16) & 0xff;
    bytes[3] = (value >> 24) & 0xff;
    return bytes;
};

/**
 * Concatenate byte arrays
 */
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
