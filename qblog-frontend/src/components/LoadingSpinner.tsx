'use client';

import React from 'react';

export const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className="flex items-center justify-center">
            <div
                className={`${sizeClasses[size]} border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin`}
            />
        </div>
    );
};

export const LoadingCard = () => {
    return (
        <div className="card animate-pulse">
            <div className="h-4 bg-white/20 rounded w-3/4 mb-4"></div>
            <div className="h-3 bg-white/20 rounded w-full mb-2"></div>
            <div className="h-3 bg-white/20 rounded w-5/6"></div>
        </div>
    );
};
