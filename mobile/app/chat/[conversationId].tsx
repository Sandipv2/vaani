import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useConversations } from "@/hooks/useConversations";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMessages } from "@/hooks/useMessages";
import { Conversation, User } from "@/types";
import { chatApi, useApiClient } from "@/utils/api";
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [composerHeight, setComposerHeight] = useState(84);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const api = useApiClient();
  const queryClient = useQueryClient();
  const { socket } = useChatSocket(Boolean(normalizedConversationId));
  const { currentUser } = useCurrentUser();
  const { conversations } = useConversations();
  const { messages, isLoading, error, refetch } = useMessages(normalizedConversationId);

  const conversation = conversations.find((item) => item._id === normalizedConversationId);
  const otherUser = getOtherParticipant(conversation, currentUser);
  const otherUserName = `${otherUser?.firstName || ""} ${otherUser?.lastName || ""}`.trim() || otherUser?.username || "Chat";
  const composerLift = Platform.OS === "android" ? keyboardHeight : 0;

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const addMessageToCache = (message: any) => {
    queryClient.setQueryData(["messages", normalizedConversationId], (currentResponse: any) => {
      if (!currentResponse?.data || !Array.isArray(currentResponse.data.messages)) {
        return currentResponse;
      }

      const alreadyExists = currentResponse.data.messages.some((item: any) => item._id === message._id);

      if (alreadyExists) {
        return currentResponse;
      }

      return {
        ...currentResponse,
        data: {
          ...currentResponse.data,
          messages: [...currentResponse.data.messages, message],
        },
      };
    });
  };

  const addConversationToCache = (updatedConversation: Conversation) => {
    queryClient.setQueryData(["conversations"], (currentResponse: any) => {
      if (!currentResponse?.data || !Array.isArray(currentResponse.data.conversations)) {
        return currentResponse;
      }

      const otherConversations = currentResponse.data.conversations.filter(
        (item: Conversation) => item._id !== updatedConversation._id
      );

      return {
        ...currentResponse,
        data: {
          ...currentResponse.data,
          conversations: [updatedConversation, ...otherConversations],
        },
      };
    });
  };

  const sendMessage = async () => {
    const text = messageText.trim();

    if (!normalizedConversationId || !text || isSending) {
      return;
    }

    setIsSending(true);

    if (socket) {
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

      return;
    }

    try {
      const response = await chatApi.sendMessage(api, normalizedConversationId, text);
      addMessageToCache(response.data.message);
      addConversationToCache(response.data.conversation);
      setMessageText("");
    } catch (sendError) {
      console.log("Failed to send message", sendError);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
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

      <View className="flex-1">
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
          <View className="flex-1">
            <ScrollView
              ref={scrollViewRef}
              className="flex-1"
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingTop: 16,
                paddingBottom: composerHeight + composerLift + 16,
              }}
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

            <View
              className="absolute left-0 right-0 bottom-0 border-t border-gray-100 bg-white px-4 pt-4"
              style={{ bottom: composerLift, paddingBottom: insets.bottom }}
              onLayout={(event) => setComposerHeight(event.nativeEvent.layout.height)}
            >
              <View className="flex-row items-end">
                <View className="flex-1 mr-3">
                  <TextInput
                    className="border border-gray-200 rounded-lg p-3 text-base text-gray-900 bg-white max-h-28"
                    placeholder="Type a message..."
                    placeholderTextColor="#657786"
                    value={messageText}
                    onChangeText={setMessageText}
                    editable={!isSending}
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                  />
                </View>

                <TouchableOpacity
                  onPress={sendMessage}
                  className={`size-10 rounded-full items-center justify-center ${
                    messageText.trim() && !isSending ? "bg-blue-500" : "bg-gray-300"
                  }`}
                  disabled={!messageText.trim() || isSending}
                >
                  <Feather name="send" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ChatScreen;
