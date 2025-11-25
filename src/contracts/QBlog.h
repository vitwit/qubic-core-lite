#pragma once

using namespace QPI;

struct Post
{
    id author;
    uint64 timestamp;
    uint32 likes;
    bit deleted;
    char title[64];
    char content[256];
};

struct QBLOG2
{
};

struct QBLOG : public ContractBase
{
    // State variables
    // Using Collection to index posts by author (PoV)
    Collection<Post, 1024> posts;

    // Create Post
    struct CreatePost_input
    {
        char title[64];
        char content[256];
    };
    struct CreatePost_output
    {
        uint32 postId;
    };

    PUBLIC_PROCEDURE(CreatePost)
    {
        if (state.posts.population() >= state.posts.capacity())
        {
            // Contract full
            output.postId = -1;
            return;
        }

        Post newPost;
        newPost.author = qpi.invocator();
        newPost.timestamp = qpi.tick();
        newPost.likes = 0;
        newPost.deleted = false;
        
        for (int i = 0; i < 64; ++i) newPost.title[i] = input.title[i];
        for (int i = 0; i < 256; ++i) newPost.content[i] = input.content[i];

        newPost.title[63] = 0;
        newPost.content[255] = 0;

        // Add to collection. 
        // PoV = author (allows querying by author)
        // Priority = timestamp (allows sorting by time)
        sint64 index = state.posts.add(newPost.author, newPost, newPost.timestamp);
        
        if (index == NULL_INDEX)
        {
             output.postId = -1;
        }
        else
        {
             output.postId = (uint32)index;
        }
    }

    // Edit Post
    struct EditPost_input
    {
        uint32 postId;
        char title[64];
        char content[256];
    };
    struct EditPost_output
    {
        bit success;
    };

    PUBLIC_PROCEDURE(EditPost)
    {
        sint64 index = (sint64)input.postId;
        // Basic bounds check
        if (index < 0 || index >= state.posts.capacity())
        {
             output.success = false;
             return;
        }
        
        Post post = state.posts.element(index);

        // Check authorization
        if (post.author != qpi.invocator())
        {
            output.success = false;
            return;
        }

        if (post.deleted)
        {
            output.success = false;
            return;
        }

        // Update content
        for (int i = 0; i < 64; ++i) post.title[i] = input.title[i];
        for (int i = 0; i < 256; ++i) post.content[i] = input.content[i];
        
        post.title[63] = 0;
        post.content[255] = 0;

        state.posts.replace(index, post);
        output.success = true;
    }

    // Delete Post
    struct DeletePost_input
    {
        uint32 postId;
    };
    struct DeletePost_output
    {
        bit success;
    };

    PUBLIC_PROCEDURE(DeletePost)
    {
        sint64 index = (sint64)input.postId;
        Post post = state.posts.element(index);

        if (post.author != qpi.invocator())
        {
            output.success = false;
            return;
        }

        if (post.deleted)
        {
            output.success = false;
            return;
        }

        post.deleted = true;
        state.posts.replace(index, post);
        // We do NOT remove from collection to keep indices stable.
        output.success = true;
    }

    // Like Post
    struct LikePost_input
    {
        uint32 postId;
    };
    struct LikePost_output
    {
        bit success;
        uint32 newLikeCount;
    };

    PUBLIC_PROCEDURE(LikePost)
    {
        sint64 index = (sint64)input.postId;
        Post post = state.posts.element(index);

        if (post.deleted)
        {
            output.success = false;
            output.newLikeCount = post.likes;
            return;
        }

        post.likes++;
        state.posts.replace(index, post);
        
        output.success = true;
        output.newLikeCount = post.likes;
    }

    // Get Post
    struct GetPost_input
    {
        uint32 postId;
    };
    struct GetPost_output
    {
        Post post;
        bit exists;
    };

    PUBLIC_FUNCTION(GetPost)
    {
        sint64 index = (sint64)input.postId;
        
        output.post = state.posts.element(index);
        
        // Simple validity check: if author is 0 and timestamp is 0, it's likely invalid/empty
        if (output.post.author == id::zero() && output.post.timestamp == 0)
        {
             output.exists = false;
        }
        else
        {
             output.exists = true;
        }
    }

    // Get Posts By User
    struct GetPostsByUser_input
    {
        id author;
        uint32 page;
        uint32 pageSize;
    };
    struct GetPostsByUser_output
    {
        Post posts[10]; // Fixed size for simplicity, max 10 per page
        uint32 count;
        bit hasMore;
    };

    PUBLIC_FUNCTION(GetPostsByUser)
    {
        output.count = 0;
        output.hasMore = false;
        
        if (input.pageSize == 0 || input.pageSize > 10) input.pageSize = 10;

        sint64 currentIdx = state.posts.headIndex(input.author);
        uint32 skipped = 0;
        uint32 targetSkip = input.page * input.pageSize;
        
        while (currentIdx != NULL_INDEX)
        {
            Post p = state.posts.element(currentIdx);
            
            if (!p.deleted)
            {
                if (skipped < targetSkip)
                {
                    skipped++;
                }
                else
                {
                    if (output.count < input.pageSize)
                    {
                        output.posts[output.count] = p;
                        output.count++;
                    }
                    else
                    {
                        output.hasMore = true;
                        break;
                    }
                }
            }
            
            currentIdx = state.posts.nextElementIndex(currentIdx);
        }
    }

    REGISTER_USER_FUNCTIONS_AND_PROCEDURES()
    {
        REGISTER_USER_PROCEDURE(CreatePost, 1);
        REGISTER_USER_PROCEDURE(EditPost, 2);
        REGISTER_USER_PROCEDURE(DeletePost, 3);
        REGISTER_USER_PROCEDURE(LikePost, 4);
        REGISTER_USER_FUNCTION(GetPost, 5);
        REGISTER_USER_FUNCTION(GetPostsByUser, 6);
    }

    INITIALIZE()
    {
        state.posts.reset();
    }
};
