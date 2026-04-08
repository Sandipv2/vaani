import { useState } from "react";
import { Post, PostMedia, User } from "@/types";
import { formatDate, formatNumber } from "@/utils/formatters";
import { AntDesign, Feather } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  View,
  Text,
  Alert,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from "react-native";

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onComment: (post: Post) => void;
  isLiked?: boolean;
  currentUser?: User;
}

const PostMediaItem = ({
  url,
  type,
  width,
}: {
  url: string;
  type: "image" | "video";
  width: number;
}) => {
  const player = useVideoPlayer(type === "video" ? url : null, (videoPlayer) => {
    videoPlayer.pause();
  });

  if (type === "video") {
    return (
      <View style={{ width }} className="h-64 rounded-2xl overflow-hidden bg-black">
        <VideoView player={player} nativeControls style={{ width: "100%", height: "100%" }} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: url }}
      style={{ width, height: 256, borderRadius: 16 }}
      resizeMode="cover"
    />
  );
};

const MediaPreviewModal = ({
  media,
  visible,
  onClose,
}: {
  media?: PostMedia;
  visible: boolean;
  onClose: () => void;
}) => {
  const player = useVideoPlayer(media?.type === "video" ? media.url : null, (videoPlayer) => {
    videoPlayer.pause();
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/90 justify-center items-center px-4">
        <Pressable className="absolute top-14 right-6 z-10" onPress={onClose}>
          <Feather name="x" size={28} color="white" />
        </Pressable>

        {media?.type === "video" ? (
          <VideoView
            player={player}
            nativeControls
            allowsFullscreen
            style={{ width: "100%", height: 320, borderRadius: 24 }}
          />
        ) : media ? (
          <Image
            source={{ uri: media.url }}
            style={{ width: "100%", height: 320, borderRadius: 24 }}
            resizeMode="contain"
          />
        ) : null}
      </View>
    </Modal>
  );
};

const PostCard = ({ currentUser, onDelete, onLike, post, isLiked, onComment }: PostCardProps) => {
  const isOwnPost = currentUser?._id === post.user._id;
  const { width: screenWidth } = useWindowDimensions();
  const slideGap = 3;
  const sliderWidth = screenWidth - 104;
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const mediaItems = post.media || [];

  const handleDelete = () => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDelete(post._id),
      },
    ]);
  };

  return (
    <View className="border-b border-gray-100 bg-white">
      <MediaPreviewModal
        media={previewIndex !== null ? mediaItems[previewIndex] : undefined}
        visible={previewIndex !== null}
        onClose={() => setPreviewIndex(null)}
      />

      <View className="flex-row p-4">
        <Image
          source={{ uri: post.user.profilePicture || "" }}
          className="w-12 h-12 rounded-full mr-3"
        />

        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center">
              <Text className="font-bold text-gray-900 mr-1">
                {post.user.firstName} {post.user.lastName}
              </Text>
              <Text className="text-gray-500 ml-1">
                @{post.user.username} · {formatDate(post.createdAt)}
              </Text>
            </View>
            {isOwnPost && (
              <TouchableOpacity onPress={handleDelete}>
                <Feather name="trash" size={20} color="#657786" />
              </TouchableOpacity>
            )}
          </View>

          {post.content && (
            <Text className="text-gray-900 text-base leading-5 mb-3">{post.content}</Text>
          )}

          {mediaItems.length > 0 && (
            <View className="mb-3">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={sliderWidth + slideGap}
                decelerationRate="fast"
                disableIntervalMomentum
                contentContainerStyle={{ paddingRight: slideGap }}
              >
                {mediaItems.map((media, index) => (
                  <TouchableOpacity
                    key={`${media.publicId || media.url}-${index}`}
                    activeOpacity={0.95}
                    onPress={() => setPreviewIndex(index)}
                    style={{ marginRight: slideGap }}
                  >
                    <PostMediaItem url={media.url} type={media.type} width={sliderWidth} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View className="flex-row gap-5 max-w-xs">
            <TouchableOpacity className="flex-row items-center" onPress={() => onComment(post)}>
              <Feather name="message-circle" size={18} color="#657786" />
              <Text className="text-gray-500 text-sm ml-2">
                {formatNumber(post.comments?.length || 0)}
              </Text>
            </TouchableOpacity>

            {/* <TouchableOpacity className="flex-row items-center">
              <Feather name="repeat" size={18} color="#657786" />
              <Text className="text-gray-500 text-sm ml-2">0</Text>
            </TouchableOpacity> */}

            <TouchableOpacity className="flex-row items-center" onPress={() => onLike(post._id)}>
              {isLiked ? (
                <AntDesign name="heart" size={18} color="#E0245E" />
              ) : (
                <Feather name="heart" size={18} color="#657786" />
              )}

              <Text className={`text-sm ml-2 ${isLiked ? "text-red-500" : "text-gray-500"}`}>
                {formatNumber(post.likes?.length || 0)}
              </Text>
            </TouchableOpacity>

            {/* <TouchableOpacity>
              <Feather name="share" size={18} color="#657786" />
            </TouchableOpacity> */}
          </View>
        </View>
      </View>
    </View>
  );
};

export default PostCard;
