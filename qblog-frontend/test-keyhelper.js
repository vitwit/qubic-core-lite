
const { KeyHelper } = require('@qubic-lib/qubic-ts-library/dist/keyHelper');

console.log('KeyHelper prototype:', Object.getOwnPropertyNames(KeyHelper.prototype));

try {
    const helper = new KeyHelper();
    console.log('KeyHelper instance:', helper);
    // Try to find key generation methods
} catch (e) {
    console.error('Error instantiating KeyHelper:', e);
}
