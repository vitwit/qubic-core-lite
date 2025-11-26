
const { QubicConnector } = require('@qubic-lib/qubic-ts-library/dist/QubicConnector');

const NODE_IP = '127.0.0.1';
const NODE_PORT = '31841';

async function testConnection() {
    console.log(`Testing connection to ${NODE_IP}:${NODE_PORT}...`);

    const connector = new QubicConnector(NODE_IP);
    console.log('Connector created. Properties:', Object.keys(connector));

    // Try to attach to internal socket if it exists
    if (connector.socket) {
        console.log('Socket exists initially');
    }

    connector.onReady = () => {
        console.log('EVENT: onReady');
    };

    connector.onError = (err) => {
        console.log('EVENT: onError', err);
    };

    console.log('Calling connect()...');
    connector.connect(NODE_PORT);

    // Check socket after connect
    if (connector.socket) {
        console.log('Socket created after connect()');
        connector.socket.on('connect', () => console.log('SOCKET EVENT: connect'));
        connector.socket.on('ready', () => console.log('SOCKET EVENT: ready'));
        connector.socket.on('data', (data) => console.log('SOCKET EVENT: data', data.length));
        connector.socket.on('error', (err) => console.log('SOCKET EVENT: error', err));
    } else {
        console.log('No socket property found on connector');
        // Maybe it's private or named differently?
        console.log('Connector keys:', Object.keys(connector));
    }

    setTimeout(() => {
        console.log('Timeout reached. Connector state:', connector);
        process.exit(1);
    }, 5000);
}

testConnection();
