
const net = require('net');

const NODE_IP = '127.0.0.1';
const NODE_PORT = 31841;

console.log(`Testing raw TCP connection to ${NODE_IP}:${NODE_PORT}...`);

const socket = new net.Socket();

socket.setTimeout(5000);

socket.on('connect', () => {
    console.log('SUCCESS: Connected to node via raw TCP!');
    socket.destroy();
    process.exit(0);
});

socket.on('timeout', () => {
    console.error('TIMEOUT: Connection timed out after 5s');
    socket.destroy();
    process.exit(1);
});

socket.on('error', (err) => {
    console.error('ERROR: Connection failed:', err.message);
    process.exit(1);
});

socket.connect(NODE_PORT, NODE_IP);
