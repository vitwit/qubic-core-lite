'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateKeysFromSeed, retrieveWallet, storeWallet, clearWallet, type WalletKeys } from '@/lib/qubic/wallet';

interface WalletContextType {
    wallet: WalletKeys | null;
    isConnected: boolean;
    connect: (seed: string) => Promise<boolean>;
    connectWallet: (keys: WalletKeys) => void;
    disconnect: () => void;
    isModalOpen: boolean;
    openModal: () => void;
    closeModal: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
    const [wallet, setWallet] = useState<WalletKeys | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        // Try to restore wallet from session storage
        const restoreWallet = async () => {
            const stored = await retrieveWallet();
            if (stored) {
                setWallet(stored);
            }
        };
        restoreWallet();
    }, []);

    const connect = async (seed: string): Promise<boolean> => {
        try {
            const keys = await generateKeysFromSeed(seed);
            if (!keys) {
                return false;
            }

            setWallet(keys);
            storeWallet(keys);
            return true;
        } catch (error) {
            console.error('Error connecting wallet:', error);
            return false;
        }
    };

    const connectWallet = (keys: WalletKeys) => {
        setWallet(keys);
        storeWallet(keys);
    };

    const disconnect = () => {
        setWallet(null);
        clearWallet();
    };

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    return (
        <WalletContext.Provider
            value={{
                wallet,
                isConnected: wallet !== null,
                connect,
                connectWallet,
                disconnect,
                isModalOpen,
                openModal,
                closeModal,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};
