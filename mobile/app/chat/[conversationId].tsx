import * as DocumentPicker from "expo-document-picker";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Channel } from "stream-chat";
import { useStreamChat } from "@/components/StreamChatProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

const ChatScreen = () => {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const normalizedChannelId = Array.isArray(conversationId) ? conversationId[0] : conversationId;
  const { client } = useStreamChat();
  const { currentUser } = useCurrentUser();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<FlatList<any>>(null);

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

  const renderMessage = ({ item }: { item: any }) => {
    const isMine = item.user?.id === currentUser?._id;

    return (
      <View className={`mb-3 px-4 ${isMine ? "items-end" : "items-start"}`}>
        <View
          className={`max-w-[82%] rounded-2xl px-4 py-2 ${
            isMine ? "bg-blue-500" : "bg-gray-100"
          }`}
        >
          {!!item.text && (
            <Text className={isMine ? "text-white" : "text-gray-900"}>{item.text}</Text>
          )}

          {item.attachments?.map((attachment: any, index: number) => {
            const url = attachment.image_url || attachment.asset_url || attachment.title_link;
            const title = attachment.title || "Attachment";

            if (attachment.type === "image" && attachment.image_url) {
              return (
                <TouchableOpacity
                  key={`${item.id}-attachment-${index}`}
                  className="mt-2 overflow-hidden rounded-xl"
                  onPress={() => Linking.openURL(attachment.image_url)}
                >
                  <Image
                    source={{ uri: attachment.image_url }}
                    className="h-48 w-56 bg-gray-200"
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={`${item.id}-attachment-${index}`}
                className={`mt-2 flex-row items-center rounded-xl px-3 py-2 ${
                  isMine ? "bg-blue-600" : "bg-white"
                }`}
                onPress={() => url && Linking.openURL(url)}
              >
                <Feather name="paperclip" size={16} color={isMine ? "#fff" : "#1DA1F2"} />
                <Text
                  className={`ml-2 flex-1 text-sm font-medium ${
                    isMine ? "text-white" : "text-gray-900"
                  }`}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
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
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item, index) => item.id || `${item.created_at}-${index}`}
            className="flex-1"
            contentContainerClassName="py-4"
            renderItem={renderMessage}
          />

          <View className="flex-row items-end border-t border-gray-100 px-3 py-2">
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
