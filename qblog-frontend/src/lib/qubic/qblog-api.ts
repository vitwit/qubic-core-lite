// QBlog Smart Contract API (direct node connection)

import { buildTransaction, broadcastTransactionViaNode } from './transaction';
import { QubicHelper } from '@qubic-lib/qubic-ts-library/dist/qubicHelper';
import { PublicKey } from '@qubic-lib/qubic-ts-library/dist/qubic-types/PublicKey';
import { identityToPublicKey } from './wallet';
import type {
    Post,
    CreatePostInput,
    CreatePostOutput,
    EditPostInput,
    DeletePostInput,
    LikePostInput,
    GetPostInput,
    GetPostOutput,
    GetPostsByUserInput,
    GetPostsByUserOutput,
} from '@/types/qblog';

export interface EditPostOutput {
    returnCode: number;
    txId?: string;
    targetTick?: number;
}

export interface DeletePostOutput {
    returnCode: number;
    txId?: string;
    targetTick?: number;
}

export interface LikePostOutput {
    newLikeCount: number;
    returnCode: number;
    txId?: string;
    targetTick?: number;
}

// Configuration
const CONTRACT_INDEX = parseInt(process.env.NEXT_PUBLIC_QBLOG_CONTRACT_INDEX || '19');

const FUNCTION_INDEX = {
    CREATE_POST: 1,
    EDIT_POST: 2,
    DELETE_POST: 3,
    LIKE_POST: 4,
    GET_POST: 5,
    GET_POSTS_BY_USER: 6,
};

// ---------------------------------------------------------------------------
// Utility: string to fixed‑size byte array (sint8 compatible)
// ---------------------------------------------------------------------------
/**
 * Convert string to byte array compatible with Array<sint8, N> contract types.
 * UTF-8 encoded text typically uses values 0-127, which are identical in both
 * uint8 and sint8 representations. Extended ASCII (128-255) will be interpreted
 * as negative values (-128 to -1) by the contract.
 */
function stringToByteArray(str: string, maxLength: number): number[] {
    const encoded = new TextEncoder().encode(str);
    const result = new Array(maxLength).fill(0);
    for (let i = 0; i < Math.min(encoded.length, maxLength); i++) {
        // Values 0-127 are the same in uint8 and sint8
        // Values 128-255 will be interpreted as -128 to -1 in sint8
        result[i] = encoded[i];
    }
    return result;
}

async function querySmartContract(contractIndex: number, inputType: number, inputData: Uint8Array): Promise<Uint8Array> {
    const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contractIndex,
            inputType,
            inputData: Array.from(inputData),
        }),
    });

    const data = await response.json();
    if (!data.success) {
        throw new Error(data.error || 'Query failed');
    }

    return new Uint8Array(data.data);
}


