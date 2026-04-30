import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Channel } from "stream-chat";
import { useStreamChat } from "@/components/StreamChatProvider";
import { useConversations } from "@/hooks/useConversations";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

const getOtherMember = (channel: Channel, currentUserId?: string) => {
  const members = Object.values(channel.state.members || {});
  return members.find((member: any) => member.user?.id !== currentUserId) as any;
};

const MessagesScreen = () => {
  const { currentUser, isLoading: isCurrentUserLoading, refetch: refetchCurrentUser } = useCurrentUser();
  const { client, error, isConnecting, reconnect } = useStreamChat();
  const { deleteConversation, isDeletingConversation } = useConversations();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingChannelId, setDeletingChannelId] = useState<string | null>(null);

  const loadChannels = useCallback(async () => {
    if (!client || !currentUser?._id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const nextChannels = await client.queryChannels(
        {
          members: { $in: [currentUser._id] },
          type: "messaging",
        },
        { last_message_at: -1 },
        {
          limit: 30,
          presence: true,
          state: true,
          watch: true,
        }
      );

      setChannels(nextChannels);
    } finally {
      setIsLoading(false);
    }
  }, [client, currentUser?._id]);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  useEffect(() => {
    if (!client) {
      return;
    }

    const subscription = client.on((event: any) => {
      if (
        event.type === "message.new" ||
        event.type === "message.deleted" ||
        event.type === "notification.message_new" ||
        event.type === "notification.mark_read"
      ) {
        loadChannels();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [client, loadChannels]);

  const promptDeleteConversation = (channelId: string) => {
    if (!channelId || isDeletingConversation) {
      return;
    }

    Alert.alert("Delete chat", "This will remove the conversation from your chat list.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setDeletingChannelId(channelId);
            await deleteConversation(channelId);
            setChannels((currentChannels) =>
              currentChannels.filter((channel) => (channel.id || "") !== channelId)
            );
          } catch (error: any) {
            Alert.alert(
              "Could not delete chat",
              error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                "Please try again."
            );
          } finally {
            setDeletingChannelId(null);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3">
        <Text className="text-xl font-bold text-gray-900">Messages</Text>
      </View>

      {!!error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-gray-500">{error}</Text>
          <TouchableOpacity
            className="mt-4 rounded-full bg-blue-500 px-5 py-2"
            onPress={() => {
              refetchCurrentUser();
              reconnect();
            }}
          >
            <Text className="font-semibold text-white">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : isCurrentUserLoading || isConnecting || isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1DA1F2" />
          <Text className="mt-2 text-gray-500">Loading messages...</Text>
        </View>
      ) : !client || !currentUser?._id ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-gray-500">
            Chat is not connected yet. Pull back and try again in a moment.
          </Text>
        </View>
      ) : (
        <FlatList
          data={channels}
          keyExtractor={(channel) => channel.cid}
          ListEmptyComponent={() => (
            <View className="flex-1 items-center justify-center p-8">
              <Feather name="message-circle" size={32} color="#9CA3AF" />
              <Text className="mt-3 text-center text-gray-500">
                Start a chat from someone&apos;s profile.
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            const otherMember = getOtherMember(item, currentUser._id);
            const otherUser = otherMember?.user;
            const latestMessage = item.state.messages[item.state.messages.length - 1];
            const channelId = item.id || item.cid.replace("messaging:", "");
            const isLatestMessageDeleted =
              latestMessage?.type === "deleted" || Boolean(latestMessage?.deleted_at);
            const unreadCount =
              typeof (item as any).countUnread === "function"
                ? Number((item as any).countUnread() || 0)
                : 0;

            return (
              <TouchableOpacity
                className="flex-row items-center border-b border-gray-100 px-4 py-3"
                onPress={() => {
                  router.push({
                    pathname: "/chat/[conversationId]",
                    params: { conversationId: channelId },
                  });
                }}
                onLongPress={() => promptDeleteConversation(channelId)}
                disabled={deletingChannelId === channelId}
              >
                <Image
                  source={{ uri: otherUser?.image || DEFAULT_AVATAR }}
                  className="mr-3 size-12 rounded-full"
                />

                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-semibold text-gray-900" numberOfLines={1}>
                      {otherUser?.name || otherUser?.username || "Chat"}
                    </Text>
                    {unreadCount > 0 && (
                      <View className="ml-2 min-w-5 items-center rounded-full bg-blue-500 px-1.5 py-0.5">
                        <Text className="text-xs font-bold text-white">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text className="mt-1 text-sm text-gray-500" numberOfLines={1}>
                    {isLatestMessageDeleted
                      ? "Message deleted"
                      : latestMessage?.text ||
                      (latestMessage?.attachments?.length ? "Attachment" : "No messages yet")}
                  </Text>
                </View>

                {deletingChannelId === channelId && (
                  <ActivityIndicator className="ml-3" size="small" color="#EF4444" />
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default MessagesScreen;
