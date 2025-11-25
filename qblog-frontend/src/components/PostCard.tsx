'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Trash2, Edit, User } from 'lucide-react';
import { PostWithId } from '@/types/qblog';
import { formatRelativeTime, truncateText, stringToColor, getInitials } from '@/utils/format';
import { truncateIdentity } from '@/lib/qubic/wallet';

interface PostCardProps {
    post: PostWithId;
    onLike?: (postId: number) => void;
    onDelete?: (postId: number) => void;
    showActions?: boolean;
    isOwner?: boolean;
}

export const PostCard = ({ post, onLike, onDelete, showActions = true, isOwner = false }: PostCardProps) => {
    if (post.deleted) {
        return (
            <div className="card opacity-50 flex items-center justify-center min-h-[200px]">
                <p className="text-gray-500 italic">This post has been deleted</p>
            </div>
        );
    }

    return (
        <article className="card group flex flex-col h-full hover:border-violet-500/30 transition-all duration-300">
            {/* Author Info */}
            <div className="flex items-center space-x-3 mb-4">
                <div className={`w-10 h-10 bg-gradient-to-br ${stringToColor(post.author)} rounded-full flex items-center justify-center font-bold text-white shadow-lg`}>
                    {getInitials(post.author)}
                </div>
                <div className="flex-1 min-w-0">
                    <Link
                        href={`/profile/${post.author}`}
                        className="font-semibold text-gray-200 hover:text-violet-400 transition-colors truncate block"
                    >
                        {truncateIdentity(post.author, 6)}
                    </Link>
                    <p className="text-xs text-gray-500">
                        {formatRelativeTime(post.timestamp)}
                    </p>
                </div>
            </div>

            {/* Post Content */}
            <Link href={`/post/${post.id}`} className="block flex-1 group-hover:translate-x-1 transition-transform duration-300">
                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-violet-400 transition-colors line-clamp-2">
                    {post.title}
                </h3>
                <p className="text-gray-400 line-clamp-4 mb-4 leading-relaxed">
                    {post.content}
                </p>
            </Link>

            {/* Actions */}
            {showActions && (
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.05] mt-auto">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onLike?.(post.id);
                        }}
                        className="flex items-center space-x-2 text-gray-500 hover:text-pink-500 transition-colors group/like"
                    >
                        <Heart
                            size={20}
                            className="group-hover/like:fill-pink-500 transition-all"
                        />
                        <span className="font-medium text-sm">{post.likes}</span>
                    </button>

                    {isOwner && (
                        <div className="flex items-center space-x-2">
                            <Link
                                href={`/post/${post.id}/edit`}
                                className="p-2 hover:bg-white/[0.05] rounded-lg text-gray-500 hover:text-blue-400 transition-colors"
                            >
                                <Edit size={18} />
                            </Link>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    onDelete?.(post.id);
                                }}
                                className="p-2 hover:bg-white/[0.05] rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </article>
    );
};
