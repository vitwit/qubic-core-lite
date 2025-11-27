#!/bin/bash

# QBlog Contract Testing Script
# This script provides an interactive interface for testing the QBlog smart contract

# Load environment variables from .env file
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Warning: .env file not found. Using defaults or environment variables."
fi

# Default values
QUBIC_NODE_IP=${QUBIC_NODE_IP:-"127.0.0.1"}
QUBIC_NODE_PORT=${QUBIC_NODE_PORT:-"21841"}
QBLOG_CONTRACT_INDEX=${QBLOG_CONTRACT_INDEX:-"19"}
QUBIC_CLI_PATH=${QUBIC_CLI_PATH:-"./qubic-cli"}
DEFAULT_INVOCATION_REWARD=${DEFAULT_INVOCATION_REWARD:-"1000000"}

# Check if seed is set
check_seed() {
    if [ -z "$QUBIC_SEED" ]; then
        echo "Error: QUBIC_SEED not set. Please set it in .env file or as environment variable."
        exit 1
    fi
}

# Show configuration
show_config() {
    echo "=== Current Configuration ==="
    echo "Node IP: $QUBIC_NODE_IP"
    echo "Node Port: $QUBIC_NODE_PORT"
    echo "Contract Index: $QBLOG_CONTRACT_INDEX"
    echo "CLI Path: $QUBIC_CLI_PATH"
    echo "Invocation Reward: $DEFAULT_INVOCATION_REWARD"
    echo "Seed: ${QUBIC_SEED:0:10}..." # Show only first 10 chars
    echo "============================"
}

# Get identity
get_identity() {
    check_seed
    echo "Getting identity from seed..."
    python3 qblog_cli_helper.py identity
}

# Create post
create_post() {
    check_seed
    local title="$1"
    local content="$2"
    
    if [ -z "$title" ] || [ -z "$content" ]; then
        echo "Usage: $0 create <title> <content>"
        exit 1
    fi
    
    echo "Creating post..."
    python3 qblog_cli_helper.py create --title "$title" --content "$content"
}

# Edit post
edit_post() {
    check_seed
    local post_id="$1"
    local title="$2"
    local content="$3"
    
    if [ -z "$post_id" ] || [ -z "$title" ] || [ -z "$content" ]; then
        echo "Usage: $0 edit <post_id> <title> <content>"
        exit 1
    fi
    
    echo "Editing post $post_id..."
    python3 qblog_cli_helper.py edit --post-id "$post_id" --title "$title" --content "$content"
}

# Delete post
delete_post() {
    check_seed
    local post_id="$1"
    
    if [ -z "$post_id" ]; then
        echo "Usage: $0 delete <post_id>"
        exit 1
    fi
    
    echo "Deleting post $post_id..."
    python3 qblog_cli_helper.py delete --post-id "$post_id"
}

# Like post
like_post() {
    check_seed
    local post_id="$1"
    
    if [ -z "$post_id" ]; then
        echo "Usage: $0 like <post_id>"
        exit 1
    fi
    
    echo "Liking post $post_id..."
    python3 qblog_cli_helper.py like --post-id "$post_id"
}

# Get post
get_post() {
    local post_id="$1"
    
    if [ -z "$post_id" ]; then
        echo "Usage: $0 get <post_id>"
        exit 1
    fi
    
    echo "Getting post $post_id..."
    python3 qblog_cli_helper.py get --post-id "$post_id"
}

# Get posts by user
get_posts_by_user() {
    local author="$1"
    local page="${2:-0}"
    local page_size="${3:-10}"
    
    if [ -z "$author" ]; then
        echo "Usage: $0 getbyuser <author> [page] [page_size]"
        exit 1
    fi
    
    echo "Getting posts by user $author (page $page, size $page_size)..."
    python3 qblog_cli_helper.py getbyuser --author "$author" --page "$page" --page-size "$page_size"
}

# Run full test workflow
run_test_workflow() {
    check_seed
    echo "=== Running Full Test Workflow ==="
    
    echo -e "\n1. Getting identity..."
    get_identity
    
    echo -e "\n2. Creating test post..."
    create_post "Test Post" "This is a test post created by the automated workflow"
    
    echo -e "\n3. Waiting 2 seconds..."
    sleep 2
    
    echo -e "\n4. Getting post 0..."
    get_post 0
    
    echo -e "\n5. Liking post 0..."
    like_post 0
    
    echo -e "\n6. Editing post 0..."
    edit_post 0 "Updated Test Post" "This post has been updated"
    
    echo -e "\n=== Test Workflow Complete ==="
}

# Interactive menu
show_menu() {
    echo "=== QBlog Contract Testing Menu ==="
    echo "1. Get Identity"
    echo "2. Create Post"
    echo "3. Edit Post"
    echo "4. Delete Post"
    echo "5. Like Post"
    echo "6. Get Post"
    echo "7. Get Posts by User"
    echo "8. Run Full Test Workflow"
    echo "9. Show Configuration"
    echo "0. Exit"
    echo "===================================="
}

interactive_mode() {
    while true; do
        show_menu
        read -p "Select an option: " choice
        
        case $choice in
            1)
                get_identity
                ;;
            2)
                read -p "Enter title: " title
                read -p "Enter content: " content
                create_post "$title" "$content"
                ;;
            3)
                read -p "Enter post ID: " post_id
                read -p "Enter new title: " title
                read -p "Enter new content: " content
                edit_post "$post_id" "$title" "$content"
                ;;
            4)
                read -p "Enter post ID: " post_id
                delete_post "$post_id"
                ;;
            5)
                read -p "Enter post ID: " post_id
                like_post "$post_id"
                ;;
            6)
                read -p "Enter post ID: " post_id
                get_post "$post_id"
                ;;
            7)
                read -p "Enter author identity: " author
                read -p "Enter page (default 0): " page
                read -p "Enter page size (default 10): " page_size
                get_posts_by_user "$author" "${page:-0}" "${page_size:-10}"
                ;;
            8)
                run_test_workflow
                ;;
            9)
                show_config
                ;;
            0)
                echo "Exiting..."
                exit 0
                ;;
            *)
                echo "Invalid option. Please try again."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Main script logic
if [ $# -eq 0 ]; then
    # No arguments - run interactive mode
    interactive_mode
else
    # Command line mode
    command="$1"
    shift
    
    case "$command" in
        identity)
            get_identity
            ;;
        create)
            create_post "$@"
            ;;
        edit)
            edit_post "$@"
            ;;
        delete)
            delete_post "$@"
            ;;
        like)
            like_post "$@"
            ;;
        get)
            get_post "$@"
            ;;
        getbyuser)
            get_posts_by_user "$@"
            ;;
        test)
            run_test_workflow
            ;;
        config)
            show_config
            ;;
        *)
            echo "Unknown command: $command"
            echo "Available commands: identity, create, edit, delete, like, get, getbyuser, test, config"
            exit 1
            ;;
    esac
fi
