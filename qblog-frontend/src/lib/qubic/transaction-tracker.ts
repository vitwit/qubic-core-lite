import { getCurrentTick } from './transaction';

export interface TransactionStatus {
    txId: string;
    targetTick: number;
    currentTick: number;
    status: 'pending' | 'ready' | 'expired';
    ticksRemaining: number;
}

export async function checkTransactionStatus(txId: string, targetTick: number): Promise<TransactionStatus> {
    const currentTick = await getCurrentTick();
    const ticksRemaining = targetTick - currentTick;

    let status: 'pending' | 'ready' | 'expired';
    if (ticksRemaining > 0) {
        status = 'pending';
    } else if (ticksRemaining >= -5) {
        status = 'ready';
    } else {
        status = 'expired';
    }

    return {
        txId,
        targetTick,
        currentTick,
        status,
        ticksRemaining
    };
}

export function formatTransactionStatus(status: TransactionStatus): string {
    const { txId, targetTick, currentTick, ticksRemaining } = status;

    if (status.status === 'pending') {
        return `Transaction ${txId.slice(0, 16)}... pending. Target tick: ${targetTick}, Current tick: ${currentTick}, Ticks remaining: ${ticksRemaining}`;
    } else if (status.status === 'ready') {
        return `Transaction ${txId.slice(0, 16)}... should be processed. Target tick: ${targetTick} reached.`;
    } else {
        return `Transaction ${txId.slice(0, 16)}... expired. Target tick: ${targetTick} was ${Math.abs(ticksRemaining)} ticks ago.`;
    }
}
