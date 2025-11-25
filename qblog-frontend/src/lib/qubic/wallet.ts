import { QubicHelper } from '@qubic-lib/qubic-ts-library/dist/qubicHelper';
import { KeyHelper } from '@qubic-lib/qubic-ts-library/dist/keyHelper';
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
        const publicKey = keyHelper.createPublicKey(privateKey, crypto.schnorrq, crypto.K12);

        // Get identity
        // getIdentity might be async or sync depending on implementation, awaiting just in case
        const identity = await qubicHelper.getIdentity(publicKey);

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
