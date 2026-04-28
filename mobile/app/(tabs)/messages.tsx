import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { ActivityIndicator, Image, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useConversations } from "@/hooks/useConversations";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Conversation, User } from "@/types";
import { formatDate } from "@/utils/formatters";

const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

const getOtherParticipant = (conversation: Conversation, currentUser?: User) => {
  return conversation.participants.find((user) => user._id !== currentUser?._id);
};

const MessagesScreen = () => {
  const [searchText, setSearchText] = useState("");
  const { currentUser } = useCurrentUser();
  const { conversations, isLoading, isRefreshing, error, refetch } = useConversations();

  const filteredConversations = conversations.filter((conversation) => {
    const otherUser = getOtherParticipant(conversation, currentUser);
    const fullName = `${otherUser?.firstName || ""} ${otherUser?.lastName || ""}`.toLowerCase();
    const username = otherUser?.username?.toLowerCase() || "";
    const query = searchText.trim().toLowerCase();

    return !query || fullName.includes(query) || username.includes(query);
  });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Messages</Text>
      </View>

      <View className="px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-full p-3">
          <Feather name="search" size={20} color="#657786" />
          <TextInput
            placeholder="Search conversations"
            className="flex-1 ml-3 text-base"
            placeholderTextColor="#657786"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1DA1F2" />
          <Text className="text-gray-500 mt-2">Loading conversations...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-gray-500 text-center mb-4">Failed to load conversations</Text>
          <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-lg" onPress={() => refetch()}>
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => refetch()} tintColor="#1DA1F2" />
          }
        >
          {filteredConversations.length === 0 ? (
            <View className="p-8 items-center">
              <Feather name="message-circle" size={32} color="#9CA3AF" />
              <Text className="text-gray-500 mt-3 text-center">
                Start a chat from someone&apos;s profile.
              </Text>
            </View>
          ) : (
            filteredConversations.map((conversation) => {
              const otherUser = getOtherParticipant(conversation, currentUser);
              const fullName = `${otherUser?.firstName || ""} ${otherUser?.lastName || ""}`.trim() || otherUser?.username;

              return (
                <TouchableOpacity
                  key={conversation._id}
                  className="flex-row items-center py-4 px-5 border-b border-gray-50"
                  onPress={() =>
                    router.push({
                      pathname: "/chat/[conversationId]",
                      params: { conversationId: conversation._id },
                    })
                  }
                >
                  <Image
                    source={{ uri: otherUser?.profilePicture || DEFAULT_AVATAR }}
                    className="size-12 rounded-full mr-3"
                  />

                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <View className="flex-1 mr-2">
                        <Text className="font-semibold text-gray-900" numberOfLines={1}>
                          {fullName}
                        </Text>
                        <Text className="text-gray-500 text-sm">@{otherUser?.username}</Text>
                      </View>
                      <Text className="text-gray-500 text-sm">
                        {conversation.lastMessage ? formatDate(conversation.lastMessage.createdAt) : ""}
                      </Text>
                    </View>
                    <Text className="text-sm text-gray-500" numberOfLines={1}>
                      {conversation.lastMessage?.text || "No messages yet"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default MessagesScreen;
