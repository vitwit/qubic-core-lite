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

        // A Post struct is now 369 bytes (4 for id + 365 for other fields)
        if (result.length < 369) {
            return {
                post: { id: 0, author: '', timestamp: 0, likes: 0, deleted: false, title: '', content: '' },
                exists: false
            };
        }

        const resultView = new DataView(result.buffer);
        let offset = 0;

        // Parse Post struct: id (4) + author (32) + timestamp (8) + likes (4) + deleted (1) + title (64) + content (256) = 369 bytes
        const id = resultView.getUint32(offset, true);
        offset += 4;

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
        // Use the contract's validation logic instead: check if author is zero AND timestamp is zero
        const exists = author !== 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' || timestamp !== 0;

        // Parse userLiked (bit at offset 369)
        const userLiked = result.length > 369 ? result[369] !== 0 : false;

        return {
            post: { id, author, timestamp, likes, deleted, title, content },
            exists,
            userLiked
        };
    } catch (e) {
        console.error('Error fetching post:', e);
        return {
            post: {
                id: 0,
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

        // Calculate Post Size dynamically to handle padding
        // result.length = 16 * POST_SIZE + 4 (count) + 1 (hasMore)
        // We assume the response is exactly this size.
        // If not, we fallback to 369 (new Post struct size)
        const POST_SIZE = Math.floor((result.length - 5) / 16);
        console.log(`Detected POST_SIZE: ${POST_SIZE} bytes`);

        // Posts
        const posts: Post[] = [];

        // We can read 16 posts.
        for (let i = 0; i < 16; i++) {
            const postStartOffset = offset;

            // Read Post struct: id (4) + author (32) + timestamp (8) + likes (4) + deleted (1) + title (64) + content (256) = 369 bytes
            if (offset + 369 > result.length) break;

            const pId = resultView.getUint32(offset, true);
            offset += 4;

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

            // Advance to next post based on calculated size
            offset = postStartOffset + POST_SIZE;

            console.log(`[getPostsByUser] Post ${i}: ID=${pId}, Author=${pAuthor}, Timestamp=${pTimestamp}`);

            // Only add if not empty (check timestamp or author)
            // Check for known empty identity pattern or zero timestamp
            if (pTimestamp !== 0 && !pAuthor.startsWith('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA')) {
                posts.push({
                    id: pId,
                    author: pAuthor,
                    timestamp: pTimestamp,
                    likes: pLikes,
                    deleted: pDeleted,
                    title: pTitle,
                    content: pContent,
                });
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
