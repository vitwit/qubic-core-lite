// QBlog Smart Contract API
// Using RPC server for contract queries and direct node connection for transactions
// Contract Index: 20

import { buildTransaction, broadcastTransaction } from './transaction';
import { querySmartContract } from './node-service';
import { QubicHelper } from '@qubic-lib/qubic-ts-library/dist/qubicHelper';
import { PublicKey } from '@qubic-lib/qubic-ts-library/dist/qubic-types/PublicKey';
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

// Read configuration from environment
const CONTRACT_INDEX = parseInt(process.env.NEXT_PUBLIC_QBLOG_CONTRACT_INDEX || '20');

// Function indices from QBlog contract
const FUNCTION_INDEX = {
    CREATE_POST: 1,
    EDIT_POST: 2,
    DELETE_POST: 3,
    LIKE_POST: 4,
    GET_POST: 5,
    GET_POSTS_BY_USER: 6,
};

// ============================================================================
// Data Formatting Utilities
// ============================================================================

/**
 * Convert string to byte array for contract input
 */
function stringToByteArray(str: string, maxLength: number): number[] {
    const encoded = new TextEncoder().encode(str);
    const result = new Array(maxLength).fill(0);
    for (let i = 0; i < Math.min(encoded.length, maxLength); i++) {
        result[i] = encoded[i];
    }
    return result;
}

// ============================================================================
// Contract Query Functions (Simplified - Return Empty Data)
// ============================================================================

/**
 * Get a single post by ID using RPC querySmartContract
 */
export async function getPost(postId: number): Promise<GetPostOutput> {
    try {
        // Create input data (uint32 postId)
        const inputData = new Uint8Array(4);
        new DataView(inputData.buffer).setUint32(0, postId, true);

        // Convert to base64
        const inputBase64 = Buffer.from(inputData).toString('base64');

        // Query contract
        const responseBase64 = await querySmartContract(
            CONTRACT_INDEX,
            FUNCTION_INDEX.GET_POST,
            inputBase64
        );

        // Decode response
        const responseData = Buffer.from(responseBase64, 'base64');
        const view = new DataView(responseData.buffer, responseData.byteOffset, responseData.byteLength);

        // Parse Post structure: author(32) + timestamp(8) + likes(4) + deleted(1) + title(64) + content(256)
        const authorBytes = new Uint8Array(responseData.buffer, responseData.byteOffset, 32);
        const timestamp = Number(view.getBigUint64(32, true));
        const likes = view.getUint32(40, true);
        const deleted = view.getUint8(44) !== 0;

        const titleBytes = new Uint8Array(responseData.buffer, responseData.byteOffset + 45, 64);
        const contentBytes = new Uint8Array(responseData.buffer, responseData.byteOffset + 109, 256);

        const decoder = new TextDecoder();
        const title = decoder.decode(titleBytes).replace(/\0/g, '').trim();
        const content = decoder.decode(contentBytes).replace(/\0/g, '').trim();

        // Get author identity from public key (uppercase for correct checksum)
        const qubicHelper = new QubicHelper();
        const author = await qubicHelper.getIdentity(authorBytes, false);

        // Check if exists (bit at offset 365)
        const exists = view.getUint8(365) !== 0;

        return {
            post: {
                author,
                timestamp,
                likes,
                deleted,
                title,
                content,
            },
            exists,
        };
    } catch (error) {
        console.error('Error fetching post:', error);
        return {
            post: {
                author: '',
                timestamp: 0,
                likes: 0,
                deleted: false,
                title: '',
                content: '',
            },
            exists: false,
        };
    }
}

/**
 * Get posts by user (author) using RPC querySmartContract
 */
