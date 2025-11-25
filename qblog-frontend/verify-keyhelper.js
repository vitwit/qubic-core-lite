
const { KeyHelper } = require('@qubic-lib/qubic-ts-library/dist/keyHelper');

const seed = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabc'; // 55 chars
console.log('Testing seed:', seed);

try {
    const helper = new KeyHelper();

    const seedBytes = helper.seedToBytes(seed);
    console.log('Seed bytes generated');

    const privKey = helper.privateKey(seedBytes);
    console.log('Private key generated');

    const pubKey = helper.createPublicKey(privKey);
    console.log('Public key generated');

    // KeyHelper doesn't have getIdentity?
    // Let's check QubicHelper for getIdentity
    const { QubicHelper } = require('@qubic-lib/qubic-ts-library/dist/qubicHelper');
    const qHelper = new QubicHelper();
    const identity = qHelper.getIdentity(pubKey);
    console.log('Identity:', identity);

} catch (error) {
    console.error('Error:', error);
}
