import * as DocumentPicker from "expo-document-picker";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import type { Channel } from "stream-chat";
import { useConversations } from "@/hooks/useConversations";
import { useStreamChat } from "@/components/StreamChatProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

const ChatScreen = () => {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const normalizedChannelId = Array.isArray(conversationId) ? conversationId[0] : conversationId;
  const { client } = useStreamChat();
  const { currentUser } = useCurrentUser();
  const { deleteConversation, isDeletingConversation } = useConversations();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const listRef = useRef<FlatList<any>>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let isMounted = true;
    let subscription: { unsubscribe: () => void } | undefined;

    const loadChannel = async () => {
      if (!client || !normalizedChannelId) {
        return;
      }

      setIsLoading(true);

      try {
        const nextChannel = client.channel("messaging", normalizedChannelId);
        await nextChannel.watch();
        await nextChannel.markRead();

        if (isMounted) {
          setChannel(nextChannel);
          setMessages([...nextChannel.state.messages]);
        }

        subscription = nextChannel.on((event: any) => {
          if (
            event.type === "message.new" ||
            event.type === "message.updated" ||
            event.type === "message.deleted"
          ) {
            setMessages([...nextChannel.state.messages]);
          }
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadChannel();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [client, normalizedChannelId]);

  useEffect(() => {
    if (messages.length) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages.length]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const otherMember = useMemo(() => {
    if (!channel || !currentUser?._id) {
      return null;
    }

    return Object.values(channel.state.members || {}).find(
      (member: any) => member.user?.id !== currentUser._id
    ) as any;
  }, [channel, currentUser?._id]);

  const otherUser = otherMember?.user;
  const otherUserName = otherUser?.name || otherUser?.username || "Chat";

  const getAttachmentName = (attachment: any) => {
    if (attachment.title || attachment.name || attachment.filename) {
      return attachment.title || attachment.name || attachment.filename;
    }

    const rawUrl = attachment.asset_url || attachment.image_url || attachment.title_link;

    if (!rawUrl) {
      return "Attachment";
    }

    const lastSegment = rawUrl.split("?")[0].split("/").pop();
    return lastSegment ? decodeURIComponent(lastSegment) : "Attachment";
  };

  const sendTextMessage = async () => {
    const text = messageText.trim();

    if (!channel || !text || isSending) {
      return;
    }

    setIsSending(true);

    try {
      await channel.sendMessage({ text });
      setMessageText("");
      setMessages([...channel.state.messages]);
    } finally {
      setIsSending(false);
    }
  };

  const sendFileMessage = async () => {
    if (!channel || isSending) {
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const file = result.assets[0];

    setIsSending(true);

    try {
      const mimeType = file.mimeType || "application/octet-stream";
      const isImage = mimeType.startsWith("image/");
      const upload = isImage
        ? await channel.sendImage(file.uri, file.name, mimeType)
        : await channel.sendFile(file.uri, file.name, mimeType);

      await channel.sendMessage({
        attachments: [
          {
            asset_url: isImage ? undefined : upload.file,
            file_size: file.size,
            image_url: isImage ? upload.file : undefined,
            mime_type: mimeType,
            title: file.name,
            type: isImage ? "image" : "file",
          },
        ],
        text: "",
      });
      setMessages([...channel.state.messages]);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteConversation = () => {
    if (!normalizedChannelId || isDeletingConversation) {
      return;
    }

    Alert.alert("Delete chat", "This will remove the conversation from your chat list.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteConversation(normalizedChannelId);
            router.back();
          } catch (error: any) {
            Alert.alert(
              "Could not delete chat",
              error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                "Please try again."
            );
          }
        },
      },
    ]);
  };

  const promptDeleteMessage = (messageId?: string) => {
    if (!client || !messageId || deletingMessageId) {
      return;
    }

    Alert.alert("Delete message", "This message will be removed from the chat.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setDeletingMessageId(messageId);
            await client.deleteMessage(messageId, { hardDelete: false });
          } catch (error: any) {
            Alert.alert(
              "Could not delete message",
              error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                "Please try again."
            );
          } finally {
            setDeletingMessageId(null);
          }
        },
      },
    ]);
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMine = item.user?.id === currentUser?._id;
    const isDeleted = item.type === "deleted" || Boolean(item.deleted_at);
    const hasText = Boolean(item.text?.trim());
    const deletedLabel = isMine ? "You deleted this message" : "This message was deleted";

    return (
      <TouchableOpacity
        className={`mb-3 px-4 ${isMine ? "items-end" : "items-start"}`}
        activeOpacity={1}
        disabled={!isMine || deletingMessageId === item.id || isDeleted}
        onLongPress={() => promptDeleteMessage(item.id)}
      >
        <View className="max-w-[82%]">
          {isDeleted ? (
            <View
              className={`self-start rounded-2xl border px-4 py-3 ${
                isMine ? "border-slate-200 bg-slate-100" : "border-gray-200 bg-gray-50"
              }`}
            >
              <Text
                className={`text-sm italic ${
                  isMine ? "text-slate-500" : "text-gray-500"
                }`}
              >
                {deletedLabel}
              </Text>
            </View>
          ) : hasText && (
            <View
              className={`self-start rounded-2xl px-4 py-2 ${
                isMine ? "bg-blue-500" : "bg-gray-100"
              }`}
            >
              <Text className={isMine ? "text-white" : "text-gray-900"}>{item.text}</Text>
            </View>
          )}

          {item.attachments?.map((attachment: any, index: number) => {
            const url = attachment.image_url || attachment.asset_url || attachment.title_link;
            const title = getAttachmentName(attachment);
            const spacingClass = hasText || index > 0 ? "mt-2" : "";

            if (isDeleted) {
              return null;
            }

            if (attachment.type === "image" && attachment.image_url) {
              return (
                <TouchableOpacity
                  key={`${item.id}-attachment-${index}`}
                  className={`${spacingClass} overflow-hidden rounded-3xl`}
                  onPress={() => Linking.openURL(attachment.image_url)}
                  onLongPress={() => isMine && promptDeleteMessage(item.id)}
                  disabled={deletingMessageId === item.id}
                  activeOpacity={0.95}
                >
                  <Image
                    source={{ uri: attachment.image_url }}
                    className="h-48 w-56"
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={`${item.id}-attachment-${index}`}
                className={`${spacingClass} flex-row items-center rounded-2xl border border-gray-200 bg-white px-3 py-3`}
                onPress={() => url && Linking.openURL(url)}
                onLongPress={() => isMine && promptDeleteMessage(item.id)}
                disabled={!url || deletingMessageId === item.id}
                activeOpacity={0.85}
              >
                <View className="mr-3 size-10 items-center justify-center rounded-full bg-blue-50">
                  <Feather name="paperclip" size={18} color="#1DA1F2" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
                    {title}
                  </Text>
                  <Text className="mt-0.5 text-xs text-gray-500" numberOfLines={1}>
                    Tap to open file
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    );
  };

  const composerBottomPadding =
    Math.max(insets.bottom, 12) +
    (Platform.OS === "android" ? Math.max(0, keyboardHeight - insets.bottom) : 0);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View className="flex-row items-center border-b border-gray-100 px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Feather name="arrow-left" size={24} color="#1DA1F2" />
        </TouchableOpacity>

        <Image
          source={{ uri: otherUser?.image || DEFAULT_AVATAR }}
          className="mr-3 size-10 rounded-full"
        />

        <View className="flex-1">
          <Text className="font-semibold text-gray-900" numberOfLines={1}>
            {otherUserName}
          </Text>
          {!!otherUser?.username && (
            <Text className="text-sm text-gray-500">@{otherUser.username}</Text>
          )}
        </View>

        <TouchableOpacity
          className="ml-3"
          onPress={handleDeleteConversation}
          disabled={isDeletingConversation}
        >
          {isDeletingConversation ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Feather name="trash-2" size={20} color="#EF4444" />
          )}
        </TouchableOpacity>
      </View>

      {isLoading || !client || !channel ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1DA1F2" />
          <Text className="mt-2 text-gray-500">Loading chat...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item, index) => item.id || `${item.created_at}-${index}`}
            className="flex-1"
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
            renderItem={renderMessage}
          />

          <View
            className="flex-row items-end border-t border-gray-100 bg-white px-3 pt-2"
            style={{ paddingBottom: composerBottomPadding }}
          >
            <TouchableOpacity
              className="mr-2 size-10 items-center justify-center rounded-full bg-gray-100"
              disabled={isSending}
              onPress={sendFileMessage}
            >
              <Feather name="paperclip" size={20} color="#1DA1F2" />
            </TouchableOpacity>

            <TextInput
              className="max-h-28 flex-1 rounded-2xl bg-gray-100 px-4 py-2 text-base text-gray-900"
              multiline
              onChangeText={setMessageText}
              placeholder="Message"
              placeholderTextColor="#9CA3AF"
              value={messageText}
            />

            <TouchableOpacity
              className="ml-2 size-10 items-center justify-center rounded-full bg-blue-500"
              disabled={isSending || !messageText.trim()}
              onPress={sendTextMessage}
            >
              {isSending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Feather name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

export default ChatScreen;
