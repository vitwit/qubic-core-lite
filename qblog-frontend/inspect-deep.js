
const lib = require('@qubic-lib/qubic-ts-library');
console.log('Main lib exports:', Object.keys(lib));

try {
    const { QubicHelper } = require('@qubic-lib/qubic-ts-library/dist/qubicHelper');
    console.log('QubicHelper class:', QubicHelper);

    const helper = new QubicHelper();
    console.log('Helper instance:', helper);
    console.log('Helper prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(helper)));

    // Check for static methods
    console.log('Static methods:', Object.getOwnPropertyNames(QubicHelper));

} catch (e) {
    console.error('Error inspecting QubicHelper:', e);
}
