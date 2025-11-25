// QBlog Smart Contract API
import { getQubicConnector } from './connector';
import { buildTransaction, broadcastTransaction, encodeString, encodeUint32, concatBytes, signWithSnap } from './transaction';
import type {
    Post,
    CreatePostInput,
    CreatePostOutput,
    EditPostInput,
    EditPostOutput,
    DeletePostInput,
    DeletePostOutput,
    LikePostInput,
    LikePostOutput,
    GetPostInput,
    GetPostOutput,
    GetPostsByUserInput,
    GetPostsByUserOutput,
} from '@/types/qblog';

const CONTRACT_INDEX = parseInt(process.env.NEXT_PUBLIC_QBLOG_CONTRACT_INDEX || '20');

// Function indices from QBLOG contract
const FUNCTION_INDEX = {
    CREATE_POST: 1,
    EDIT_POST: 2,
    DELETE_POST: 3,
    LIKE_POST: 4,
    GET_POST: 5,
    GET_POSTS_BY_USER: 6,
};

/**
 * Create a new blog post
 */
export const createPost = async (
    input: CreatePostInput,
    publicKey: Uint8Array,
    privateKey?: Uint8Array
): Promise<CreatePostOutput> => {
    try {
        // Encode input: title[64] + content[256]
        const titleBytes = encodeString(input.title, 64);
        const contentBytes = encodeString(input.content, 256);
        const inputData = concatBytes(titleBytes, contentBytes);

        // Build transaction (will sign if privateKey is provided)
        const tx = await buildTransaction(
            publicKey,
            FUNCTION_INDEX.CREATE_POST,
            inputData,
            privateKey
        );

        // If no private key, sign with Snap
        if (!privateKey) {
            await signWithSnap(tx);
        }

        const txId = await broadcastTransaction(tx);

        // Note: In production, you'd poll for the transaction result
        // For now, return a placeholder
        return { postId: -1 }; // Will be updated when tx is processed
    } catch (error) {
        console.error('Error creating post:', error);
        throw error;
    }
};

/**
 * Edit an existing blog post
 */
export const editPost = async (
    input: EditPostInput,
    publicKey: Uint8Array,
    privateKey?: Uint8Array
): Promise<EditPostOutput> => {
    try {
        // Encode input: postId(uint32) + title[64] + content[256]
        const postIdBytes = encodeUint32(input.postId);
        const titleBytes = encodeString(input.title, 64);
        const contentBytes = encodeString(input.content, 256);
        const inputData = concatBytes(postIdBytes, titleBytes, contentBytes);

        const tx = await buildTransaction(
            publicKey,
            FUNCTION_INDEX.EDIT_POST,
            inputData,
            privateKey
        );

        if (!privateKey) {
            await signWithSnap(tx);
        }

        await broadcastTransaction(tx);

        return { success: true };
    } catch (error) {
        console.error('Error editing post:', error);
        throw error;
    }
};

/**
 * Delete a blog post (soft delete)
 */
export const deletePost = async (
    input: DeletePostInput,
    publicKey: Uint8Array,
    privateKey?: Uint8Array
): Promise<DeletePostOutput> => {
    try {
        // Encode input: postId(uint32)
        const inputData = encodeUint32(input.postId);

        const tx = await buildTransaction(
            publicKey,
            FUNCTION_INDEX.DELETE_POST,
            inputData,
            privateKey
        );

        if (!privateKey) {
            await signWithSnap(tx);
        }

        await broadcastTransaction(tx);

        return { success: true };
    } catch (error) {
        console.error('Error deleting post:', error);
        throw error;
    }
};

/**
 * Like a blog post
 */
export const likePost = async (
    input: LikePostInput,
    publicKey: Uint8Array,
    privateKey?: Uint8Array
): Promise<LikePostOutput> => {
    try {
        // Encode input: postId(uint32)
        const inputData = encodeUint32(input.postId);

        const tx = await buildTransaction(
            publicKey,
            FUNCTION_INDEX.LIKE_POST,
            inputData,
            privateKey
        );

        if (!privateKey) {
            await signWithSnap(tx);
        }

        await broadcastTransaction(tx);

        return { success: true, newLikeCount: 0 }; // Will be updated from contract
    } catch (error) {
        console.error('Error liking post:', error);
        throw error;
    }
};

/**
 * Get a single post by ID
 */
export const getPost = async (input: GetPostInput): Promise<GetPostOutput> => {
    try {
        const connector = getQubicConnector() as any;

        // Encode input: postId(uint32)
        const inputData = encodeUint32(input.postId);

        const result = await connector.querySmartContract({
            contractIndex: CONTRACT_INDEX,
            inputType: FUNCTION_INDEX.GET_POST,
            inputSize: inputData.length,
            requestData: Array.from(inputData),
        });

        // Decode response (Post struct + exists bool)
        // This is a simplified version - actual decoding depends on response format
        const post: Post = {
            author: '', // Decode from result
            timestamp: 0,
            likes: 0,
            deleted: false,
            title: '',
            content: '',
        };

        return {
            post,
            exists: true,
        };
    } catch (error) {
        console.error('Error getting post:', error);
        throw error;
    }
};

/**
 * Get posts by user with pagination
 */
export const getPostsByUser = async (
    input: GetPostsByUserInput
): Promise<GetPostsByUserOutput> => {
    try {
        const connector = getQubicConnector() as any;

        // Encode input: author(32 bytes) + page(uint32) + pageSize(uint32)
        // Note: author needs to be converted from identity to public key bytes
        const authorBytes = new Uint8Array(32); // Convert identity to bytes
        const pageBytes = encodeUint32(input.page);
        const pageSizeBytes = encodeUint32(input.pageSize);
        const inputData = concatBytes(authorBytes, pageBytes, pageSizeBytes);

        const result = await connector.querySmartContract({
            contractIndex: CONTRACT_INDEX,
            inputType: FUNCTION_INDEX.GET_POSTS_BY_USER,
            inputSize: inputData.length,
            requestData: Array.from(inputData),
        });

        // Decode response
        const posts: Post[] = [];

        return {
            posts,
            count: 0,
            hasMore: false,
        };
    } catch (error) {
        console.error('Error getting posts by user:', error);
        throw error;
    }
};
