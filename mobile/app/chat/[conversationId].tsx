import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useChatSocketContext } from "@/context/ChatSocketContext";
import { useConversations } from "@/hooks/useConversations";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMessages } from "@/hooks/useMessages";
import { Conversation, User } from "@/types";
import { formatDate } from "@/utils/formatters";

const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

const getOtherParticipant = (conversation?: Conversation, currentUser?: User) => {
  return conversation?.participants.find((user) => user._id !== currentUser?._id);
};

const ChatScreen = () => {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const normalizedConversationId = Array.isArray(conversationId) ? conversationId[0] : conversationId;
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const { socket } = useChatSocketContext();
  const { currentUser } = useCurrentUser();
  const { conversations } = useConversations();
  const { messages, isLoading, error, refetch } = useMessages(normalizedConversationId);

  const conversation = conversations.find((item) => item._id === normalizedConversationId);
  const otherUser = getOtherParticipant(conversation, currentUser);
  const otherUserName = `${otherUser?.firstName || ""} ${otherUser?.lastName || ""}`.trim() || otherUser?.username || "Chat";

  const sendMessage = () => {
    const text = messageText.trim();

    if (!socket || !normalizedConversationId || !text || isSending) {
      return;
    }

    setIsSending(true);
    socket.emit(
      "sendMessage",
      {
        conversationId: normalizedConversationId,
        text,
      },
      (response: { ok: boolean; error?: string }) => {
        setIsSending(false);

        if (response.ok) {
          setMessageText("");
          return;
        }

        console.log(response.error || "Failed to send message");
      }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Feather name="arrow-left" size={24} color="#1DA1F2" />
          </TouchableOpacity>

          <Image
            source={{ uri: otherUser?.profilePicture || DEFAULT_AVATAR }}
            className="size-10 rounded-full mr-3"
          />

          <View className="flex-1">
            <Text className="font-semibold text-gray-900" numberOfLines={1}>
              {otherUserName}
            </Text>
            {!!otherUser?.username && (
              <Text className="text-gray-500 text-sm">@{otherUser.username}</Text>
            )}
          </View>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#1DA1F2" />
            <Text className="text-gray-500 mt-2">Loading messages...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-gray-500 text-center mb-4">Failed to load messages</Text>
            <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-lg" onPress={() => refetch()}>
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4 py-4"
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 ? (
              <View className="items-center py-10">
                <Text className="text-gray-500 text-center">Send the first message.</Text>
              </View>
            ) : (
              messages.map((message) => {
                const isMine = message.sender._id === currentUser?._id;

                return (
                  <View
                    key={message._id}
                    className={`mb-3 flex-row ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <View className={`max-w-[80%] ${isMine ? "items-end" : "items-start"}`}>
                      <View className={`rounded-2xl px-4 py-3 ${isMine ? "bg-blue-500" : "bg-gray-100"}`}>
                        <Text className={isMine ? "text-white" : "text-gray-900"}>
                          {message.text}
                        </Text>
                      </View>
                      <Text className="text-xs text-gray-400 mt-1">
                        {formatDate(message.createdAt)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        <View className="flex-row items-center px-4 py-3 border-t border-gray-100">
          <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 mr-3">
            <TextInput
              className="text-base max-h-28"
              placeholder={socket ? "Type a message..." : "Connecting..."}
              placeholderTextColor="#657786"
              value={messageText}
              onChangeText={setMessageText}
              editable={Boolean(socket) && !isSending}
              multiline
            />
          </View>

          <TouchableOpacity
            onPress={sendMessage}
            className={`size-10 rounded-full items-center justify-center ${
              messageText.trim() && socket && !isSending ? "bg-blue-500" : "bg-gray-300"
            }`}
            disabled={!messageText.trim() || !socket || isSending}
          >
            <Feather name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;
