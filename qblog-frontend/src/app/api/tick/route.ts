// API Route: Get Current Tick from Qubic Node
import { NextResponse } from 'next/server';
import { serverNodeConnector } from '@/lib/server/nodeConnector';

export async function GET() {
    try {
        const { tick, epoch } = await serverNodeConnector.getCurrentTick();

        return NextResponse.json({
            success: true,
            tick,
            epoch,
            timestamp: Date.now(),
        });
    } catch (error) {
        console.error('Error in /api/tick:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
