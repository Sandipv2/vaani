import CommentsModal from "@/components/CommentsModal";
import PostCard from "@/components/PostCard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePost } from "@/hooks/usePost";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

const PostDetailsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { currentUser } = useCurrentUser();
  const { post, isLoading, error, refetch, toggleLike, deletePost } = usePost(postId);
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);

  const isLiked = !!currentUser && !!post?.likes?.includes(currentUser._id);

  const handleDelete = (id: string) => {
    deletePost(id, () => router.replace("/(tabs)"));
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <TouchableOpacity className="mr-3 p-1" onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Post</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center p-8">
          <ActivityIndicator size="large" color="#1DA1F2" />
          <Text className="text-gray-500 mt-4">Loading post...</Text>
        </View>
      ) : error || !post ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-gray-500 mb-4">Failed to load post</Text>
          <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-lg" onPress={() => refetch()}>
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
            showsVerticalScrollIndicator={false}
          >
            <PostCard
              post={post}
              onLike={toggleLike}
              onDelete={handleDelete}
              onComment={() => setIsCommentsVisible(true)}
              currentUser={currentUser}
              isLiked={isLiked}
            />
          </ScrollView>

          <CommentsModal
            selectedPost={isCommentsVisible ? post : null}
            onClose={() => setIsCommentsVisible(false)}
          />
        </>
      )}
    </SafeAreaView>
  );
};

export default PostDetailsScreen;
