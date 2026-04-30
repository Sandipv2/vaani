import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import UserProfileView from "@/components/UserProfileView";
import { useConversations } from "@/hooks/useConversations";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePosts } from "@/hooks/usePosts";
import { useUserProfile } from "@/hooks/useUserProfile";

const UserProfileScreen = () => {
  const { username } = useLocalSearchParams<{ username: string }>();
  const normalizedUsername = Array.isArray(username) ? username[0] : username;
  const { currentUser } = useCurrentUser();
  const { user, isLoading, isRefreshing, error, refetch } = useUserProfile(normalizedUsername);
  const { posts, refetch: refetchPosts, isRefreshing: isPostsRefreshing } = usePosts(normalizedUsername);
  const { getOrCreateConversation, isCreatingConversation } = useConversations();

  const openChat = async () => {
    if (!user?._id || isCreatingConversation) {
      return;
    }

    try {
      const response = await getOrCreateConversation(user._id);
      const conversationId = response.data.channelId;

      router.push({
        pathname: "/chat/[conversationId]",
        params: { conversationId },
      });
    } catch (error: any) {
      Alert.alert(
        "Could not open chat",
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "Please try again."
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={["top"]}>
        <ActivityIndicator size="large" color="#1DA1F2" />
      </SafeAreaView>
    );
  }

  if (error || !user) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
          <TouchableOpacity className="mr-4" onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Profile</Text>
        </View>
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-gray-500 mb-4">User not found</Text>
          <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-lg" onPress={() => refetch()}>
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <UserProfileView
        user={user}
        postCount={posts.length}
        isRefreshing={isRefreshing || isPostsRefreshing}
        onRefresh={() => {
          refetch();
          refetchPosts();
        }}
        headerRight={
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="x" size={24} color="#111827" />
          </TouchableOpacity>
        }
        action={
          currentUser?._id !== user._id ? (
            <TouchableOpacity
              className="border border-gray-300 px-6 py-2 rounded-full"
              onPress={openChat}
              disabled={isCreatingConversation}
            >
              <Text className="font-semibold text-gray-900">
                {isCreatingConversation ? "Opening..." : "Message"}
              </Text>
            </TouchableOpacity>
          ) : undefined
        }
      />
    </SafeAreaView>
  );
};

export default UserProfileScreen;
