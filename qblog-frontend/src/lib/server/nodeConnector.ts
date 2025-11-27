// Server-side Qubic Node Connector (uses TCP sockets - Node.js only)
// This module runs ONLY on the server side (Next.js API routes)
// Implements custom protocol since @qubic-lib/qubic-ts-library has connection issues

import net from 'net';
import crypto from 'crypto';
import cryptoPromise from '@qubic-lib/qubic-ts-library/dist/crypto';

const NODE_IP = process.env.QUBIC_NODE_IP || '127.0.0.1';
const NODE_PORT = parseInt(process.env.QUBIC_NODE_PORT || '31841');

const REQUEST_CURRENT_TICK_INFO = 27;
const RESPOND_CURRENT_TICK_INFO = 28;
const BROADCAST_TRANSACTION = 24;
const REQUEST_CONTRACT_FUNCTION = 42;
const RESPOND_CONTRACT_FUNCTION = 43;

class ServerNodeConnector {
    async getCurrentTick(): Promise<{ tick: number; epoch: number }> {
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();
            socket.setTimeout(5000);

            let receivedResponse = false;

            socket.on('connect', () => {
                const buffer = Buffer.alloc(8);
                buffer[0] = 8; buffer[1] = 0; buffer[2] = 0;
                buffer[3] = REQUEST_CURRENT_TICK_INFO;
                const dejavu = Math.floor(Math.random() * 0xFFFFFFFF);
                buffer.writeUInt32LE(dejavu, 4);

                socket.write(buffer);
            });

            socket.on('data', (data) => {
                let offset = 0;
                while (offset < data.length) {
                    if (data.length - offset < 8) break;

                    const size = data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16);
                    const type = data[offset + 3];

                    if (size < 8) {
                        console.error(`[NodeConnector] Invalid packet size: ${size}. Minimum is 8. Disconnecting.`);
                        socket.destroy();
                        reject(new Error('Received invalid packet from node'));
                        return;
                    }

                    if (data.length - offset < size) break;

                    if (type === RESPOND_CURRENT_TICK_INFO) {
                        const body = data.slice(offset + 8, offset + size);
                        const tickDuration = body.readUInt16LE(0);
                        const epoch = body.readUInt16LE(2);
                        const tick = body.readUInt32LE(4);

                        receivedResponse = true;
                        socket.destroy();
                        resolve({ tick, epoch });
                        return;
                    } else if (type === 255) { // Error packet
                        console.error(`[NodeConnector] Received error packet from node during tick request.`);
                        receivedResponse = true;
                        socket.destroy();
                        reject(new Error('Node returned error (type 255)'));
                        return;
                    }

                    offset += size;
                }
            });

            socket.on('timeout', () => {
                socket.destroy();
                reject(new Error('Connection timeout'));
            });

            socket.on('error', (err) => {
                reject(err);
            });

            socket.connect(NODE_PORT, NODE_IP);
        });
    }

    async broadcastTransaction(txData: Uint8Array): Promise<string> {
        return new Promise(async (resolve, reject) => {
            const socket = new net.Socket();
            socket.setTimeout(5000);

            socket.on('connect', async () => {
                console.log('[NodeConnector] Connected to node at', NODE_IP + ':' + NODE_PORT);
                console.log('[NodeConnector] Broadcasting transaction...');
                console.log('[NodeConnector] Transaction data length:', txData.length);

                const packetSize = 8 + txData.length;
                const buffer = Buffer.alloc(packetSize);

                buffer[0] = packetSize & 0xFF;
                buffer[1] = (packetSize >> 8) & 0xFF;
                buffer[2] = (packetSize >> 16) & 0xFF;
                buffer[3] = BROADCAST_TRANSACTION;
                buffer.writeUInt32LE(0, 4);
                buffer.set(txData, 8);

                console.log('[NodeConnector] Packet size:', packetSize);
                console.log('[NodeConnector] Sending packet to node...');

                socket.write(buffer);

                // Compute TxID: K12 hash of first 1024 bytes of transaction
                const cryptoLib = await cryptoPromise;
                const digest = new Uint8Array(32);
                const txDataForDigest = txData.length > 1024 ? txData.slice(0, 1024) : txData;
                cryptoLib.K12(txDataForDigest, digest, 32, 0);
                const txId = Buffer.from(digest).toString('hex');

                console.log('[NodeConnector] Transaction sent, TxID:', txId);

                setTimeout(() => {
                    socket.destroy();
                    resolve(txId);
                }, 500);
            });

            socket.on('error', (err) => {
                reject(err);
            });

            socket.connect(NODE_PORT, NODE_IP);
        });
    }

    async querySmartContract(contractIndex: number, inputType: number, inputData: Uint8Array): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();
            socket.setTimeout(5000);

            let receivedResponse = false;

            socket.on('connect', () => {
                const packetSize = 8 + 4 + 2 + 2 + inputData.length;
                const buffer = Buffer.alloc(packetSize);

                buffer[0] = packetSize & 0xFF;
                buffer[1] = (packetSize >> 8) & 0xFF;
                buffer[2] = (packetSize >> 16) & 0xFF;
                buffer[3] = REQUEST_CONTRACT_FUNCTION;

                const dejavu = Math.floor(Math.random() * 0xFFFFFFFF);
                buffer.writeUInt32LE(dejavu, 4);

                buffer.writeUInt32LE(contractIndex, 8);
                buffer.writeUInt16LE(inputType, 12);
                buffer.writeUInt16LE(inputData.length, 14);
                buffer.set(inputData, 16);

                socket.write(buffer);
            });

            socket.on('data', (data) => {
                console.log(`[NodeConnector] Received data: ${data.length} bytes`);
                let offset = 0;
                while (offset < data.length) {
                    if (data.length - offset < 8) break;

                    const size = data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16);
                    const type = data[offset + 3];
                    console.log(`[NodeConnector] Packet: size=${size}, type=${type}`);

                    if (size < 8) {
                        console.error(`[NodeConnector] Invalid packet size: ${size}. Minimum is 8. Disconnecting.`);
                        socket.destroy();
                        reject(new Error('Received invalid packet from node'));
                        return;
                    }

                    if (data.length - offset < size) {
                        console.log(`[NodeConnector] Incomplete packet. Waiting for more data.`);
                        break;
                    }

                    if (type === RESPOND_CONTRACT_FUNCTION) {
                        const body = data.slice(offset + 8, offset + size);
                        receivedResponse = true;
                        socket.destroy();
                        resolve(body);
                        return;
                    } else if (type === 255) { // Error packet
                        console.error(`[NodeConnector] Received error packet from node.`);
                        receivedResponse = true;
                        socket.destroy();
                        reject(new Error('Node returned error (type 255)'));
                        return;
                    } else {
                        console.log(`[NodeConnector] Unexpected packet type: ${type}. Ignoring.`);
                    }

                    offset += size;
                }
            });

            socket.on('timeout', () => {
                socket.destroy();
                reject(new Error('Connection timeout'));
            });

            socket.on('error', (err) => {
                reject(err);
            });

            socket.connect(NODE_PORT, NODE_IP);
        });
    }
}

export const serverNodeConnector = new ServerNodeConnector();
