import { NextRequest, NextResponse } from 'next/server';
import { serverNodeConnector } from '@/lib/server/nodeConnector';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { contractIndex, inputType, inputData } = body;

        if (contractIndex === undefined || inputType === undefined || !inputData) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        // inputData is expected to be an array of numbers (byte array)
        const inputBytes = new Uint8Array(inputData);

        const result = await serverNodeConnector.querySmartContract(contractIndex, inputType, inputBytes);

        return NextResponse.json({
            success: true,
            data: Array.from(result),
        });
    } catch (error) {
        console.error('Error in /api/query:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
