import { QubicHelper } from '@qubic-lib/qubic-ts-library/dist/qubicHelper';
import { KeyHelper } from '@qubic-lib/qubic-ts-library/dist/keyHelper';
import { PublicKey } from '@qubic-lib/qubic-ts-library/dist/qubic-types/PublicKey';
import cryptoPromise from '@qubic-lib/qubic-ts-library/dist/crypto';

export interface WalletKeys {
    publicKey: Uint8Array;
    identity: string;
    seed: string;
    privateKey: Uint8Array;
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
/**
 * Truncate identity for display
 */
export const truncateIdentity = (identity: string, chars: number = 8): string => {
    if (identity.length <= chars * 2) return identity;
    return `${identity.slice(0, chars)}...${identity.slice(-chars)}`;
};

/**
 * Convert identity to public key bytes
*/
export const identityToPublicKey = (identity: string): Uint8Array => {
    if (!isValidIdentity(identity)) {
        throw new Error('Invalid identity format');
    }

    const qubicHelper = new QubicHelper();
    const bytes = qubicHelper.getIdentityBytes(identity)

    // Return first 32 bytes (public key)
    return bytes.slice(0, 32);
};

/**
 * Store wallet in session storage (not recommended for production)
 * Just for testing purpose
 */
export const storeWallet = (keys: WalletKeys): void => {
    if (typeof window !== 'undefined') {
        const storageData = {
            identity: keys.identity,
            publicKey: Array.from(keys.publicKey),
            seed: keys.seed,
        };

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
                if (data.seed) {
                    return await generateKeysFromSeed(data.seed);
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

