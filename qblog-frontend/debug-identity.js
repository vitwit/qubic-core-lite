const { QubicHelper } = require('@qubic-lib/qubic-ts-library/dist/qubicHelper');
const { PublicKey } = require('@qubic-lib/qubic-ts-library/dist/qubic-types/PublicKey');
const { KeyHelper } = require('@qubic-lib/qubic-ts-library/dist/keyHelper');

async function testIdentity() {
    // Wait for crypto to initialize
    const cryptoPromise = require('@qubic-lib/qubic-ts-library/dist/crypto').default;
    const crypto = await cryptoPromise;
    console.log('Crypto keys:', Object.keys(crypto));
    // We don't have the user's seed, but we can test the generation logic.
    // The user reported:
    // Network: SINUBYSBZKBSVEFQDZBQWUEJWRXCXOZNKPHIXDZWRBKXDSPJEHFAMBACXHUN
    // Local:   SINUBYSBZKBSVEFQDZBQWUEJWRXCXOZNKPHIXDZWRBKXDSPJEHFAMBACSNWA

    // The difference is only in the checksum (last 4 chars).
    // This usually means the public key bytes are correct, but the checksum calculation differs.

    console.log('Testing Identity Generation...');

    // Let's try to reverse engineer the checksum difference.
    // We'll generate a random identity and see how getIdentity(false) vs getIdentity(true) vs PublicKey behaves.

    const seed = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabc'; // 55 chars
    const keyHelper = new KeyHelper();
    const privateKey = keyHelper.privateKey(seed, 0, crypto.K12);
    const publicKey = keyHelper.createPublicKey(privateKey, crypto.schnorrq, crypto.K12);

    const qubicHelper = new QubicHelper();

    console.log('\n--- Method 1: QubicHelper.getIdentity(pk) (Default) ---');
    const id1 = await qubicHelper.getIdentity(publicKey);
    console.log('ID1:', id1);

    console.log('\n--- Method 2: QubicHelper.getIdentity(pk, false) (UpperCase) ---');
    const id2 = await qubicHelper.getIdentity(publicKey, false);
    console.log('ID2:', id2);

    console.log('\n--- Method 3: QubicHelper.getIdentity(pk, true) (LowerCase) ---');
    const id3 = await qubicHelper.getIdentity(publicKey, true);
    console.log('ID3:', id3);

    console.log('\n--- Method 4: PublicKey.getIdentityAsSring() ---');
    const pkObj = new PublicKey(publicKey);
    // Note: In the library code we saw earlier, setIdentity might be needed?
    // But constructor takes identity? Let's try setting bytes.
    // The d.ts showed setIdentity(bytes).
    await pkObj.setIdentity(publicKey);
    const id4 = pkObj.getIdentityAsSring();
    console.log('ID4:', id4);

    console.log('\n--- Method 5: PublicKey constructor with bytes ---');
    // The d.ts showed constructor(identity?: string | Uint8Array)
    const pkObj2 = new PublicKey(publicKey);
    // It might need verifyIdentity or something to populate the string?
    const id5 = pkObj2.getIdentityAsSring();
    console.log('ID5:', id5);

}

testIdentity().catch(console.error);
