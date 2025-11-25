interface Window {
    ethereum?: {
        isMetaMask?: boolean;
        request: (args: { method: string; params?: any[] | object }) => Promise<any>;
    };
}
