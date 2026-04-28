import { Notification, PostMedia } from "@/types";
import { formatDate } from "@/utils/formatters";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, Alert, Image, TouchableOpacity } from "react-native";

interface NotificationCardProps {
  notification: Notification;
  onDelete: (notificationId: string) => void;
}

const NotificationPostMediaPreview = ({ media }: { media: PostMedia }) => {
  const [aspectRatio, setAspectRatio] = useState(1);

  useEffect(() => {
    if (media.type === "image") {
      Image.getSize(media.url, (width, height) => {
        if (height > 0) {
          setAspectRatio(width / height);
        }
      });
    }
  }, [media]);

  if (media.type === "video") {
    return (
      <View
        style={{ aspectRatio: 16 / 9 }}
        className="w-full rounded-lg bg-black items-center justify-center"
      >
        <Feather name="play-circle" size={32} color="white" />
        <Text className="text-white text-xs mt-2">Video</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: media.url }}
      style={{ width: "100%", aspectRatio, borderRadius: 8 }}
      resizeMode="contain"
    />
  );
};

const NotificationCard = ({ notification, onDelete }: NotificationCardProps) => {
  const router = useRouter();
  const postMedia = notification.post?.media?.length
    ? notification.post.media
    : notification.post?.image
      ? [{ url: notification.post.image, type: "image" as const }]
      : [];

  const openPost = () => {
    if (!notification.post?._id) {
      return;
    }

    router.push({
      pathname: "/post/[postId]",
      params: { postId: notification.post._id },
    });
  };

  const getNotificationText = () => {
    const name = `${notification.from.firstName} ${notification.from.lastName}`;
    switch (notification.type) {
      case "like":
        return `${name} liked your post`;
      case "comment":
        return `${name} commented on your post`;
      case "follow":
        return `${name} started following you`;
      default:
        return "";
    }
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case "like":
        return <Feather name="heart" size={20} color="#E0245E" />;
      case "comment":
        return <Feather name="message-circle" size={20} color="#1DA1F2" />;
      case "follow":
        return <Feather name="user-plus" size={20} color="#17BF63" />;
      default:
        return <Feather name="bell" size={20} color="#657786" />;
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Notification", "Are you sure you want to delete this notification?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDelete(notification._id),
      },
    ]);
  };

  return (
    <View className="border-b border-gray-100 bg-white">
      <View className="flex-row p-4">
        <View className="relative mr-3">
          <Image
            source={{ uri: notification.from.profilePicture }}
            className="size-12 rounded-full"
          />

          <View className="absolute -bottom-1 -right-1 size-6 bg-white items-center justify-center">
            {getNotificationIcon()}
          </View>
        </View>

        <View className="flex-1">
          <View className="flex-row items-start justify-between mb-1">
            <View className="flex-1">
              <Text className="text-gray-900 text-base leading-5 mb-1">
                <Text className="font-semibold">
                  {notification.from.firstName} {notification.from.lastName}
                </Text>
                <Text className="text-gray-500"> @{notification.from.username}</Text>
              </Text>
              <Text className="text-gray-700 text-sm mb-2">{getNotificationText()}</Text>
            </View>

            <TouchableOpacity className="ml-2 p-1" onPress={handleDelete}>
              <Feather name="trash" size={16} color="#E0245E" />
            </TouchableOpacity>
          </View>

          {notification.post && (
            <TouchableOpacity
              activeOpacity={0.85}
              className="bg-gray-50 rounded-lg p-3 mb-2"
              onPress={openPost}
            >
              {notification.post.content ? (
                <Text className="text-gray-700 text-sm mb-1" numberOfLines={3}>
                  {notification.post.content}
                </Text>
              ) : null}

              {postMedia.length > 0 && (
                <View className="mt-2">
                  <NotificationPostMediaPreview media={postMedia[0]} />

                  {postMedia.length > 1 && (
                    <View className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1">
                      <Text className="text-white text-xs font-semibold">
                        +{postMedia.length - 1}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          )}

          {notification.comment && (
            <View className="bg-blue-50 rounded-lg p-3 mb-2">
              <Text className="text-gray-600 text-xs mb-1">Comment:</Text>
              <Text className="text-gray-700 text-sm" numberOfLines={2}>
                &ldquo;{notification.comment.content}&rdquo;
              </Text>
            </View>
          )}

          <Text className="text-gray-400 text-xs">{formatDate(notification.createdAt)}</Text>
        </View>
      </View>
    </View>
  );
};
export default NotificationCard;
