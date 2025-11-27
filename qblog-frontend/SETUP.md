# QBlog Frontend - Direct Node Connection Setup

## Overview

The QBlog frontend now connects directly to Qubic nodes using TCP sockets via Next.js API routes. This eliminates the need for custom RPC servers.

## Architecture

```
Browser → HTTP → Next.js API Routes → TCP Sockets → Qubic Node
```

### Why API Routes?

Browsers cannot make direct TCP connections due to security restrictions. Next.js API routes run server-side in Node.js, allowing us to use the `QubicConnector` TCP socket implementation.

## Setup

### 1. Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
# Qubic Node Connection (server-side only)
QUBIC_NODE_IP=127.0.0.1
QUBIC_NODE_PORT=21841
QBLOG_CONTRACT_INDEX=19
```

**Important**: These are NOT prefixed with `NEXT_PUBLIC_` because they're server-side only.

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### GET /api/tick

Returns current tick from the Qubic node.

**Response:**
```json
{
  "success": true,
  "tick": 12345678,
  "epoch": 123,
  "timestamp": 1234567890123
}
```

### POST /api/broadcast

Broadcasts a transaction to the Qubic node.

**Request:**
```json
{
  "txData": [/* Uint8Array as number array */]
}
```

**Response:**
```json
{
  "success": true,
  "txId": "abc123...",
  "timestamp": 1234567890123
}
```

## Code Structure

### Server-Side (Node.js)

- **`src/lib/server/nodeConnector.ts`** - QubicConnector singleton using TCP sockets
- **`src/app/api/tick/route.ts`** - API route for getting current tick
- **`src/app/api/broadcast/route.ts`** - API route for broadcasting transactions

### Client-Side (Browser)

- **`src/lib/qubic/transaction.ts`** - Transaction building and API calls
- **`src/lib/qubic/qblog-api.ts`** - QBlog contract interaction functions
- **`src/lib/qubic/wallet.ts`** - Wallet and key management

## How It Works

### Getting Current Tick

1. Frontend calls `getCurrentTick()` in `transaction.ts`
2. Makes HTTP GET request to `/api/tick`
3. API route uses `serverNodeConnector.getCurrentTick()`
4. Server-side connector queries Qubic node via TCP
5. Returns tick data to frontend

### Broadcasting Transactions

1. Frontend builds transaction using `buildTransaction()`
2. Signs with MetaMask Snap or private key
3. Calls `broadcastTransactionViaNode()`
4. Makes HTTP POST to `/api/broadcast` with transaction data
5. API route uses `serverNodeConnector.broadcastTransaction()`
6. Server-side connector sends to Qubic node via TCP
7. Returns transaction ID to frontend

## Troubleshooting

### Connection Errors

If you see "Connection timeout" errors:
- Check that `QUBIC_NODE_IP` and `QUBIC_NODE_PORT` are correct
- Ensure the Qubic node is running and accessible
- Check firewall settings

### API Route Errors

Check the Next.js server logs for detailed error messages:
```bash
npm run dev
```

### Frontend Not Getting Tick Data

1. Test the API route directly: `curl http://localhost:3000/api/tick`
2. Check browser console for errors
3. Verify environment variables are set correctly

## Development

### Testing API Routes

```bash
# Test getCurrentTick
curl http://localhost:3000/api/tick

# Test broadcast (with sample data)
curl -X POST http://localhost:3000/api/broadcast \
  -H "Content-Type: application/json" \
  -d '{"txData": [/* transaction bytes */]}'
```

### Modifying Node Connection

Edit `src/lib/server/nodeConnector.ts` to customize:
- Connection timeout
- Error handling
- Retry logic
- Logging

## Production Deployment

When deploying to production:

1. Set environment variables in your hosting platform
2. Ensure the Qubic node is accessible from your server
3. Consider adding rate limiting to API routes
4. Monitor API route performance and errors

## Migration from RPC

This implementation replaces any previous RPC-based approach. The key changes:

- ✅ Direct TCP connection to Qubic node (via server-side)
- ✅ No custom RPC server needed
- ✅ Standard Next.js API routes
- ✅ Works in all browsers
- ✅ Easy to deploy

## References

- [qubic-cli](https://github.com/qubic/qubic-cli) - Reference implementation
- [qubic-ts-library](https://github.com/qubic-lib/qubic-ts-library) - TypeScript library
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction) - Documentation
