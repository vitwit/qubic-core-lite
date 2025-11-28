// Formatting Utilities

/**
 * Format timestamp to readable date
 * Note: QBlog stores Qubic tick numbers, not Unix timestamps
 */
export const formatDate = (tickNumber: number): string => {
    // For now, display tick number since we don't have epoch start time
    // TODO: Convert tick to actual date using epoch start time
    return `Tick #${tickNumber.toLocaleString()}`;
};

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 * Note: QBlog stores Qubic tick numbers, not Unix timestamps
 */
export const formatRelativeTime = (tickNumber: number): string => {
    // For now, display tick number
    // TODO: Convert tick to actual date and calculate relative time
    return `Tick #${tickNumber.toLocaleString()}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input: string): string => {
    return input.replace(/[<>]/g, '');
};

/**
 * Format number with commas
 */
export const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
};

/**
 * Get initials from identity
 */
export const getInitials = (identity: string): string => {
    if (!identity || identity.length < 2) return '??';
    return identity.slice(0, 2).toUpperCase();
};

/**
 * Generate random color from string (for avatars)
 */
export const stringToColor = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors = [
        'from-purple-500 to-pink-500',
        'from-blue-500 to-cyan-500',
        'from-green-500 to-emerald-500',
        'from-orange-500 to-red-500',
        'from-indigo-500 to-purple-500',
        'from-pink-500 to-rose-500',
    ];

    return colors[Math.abs(hash) % colors.length];
};
