# QBlog Contract Testing Guide

This guide provides comprehensive instructions for testing the QBlog smart contract using qubic-cli.

## 📋 Prerequisites

1. **Build qubic-cli:**
   ```bash
   git clone https://github.com/qubic/qubic-cli.git
   cd qubic-cli
   mkdir build && cd build
   cmake ../
   cmake --build .
   ```

2. **Python 3** installed for the helper script

## 🚀 Quick Start

### 1. Configure Environment

Copy the example environment file and edit it with your settings:

```bash
cd tools/qblog-testing
cp .env.example .env
nano .env  # or use your preferred editor
```

Update the following values in `.env`:
```bash
QUBIC_NODE_IP=127.0.0.1              # Your Qubic node IP
QUBIC_NODE_PORT=21841                # Node port
QBLOG_CONTRACT_INDEX=19              # QBlog contract index (from contract_def.h)
QUBIC_SEED=your_55_char_seed_here    # Your 55-character seed
QUBIC_CLI_PATH=./qubic-cli           # Path to qubic-cli binary
DEFAULT_INVOCATION_REWARD=1000000    # Default transaction reward
```

**⚠️ IMPORTANT:** Never commit the `.env` file with real credentials! It's already in `.gitignore`.

### 2. Run Interactive Mode

```bash
./qblog_test_commands.sh
```

This will launch an interactive menu where you can:
- Get your identity
- Create, edit, delete posts
- Like posts
- Query posts
- Run a full test workflow
- View current configuration

### 3. Command Line Usage

```bash
# Get your identity
./qblog_test_commands.sh identity

# Create a post
./qblog_test_commands.sh create "My Title" "My Content"

# Get a post
./qblog_test_commands.sh get 0

# Like a post
./qblog_test_commands.sh like 0

# Edit a post
./qblog_test_commands.sh edit 0 "Updated Title" "Updated Content"

# Delete a post
./qblog_test_commands.sh delete 0

# Get posts by user
./qblog_test_commands.sh getbyuser YOUR_IDENTITY 0

# Show configuration
./qblog_test_commands.sh config

# Run full test workflow
./qblog_test_commands.sh test
```

### 4. Using Python Helper Directly

```bash
# Create a post (uses .env configuration)
python3 qblog_cli_helper.py create \
  --title "Hello Qubic" \
  --content "My first blog post"

# Override environment variables
python3 qblog_cli_helper.py create \
  --node-ip 46.17.96.249 \
  --seed YOUR_SEED \
  --contract-index 20 \
  --title "Hello Qubic" \
  --content "My first blog post"

# Get a post
python3 qblog_cli_helper.py get --post-id 0

# Convert text to byte array
python3 qblog_cli_helper.py convert \
  --text "Hello World" \
  --max-length 64
```

## 📝 Available Commands

### 1. CreatePost
Creates a new blog post.

**Parameters:**
- `title`: Max 64 characters
- `content`: Max 256 characters

**Example:**
```bash
./qblog_test_commands.sh create "My First Post" "This is my first blog post on Qubic!"
```

### 2. EditPost
Edits an existing post (only by author).

**Parameters:**
- `post-id`: ID of the post to edit
- `title`: New title (max 64 chars)
- `content`: New content (max 256 chars)

**Example:**
```bash
./qblog_test_commands.sh edit 0 "Updated Title" "Updated content"
```

### 3. DeletePost
Soft-deletes a post (only by author).

**Parameters:**
- `post-id`: ID of the post to delete

**Example:**
```bash
./qblog_test_commands.sh delete 0
```

### 4. LikePost
Increments the like count on a post.

**Parameters:**
- `post-id`: ID of the post to like

**Example:**
```bash
./qblog_test_commands.sh like 0
```

### 5. GetPost
Retrieves a single post by ID.

**Parameters:**
- `post-id`: ID of the post to retrieve

**Example:**
```bash
./qblog_test_commands.sh get 0
```

### 6. GetPostsByUser
Retrieves posts by a specific author with pagination.

**Parameters:**
- `author`: Author's identity
- `page`: Page number (default: 0)
- `page-size`: Posts per page (default: 10)

**Example:**
```bash
./qblog_test_commands.sh getbyuser BZBQFLLBNCXEMGLOBHUVFTLUPLVCPQUASSILFABOFFBCADQSSUPNWLZBQEXK 0
```

## 🔧 Environment Variables

