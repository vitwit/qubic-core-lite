// API Route: Broadcast Transaction to Qubic Node
import { NextRequest, NextResponse } from 'next/server';
import { serverNodeConnector } from '@/lib/server/nodeConnector';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { txData } = body;

        if (!txData || !Array.isArray(txData)) {
            return NextResponse.json(
                { success: false, error: 'Invalid transaction data' },
                { status: 400 }
            );
        }

        // Convert array to Uint8Array
        const txBytes = new Uint8Array(txData);

        // Broadcast via server-side connector
        const txId = await serverNodeConnector.broadcastTransaction(txBytes);

        return NextResponse.json({
            success: true,
            txId,
            timestamp: Date.now(),
        });
    } catch (error) {
        console.error('Error in /api/broadcast:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
