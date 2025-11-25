// Qubic Connector Setup
import { QubicConnector } from '@qubic-lib/qubic-ts-library/dist/QubicConnector';

const RPC_URL = process.env.NEXT_PUBLIC_QUBIC_RPC_URL || 'http://127.0.0.1:21841';

let connector: QubicConnector | null = null;

export const getQubicConnector = (): QubicConnector => {
    if (!connector) {
        connector = new QubicConnector(RPC_URL);
    }
    return connector;
};