export async function getPost(postId: number): Promise<GetPostOutput> {
    const inputData = new Uint8Array(4);
    new DataView(inputData.buffer).setUint32(0, postId, true);

    try {
        const result = await querySmartContract(CONTRACT_INDEX, FUNCTION_INDEX.GET_POST, inputData);

        // Post struct is 365 bytes (no postId field in struct)
        if (result.length < 365) {
            return {
                post: { postId, author: '', timestamp: 0, likes: 0, deleted: false, title: '', content: '' },
                exists: false
            };
        }

        const resultView = new DataView(result.buffer);
        let offset = 0;

        // Parse Post struct (365 bytes): author (32) + timestamp (8) + likes (4) + deleted (1) + title (64) + content (256)
        const authorBytes = result.slice(offset, offset + 32);
        offset += 32;
        const author = await new QubicHelper().getIdentity(authorBytes);

        const timestamp = Number(resultView.getBigUint64(offset, true));
        offset += 8;

        const likes = resultView.getUint32(offset, true);
        offset += 4;

        const deleted = result[offset] !== 0;
        offset += 1;

        const titleBytes = result.slice(offset, offset + 64);
        const title = new TextDecoder().decode(titleBytes).replace(/\0/g, '');
        offset += 64;

        const contentBytes = result.slice(offset, offset + 256);
        const content = new TextDecoder().decode(contentBytes).replace(/\0/g, '');
        offset += 256;

        // NOTE: The exists flag in the response is unreliable (always 0 even for valid posts)
        // Use the contract's validation logic instead: check if author is NOT zero AND timestamp is NOT zero
        const exists = author !== 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' && timestamp !== 0;

        // Parse userLiked (bit at offset 365)
        const userLiked = result.length > 365 ? result[365] !== 0 : false;

        return {
            post: { postId, author, timestamp, likes, deleted, title, content },
            exists,
            userLiked
        };
    } catch (e) {
        console.error('Error fetching post:', e);
        return {
            post: {
                postId: 0,
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

export async function getPostsByUser(input: GetPostsByUserInput): Promise<GetPostsByUserOutput> {
    try {
        let authorBytes: Uint8Array;
        try {
            authorBytes = identityToPublicKey(input.author);
        } catch (e) {
            console.error('Error converting identity:', e);
            authorBytes = new Uint8Array(32);
        }

        const inputData = new Uint8Array(32 + 4 + 4);
        const view = new DataView(inputData.buffer);

        inputData.set(authorBytes, 0);
        view.setUint32(32, input.page, true);
        view.setUint32(36, input.pageSize, true);

        const result = await querySmartContract(CONTRACT_INDEX, FUNCTION_INDEX.GET_POSTS_BY_USER, inputData);

        const resultView = new DataView(result.buffer);
        let offset = 0;

        // Calculate Post Size dynamically
        // PostWithId = Post (365 bytes) + postId (4 bytes) + PADDING (7 bytes) = 376 bytes
        // The C++ compiler adds 7 bytes of padding to align PostWithId to 8-byte boundary
        // result.length = 16 * 376 + 4 (count) + 1 (hasMore) = 6021 bytes
        const POST_SIZE = Math.floor((result.length - 5) / 16);
        console.log(`Detected POST_SIZE: ${POST_SIZE} bytes`);

        // Posts
        const posts: Post[] = [];

        // We can read 16 posts.
        for (let i = 0; i < 16; i++) {
            const postStartOffset = offset;

            // Read PostWithId: Post (365 bytes) + postId (4 bytes) = 369 bytes
            if (offset + 369 > result.length) break;

            // Parse Post struct (365 bytes)
            const pAuthorBytes = result.slice(offset, offset + 32);
            offset += 32;
            const pAuthor = await new QubicHelper().getIdentity(pAuthorBytes);

            const pTimestamp = Number(resultView.getBigUint64(offset, true));
            offset += 8;

            const pLikes = resultView.getUint32(offset, true);
            offset += 4;

            const pDeleted = result[offset] !== 0;
            offset += 1;

            const pTitleBytes = result.slice(offset, offset + 64);
            const pTitle = new TextDecoder().decode(pTitleBytes).replace(/\0/g, '');
            offset += 64;

            const pContentBytes = result.slice(offset, offset + 256);
            const pContent = new TextDecoder().decode(pContentBytes).replace(/\0/g, '');
            offset += 256;

            // Read postId (uint32) after Post struct
            const pPostId = resultView.getUint32(offset, false); // Big-endian!
            offset += 4;

            // Advance to next post based on calculated size
            // The loop condition handles the iteration, but we need to ensure offset is correct
            // If POST_SIZE > 369, we need to skip the padding
            // We've already advanced 369 bytes (365 for Post + 4 for postId)
            // So we need to advance (POST_SIZE - 369) more bytes
            if (POST_SIZE > 369) {
                offset += (POST_SIZE - 369);
            }
            const isValidTimestamp = pTimestamp > 0 && pTimestamp < 100000000; // Reasonable tick range
            const isValidAuthor = !pAuthor.startsWith('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA') &&
                !pAuthor.startsWith('BAAAAAAAAAAAAAAA'); // Filter corrupted authors

            if (isValidTimestamp && isValidAuthor) {
                posts.push({
                    postId: pPostId,
                    author: pAuthor,
                    timestamp: pTimestamp,
                    likes: pLikes,
                    deleted: pDeleted,
                    title: pTitle,
                    content: pContent,
                });
            } else {
                console.warn(`[getPostsByUser] Skipping corrupted post: ID=${pPostId}, Author=${pAuthor.substring(0, 20)}..., Timestamp=${pTimestamp}`);
            }
        }


        let count = 0;
        if (offset + 4 <= result.length) {
            count = resultView.getUint32(offset, true);
            offset += 4;
        }

        let hasMore = false;
        if (offset < result.length) {
            hasMore = result[offset] !== 0;
        }

        return { posts, count, hasMore };
    } catch (e) {
        console.error('Error fetching posts by user:', e);
        return { posts: [], count: 0, hasMore: false };
    }
}

// ---------------------------------------------------------------------------
// Contract Transaction Functions (working with direct node connection)
// ---------------------------------------------------------------------------
export async function createPost(
    input: CreatePostInput,
    publicKey: Uint8Array,
    seed?: string
): Promise<CreatePostOutput> {
    // Convert strings to byte arrays compatible with Array<sint8, N>
    const titleBytes = stringToByteArray(input.title, 64);
    const contentBytes = stringToByteArray(input.content, 256);
    const inputData = new Uint8Array([...titleBytes, ...contentBytes]);

    const tx = await buildTransaction(
        publicKey,
        CONTRACT_INDEX,
        FUNCTION_INDEX.CREATE_POST,
        inputData,
        seed
    );

    const txId = await broadcastTransactionViaNode(tx);
    return { postId: -1, returnCode: 0, txId, targetTick: tx.tick };
}

export async function editPost(
    input: EditPostInput,
    publicKey: Uint8Array,
    seed?: string
): Promise<EditPostOutput> {
    const postIdBytes = new Uint8Array(4);
    new DataView(postIdBytes.buffer).setUint32(0, input.postId, true);
    // Convert strings to byte arrays compatible with Array<sint8, N>
    const titleBytes = stringToByteArray(input.title, 64);
    const contentBytes = stringToByteArray(input.content, 256);
    const inputData = new Uint8Array([...postIdBytes, ...titleBytes, ...contentBytes]);

    const tx = await buildTransaction(
        publicKey,
        CONTRACT_INDEX,
        FUNCTION_INDEX.EDIT_POST,
        inputData,
        seed
    );

    const txId = await broadcastTransactionViaNode(tx);
    return { returnCode: 0, txId, targetTick: tx.tick };
}

export async function deletePost(
    input: DeletePostInput,
    publicKey: Uint8Array,
    seed?: string
): Promise<DeletePostOutput> {
    const inputData = new Uint8Array(4);
    new DataView(inputData.buffer).setUint32(0, input.postId, true);

    const tx = await buildTransaction(
        publicKey,
        CONTRACT_INDEX,
        FUNCTION_INDEX.DELETE_POST,
        inputData,
        seed
    );

    const txId = await broadcastTransactionViaNode(tx);
    return { returnCode: 0, txId, targetTick: tx.tick };
}

export async function likePost(
    input: LikePostInput,
    publicKey: Uint8Array,
    seed?: string
): Promise<LikePostOutput> {
    const inputData = new Uint8Array(4);
    new DataView(inputData.buffer).setUint32(0, input.postId, true);

    const tx = await buildTransaction(
        publicKey,
        CONTRACT_INDEX,
        FUNCTION_INDEX.LIKE_POST,
        inputData,
        seed
    );

    const txId = await broadcastTransactionViaNode(tx);
    return { newLikeCount: 0, returnCode: 0, txId, targetTick: tx.tick };
}

export { CONTRACT_INDEX };
