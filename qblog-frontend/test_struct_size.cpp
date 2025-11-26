
#include <iostream>
#include <cstdint>
#include <cstring>

// Mocking Qubic types
typedef bool bit;
typedef signed char sint8;
typedef unsigned char uint8;
typedef signed short sint16;
typedef unsigned short uint16;
typedef signed int sint32;
typedef unsigned int uint32;
typedef signed long long sint64;
typedef unsigned long long uint64;

struct id {
    uint64 data[4];
    bool operator==(const id& other) const { return memcmp(data, other.data, 32) == 0; }
    static id zero() { id i; memset(&i, 0, 32); return i; }
};

template <typename T, uint64_t L>
struct Array
{
    T _values[L];
};

struct Post
{
    id author;
    uint64 timestamp;
    uint32 likes;
    bit deleted;
    Array<sint8, 64> title;
    Array<sint8, 256> content;
};

struct GetPostsByUser_output
{
    Array<Post, 16> posts;
    uint32 count;
    bit hasMore;
};

int main() {
    std::cout << "sizeof(id): " << sizeof(id) << std::endl;
    std::cout << "sizeof(Post): " << sizeof(Post) << std::endl;
    std::cout << "sizeof(Array<Post, 16>): " << sizeof(Array<Post, 16>) << std::endl;
    std::cout << "sizeof(GetPostsByUser_output): " << sizeof(GetPostsByUser_output) << std::endl;
    return 0;
}
