#!/usr/bin/env python3
"""
QBlog Contract CLI Helper Script
Converts text to qubic-cli format strings and generates ready-to-use commands
"""

import sys
import argparse
import os
import subprocess
import shlex
from pathlib import Path

def load_env():
    """Load environment variables from .env file"""
    env_file = Path(__file__).parent / '.env'
    env_vars = {}
    
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    
    # Override with actual environment variables
    for key in ['QUBIC_NODE_IP', 'QUBIC_NODE_PORT', 'QBLOG_CONTRACT_INDEX', 
                'QUBIC_SEED', 'DEFAULT_INVOCATION_REWARD', 'QUBIC_CLI_PATH']:
        if key in os.environ:
            env_vars[key] = os.environ[key]
    
    return env_vars

def text_to_byte_array(text, max_length):
    """Convert text string to qubic-cli sint8 array format"""
    # Convert to bytes and pad with zeros
    text_bytes = text.encode('utf-8')[:max_length]
    
    # Create byte array with padding
    byte_list = []
    for i in range(max_length):
        if i < len(text_bytes):
            # Convert to signed int8 (-128 to 127)
            # Values 0-127 stay the same, 128-255 become negative
            val = text_bytes[i]
            if val > 127:
                val = val - 256
            byte_list.append(f"{val}sint8")
        else:
            byte_list.append("0sint8")
    
    return f"[{max_length};{','.join(byte_list)}]"

def create_post_command(cli_path, node_ip, node_port, seed, title, content, contract_index, reward=1000000):
    """Generate CreatePost command"""
    title_bytes = text_to_byte_array(title, 64)
    content_bytes = text_to_byte_array(content, 256)
    
    format_string = f'{{ {title_bytes}, {content_bytes} }}'
    
    cmd = f"""{cli_path} -nodeip {node_ip} -nodeport {node_port} \\
  -seed {seed} \\
  -enabletestcontracts \\
  -invokecontractprocedure {contract_index} 1 {reward} \\
  "{format_string}"
"""
    return cmd

def edit_post_command(cli_path, node_ip, node_port, seed, post_id, title, content, contract_index, reward=1000000):
    """Generate EditPost command"""
    title_bytes = text_to_byte_array(title, 64)
    content_bytes = text_to_byte_array(content, 256)
    
    format_string = f'{{ {post_id}uint32, {title_bytes}, {content_bytes} }}'
    
    cmd = f"""{cli_path} -nodeip {node_ip} -nodeport {node_port} \\
  -seed {seed} \\
  -enabletestcontracts \\
  -invokecontractprocedure {contract_index} 2 {reward} \\
  "{format_string}"
"""
    return cmd

def delete_post_command(cli_path, node_ip, node_port, seed, post_id, contract_index, reward=1000000):
    """Generate DeletePost command"""
    format_string = f'{{ {post_id}uint32 }}'
    
    cmd = f"""{cli_path} -nodeip {node_ip} -nodeport {node_port} \\
  -seed {seed} \\
  -enabletestcontracts \\
  -invokecontractprocedure {contract_index} 3 {reward} \\
  "{format_string}"
"""
    return cmd

def like_post_command(cli_path, node_ip, node_port, seed, post_id, contract_index, reward=1000000):
    """Generate LikePost command"""
    format_string = f'{{ {post_id}uint32 }}'
    
    cmd = f"""{cli_path} -nodeip {node_ip} -nodeport {node_port} \\
  -seed {seed} \\
  -enabletestcontracts \\
  -invokecontractprocedure {contract_index} 4 {reward} \\
  "{format_string}"
"""
    return cmd

def get_post_command(cli_path, node_ip, node_port, post_id, contract_index):
    """Generate GetPost command"""
    input_format = f'{{ {post_id}uint32 }}'
    output_format = '{ { id, uint64, uint32, uint8, [64;sint8], [256;sint8] } }'
    
    cmd = f"""{cli_path} -enabletestcontracts -nodeip {node_ip} -nodeport {node_port} \\
  -callcontractfunction {contract_index} 5 \\
  "{input_format}" \\
  "{output_format}"
"""
    return cmd

def get_posts_by_user_command(cli_path, node_ip, node_port, author_id, page, page_size, contract_index):
    """Generate GetPostsByUser command"""
    input_format = f'{{ {author_id}id, {page}uint32, {page_size}uint32 }}'
    output_format = '{ [10;{ id, uint64, uint32, uint8, [64;sint8], [256;sint8] }], uint32, uint8 }'
    
    cmd = f"""{cli_path} -enabletestcontracts -nodeip {node_ip} -nodeport {node_port} \\
  -callcontractfunction {contract_index} 6 \\
  "{input_format}" \\
  "{output_format}"
"""
    return cmd

