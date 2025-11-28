'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
    text: string;
    className?: string;
    iconSize?: number;
}

export const CopyButton = ({ text, className = '', iconSize = 16 }: CopyButtonProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={`p-1.5 rounded-lg hover:bg-white/[0.1] transition-colors ${className}`}
            title="Copy to clipboard"
        >
            {copied ? (
                <Check size={iconSize} className="text-green-400" />
            ) : (
                <Copy size={iconSize} className="text-gray-400 hover:text-white" />
            )}
        </button>
    );
};
