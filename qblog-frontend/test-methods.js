
const { QubicHelper } = require('@qubic-lib/qubic-ts-library/dist/qubicHelper');

const seed = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabc'; // 55 chars
console.log('Testing seed:', seed);

try {
    const helper = new QubicHelper();

    // Try seedToBytes
    const seedBytes = helper.seedToBytes(seed);
    console.log('Seed bytes:', seedBytes);

    // Try privateKey
    // It might take the seed bytes or the seed string?
    // Let's try passing the seed string first, or the bytes.
    // Based on the name 'privateKey', it might be a getter or a method.
    // The inspection showed it as a method name.

    let privKey;
    try {
        privKey = helper.privateKey(seed);
        console.log('privateKey(seed) result:', privKey);
    } catch (e) {
        console.log('privateKey(seed) failed:', e.message);
        try {
            privKey = helper.privateKey(seedBytes);
            console.log('privateKey(seedBytes) result:', privKey);
        } catch (e2) {
            console.log('privateKey(seedBytes) failed:', e2.message);
        }
    }

    if (privKey) {
        const pubKey = helper.createPublicKey(privKey);
        console.log('Public key created successfully');
        const identity = helper.getIdentity(pubKey);
        console.log('Identity:', identity);
    }

} catch (error) {
    console.error('Error:', error);
}
