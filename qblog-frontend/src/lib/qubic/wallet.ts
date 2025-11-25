import { QubicHelper } from '@qubic-lib/qubic-ts-library/dist/qubicHelper';
import { KeyHelper } from '@qubic-lib/qubic-ts-library/dist/keyHelper';
import { PublicKey } from '@qubic-lib/qubic-ts-library/dist/qubic-types/PublicKey';
import cryptoPromise from '@qubic-lib/qubic-ts-library/dist/crypto';

export interface WalletKeys {
    publicKey: Uint8Array;
    identity: string;
    seed?: string;
    privateKey?: Uint8Array;
    type: 'seed' | 'snap';
}

/**
 * Generate wallet keys from a 55-character seed phrase
 */
export const generateKeysFromSeed = async (seed: string): Promise<WalletKeys | null> => {
    try {
        if (seed.length !== 55) {
            throw new Error('Seed must be exactly 55 characters');
        }

        // Validate seed contains only lowercase letters
        if (!/^[a-z]{55}$/.test(seed)) {
            throw new Error('Seed must contain only lowercase letters (a-z)');
        }

        // Wait for crypto library to initialize
        const crypto = await cryptoPromise;

        const keyHelper = new KeyHelper();
        const qubicHelper = new QubicHelper();

        // Generate private key
        // privateKey(seed, index, K12)
        const privateKey = keyHelper.privateKey(seed, 0, crypto.K12);

        // Generate public key
        // createPublicKey(privateKey, schnorrq, K12)
        const publicKey = (await qubicHelper.createIdPackage(seed)).publicKey

        // Get identity using QubicHelper with uppercase (lowerCase=false)
        // This matches the network's checksum calculation
        console.log('Generating identity with lowerCase=false parameter');
        const identity = await qubicHelper.getIdentity(publicKey, false);
        console.log('Generated identity:', identity);

        if (!identity) {
            throw new Error('Failed to generate identity from public key');
        }

        return {
            publicKey,
            privateKey,
            identity,
            seed,
            type: 'seed'
        };
    } catch (error) {
        console.error('Error generating keys from seed:', error);
        throw error;
    }
};

/**
 * Validate a Qubic identity (60 uppercase letters)
 */
export const isValidIdentity = (identity: string): boolean => {
    return /^[A-Z]{60}$/.test(identity);
};

/**
 * Truncate identity for display
 */
export const truncateIdentity = (identity: string, chars: number = 8): string => {
    if (identity.length <= chars * 2) return identity;
    return `${identity.slice(0, chars)}...${identity.slice(-chars)}`;
};

/**
 * Store wallet in session storage (not recommended for production)
 */
export const storeWallet = (keys: WalletKeys): void => {
    if (typeof window !== 'undefined') {
        const storageData: any = {
            identity: keys.identity,
            type: keys.type,
            publicKey: Array.from(keys.publicKey), // Store public key as array
        };

        if (keys.type === 'seed' && keys.seed) {
            storageData.seed = keys.seed;
        }

        sessionStorage.setItem('qubic_wallet', JSON.stringify(storageData));
    }
};

/**
 * Retrieve wallet from session storage
 */
/**
 * Retrieve wallet from session storage
 */
export const retrieveWallet = async (): Promise<WalletKeys | null> => {
    if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('qubic_wallet');
        if (stored) {
            try {
                const data = JSON.parse(stored);

                if (data.type === 'seed' && data.seed) {
                    return await generateKeysFromSeed(data.seed);
                } else if (data.type === 'snap') {
                    return {
                        identity: data.identity,
                        publicKey: new Uint8Array(data.publicKey),
                        type: 'snap',
                    };
                }
            } catch (e) {
                console.error('Error retrieving wallet:', e);
                return null;
            }
        }
    }
    return null;
};

/**
 * Clear wallet from session storage
 */
export const clearWallet = (): void => {
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem('qubic_wallet');
    }
};

/**
 * Connect to MetaMask Snap and get public key
 */
export const connectMetaMaskSnap = async (): Promise<WalletKeys | null> => {
    try {
        if (typeof window === 'undefined' || !window.ethereum) {
            throw new Error('MetaMask not installed');
        }

        const SNAP_ID = 'npm:@qubic-lib/qubic-mm-snap';

        // First check if Snaps are supported at all
        let snaps: any;
        try {
            snaps = await window.ethereum.request({
                method: 'wallet_getSnaps',
            });
        } catch (snapCheckError: any) {
            if (snapCheckError.code === -32601 || snapCheckError.code === 4200) {
                throw new Error('MetaMask Snaps not supported. Please install MetaMask Flask from https://metamask.io/flask/');
            }
            throw snapCheckError;
        }

        // Check if our Snap is already installed
        const isInstalled = snaps && Object.keys(snaps).includes(SNAP_ID);

        // Request Snap connection/installation if not installed
        if (!isInstalled) {
            try {
                await window.ethereum.request({
                    method: 'wallet_requestSnaps',
                    params: {
                        [SNAP_ID]: {},
                    },
                });
            } catch (snapError: any) {
                if (snapError.code === -32601 || snapError.code === 4200) {
                    throw new Error('MetaMask Snaps not supported. Please install MetaMask Flask.');
                }
                if (snapError.code === 4001) {
                    throw new Error('User rejected Snap installation');
                }
                throw snapError;
            }
        }

        // Get public key from Snap
        const response: any = await window.ethereum.request({
            method: 'wallet_invokeSnap',
            params: {
                snapId: SNAP_ID,
                request: {
                    method: 'getPublicKey',
                },
            },
        });

        if (!response || !response.publicKey) {
            throw new Error('Failed to get public key from Snap');
        }

        // Convert public key to Uint8Array
        let publicKeyBytes: Uint8Array;
        if (typeof response.publicKey === 'string') {
            const pkHex = response.publicKey.startsWith('0x')
                ? response.publicKey.slice(2)
                : response.publicKey;
            publicKeyBytes = new Uint8Array(
                pkHex.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16))
            );
        } else if (Array.isArray(response.publicKey)) {
            publicKeyBytes = new Uint8Array(response.publicKey);
        } else {
            publicKeyBytes = new Uint8Array(response.publicKey);
        }

        // Get identity from public key
        const qubicHelper = new QubicHelper();
        const identity = await qubicHelper.getIdentity(publicKeyBytes);

        return {
            publicKey: publicKeyBytes,
            identity,
            type: 'snap',
        };
    } catch (error: any) {
        console.error('Error connecting to MetaMask Snap:', error);
        // Provide more helpful error messages
        if (error.code === -32601 || error.code === 4200) {
            throw new Error('MetaMask Snaps not supported. Please use MetaMask Flask or connect with Seed Phrase instead.');
        }
        if (error.code === 4001) {
            throw new Error('User rejected the connection request');
        }
        throw error;
    }
};

/**
 * Check if MetaMask Snap is installed
 */
export const isSnapInstalled = async (): Promise<boolean> => {
    try {
        if (typeof window === 'undefined' || !window.ethereum) {
            return false;
        }

        const SNAP_ID = 'npm:@qubic-lib/qubic-mm-snap';
        const snaps = await window.ethereum.request({
            method: 'wallet_getSnaps',
        });

        return Object.keys(snaps).includes(SNAP_ID);
    } catch {
        return false;
    }
};
