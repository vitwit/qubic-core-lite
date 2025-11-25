# QBlog Frontend

A beautiful, decentralized blogging platform built on Qubic blockchain with Next.js 14 and Tailwind CSS.

![QBlog](https://img.shields.io/badge/Qubic-Blockchain-purple)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-cyan)

## Features

✨ **Modern UI/UX**
- Glassmorphism design with beautiful gradients
- Smooth animations and micro-interactions
- Fully responsive (mobile, tablet, desktop)
- Dark theme optimized

🔗 **Blockchain Integration**
- Full QBlog smart contract integration
- Create, edit, delete, and like posts
- Real-time blockchain data fetching
- Wallet connection with seed phrase

📝 **Blog Features**
- Create posts with title (64 chars) and content (256 chars)
- Edit your own posts
- Soft delete functionality
- Like posts
- User profiles with post history
- Pagination support

## Prerequisites

- Node.js 18+ and npm/yarn
- A running Qubic testnet node (see [Qubic Core Lite](../README.md))
- A Qubic wallet seed phrase (55 lowercase letters)

## Quick Start

### 1. Install Dependencies

```bash
cd qblog-frontend
npm install
# or
yarn install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your settings:

```env
NEXT_PUBLIC_QUBIC_RPC_URL=http://127.0.0.1:21841
NEXT_PUBLIC_QBLOG_CONTRACT_INDEX=20
NEXT_PUBLIC_NETWORK=testnet
```

### 3. Run Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Connect Your Wallet

1. Click "Connect Wallet" in the header
2. Enter your 55-character seed phrase
3. Start creating posts!

## Project Structure

```
qblog-frontend/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── page.tsx           # Home page
│   │   ├── create/            # Create post page
│   │   ├── post/[id]/         # Post detail page
│   │   └── profile/[address]/ # User profile page
│   ├── components/            # React components
│   │   ├── Header.tsx         # Navigation header
│   │   ├── PostCard.tsx       # Post card component
│   │   ├── WalletConnect.tsx  # Wallet modal
│   │   └── LoadingSpinner.tsx # Loading states
│   ├── lib/qubic/            # Blockchain integration
│   │   ├── connector.ts       # RPC connector
│   │   ├── wallet.ts          # Wallet utilities
│   │   ├── transaction.ts     # Transaction building
│   │   └── qblog-api.ts       # Smart contract API
│   ├── contexts/             # React contexts
│   │   └── WalletContext.tsx # Wallet state management
│   ├── types/                # TypeScript types
│   │   └── qblog.ts          # Contract types
│   └── utils/                # Utility functions
│       └── format.ts         # Formatting helpers
├── public/                   # Static assets
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

## Smart Contract Functions

The frontend integrates with all QBlog contract functions:

### Procedures (Write Operations)
- **CreatePost** - Create a new blog post
- **EditPost** - Edit your existing post
- **DeletePost** - Soft delete a post
- **LikePost** - Like any post

### Functions (Read Operations)
- **GetPost** - Fetch a single post by ID
- **GetPostsByUser** - Fetch all posts by a user with pagination

## Development

### Building for Production

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

## Configuration

### Tailwind CSS

The project uses a custom Tailwind configuration with:
- Custom color palette (purple/blue gradients)
- Glassmorphism utilities
- Custom animations
- Responsive breakpoints

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_QUBIC_RPC_URL` | Qubic node RPC endpoint | `http://127.0.0.1:21841` |
| `NEXT_PUBLIC_QBLOG_CONTRACT_INDEX` | QBlog contract index | `20` |
| `NEXT_PUBLIC_NETWORK` | Network type | `testnet` |

## Security Notes

⚠️ **Important Security Considerations:**

1. **Seed Storage**: This demo stores wallet seeds in session storage for convenience. Production apps should use:
   - MetaMask Snap integration
   - WalletConnect
   - Hardware wallet support
   - Secure enclave storage

2. **Never share your seed phrase** with anyone
3. **Use testnet** for development and testing
4. **Audit smart contracts** before mainnet deployment

## Troubleshooting

### Common Issues

**"Failed to connect to RPC"**
- Ensure your Qubic node is running
- Check the RPC URL in `.env.local`
- Verify the node is accessible

**"Invalid seed phrase"**
- Seed must be exactly 55 lowercase letters (a-z)
- No spaces or special characters
- Check for typos

**"Transaction failed"**
- Ensure you have sufficient balance
- Check contract index is correct
- Verify node is in MAIN mode (press F12)

## Resources

- [Qubic Documentation](https://docs.qubic.org)
- [Qubic TypeScript Library](https://github.com/qubic/ts-library)
- [QBlog Contract Source](../src/contracts/QBlog.h)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- [Qubic Discord](https://discord.gg/qubic)
- [GitHub Issues](https://github.com/vitwit/qubic-core-lite/issues)

---

Built with ❤️ on Qubic Blockchain
