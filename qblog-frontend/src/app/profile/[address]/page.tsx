'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { PostCard } from '@/components/PostCard';
import { LoadingCard } from '@/components/LoadingSpinner';
import { PostWithId } from '@/types/qblog';
import { truncateIdentity } from '@/lib/qubic/wallet';
import { stringToColor, getInitials } from '@/utils/format';

export default function ProfilePage() {
    const params = useParams();
    const { wallet, isConnected } = useWallet();
    const [posts, setPosts] = useState<PostWithId[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const address = params.address as string;
    const isOwnProfile = Boolean(isConnected && wallet && wallet.identity === address);

    useEffect(() => {
        loadPosts();
    }, [address, page]);

    const loadPosts = async () => {
        try {
            setLoading(true);

            // Import and use real API
            const { getPostsByUser } = await import('@/lib/qubic/qblog-api');

            const result = await getPostsByUser({
                author: address,
                page,
                pageSize: 10,
            });

            // Posts now come with real IDs from the contract
            if (page === 0) {
                setPosts(result.posts);
            } else {
                setPosts(prev => [...prev, ...result.posts]);
            }

            setHasMore(result.hasMore);
        } catch (error) {
            console.error('Error loading posts:', error);
            // Show empty state on error
            setPosts([]);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden pt-20 pb-12">
            {/* Background Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[100px] animate-pulse-slow" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <Link
                        href="/"
                        className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6 group"
                    >
                        <div className="p-2 rounded-full bg-white/[0.05] group-hover:bg-white/[0.1] transition-colors">
                            <ArrowLeft size={18} />
                        </div>
                        <span className="font-medium text-sm">Back to Home</span>
                    </Link>

                    {/* Profile Header */}
                    <div className="glass rounded-2xl p-6 md:p-8 mb-8 border border-white/[0.1] shadow-2xl animate-slide-up relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />

                        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
                            <div className={`w-24 h-24 bg-gradient-to-br ${stringToColor(address)} rounded-2xl flex items-center justify-center font-bold text-3xl shadow-2xl ring-2 ring-white/[0.05]`}>
                                {getInitials(address)}
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                    {isOwnProfile ? 'Your Profile' : 'User Profile'}
                                </h1>
                                <p className="font-mono text-violet-300 bg-violet-500/10 px-3 py-1.5 rounded-lg inline-block mb-4 border border-violet-500/20 text-sm">
                                    {truncateIdentity(address, 12)}
                                </p>

                                <div className="flex items-center justify-center md:justify-start gap-6">
                                    <div className="text-center md:text-left">
                                        <span className="block text-2xl font-bold text-white mb-0.5">{posts.length}</span>
                                        <span className="text-xs text-gray-400 uppercase tracking-wider">Posts</span>
                                    </div>
                                    <div className="w-px h-8 bg-white/[0.1]" />
                                    <div className="text-center md:text-left">
                                        <span className="block text-2xl font-bold text-white mb-0.5">
                                            {posts.reduce((sum, post) => sum + post.likes, 0)}
                                        </span>
                                        <span className="text-xs text-gray-400 uppercase tracking-wider">Total Likes</span>
                                    </div>
                                </div>
                            </div>

                            {isOwnProfile && (
                                <Link
                                    href="/create"
                                    className="btn-primary px-6 py-2.5 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all hover:scale-105 text-sm"
                                >
                                    Create Post
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Posts Section */}
                    <div>
                        <h2 className="text-xl font-bold mb-6 flex items-center space-x-3">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                {isOwnProfile ? 'Your Posts' : 'Published Posts'}
                            </span>
                            <div className="h-px flex-1 bg-gradient-to-r from-white/[0.1] to-transparent" />
                        </h2>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <LoadingCard />
                                <LoadingCard />
                            </div>
                        ) : posts.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {posts.map((post) => (
                                        <PostCard
                                            key={post.id}
                                            post={post}
                                            isOwner={isOwnProfile}
                                            onLike={(id) => console.log('Like post', id)}
                                            onDelete={(id) => console.log('Delete post', id)}
                                        />
                                    ))}
                                </div>

                                {hasMore && (
                                    <div className="text-center mt-8">
                                        <button
                                            onClick={() => setPage(page + 1)}
                                            className="px-6 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white transition-all border border-white/[0.1] hover:border-white/[0.2] text-sm"
                                        >
                                            Load More Posts
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="glass rounded-2xl p-8 text-center border border-white/[0.1]">
                                <div className="w-16 h-16 bg-white/[0.05] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User size={32} className="text-gray-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">No Posts Yet</h3>
                                <p className="text-gray-400 mb-6 max-w-md mx-auto text-sm">
                                    {isOwnProfile
                                        ? "You haven't created any posts yet. Share your thoughts with the world!"
                                        : 'This user hasn\'t published any posts yet.'}
                                </p>
                                {isOwnProfile && (
                                    <Link href="/create" className="btn-primary inline-flex items-center space-x-2 px-6 py-2.5 text-sm">
                                        <span>Create Your First Post</span>
                                        <ArrowRight size={16} />
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
