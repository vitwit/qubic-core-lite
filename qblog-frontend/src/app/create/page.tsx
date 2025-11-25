'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { createPost } from '@/lib/qubic/qblog-api';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function CreatePostPage() {
    const router = useRouter();
    const { wallet, isConnected } = useWallet();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isConnected || !wallet) {
            setError('Please connect your wallet first');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await createPost(
                { title, content },
                wallet.publicKey,
                wallet.privateKey
            );

            // Redirect to home after successful creation
            router.push('/');
        } catch (err) {
            setError('Failed to create post. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

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
