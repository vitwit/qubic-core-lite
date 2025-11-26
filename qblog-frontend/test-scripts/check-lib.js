try {
    const k12Lib = require('@qubic-lib/qubic-ts-library/dist/crypto/libFourQ_K12');
    console.log('K12 Lib default keys:', Object.keys(k12Lib.default || {}));
} catch (e) {
    console.log('Error loading K12 lib:', e.message);
}
