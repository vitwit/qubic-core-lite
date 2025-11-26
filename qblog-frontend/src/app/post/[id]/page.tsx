'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Heart, Edit, Trash2, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { likePost, deletePost, getPost } from '@/lib/qubic/qblog-api';
import { PostWithId } from '@/types/qblog';
import { formatDate, stringToColor, getInitials } from '@/utils/format';
import { truncateIdentity } from '@/lib/qubic/wallet';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function PostDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { wallet, isConnected } = useWallet();
    const [post, setPost] = useState<PostWithId | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const postId = params ? parseInt(params.id as string) : 0;
    const isOwner = isConnected && wallet && post && post.author === wallet.identity;

    useEffect(() => {
        loadPost();
    }, [postId]);

    const loadPost = async () => {
        try {
            const { post: fetchedPost, exists } = await getPost(postId);

            if (exists) {
                setPost({ ...fetchedPost, id: postId });
            } else {
                setPost(null);
            }
        } catch (error) {
            console.error('Error loading post:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!isConnected || !wallet || !post) return;

        setActionLoading(true);
        try {
            await likePost({ postId: post.id }, wallet.publicKey, wallet.privateKey);
            setPost({ ...post, likes: post.likes + 1 });
        } catch (error) {
            console.error('Error liking post:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!isConnected || !wallet || !post) return;

        if (!confirm('Are you sure you want to delete this post?')) return;

        setActionLoading(true);
        try {
            await deletePost({ postId: post.id }, wallet.publicKey, wallet.privateKey);
            router.push('/');
        } catch (error) {
            console.error('Error deleting post:', error);
            setActionLoading(false);
        }
    };

    const handleShare = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto">
                    <LoadingSpinner size="lg" />
                </div>
            </div>
        );
    }

    if (!post || post.deleted) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="card">
                        <h2 className="text-2xl font-bold mb-4">Post Not Found</h2>
                        <p className="text-gray-300 mb-6">
                            This post doesn't exist or has been deleted.
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
        <div className="min-h-screen relative overflow-hidden pt-20 pb-12">
            {/* Background Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[100px] animate-pulse-slow" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-3xl mx-auto">
                    {/* Back Button */}
                    <Link
                        href={`/profile/${post.author}`}
                        className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6 group"
                    >
                        <div className="p-2 rounded-full bg-white/[0.05] group-hover:bg-white/[0.1] transition-colors">
                            <ArrowLeft size={18} />
                        </div>
                        <span className="font-medium text-sm">Back to All Posts</span>
                    </Link>

                    {/* Post Content */}
                    <article className="glass rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl animate-slide-up">
                        {/* Header Section */}
                        <div className="relative p-6 md:p-8 border-b border-white/[0.05] bg-gradient-to-b from-white/[0.05] to-transparent">
                            <div className="absolute top-6 right-6">
                                <button
                                    onClick={handleShare}
                                    className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 hover:text-white transition-all hover:scale-105"
                                    title="Share Post"
                                >
                                    <Share2 size={18} />
                                </button>
                            </div>

                            {/* Author Info */}
                            <div className="flex items-center space-x-3 mb-6">
                                <Link href={`/profile/${post.author}`} className="group relative">
                                    <div className={`w-10 h-10 bg-gradient-to-br ${stringToColor(post.author)} rounded-xl flex items-center justify-center font-bold text-sm shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                                        {getInitials(post.author)}
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#030711] rounded-full" />
                                </Link>
                                <div>
                                    <Link
                                        href={`/profile/${post.author}`}
                                        className="font-bold text-white hover:text-violet-400 transition-colors block leading-tight"
                                    >
                                        {truncateIdentity(post.author, 8)}
                                    </Link>
                                    <div className="flex items-center space-x-2 text-xs text-gray-400 mt-0.5">
                                        <span>{formatDate(post.timestamp)}</span>
                                        <span>•</span>
                                        <span>{Math.ceil(post.content.length / 200)} min read</span>
                                    </div>
                                </div>
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight mb-2">
                                {post.title}
                            </h1>
                        </div>

                        {/* Content Body */}
                        <div className="p-6 md:p-8 bg-black/20">
                            <div className="prose prose-invert max-w-none">
                                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap font-light">
                                    {post.content}
                                </p>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="bg-black/40 p-4 md:p-6 flex items-center justify-between border-t border-white/[0.05]">
                            <button
                                onClick={handleLike}
                                disabled={!isConnected || actionLoading}
                                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-pink-500/10 text-gray-300 hover:text-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                <Heart
                                    size={20}
                                    className={`transition-all ${post.likes > 0 ? 'fill-pink-500 text-pink-500' : 'group-hover:scale-110'}`}
                                />
                                <span className="font-semibold">{post.likes}</span>
                            </button>

                            {isOwner && (
                                <div className="flex items-center space-x-2">
                                    <Link
                                        href={`/post/${post.id}/edit`}
                                        className="btn-secondary flex items-center space-x-2 px-4 py-2 text-sm"
                                    >
                                        <Edit size={16} />
                                        <span>Edit</span>
                                    </Link>
                                    <button
                                        onClick={handleDelete}
                                        disabled={actionLoading}
                                        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-all disabled:opacity-50 text-sm"
                                    >
                                        <Trash2 size={16} />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </article>
                </div>
            </div>
        </div>
    );
}