def execute_command(cmd_string):
    """Execute a command and return output"""
    # Remove line continuations and extra whitespace
    cmd_string = cmd_string.replace('\\\n', ' ').strip()
    
    print(f"\n{'='*60}")
    print("Executing command:")
    print(cmd_string)
    print(f"{'='*60}\n")
    
    try:
        # Use shell=True to handle the complex command string
        result = subprocess.run(
            cmd_string,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        print("Output:")
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print("Errors:", result.stderr)
        
        print(f"\n{'='*60}")
        print(f"Exit code: {result.returncode}")
        print(f"{'='*60}\n")
        
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        print("Error: Command timed out after 30 seconds")
        return False
    except Exception as e:
        print(f"Error executing command: {e}")
        return False

def main():
    # Load environment variables
    env = load_env()
    
    parser = argparse.ArgumentParser(
        description='QBlog Contract CLI Helper - Generate qubic-cli commands',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Create a post
  %(prog)s create --title "Hello" --content "World"

  # Edit a post
  %(prog)s edit --post-id 0 --title "Updated" --content "New content"

  # Like a post
  %(prog)s like --post-id 0

  # Get a post
  %(prog)s get --post-id 0

  # Get posts by user
  %(prog)s getbyuser --author YOUR_IDENTITY --page 0 --page-size 10

  # Delete a post
  %(prog)s delete --post-id 0

  # Convert text to byte array
  %(prog)s convert --text "Hello World" --max-length 64

Environment variables (or set in .env file):
  QUBIC_NODE_IP, QUBIC_NODE_PORT, QBLOG_CONTRACT_INDEX, QUBIC_SEED
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # Identity command
    identity_parser = subparsers.add_parser('identity', help='Get identity from seed')
    identity_parser.add_argument('--seed', default=env.get('QUBIC_SEED'), help='Your 55-character lowercase seed')
    
    # Common arguments
    def add_common_args(p, include_seed=False):
        p.add_argument('--node-ip', default=env.get('QUBIC_NODE_IP'), help='Qubic node IP address')
        p.add_argument('--node-port', default=env.get('QUBIC_NODE_PORT', '21841'), type=int, help='Qubic node port')
        p.add_argument('--contract-index', default=env.get('QBLOG_CONTRACT_INDEX'), type=int, help='QBlog contract index')
        if include_seed:
            p.add_argument('--seed', default=env.get('QUBIC_SEED'), help='Your 55-character lowercase seed')
            p.add_argument('--reward', default=env.get('DEFAULT_INVOCATION_REWARD', '1000000'), type=int, help='Invocation reward')
    
    # CreatePost
    create_parser = subparsers.add_parser('create', help='Create a new post')
    add_common_args(create_parser, include_seed=True)
    create_parser.add_argument('--title', required=True, help='Post title (max 64 chars)')
    create_parser.add_argument('--content', required=True, help='Post content (max 256 chars)')
    
    # EditPost
    edit_parser = subparsers.add_parser('edit', help='Edit an existing post')
    add_common_args(edit_parser, include_seed=True)
    edit_parser.add_argument('--post-id', required=True, type=int, help='Post ID to edit')
    edit_parser.add_argument('--title', required=True, help='New title (max 64 chars)')
    edit_parser.add_argument('--content', required=True, help='New content (max 256 chars)')
    
    # DeletePost
    delete_parser = subparsers.add_parser('delete', help='Delete a post')
    add_common_args(delete_parser, include_seed=True)
    delete_parser.add_argument('--post-id', required=True, type=int, help='Post ID to delete')
    
    # LikePost
    like_parser = subparsers.add_parser('like', help='Like a post')
    add_common_args(like_parser, include_seed=True)
    like_parser.add_argument('--post-id', required=True, type=int, help='Post ID to like')
    
    # GetPost
    get_parser = subparsers.add_parser('get', help='Get a post by ID')
    add_common_args(get_parser, include_seed=False)
    get_parser.add_argument('--post-id', required=True, type=int, help='Post ID to retrieve')
    
    # GetPostsByUser
    getbyuser_parser = subparsers.add_parser('getbyuser', help='Get posts by user')
    add_common_args(getbyuser_parser, include_seed=False)
    getbyuser_parser.add_argument('--author', required=True, help='Author identity')
    getbyuser_parser.add_argument('--page', default=0, type=int, help='Page number (default: 0)')
    getbyuser_parser.add_argument('--page-size', default=10, type=int, help='Page size (default: 10)')
    
    # Convert text
    convert_parser = subparsers.add_parser('convert', help='Convert text to byte array format')
    convert_parser.add_argument('--text', required=True, help='Text to convert')
    convert_parser.add_argument('--max-length', required=True, type=int, help='Maximum length (64 for title, 256 for content)')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Execute command
    cli_path = env.get('QUBIC_CLI_PATH', './qubic-cli')
    
    if args.command == 'identity':
        if not args.seed:
            print("Error: QUBIC_SEED not set. Please set it in .env file or use --seed argument.")
            sys.exit(1)
        cmd = f"{cli_path} -seed {args.seed} -getidentity"
        execute_command(cmd)
    
    elif args.command == 'create':
        cmd = create_post_command(cli_path, args.node_ip, args.node_port, args.seed, 
                                  args.title, args.content, args.contract_index, args.reward)
        execute_command(cmd)
    
    elif args.command == 'edit':
        cmd = edit_post_command(cli_path, args.node_ip, args.node_port, args.seed, args.post_id,
                               args.title, args.content, args.contract_index, args.reward)
        execute_command(cmd)
    
    elif args.command == 'delete':
        cmd = delete_post_command(cli_path, args.node_ip, args.node_port, args.seed, 
                                 args.post_id, args.contract_index, args.reward)
        execute_command(cmd)
    
    elif args.command == 'like':
        cmd = like_post_command(cli_path, args.node_ip, args.node_port, args.seed,
                               args.post_id, args.contract_index, args.reward)
        execute_command(cmd)
    
    elif args.command == 'get':
        cmd = get_post_command(cli_path, args.node_ip, args.node_port, 
                              args.post_id, args.contract_index)
        execute_command(cmd)
    
    elif args.command == 'getbyuser':
        cmd = get_posts_by_user_command(cli_path, args.node_ip, args.node_port, args.author,
                                       args.page, args.page_size, args.contract_index)
        execute_command(cmd)
    
    elif args.command == 'convert':
        result = text_to_byte_array(args.text, args.max_length)
        print(f"Byte array format:\n{result}")

if __name__ == '__main__':
    main()
