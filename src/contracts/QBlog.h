#pragma once

using namespace QPI;

enum class QBlogLogInfo {
    success = 0,
    contractFull = 1,
    invalidPostId = 2,
    unauthorized = 3,
    postDeleted = 4,
    postNotFound = 5,
};

struct QBlogLogger {
    uint32 _contractIndex;
    uint32 _type;
    sint8 _terminator;
};

struct Post
{
    uint32 id;
    id author;
    uint64 timestamp;
    uint32 likes;
    bit deleted;
    Array<sint8, 64> title;
    Array<sint8, 256> content;
};

struct QBLOG2
{
};

struct QBLOG : public ContractBase
{
    // State variables
    // Using Collection to index posts by author (PoV)
    Collection<Post, 1024> posts;
    
    // Track who liked each post to enable like toggling
    // Key: hash(postId + voterId), Value: 1 if liked
    HashMap<uint64, uint8, 4096> likedBy;

    // Create Post
    struct CreatePost_input
    {
        Array<sint8, 64> title;
        Array<sint8, 256> content;
    };
    struct CreatePost_output
    {
        uint32 postId;
        uint32 returnCode;
    };

    struct CreatePost_locals
    {
        QBlogLogger log;
    };

    PUBLIC_PROCEDURE_WITH_LOCALS(CreatePost)
    {
        if (state.posts.population() >= state.posts.capacity())
        {
            // Contract full
            output.postId = -1;
            output.returnCode = static_cast<uint32>(QBlogLogInfo::contractFull);
            locals.log = QBlogLogger{ QBLOG_CONTRACT_INDEX, static_cast<uint32>(QBlogLogInfo::contractFull), 0 };
            LOG_INFO(locals.log);
            return;
        }

        Post newPost;
        newPost.id = 0; // Will be set to actual index after add()
        newPost.author = qpi.invocator();
        newPost.timestamp = qpi.tick();
        newPost.likes = 0;
        newPost.deleted = false;
        
        newPost.title = input.title;
        newPost.content = input.content;

        newPost.title.set(63, 0);
        newPost.content.set(255, 0);

        // Add to collection. 
        // PoV = author (allows querying by author)
        // Priority = timestamp (allows sorting by time)
        sint64 index = state.posts.add(newPost.author, newPost, newPost.timestamp);
        
        if (index == NULL_INDEX)
        {
             output.postId = -1;
             output.returnCode = static_cast<uint32>(QBlogLogInfo::contractFull);
             locals.log = QBlogLogger{ QBLOG_CONTRACT_INDEX, static_cast<uint32>(QBlogLogInfo::contractFull), 0 };
             LOG_INFO(locals.log);
        }
        else
        {
             // Update the post with its actual ID and save it back
             newPost.id = (uint32)index;
             state.posts.replace(index, newPost);
             
             output.postId = (uint32)index;
             output.returnCode = static_cast<uint32>(QBlogLogInfo::success);
             locals.log = QBlogLogger{ QBLOG_CONTRACT_INDEX, static_cast<uint32>(QBlogLogInfo::success), 0 };
             LOG_INFO(locals.log);
        }
    }

    // Edit Post
    struct EditPost_input
    {
        uint32 postId;
        Array<sint8, 64> title;
        Array<sint8, 256> content;
    };
    struct EditPost_output
    {
        uint32 returnCode;
    };

    struct EditPost_locals
    {
        QBlogLogger log;
    };

    PUBLIC_PROCEDURE_WITH_LOCALS(EditPost)
    {
        sint64 index = (sint64)input.postId;
        // Basic bounds check
        if (index < 0 || index >= state.posts.capacity())
        {
             output.returnCode = static_cast<uint32>(QBlogLogInfo::invalidPostId);
             locals.log = QBlogLogger{ QBLOG_CONTRACT_INDEX, static_cast<uint32>(QBlogLogInfo::invalidPostId), 0 };
             LOG_INFO(locals.log);
             return;
        }
        
        Post post = state.posts.element(index);

        // Check authorization
        if (post.author != qpi.invocator())
        {
            output.returnCode = static_cast<uint32>(QBlogLogInfo::unauthorized);
            locals.log = QBlogLogger{ QBLOG_CONTRACT_INDEX, static_cast<uint32>(QBlogLogInfo::unauthorized), 0 };
            LOG_INFO(locals.log);
            return;
        }

        if (post.deleted)
        {
            output.returnCode = static_cast<uint32>(QBlogLogInfo::postDeleted);
            locals.log = QBlogLogger{ QBLOG_CONTRACT_INDEX, static_cast<uint32>(QBlogLogInfo::postDeleted), 0 };
            LOG_INFO(locals.log);
            return;
        }

        // Update content
        post.title = input.title;
        post.content = input.content;
        
        post.title.set(63, 0);
        post.content.set(255, 0);

        state.posts.replace(index, post);
        output.returnCode = static_cast<uint32>(QBlogLogInfo::success);
        locals.log = QBlogLogger{ QBLOG_CONTRACT_INDEX, static_cast<uint32>(QBlogLogInfo::success), 0 };
        LOG_INFO(locals.log);
    }