All configuration is managed through environment variables that can be set in the `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `QUBIC_NODE_IP` | Qubic node IP address | `127.0.0.1` |
| `QUBIC_NODE_PORT` | Qubic node port | `21841` |
| `QBLOG_CONTRACT_INDEX` | QBlog contract index | `20` |
| `QUBIC_SEED` | Your 55-character seed | (required) |
| `QUBIC_CLI_PATH` | Path to qubic-cli binary | `./qubic-cli` |
| `DEFAULT_INVOCATION_REWARD` | Default transaction reward | `1000000` |

You can also override these by setting environment variables:

```bash
export QUBIC_NODE_IP=46.17.96.249
./qblog_test_commands.sh create "Title" "Content"
```

## 📊 Data Format Reference

### Post Structure
```cpp
struct Post {
    id author;          // 32 bytes - Author's public key
    uint64 timestamp;   // 8 bytes - Creation timestamp
    uint32 likes;       // 4 bytes - Like count
    uint8 deleted;      // 1 byte - Deletion flag
    char title[64];     // 64 bytes - Post title
    char content[256];  // 256 bytes - Post content
}
```

### Format Strings

**CreatePost Input:**
```
{ [64;uint8], [256;uint8] }
```

**EditPost Input:**
```
{ uint32, [64;uint8], [256;uint8] }
```

**GetPost Output:**
```
{ { id, uint64, uint32, uint8, [64;uint8], [256;uint8] } }
```

**GetPostsByUser Output:**
```
{ [10;{ id, uint64, uint32, uint8, [64;uint8], [256;uint8] }], uint32, uint8 }
```

## 🧪 Testing Workflow

1. **Configure environment:**
   ```bash
   cp .env.example .env
   nano .env
   ```

2. **Get your identity:**
   ```bash
   ./qblog_test_commands.sh identity
   ```

3. **Create your first post:**
   ```bash
   ./qblog_test_commands.sh create "Hello Qubic" "My first post!"
   ```

4. **Wait for transaction to process** (check with node)

5. **Retrieve the post:**
   ```bash
   ./qblog_test_commands.sh get 0
   ```

6. **Like the post:**
   ```bash
   ./qblog_test_commands.sh like 0
   ```

7. **Edit the post:**
   ```bash
   ./qblog_test_commands.sh edit 0 "Updated Title" "Updated content"
   ```

8. **Get all your posts:**
   ```bash
   ./qblog_test_commands.sh getbyuser YOUR_IDENTITY 0
   ```

9. **Delete the post:**
   ```bash
   ./qblog_test_commands.sh delete 0
   ```

## 🐛 Troubleshooting

### Common Issues

1. **".env file not found"**
   - Copy `.env.example` to `.env` and configure it
   - Make sure you're in the `qblog-testing` directory

2. **"QUBIC_SEED not set"**
   - Edit `.env` file and set your 55-character seed
   - Ensure the seed doesn't have quotes around it

3. **"Invalid format string"**
   - Ensure text doesn't exceed max length (64 for title, 256 for content)
   - Check that special characters are properly escaped

4. **"Transaction failed"**
   - Verify you have sufficient balance for the invocation reward
   - Check that the contract index is correct
   - Ensure the node IP and port are accessible

5. **"Authorization failed" (Edit/Delete)**
   - Only the post author can edit or delete posts
   - Verify you're using the correct seed

## 📁 File Structure

```
qblog-testing/
├── .env.example          # Environment configuration template
├── .env                  # Your configuration (git-ignored)
├── qblog_cli_helper.py   # Python command generator
├── qblog_test_commands.sh # Bash testing script
└── README.md             # This file
```

## 🔒 Security Notes

- **Never commit `.env` file** with real credentials
- The `.env` file is already in `.gitignore`
- Use `.env.example` as a template for sharing
- Keep your seed secure and never share it

## 📚 Additional Resources

- [Qubic CLI Repository](https://github.com/qubic/qubic-cli)
- [Qubic Documentation](https://qubic.org)
- QBlog Contract Source: `../src/contracts/QBlog.h`

## 💡 Tips

- Always wait a few seconds between transactions for processing
- Use the test workflow to verify all functionality
- Keep track of post IDs returned by CreatePost
- Remember that DeletePost is a soft delete (posts remain but are marked deleted)
- Post IDs are assigned sequentially starting from 0
- Use `./qblog_test_commands.sh config` to verify your configuration
