'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { editPost, getPost } from '@/lib/qubic/qblog-api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { checkTransactionStatus, formatTransactionStatus } from '@/lib/qubic/transaction-tracker';
import { CopyButton } from '@/components/CopyButton';

export default function EditPostPage() {
    const params = useParams();
    const router = useRouter();
    const { wallet, isConnected } = useWallet();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [txId, setTxId] = useState<string | null>(null);
    const [targetTick, setTargetTick] = useState<number | null>(null);
    const [txStatus, setTxStatus] = useState<string>('');

    const postId = params ? parseInt(params.id as string) : 0;

    useEffect(() => {
        loadPost();
    }, [postId]);

    const loadPost = async () => {
        try {
            const { post, exists } = await getPost(postId);

            if (!exists) {
                setError('Post not found');
                setLoading(false);
                return;
            }

            if (wallet && post.author !== wallet.identity) {
                setError('You can only edit your own posts');
                setLoading(false);
                return;
            }

            setTitle(post.title);
            setContent(post.content);
        } catch (err) {
            setError('Failed to load post');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isConnected || !wallet) {
            setError('Please connect your wallet first');
            return;
        }

        setSaving(true);
        setError('');
        setTxId(null);

        try {
            const result = await editPost(
                { postId, title, content },
                wallet.publicKey,
                wallet.seed
            );

            setTxId(result.txId || 'Transaction sent successfully');

            if (result.txId && result.targetTick) {
                setTargetTick(result.targetTick);
                const status = await checkTransactionStatus(result.txId, result.targetTick);
                setTxStatus(formatTransactionStatus(status));
            }


        } catch (err) {
            setError('Failed to update post. Please try again.');
            console.error(err);
            setSaving(false);
        }
    };

    // Poll for transaction status
    useEffect(() => {
        if (!txId || !targetTick) return;

        const interval = setInterval(async () => {
            try {
                const status = await checkTransactionStatus(txId, targetTick);
                setTxStatus(formatTransactionStatus(status));

                // Stop polling if expired or ready (though we might want to keep polling for 'ready' state confirmation if we had a way to check actual inclusion)
                if (status.status === 'expired') {
                    clearInterval(interval);
                }
            } catch (err) {
                console.error('Error checking tx status:', err);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [txId, targetTick]);

    if (!isConnected) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="card">
                        <h2 className="text-2xl font-bold mb-4">Wallet Not Connected</h2>
                        <p className="text-gray-300 mb-6">
                            Please connect your wallet to edit posts.
                        </p>
                        <Link href="/" className="btn-primary inline-block">
                            Go Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto">
                    <LoadingSpinner size="lg" />
                </div>
            </div>
        );
    }

    if (error && !title) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="card">
                        <h2 className="text-2xl font-bold mb-4">Error</h2>
                        <p className="text-gray-300 mb-6">{error}</p>
                        <Link href={`/post/${postId}`} className="btn-primary inline-block">
                            Back to Post
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (txId) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="card">
                        <div className="mb-6 text-green-500 flex justify-center">
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-4 text-gradient">Update Broadcasted!</h2>
                        <p className="text-gray-300 mb-6">
                            Your post update has been broadcast to the network.
                        </p>

                        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 text-left">
                            <div className="mb-2">
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Transaction ID</span>
                                <div className="flex items-center gap-2">
                                    <p className="font-mono text-sm text-blue-400 break-all">{txId}</p>
                                    <CopyButton text={txId} />
                                </div>
                            </div>
                            {targetTick && (
                                <div className="mb-2">
                                    <span className="text-xs text-gray-500 uppercase tracking-wider">Target Tick</span>
                                    <p className="font-mono text-sm text-gray-300">{targetTick}</p>
                                </div>
                            )}
                            <div>
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Status</span>
                                <div className="text-sm text-yellow-400 flex items-center gap-2">
                                    <LoadingSpinner size="sm" />
                                    {txStatus || 'Broadcasting...'}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href={`/post/${postId}`} className="btn-primary">
                                View Post
                            </Link>
                            <Link href="/" className="btn-secondary">
                                Go Home
                            </Link>
                        </div>
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
                        href={`/post/${postId}`}
                        className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft size={20} />
                        <span>Back to Post</span>
                    </Link>

                    <h1 className="text-4xl font-bold gradient-text mb-2">
                        Edit Post
                    </h1>
                    <p className="text-gray-400">
                        Update your post on the blockchain
                    </p>
                </div>

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
                        <Link href={`/post/${postId}`} className="btn-secondary">
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={saving || !title.trim() || !content.trim()}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {saving ? (
                                <>
                                    <LoadingSpinner size="sm" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Info Box */}
                <div className="mt-8 glass rounded-lg p-6 border border-blue-500/30">
                    <h3 className="font-semibold mb-2 flex items-center space-x-2">
                        <span className="text-blue-400">ℹ️</span>
                        <span>Updating on Blockchain</span>
                    </h3>
                    <ul className="text-sm text-gray-300 space-y-1">
                        <li>• Changes will be permanently stored on the Qubic blockchain</li>
                        <li>• Transaction may take a few seconds to process</li>
                        <li>• Previous version will be overwritten</li>
                        <li>• Gas fees may apply (check your wallet)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