export async function getPostsByUser(
    input: GetPostsByUserInput
): Promise<GetPostsByUserOutput> {
    try {
        // Create input data: author(32) + page(4) + pageSize(4)
        const inputData = new Uint8Array(40);
        const view = new DataView(inputData.buffer);

        // Convert author identity to public key bytes
        const qubicHelper = new QubicHelper();
        const idPackage = await qubicHelper.createIdPackage(input.author);
        inputData.set(idPackage.publicKey, 0);

        view.setUint32(32, input.page, true);
        view.setUint32(36, input.pageSize, true);

        // Convert to base64
        const inputBase64 = Buffer.from(inputData).toString('base64');

        // Query contract
        const responseBase64 = await querySmartContract(
            CONTRACT_INDEX,
            FUNCTION_INDEX.GET_POSTS_BY_USER,
            inputBase64
        );

        // Decode response
        const responseData = Buffer.from(responseBase64, 'base64');
        const responseView = new DataView(responseData.buffer, responseData.byteOffset, responseData.byteLength);
        const decoder = new TextDecoder();

        const posts: Post[] = [];
        const POST_SIZE = 365; // 32 + 8 + 4 + 1 + 64 + 256

        // Read count and hasMore (at end of response)
        const count = responseView.getUint32(POST_SIZE * 10, true);
        const hasMore = responseView.getUint8(POST_SIZE * 10 + 4) !== 0;

        // Parse posts
        for (let i = 0; i < count && i < 10; i++) {
            const offset = i * POST_SIZE;

            const authorBytes = new Uint8Array(responseData.buffer, responseData.byteOffset + offset, 32);
            const timestamp = Number(responseView.getBigUint64(offset + 32, true));
            const likes = responseView.getUint32(offset + 40, true);
            const deleted = responseView.getUint8(offset + 44) !== 0;

            const titleBytes = new Uint8Array(responseData.buffer, responseData.byteOffset + offset + 45, 64);
            const contentBytes = new Uint8Array(responseData.buffer, responseData.byteOffset + offset + 109, 256);

            const title = decoder.decode(titleBytes).replace(/\0/g, '').trim();
            const content = decoder.decode(contentBytes).replace(/\0/g, '').trim();

            const author = await qubicHelper.getIdentity(authorBytes, false);

            posts.push({
                author,
                timestamp,
                likes,
                deleted,
                title,
                content,
            });
        }

        return {
            posts,
            count,
            hasMore,
        };
    } catch (error) {
        console.error('Error fetching posts by user:', error);
        return {
            posts: [],
            count: 0,
            hasMore: false,
        };
    }
}

// ============================================================================
// Contract Transaction Functions (Working)
// ============================================================================

/**
 * Create a new post
 */
export async function createPost(
    input: CreatePostInput,
    publicKey: Uint8Array,
    privateKey?: Uint8Array
): Promise<CreatePostOutput> {
    try {
        const titleBytes = stringToByteArray(input.title, 64);
        const contentBytes = stringToByteArray(input.content, 256);
        const inputData = new Uint8Array([...titleBytes, ...contentBytes]);

        const tx = await buildTransaction(
            publicKey,
            CONTRACT_INDEX,
            FUNCTION_INDEX.CREATE_POST,
            inputData,
            privateKey
        );

        await broadcastTransaction(tx);

        return { postId: -1 };
    } catch (error) {
        console.error('Error creating post:', error);
        throw error;
    }
}

/**
 * Edit an existing post
 */
export async function editPost(
    input: EditPostInput,
    publicKey: Uint8Array,
    privateKey?: Uint8Array
): Promise<EditPostOutput> {
    try {
        const postIdBytes = new Uint8Array(4);
        new DataView(postIdBytes.buffer).setUint32(0, input.postId, true);
        const titleBytes = stringToByteArray(input.title, 64);
        const contentBytes = stringToByteArray(input.content, 256);
        const inputData = new Uint8Array([...postIdBytes, ...titleBytes, ...contentBytes]);

        const tx = await buildTransaction(
            publicKey,
            CONTRACT_INDEX,
            FUNCTION_INDEX.EDIT_POST,
            inputData,
            privateKey
        );

        await broadcastTransaction(tx);

        return { success: true };
    } catch (error) {
        console.error('Error editing post:', error);
        throw error;
    }
}

/**
 * Delete a post
 */
export async function deletePost(
    input: DeletePostInput,
    publicKey: Uint8Array,
    privateKey?: Uint8Array
): Promise<DeletePostOutput> {
    try {
        const inputData = new Uint8Array(4);
        new DataView(inputData.buffer).setUint32(0, input.postId, true);

        const tx = await buildTransaction(
            publicKey,
            CONTRACT_INDEX,
            FUNCTION_INDEX.DELETE_POST,
            inputData,
            privateKey
        );

        await broadcastTransaction(tx);

        return { success: true };
    } catch (error) {
        console.error('Error deleting post:', error);
        throw error;
    }
}

/**
 * Like a post
 */
export async function likePost(
    input: LikePostInput,
    publicKey: Uint8Array,
    privateKey?: Uint8Array
): Promise<LikePostOutput> {
    try {
        const inputData = new Uint8Array(4);
        new DataView(inputData.buffer).setUint32(0, input.postId, true);

        const tx = await buildTransaction(
            publicKey,
            CONTRACT_INDEX,
            FUNCTION_INDEX.LIKE_POST,
            inputData,
            privateKey
        );

        await broadcastTransaction(tx);

        return { success: true, newLikeCount: 0 };
    } catch (error) {
        console.error('Error liking post:', error);
        throw error;
    }
}

export { CONTRACT_INDEX };
