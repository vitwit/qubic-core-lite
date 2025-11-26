
const net = require('net');

const NODE_IP = '127.0.0.1';
const NODE_PORT = 31841;
const REQUEST_CURRENT_TICK_INFO = 27;

console.log(`Testing protocol to ${NODE_IP}:${NODE_PORT}...`);

const socket = new net.Socket();
socket.setTimeout(5000);

socket.on('connect', () => {
    console.log('Connected!');

    // Build packet
    // Header: size (3 bytes), type (1 byte), dejavu (4 bytes)
    const buffer = Buffer.alloc(8);

    // Size: 8 bytes (header only)
    buffer[0] = 8;
    buffer[1] = 0;
    buffer[2] = 0;

    // Type: 27
    buffer[3] = REQUEST_CURRENT_TICK_INFO;

    // Dejavu: random
    const dejavu = Math.floor(Math.random() * 0xFFFFFFFF);
    buffer.writeUInt32LE(dejavu, 4);

    console.log('Sending packet:', buffer.toString('hex'));
    socket.write(buffer);
});

socket.on('data', (data) => {
    console.log('Received data:', data.length, 'bytes');
    console.log('Hex:', data.toString('hex'));

    // Parse header
    const size = data[0] | (data[1] << 8) | (data[2] << 16);
    const type = data[3];
    const dejavu = data.readUInt32LE(4);

    console.log(`Header: size=${size}, type=${type}, dejavu=${dejavu}`);

    if (type === 28) { // RESPOND_CURRENT_TICK_INFO
        // Parse body
        // struct CurrentTickInfo {
        //     unsigned short tickDuration;
        //     unsigned short epoch;
        //     unsigned int tick;
        //     unsigned short numberOfAlignedVotes;
        //     unsigned short numberOfMisalignedVotes;
        //     unsigned int initialTick;
        // }

        const body = data.slice(8);
        const tickDuration = body.readUInt16LE(0);
        const epoch = body.readUInt16LE(2);
        const tick = body.readUInt32LE(4);

        console.log(`Tick Info: tick=${tick}, epoch=${epoch}, duration=${tickDuration}`);
        socket.destroy();
        process.exit(0);
    }
});

socket.on('timeout', () => {
    console.error('TIMEOUT');
    socket.destroy();
    process.exit(1);
});

socket.on('error', (err) => {
    console.error('ERROR:', err.message);
    process.exit(1);
});

socket.connect(NODE_PORT, NODE_IP);
