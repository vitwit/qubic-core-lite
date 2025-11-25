// Node Service Functions
// These functions communicate with the Next.js API routes which maintain a direct connection to the Qubic node

const API_URL = '/api/qubic';

/**
 * Get current tick from internal API
 */
export async function getCurrentTick(): Promise<number> {
    try {
        const response = await fetch(`${API_URL}/tick-info`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        return json.tickInfo.tick;
    } catch (error) {
        console.error('Error fetching current tick:', error);

        // Fallback to timestamp-based calculation
        const QUBIC_EPOCH = new Date('2024-04-03T12:00:00Z').getTime();
        const now = Date.now();
        return Math.floor((now - QUBIC_EPOCH) / 1000);
    }
}

/**
 * Query smart contract via internal API
 */
export async function querySmartContract(
    contractIndex: number,
    inputType: number,
    inputData: string
): Promise<string> {
    try {
        const response = await fetch(`${API_URL}/query-contract`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contractIndex,
                inputType,
                inputData,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        return json.responseData || '';
    } catch (error) {
        console.error('Error querying smart contract:', error);
        throw error;
    }
}

export { API_URL };
