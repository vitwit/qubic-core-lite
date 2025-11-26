// QBlog Smart Contract API (direct node connection)

import { buildTransaction, broadcastTransactionViaNode } from './transaction';
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

// Configuration
const CONTRACT_INDEX = parseInt(process.env.NEXT_PUBLIC_QBLOG_CONTRACT_INDEX || '20');

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

// ---------------------------------------------------------------------------
// Contract Query Stubs (return empty data – real implementation requires a query packet)
// ---------------------------------------------------------------------------
/** Placeholder – real contract queries need a proper request packet via QubicConnector */
async function querySmartContractStub(_: number, __: number, ___: string): Promise<string> {
    // For now we simply return an empty base64 string.
    return '';
}

/** Get a single post – currently returns empty data */
export async function getPost(postId: number): Promise<GetPostOutput> {
    // TODO: implement proper contract query using QubicConnector.
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

/** Get posts by user – currently returns empty list */
export async function getPostsByUser(input: GetPostsByUserInput): Promise<GetPostsByUserOutput> {
    return { posts: [], count: 0, hasMore: false };
}

// ---------------------------------------------------------------------------
// Contract Transaction Functions (working with direct node connection)
// ---------------------------------------------------------------------------
export async function createPost(
    input: CreatePostInput,
    publicKey: Uint8Array,
    privateKey?: Uint8Array
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
        privateKey
    );

    await broadcastTransactionViaNode(tx);
    return { postId: -1, returnCode: 0 };
}

export async function editPost(
    input: EditPostInput,
    publicKey: Uint8Array,
    privateKey?: Uint8Array
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
        privateKey
    );

    await broadcastTransactionViaNode(tx);
    return { returnCode: 0 };
}

export async function deletePost(
    input: DeletePostInput,
    publicKey: Uint8Array,
    privateKey?: Uint8Array
): Promise<DeletePostOutput> {
    const inputData = new Uint8Array(4);
    new DataView(inputData.buffer).setUint32(0, input.postId, true);

    const tx = await buildTransaction(
        publicKey,
        CONTRACT_INDEX,
        FUNCTION_INDEX.DELETE_POST,
        inputData,
        privateKey
    );

    await broadcastTransactionViaNode(tx);
    return { returnCode: 0 };
}

export async function likePost(
    input: LikePostInput,
    publicKey: Uint8Array,
    privateKey?: Uint8Array
): Promise<LikePostOutput> {
    const inputData = new Uint8Array(4);
    new DataView(inputData.buffer).setUint32(0, input.postId, true);

    const tx = await buildTransaction(
        publicKey,
        CONTRACT_INDEX,
        FUNCTION_INDEX.LIKE_POST,
        inputData,
        privateKey
    );

    await broadcastTransactionViaNode(tx);
    return { newLikeCount: 0, returnCode: 0 };
}

export { CONTRACT_INDEX };
