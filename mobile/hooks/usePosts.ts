import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Post, PostMedia } from "@/types";
import { useApiClient, postApi } from "../utils/api";

const normalizeMedia = (post: any): PostMedia[] => {
    if (Array.isArray(post.media)) {
        return post.media
            .filter((item: any) => item?.url)
            .map((item: any) => ({
                url: item.url,
                type: item.type === "video" ? "video" : "image",
                publicId: item.publicId,
            }));
    }

    if (post.image) {
        return [
            {
                url: post.image,
                type: "image",
            },
        ];
    }

    return [];
};

const normalizePost = (post: any): Post => {
    const normalizedUsername = String(post.user?.username || post.user?.usrname || "").trim();
    const fallbackUsername =
        normalizedUsername ||
        String(
            [post.user?.firstName, post.user?.lastName]
                .filter(Boolean)
                .join("")
                .toLowerCase()
        ).trim() ||
        `user${String(post.user?._id || "").slice(-6)}`;

    return {
        ...post,
        user: {
            ...post.user,
            username: fallbackUsername,
        },
        media: normalizeMedia(post),
    };
};

const removePostFromResponse = (response: any, postId: string) => {
    if (!response?.data?.posts || !Array.isArray(response.data.posts)) {
        return response;
    }

    return {
        ...response,
        data: {
            ...response.data,
            posts: response.data.posts.filter((post: any) => post._id !== postId),
        },
    };
};

export const usePosts = (username?: string) => {
    const api = useApiClient();
    const queryClient = useQueryClient();

    const {
        data: postsData,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: username ? ["userPosts", username] : ["posts"],
        queryFn: () => (username ? postApi.getUserPosts(api, username) : postApi.getPosts(api)),
        select: (response) => response.data.posts.map(normalizePost),
    });

    const likePostMutation = useMutation({
        mutationFn: (postId: string) => postApi.likePost(api, postId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            if (username) {
                queryClient.invalidateQueries({ queryKey: ["userPosts", username] });
            }
        },
    });

    const deletePostMutation = useMutation({
        mutationFn: (postId: string) => postApi.deletePost(api, postId),
        onMutate: async (postId: string) => {
            await queryClient.cancelQueries({ queryKey: ["posts"] });

            if (username) {
                await queryClient.cancelQueries({ queryKey: ["userPosts", username] });
            }

            const previousPosts = queryClient.getQueryData(["posts"]);
            const previousUserPosts = username
                ? queryClient.getQueryData(["userPosts", username])
                : undefined;

            queryClient.setQueryData(["posts"], (currentResponse: any) =>
                removePostFromResponse(currentResponse, postId)
            );

            if (username) {
                queryClient.setQueryData(["userPosts", username], (currentResponse: any) =>
                    removePostFromResponse(currentResponse, postId)
                );
            }

            return { previousPosts, previousUserPosts };
        },
        onError: (_error, _postId, context) => {
            if (context?.previousPosts) {
                queryClient.setQueryData(["posts"], context.previousPosts);
            }

            if (username && context?.previousUserPosts) {
                queryClient.setQueryData(["userPosts", username], context.previousUserPosts);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            if (username) {
                queryClient.invalidateQueries({ queryKey: ["userPosts", username] });
            }
        },
    });

    const checkIsLiked = (postLikes: string[] = [], currentUser: any) => {
        const isLiked = currentUser && postLikes.includes(currentUser._id);
        return isLiked;
    };

    return {
        posts: postsData || [],
        isLoading,
        error,
        refetch,
        toggleLike: (postId: string) => likePostMutation.mutate(postId),
        deletePost: (postId: string) => deletePostMutation.mutate(postId),
        checkIsLiked,
    };
};