    // Delete Post
    struct DeletePost_input
    {
        uint32 postId;
    };
    struct DeletePost_output
    {
        uint32 returnCode;
    };

    struct DeletePost_locals
    {
        QBlogLogger log;
    };

    PUBLIC_PROCEDURE_WITH_LOCALS(DeletePost)
    {
        sint64 index = (sint64)input.postId;
        Post post = state.posts.element(index);

        if (post.author != qpi.invocator())
        {
            output.returnCode = static_cast<uint32>(QBlogLogInfo::unauthorized);
            locals.log = QBlogLogger{ QBLOG_CONTRACT_INDEX, static_cast<uint32>(QBlogLogInfo::unauthorized), 0 };
            LOG_INFO(locals.log);
            return;
        }

        if (post.deleted)
        {
            output.returnCode = static_cast<uint32>(QBlogLogInfo::postDeleted);
            locals.log = QBlogLogger{ QBLOG_CONTRACT_INDEX, static_cast<uint32>(QBlogLogInfo::postDeleted), 0 };
            LOG_INFO(locals.log);
            return;
        }

        post.deleted = true;
        state.posts.replace(index, post);
        // We do NOT remove from collection to keep indices stable.
        output.returnCode = static_cast<uint32>(QBlogLogInfo::success);
        locals.log = QBlogLogger{ QBLOG_CONTRACT_INDEX, static_cast<uint32>(QBlogLogInfo::success), 0 };
        LOG_INFO(locals.log);
    }

    // Like Post
    struct LikePost_input
    {
        uint32 postId;
    };
    struct LikePost_output
    {
        uint32 newLikeCount;
        uint32 returnCode;
    };

    struct LikePost_locals
    {
        QBlogLogger log;
    };

    PUBLIC_PROCEDURE_WITH_LOCALS(LikePost)
    {
        sint64 index = (sint64)input.postId;
        Post post = state.posts.element(index);

        if (post.deleted)
        {
            output.newLikeCount = post.likes;
            output.returnCode = static_cast<uint32>(QBlogLogInfo::postDeleted);
            locals.log = QBlogLogger{ QBLOG_CONTRACT_INDEX, static_cast<uint32>(QBlogLogInfo::postDeleted), 0 };
            LOG_INFO(locals.log);
            return;
        }

        // Create unique key for this user+post combination
        uint64 voteKey = ((uint64)input.postId << 32) | (qpi.invocator().u64._0 & 0xFFFFFFFF);
        
        // Check if user already liked this post
        uint8 alreadyLiked = 0;
        if (state.likedBy.get(voteKey, alreadyLiked))
        {
            // User already liked - remove the like (toggle off)
            state.likedBy.removeByKey(voteKey);
            if (post.likes > 0)
            {
                post.likes--;
            }
        }
        else
        {
            // User hasn't liked yet - add the like (toggle on)
            state.likedBy.set(voteKey, 1);
            post.likes++;
        }
        
        state.posts.replace(index, post);
        
        output.newLikeCount = post.likes;
        output.returnCode = static_cast<uint32>(QBlogLogInfo::success);
        locals.log = QBlogLogger{ QBLOG_CONTRACT_INDEX, static_cast<uint32>(QBlogLogInfo::success), 0 };
        LOG_INFO(locals.log);
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
        bit userLiked;  // Whether the requesting user has liked this post
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
        
        // Check if the current user (invocator) has liked this post
        uint64 voteKey = ((uint64)input.postId << 32) | (qpi.invocator().u64._0 & 0xFFFFFFFF);
        uint8 liked = 0;
        output.userLiked = state.likedBy.get(voteKey, liked);
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
        Array<Post, 16> posts; // Posts now include id field
        uint32 count;
        bit hasMore;
    };

    PUBLIC_FUNCTION(GetPostsByUser)
    {
        output.count = 0;
        output.hasMore = false;
        
        if (input.pageSize == 0 || input.pageSize > 16) input.pageSize = 16;

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
                        output.posts.set(output.count, p);
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
        state.likedBy.reset();
    }
};
