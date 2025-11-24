#include "contract_testing.h"
#include "contracts/QBlog.h"

class ContractTestingQBlog : public ContractTesting
{
public:
    ContractTestingQBlog()
    {
        initEmptySpectrum();
        initEmptyUniverse();
        INIT_CONTRACT(QBLOG);
        callSystemProcedure(QBLOG_CONTRACT_INDEX, INITIALIZE);
    }

    ~ContractTestingQBlog()
    {
    }

    QBLOG::CreatePost_output createPost(const id& user, const char* title, const char* content, bool expectSuccess = true)
    {
        QBLOG::CreatePost_input input;
        QBLOG::CreatePost_output output;

        memset(input.title, 0, 64);
        memset(input.content, 0, 256);
        strncpy(input.title, title, 63);
        strncpy(input.content, content, 255);

        invokeUserProcedure(QBLOG_CONTRACT_INDEX, 1, input, output, user, 0, true, expectSuccess);
        return output;
    }

    QBLOG::EditPost_output editPost(const id& user, uint32 postId, const char* title, const char* content, bool expectSuccess = true)
    {
        QBLOG::EditPost_input input;
        QBLOG::EditPost_output output;

        input.postId = postId;
        memset(input.title, 0, 64);
        memset(input.content, 0, 256);
        strncpy(input.title, title, 63);
        strncpy(input.content, content, 255);

        invokeUserProcedure(QBLOG_CONTRACT_INDEX, 2, input, output, user, 0, true, expectSuccess);
        return output;
    }

    QBLOG::DeletePost_output deletePost(const id& user, uint32 postId, bool expectSuccess = true)
    {
        QBLOG::DeletePost_input input;
        QBLOG::DeletePost_output output;

        input.postId = postId;

        invokeUserProcedure(QBLOG_CONTRACT_INDEX, 3, input, output, user, 0, true, expectSuccess);
        return output;
    }

    QBLOG::LikePost_output likePost(const id& user, uint32 postId, bool expectSuccess = true)
    {
        QBLOG::LikePost_input input;
        QBLOG::LikePost_output output;

        input.postId = postId;

        invokeUserProcedure(QBLOG_CONTRACT_INDEX, 4, input, output, user, 0, true, expectSuccess);
        return output;
    }

    QBLOG::GetPost_output getPost(uint32 postId)
    {
        QBLOG::GetPost_input input;
        QBLOG::GetPost_output output;

        input.postId = postId;

        callFunction(QBLOG_CONTRACT_INDEX, 5, input, output);
        return output;
    }

    QBLOG::GetPostsByUser_output getPostsByUser(const id& author, uint32 page, uint32 pageSize)
    {
        QBLOG::GetPostsByUser_input input;
        QBLOG::GetPostsByUser_output output;

        input.author = author;
        input.page = page;
        input.pageSize = pageSize;

        callFunction(QBLOG_CONTRACT_INDEX, 6, input, output);
        return output;
    }
};

TEST(TestContractQBlog, testingAllProceduresAndFunctions)
{
    ContractTestingQBlog qblog;

    id user1 = id(1, 1, 1, 1);
    id user2 = id(2, 2, 2, 2);

    increaseEnergy(user1, 1000000);
    increaseEnergy(user2, 1000000);

    // 1. Create Post
    auto createOut = qblog.createPost(user1, "First Post", "Hello World");
    EXPECT_NE(createOut.postId, (uint32)-1);
    uint32 postId = createOut.postId;

    // 2. Get Post
    auto getOut = qblog.getPost(postId);
    EXPECT_TRUE(getOut.exists);
    EXPECT_EQ(getOut.post.author, user1);
    EXPECT_STREQ(getOut.post.title, "First Post");
    EXPECT_STREQ(getOut.post.content, "Hello World");
    EXPECT_EQ(getOut.post.likes, 0);
    EXPECT_FALSE(getOut.post.deleted);

    // 3. Edit Post
    auto editOut = qblog.editPost(user1, postId, "Updated Title", "Updated Content");
    EXPECT_TRUE(editOut.success);

    getOut = qblog.getPost(postId);
    EXPECT_STREQ(getOut.post.title, "Updated Title");
    EXPECT_STREQ(getOut.post.content, "Updated Content");

    // 3.1 Edit Post (Unauthorized)
    editOut = qblog.editPost(user2, postId, "Hacked", "Hacked");
    EXPECT_FALSE(editOut.success);

    getOut = qblog.getPost(postId);
    EXPECT_STREQ(getOut.post.title, "Updated Title"); // Should remain unchanged

    // 4. Like Post
    auto likeOut = qblog.likePost(user2, postId);
    EXPECT_TRUE(likeOut.success);
    EXPECT_EQ(likeOut.newLikeCount, 1);

    getOut = qblog.getPost(postId);
    EXPECT_EQ(getOut.post.likes, 1);

    // 5. Get Posts By User
    // Create another post for user1
    qblog.createPost(user1, "Second Post", "More content");
    
    auto postsOut = qblog.getPostsByUser(user1, 0, 10);
    EXPECT_EQ(postsOut.count, 2);
    EXPECT_EQ(postsOut.posts[0].author, user1);
    EXPECT_EQ(postsOut.posts[1].author, user1);

    // 6. Delete Post
    auto deleteOut = qblog.deletePost(user1, postId);
    EXPECT_TRUE(deleteOut.success);

    getOut = qblog.getPost(postId);
    EXPECT_TRUE(getOut.post.deleted);

    // 6.1 Delete Post (Unauthorized)
    // Create a post for user2
    auto createOut2 = qblog.createPost(user2, "User2 Post", "Content");
    deleteOut = qblog.deletePost(user1, createOut2.postId);
    EXPECT_FALSE(deleteOut.success);

    // 7. Verify GetPostsByUser skips deleted
    postsOut = qblog.getPostsByUser(user1, 0, 10);
    EXPECT_EQ(postsOut.count, 1); // Only "Second Post" should be returned
    EXPECT_STREQ(postsOut.posts[0].title, "Second Post");
}
