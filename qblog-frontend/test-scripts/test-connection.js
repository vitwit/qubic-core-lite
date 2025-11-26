
const { QubicConnector } = require('@qubic-lib/qubic-ts-library/dist/QubicConnector');

const NODE_IP = '127.0.0.1';
const NODE_PORT = '31841';

async function testConnection() {
    console.log(`Testing connection to ${NODE_IP}:${NODE_PORT}...`);

    return new Promise((resolve, reject) => {
        try {
            const connector = new QubicConnector(NODE_IP);

            connector.onReady = () => {
                console.log('SUCCESS: Connected to node!');
                resolve();
                process.exit(0);
            };

            connector.onError = (err) => {
                console.error('ERROR: Connection failed:', err);
                reject(err);
                process.exit(1);
            };

            console.log('Calling connect()...');
            connector.connect(NODE_PORT);

            setTimeout(() => {
                console.error('TIMEOUT: Connection timed out after 5s');
                process.exit(1);
            }, 5000);

        } catch (err) {
            console.error('EXCEPTION:', err);
            process.exit(1);
        }
    });
}

testConnection();
