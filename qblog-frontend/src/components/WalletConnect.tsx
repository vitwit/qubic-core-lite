'use client';

import React, { useState } from 'react';
import { X, Wallet, Key, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { LoadingSpinner } from './LoadingSpinner';

interface WalletConnectProps {
    isOpen: boolean;
    onClose: () => void;
}

type Tab = 'snap' | 'seed';

const SNAP_ID = 'npm:@qubic-lib/qubic-mm-snap';

export const WalletConnect = ({ isOpen, onClose }: WalletConnectProps) => {
    const [activeTab, setActiveTab] = useState<Tab>('snap');
    const [seed, setSeed] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { connect, connectWallet } = useWallet();

    const handleConnectSeed = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const success = await connect(seed);
            if (success) {
                setSeed('');
                onClose();
            } else {
                setError('Invalid seed phrase. Must be 55 lowercase letters (a-z).');
            }
        } catch (err) {
            setError('Failed to connect wallet. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleConnectSnap = async () => {
        setError('');
        setLoading(true);
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask is not installed. Please install MetaMask Flask to use Snaps.');
            }

            // Request Snap connection
            await window.ethereum.request({
                method: 'wallet_requestSnaps',
                params: { [SNAP_ID]: {} },
            });

            // Get Identity
            const identity = await window.ethereum.request({
                method: 'wallet_invokeSnap',
                params: {
                    snapId: SNAP_ID,
                    request: { method: 'getIdentity' },
                },
            }) as string;

            // Get Public Key
            const publicKeyHex = await window.ethereum.request({
                method: 'wallet_invokeSnap',
                params: {
                    snapId: SNAP_ID,
                    request: { method: 'getPublicKey' },
                },
            }) as string;

            // Convert hex public key to Uint8Array
            // Remove 0x prefix if present
            const cleanHex = publicKeyHex.replace(/^0x/, '');
            const publicKey = new Uint8Array(
                cleanHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
            );

            if (publicKey.length === 0) {
                throw new Error('Invalid public key received from Snap.');
            }

            connectWallet({
                identity,
                publicKey,
                type: 'snap',
            });

            onClose();

        } catch (err: any) {
            console.error('Snap connection error:', err);
            setError(err.message || 'Failed to connect to MetaMask Snap.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
            <div className="bg-[#030711] border border-white/[0.1] rounded-2xl max-w-md w-full shadow-2xl animate-slide-up overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/[0.05]">
                    <h2 className="text-xl font-bold text-white">Connect Wallet</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 gap-2 bg-white/[0.02]">
                    <button
                        onClick={() => setActiveTab('snap')}
                        className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${activeTab === 'snap'
                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                            }`}
                    >
                        <div className="flex items-center justify-center space-x-2">
                            <Wallet size={16} />
                            <span>MetaMask Snap</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('seed')}
                        className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${activeTab === 'seed'
                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                            }`}
                    >
                        <div className="flex items-center justify-center space-x-2">
                            <Key size={16} />
                            <span>Seed Phrase</span>
                        </div>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'snap' ? (
                        <div className="space-y-6">
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-10 h-10" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Qubic Wallet Snap</h3>
                                    <p className="text-sm text-gray-400">
                                        Connect securely using the official Qubic MetaMask Snap.
                                        Requires MetaMask Flask.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleConnectSnap}
                                disabled={loading}
                                className="w-full btn-primary flex items-center justify-center space-x-2 py-3"
                            >
                                {loading ? (
                                    <LoadingSpinner size="sm" />
                                ) : (
                                    <>
                                        <span>Connect with MetaMask</span>
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleConnectSeed} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Seed Phrase
                                </label>
                                <textarea
                                    value={seed}
                                    onChange={(e) => setSeed(e.target.value)}
                                    placeholder="Enter your 55-character seed phrase..."
                                    className="input-field min-h-[100px] font-mono text-sm resize-none"
                                    maxLength={55}
                                    required
                                />
                                <div className="flex justify-between mt-2">
                                    <p className="text-xs text-gray-500">
                                        {seed.length}/55 characters
                                    </p>
                                    {seed.length === 55 && (
                                        <span className="text-xs text-green-400 flex items-center">
                                            <CheckCircle2 size={12} className="mr-1" /> Valid length
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start space-x-3">
                                <AlertTriangle size={18} className="text-yellow-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-yellow-200/80 leading-relaxed">
                                    <strong>Security Warning:</strong> Never share your seed phrase.
                                    This interface runs locally in your browser.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || seed.length !== 55}
                                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 py-3"
                            >
                                {loading ? (
                                    <>
                                        <LoadingSpinner size="sm" />
                                        <span>Connecting...</span>
                                    </>
                                ) : (
                                    <span>Connect Wallet</span>
                                )}
                            </button>
                        </form>
                    )}

                    {error && (
                        <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4 animate-fade-in">
                            <p className="text-sm text-red-400 text-center">{error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
