
const cryptoPromise = require('@qubic-lib/qubic-ts-library/dist/crypto').default;
const { KeyHelper } = require('@qubic-lib/qubic-ts-library/dist/keyHelper');

const seed = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabc'; // 55 chars
console.log('Testing seed:', seed);

async function test() {
    try {
        console.log('Waiting for crypto...');
        const crypto = await cryptoPromise;
        console.log('Crypto loaded:', Object.keys(crypto));

        const helper = new KeyHelper();
        const seedBytes = helper.seedToBytes(seed);
        console.log('Seed bytes generated');

        // helper.privateKey(seed, index, K12)
        // Note: privateKey takes (seed, index, K12) based on source reading
        // But wait, the source I read said: privateKey(seed, index, K12)
        // Let's check the arguments again.
        // The source:
        // privateKey(seed, index, K12) { ... }

        const privKey = helper.privateKey(seed, 0, crypto.K12);
        console.log('Private key generated');

        // createPublicKey(privateKey, schnorrq, K12)
        const pubKey = helper.createPublicKey(privKey, crypto.schnorrq, crypto.K12);
        console.log('Public key generated');

        // Get identity?
        // KeyHelper.getIdentityBytes(identity) exists but getIdentity(pubKey) might be in QubicHelper?
        // Or maybe I can use QubicHelper now that I know how to use it?
        // But QubicHelper didn't seem to take K12 in constructor.
        // Let's just use KeyHelper for keys.
        // I need to convert pubKey to identity string.
        // QubicHelper has getIdentity(publicKey).

        const { QubicHelper } = require('@qubic-lib/qubic-ts-library/dist/qubicHelper');
        const qHelper = new QubicHelper();
        const identity = qHelper.getIdentity(pubKey);
        console.log('Identity:', identity);

    } catch (error) {
        console.error('Error:', error);
    }
}

test();
