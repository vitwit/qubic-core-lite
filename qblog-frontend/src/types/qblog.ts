// QBlog Smart Contract Types

export interface Post {
    author: string; // 60-character Qubic identity
    timestamp: number;
    likes: number;
    deleted: boolean;
    title: string; // max 64 chars
    content: string; // max 256 chars
}

export interface CreatePostInput {
    title: string;
    content: string;
}

export interface CreatePostOutput {
    postId: number;
    returnCode: number;
}

export interface EditPostInput {
    postId: number;
    title: string;
    content: string;
}

export interface EditPostOutput {
    returnCode: number;
}

export interface DeletePostInput {
    postId: number;
}

export interface DeletePostOutput {
    returnCode: number;
}

export interface LikePostInput {
    postId: number;
}

export interface LikePostOutput {
    newLikeCount: number;
    returnCode: number;
}

export interface GetPostInput {
    postId: number;
}

export interface GetPostOutput {
    post: Post;
    exists: boolean;
}

export interface GetPostsByUserInput {
    author: string;
    page: number;
    pageSize: number;
}

export interface GetPostsByUserOutput {
    posts: Post[];
    count: number;
    hasMore: boolean;
}

// Return Code Enum
export enum QBlogReturnCode {
    Success = 0,
    ContractFull = 1,
    InvalidPostId = 2,
    Unauthorized = 3,
    PostDeleted = 4,
    PostNotFound = 5,
}

// UI Types
export interface PostWithId extends Post {
    id: number;
}

export interface WalletState {
    connected: boolean;
    address: string | null;
    publicKey: Uint8Array | null;
    privateKey: Uint8Array | null;
}

export interface TransactionStatus {
    pending: boolean;
    success: boolean;
    error: string | null;
    txId: string | null;
}
