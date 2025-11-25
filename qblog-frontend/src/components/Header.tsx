'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, PenSquare, Home, User, Copy, Check } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { WalletConnect } from './WalletConnect';
import { truncateIdentity } from '@/lib/qubic/wallet';

export const Header = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { wallet, isConnected, disconnect, isModalOpen, openModal, closeModal } = useWallet();
    const [copied, setCopied] = useState(false);
    const pathname = usePathname();

    const isHomePage = pathname === '/';
    const isCreatePage = pathname === '/create';

    return (
        <>
            <header className="glass sticky top-0 z-50 border-b border-white/[0.05]">
                <nav className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link href="/" className="flex items-center space-x-3 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-all duration-300">
                                <span className="text-xl font-bold text-white">Q</span>
                            </div>
                            <span className="text-xl font-bold text-white tracking-tight hidden sm:inline">
                                QBlog
                            </span>
                        </Link>

                        {/* Desktop Navigation & Wallet */}
                        <div className="hidden md:flex items-center space-x-6">
                            {!isHomePage && (
                                <Link
                                    href="/"
                                    className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-300"
                                >
                                    <Home size={18} />
                                    <span className="font-medium">Home</span>
                                </Link>
                            )}

                            {isConnected && !isCreatePage && (
                                <>
                                    <Link
                                        href="/create"
                                        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-300"
                                    >
                                        <PenSquare size={18} />
                                        <span className="font-medium">Create Post</span>
                                    </Link>

                                    <Link
                                        href={`/profile/${wallet?.identity}`}
                                        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-300"
                                    >
                                        <User size={18} />
                                        <span className="font-medium">My Posts</span>
                                    </Link>

                                    <div className="h-6 w-px bg-white/[0.1] mx-2" />

                                    <div className="flex items-center space-x-4">
                                        <div className="bg-white/[0.05] border border-white/[0.05] px-4 py-2 rounded-xl flex items-center space-x-3">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                            <p className="font-mono text-sm text-gray-300">
                                                {truncateIdentity(wallet?.identity || '')}
                                            </p>
                                            <button
                                                onClick={() => {
                                                    if (wallet?.identity) {
                                                        navigator.clipboard.writeText(wallet.identity);
                                                        setCopied(true);
                                                        setTimeout(() => setCopied(false), 1500);
                                                    }
                                                }}
                                                className="text-gray-400 hover:text-white transition-colors"
                                                title="Copy identity"
                                            >
                                                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                            </button>
                                            {copied && <span className="text-xs text-green-400">Copied!</span>}
                                        </div>
                                        <button
                                            onClick={disconnect}
                                            className="btn-secondary text-sm"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                </>
                            )}

                            {!isConnected && (
                                <button
                                    onClick={openModal}
                                    className="btn-primary"
                                >
                                    Connect Wallet
                                </button>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden text-gray-300 hover:text-white transition-colors"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden mt-4 space-y-2 animate-slide-up bg-[#030711]/90 backdrop-blur-xl p-4 rounded-2xl border border-white/[0.05]">
                            {!isHomePage && (
                                <Link
                                    href="/"
                                    className="block px-4 py-3 rounded-xl hover:bg-white/[0.05] text-gray-300 hover:text-white transition-all"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <div className="flex items-center space-x-3">
                                        <Home size={20} />
                                        <span className="font-medium">Home</span>
                                    </div>
                                </Link>
                            )}

                            {isConnected && !isCreatePage && (
                                <>
                                    <Link
                                        href="/create"
                                        className="block px-4 py-3 rounded-xl hover:bg-white/[0.05] text-gray-300 hover:text-white transition-all"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <PenSquare size={20} />
                                            <span className="font-medium">Create Post</span>
                                        </div>
                                    </Link>

                                    <Link
                                        href={`/profile/${wallet?.identity}`}
                                        className="block px-4 py-3 rounded-xl hover:bg-white/[0.05] text-gray-300 hover:text-white transition-all"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <User size={20} />
                                            <span className="font-medium">My Posts</span>
                                        </div>
                                    </Link>
                                </>
                            )}

                            <div className="pt-4 mt-2 border-t border-white/[0.05]">
                                {isConnected ? (
                                    <div className="space-y-3">
                                        <div className="bg-white/[0.05] px-4 py-3 rounded-xl">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Connected as</p>
                                            <p className="font-mono text-sm text-white">
                                                {truncateIdentity(wallet?.identity || '')}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                disconnect();
                                                setMobileMenuOpen(false);
                                            }}
                                            className="w-full btn-secondary"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            openModal();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="w-full btn-primary"
                                    >
                                        Connect Wallet
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </nav>
            </header>

            <WalletConnect
                isOpen={isModalOpen}
                onClose={closeModal}
            />
        </>
    );
};
