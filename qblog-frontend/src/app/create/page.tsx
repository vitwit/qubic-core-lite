'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { createPost } from '@/lib/qubic/qblog-api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { checkTransactionStatus, formatTransactionStatus } from '@/lib/qubic/transaction-tracker';

export default function CreatePostPage() {
    const router = useRouter();
    const { wallet, isConnected } = useWallet();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [txId, setTxId] = useState<string | null>(null);
    const [targetTick, setTargetTick] = useState<number | null>(null);
    const [txStatus, setTxStatus] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isConnected || !wallet) {
            setError('Please connect your wallet first');
            return;
        }

        setLoading(true);
        setError('');
        setTxId(null);

        try {
            const result = await createPost(
                { title, content },
                wallet.publicKey,
                wallet.privateKey
            );

            setTxId(result.txId || 'Transaction sent successfully');

            if (result.txId && result.targetTick) {
                setTargetTick(result.targetTick);
                const status = await checkTransactionStatus(result.txId, result.targetTick);
                setTxStatus(formatTransactionStatus(status));
            }

            // Clear form
            setTitle('');
            setContent('');
        } catch (err) {
            setError('Failed to create post. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!txId || !targetTick) return;

        const updateStatus = async () => {
            const status = await checkTransactionStatus(txId, targetTick);
            setTxStatus(formatTransactionStatus(status));
        };

        updateStatus();
        const interval = setInterval(updateStatus, 2000);

        return () => clearInterval(interval);
    }, [txId, targetTick]);

    if (!isConnected) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="card">
                        <h2 className="text-2xl font-bold mb-4">Wallet Not Connected</h2>
                        <p className="text-gray-300 mb-6">
                            Please connect your wallet to create a post.
                        </p>
                        <Link href="/" className="btn-primary inline-block">
                            Go Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft size={20} />
                        <span>Back to Home</span>
                    </Link>

                    <h1 className="text-4xl font-bold gradient-text mb-2">
                        Create New Post
                    </h1>
                    <p className="text-gray-400">
                        Share your thoughts with the decentralized world
                    </p>
                </div>

                {/* Success Dialog */}
                {txId && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-900 border border-green-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Send className="text-green-500" size={32} />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Post Created!</h2>
                                <p className="text-gray-400">
                                    Your transaction has been broadcast to the network.
                                </p>
                            </div>

                            <div className="bg-black/50 rounded-lg p-4 mb-4 overflow-hidden">
                                <p className="text-xs text-gray-500 uppercase mb-1">Transaction ID</p>
                                <p className="text-sm font-mono text-blue-400 break-all">{txId}</p>
                            </div>

                            {txStatus && (
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                                    <p className="text-xs text-blue-300">{txStatus}</p>
                                    {targetTick && (
                                        <p className="text-xs text-gray-400 mt-2">Target Tick: {targetTick}</p>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-col space-y-3">
                                <Link
                                    href={`/profile/${wallet?.identity}`}
                                    className="btn-primary w-full text-center"
                                >
                                    View My Posts
                                </Link>
                                <button
                                    onClick={() => setTxId(null)}
                                    className="btn-secondary w-full"
                                >
                                    Create Another Post
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="card">
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter your post title..."
                                className="input-field"
                                maxLength={64}
                                required
                            />
                            <div className="flex justify-between mt-2">
                                <p className="text-xs text-gray-400">
                                    Make it catchy and descriptive
                                </p>
                                <p className="text-xs text-gray-400">
                                    {title.length}/64
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Content
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Write your post content..."
                                className="input-field min-h-[200px] resize-y"
                                maxLength={256}
                                required
                            />
                            <div className="flex justify-between mt-2">
                                <p className="text-xs text-gray-400">
                                    Express yourself freely
                                </p>
                                <p className="text-xs text-gray-400">
                                    {content.length}/256
                                </p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <Link href="/" className="btn-secondary">
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={loading || !title.trim() || !content.trim()}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {loading ? (
                                <>
                                    <LoadingSpinner size="sm" />
                                    <span>Publishing...</span>
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    <span>Publish Post</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Info Box */}
                <div className="mt-8 glass rounded-lg p-6 border border-blue-500/30">
                    <h3 className="font-semibold mb-2 flex items-center space-x-2">
                        <span className="text-blue-400">ℹ️</span>
                        <span>Publishing on Blockchain</span>
                    </h3>
                    <ul className="text-sm text-gray-300 space-y-1">
                        <li>• Your post will be permanently stored on the Qubic blockchain</li>
                        <li>• Transaction may take a few seconds to process</li>
                        <li>• You can edit or delete your post later</li>
                        <li>• Gas fees may apply (check your wallet)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
