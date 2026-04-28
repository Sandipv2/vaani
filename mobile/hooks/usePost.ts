import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Post, PostMedia } from "@/types";
import { postApi, useApiClient } from "@/utils/api";

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
    return [{ url: post.image, type: "image" }];
  }

  return [];
};

const normalizePost = (post: any): Post => ({
  ...post,
  media: normalizeMedia(post),
});

export const usePost = (postId?: string) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const postQuery = useQuery({
    queryKey: ["post", postId],
    queryFn: () => postApi.getPost(api, postId as string),
    enabled: !!postId,
    select: (response) => normalizePost(response.data.post),
  });

  const likePostMutation = useMutation({
    mutationFn: (id: string) => postApi.likePost(api, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (id: string) => postApi.deletePost(api, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return {
    post: postQuery.data,
    isLoading: postQuery.isLoading,
    error: postQuery.error,
    refetch: postQuery.refetch,
    toggleLike: (id: string) => likePostMutation.mutate(id),
    deletePost: (id: string, onSuccess?: () => void) =>
      deletePostMutation.mutate(id, { onSuccess }),
    isDeletingPost: deletePostMutation.isPending,
  };
};
