'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Search, ArrowRight, Wallet } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

export default function HomePage() {
    const { isConnected, wallet, openModal } = useWallet();
    const [searchId, setSearchId] = useState('');
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchId.trim()) {
            router.push(`/profile/${searchId.trim()}`);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center px-4 py-8 md:py-12 relative overflow-hidden min-h-[80vh]">
            {/* Background Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto text-center">
                {/* Badge */}
                <div className="inline-block mb-8 animate-fade-in">
                    <div className="flex items-center space-x-2 bg-white/[0.05] border border-white/[0.1] px-4 py-2 rounded-full backdrop-blur-md">
                        <Sparkles size={16} className="text-yellow-400" />
                        <span className="text-sm font-medium text-gray-300">Powered by Qubic Blockchain</span>
                    </div>
                </div>

                {/* Hero Title */}
                <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight animate-slide-up">
                    <span className="gradient-text">Decentralized</span>
                    <br />
                    <span className="text-white">Publishing</span>
                </h1>

                <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    Share your thoughts, stories, and ideas on a censorship-resistant platform.
                    Your content, your ownership, forever on Qubic.
                </p>

                {/* Actions */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    {isConnected ? (
                        <Link href="/create" className="btn-primary flex items-center space-x-2 w-full md:w-auto justify-center">
                            <span>Start Writing</span>
                            <ArrowRight size={18} />
                        </Link>
                    ) : (
                        <button
                            onClick={openModal}
                            className="btn-primary flex items-center space-x-2 w-full md:w-auto justify-center"
                        >
                            <Wallet size={18} />
                            <span>Connect Wallet to Write</span>
                        </button>
                    )}

                    <a
                        href="https://docs.qubic.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary w-full md:w-auto justify-center"
                    >
                        Learn How it Works
                    </a>
                </div>

                {/* Search Section */}
                <div className="w-full max-w-lg mx-auto animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <div className="glass p-2 rounded-2xl">
                        <form onSubmit={handleSearch} className="relative flex items-center">
                            <Search className="absolute left-4 text-gray-500" size={20} />
                            <input
                                type="text"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                placeholder="Enter Qubic ID to view posts..."
                                className="w-full bg-transparent border-none text-white placeholder-gray-500 pl-12 pr-4 py-3 focus:outline-none focus:ring-0"
                            />
                            <button
                                type="submit"
                                disabled={!searchId.trim()}
                                className="bg-white/[0.1] hover:bg-white/[0.2] text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Go
                            </button>
                        </form>
                    </div>
                    <p className="text-sm text-gray-500 mt-3">
                        Try searching for a friend's Qubic ID to see their blog.
                    </p>
                </div>
            </div>
        </div>
    );
}
