
const { QubicHelper } = require('@qubic-lib/qubic-ts-library/dist/qubicHelper');

const seed = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabc'; // 55 chars
console.log('Testing seed:', seed);

try {
    const helper = new QubicHelper();
    const subseed = helper.createSubSeed(seed);
    console.log('Subseed generated successfully');
    const privateKey = helper.createPrivateKey(subseed);
    console.log('Private key generated successfully');
    const publicKey = helper.createPublicKey(privateKey);
    console.log('Public key generated successfully');
    const identity = helper.getIdentity(publicKey);
    console.log('Identity:', identity);
} catch (error) {
    console.error('Error:', error);
}
