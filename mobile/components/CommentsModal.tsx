import { useComments } from "@/hooks/useComments";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Post, PostMedia } from "@/types";
import { formatDate } from "@/utils/formatters";
import { Feather } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";
import { useEffect, useState } from "react";
import {
    Alert,
    View,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
    Image,
    TextInput,
    ActivityIndicator,
    useWindowDimensions,
} from "react-native";

interface CommentsModalProps {
    selectedPost: Post | null;
    onClose: () => void;
}

const PostMediaItem = ({ media }: { media: PostMedia }) => {
    const [aspectRatio, setAspectRatio] = useState(1);
    const player = useVideoPlayer(media.type === "video" ? media.url : null, (videoPlayer) => {
        videoPlayer.pause();
    });
    const sourceLoad = useEvent(player, "sourceLoad", null);

    useEffect(() => {
        if (media.type === "image") {
            Image.getSize(media.url, (w, h) => h > 0 && setAspectRatio(w / h));
        }
    }, [media]);

    useEffect(() => {
        const track = sourceLoad?.availableVideoTracks?.[0];
        if (media.type === "video" && track?.size?.height) {
            setAspectRatio(track.size.width / track.size.height);
        }
    }, [media, sourceLoad]);

    if (media.type === "video") {
        return (
            <View style={{ aspectRatio }} className="w-full rounded-2xl mb-3 overflow-hidden bg-black">
                <VideoView player={player} nativeControls style={{ width: "100%", height: "100%" }} />
            </View>
        );
    }

    return (
        <Image
            source={{ uri: media.url }}
            style={{ width: "100%", aspectRatio, borderRadius: 16, marginBottom: 12 }}
            resizeMode="contain"
        />
    );
};

const CommentsModal = ({ selectedPost, onClose }: CommentsModalProps) => {
    const {
        commentText,
        setCommentText,
        createComment,
        deleteComment,
        isCreatingComment,
        isDeletingComment,
    } = useComments();
    const { currentUser } = useCurrentUser();
    const { width: screenWidth } = useWindowDimensions();

    const handleClose = () => {
        onClose();
        setCommentText("");
    };

    const handleDeleteComment = (commentId: string) => {
        Alert.alert("Delete Comment", "Are you sure you want to delete this comment?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => deleteComment(commentId),
            },
        ]);
    };

    const mediaItems = selectedPost?.media?.length
        ? selectedPost.media
        : selectedPost?.image
            ? [{ url: selectedPost.image, type: "image" as const }]
            : [];
    const slideGap = 3;
    const sliderWidth = screenWidth - 56;

    return (
        <Modal
            visible={!!selectedPost}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            {/* MODAL HEADER */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <TouchableOpacity onPress={handleClose}>
                    <Text className="text-blue-500 text-lg">Close</Text>
                </TouchableOpacity>
                <Text className="text-lg font-semibold">Comments</Text>
                <View className="w-12" />
            </View>

            {selectedPost && (
                <ScrollView className="flex-1">
                    {/* ORIGINAL POST */}
                    <View className="border-b border-gray-100 bg-white p-4">
                        <View className="flex-row">
                            <Image
                                source={{ uri: selectedPost.user.profilePicture }}
                                className="size-12 rounded-full mr-3"
                            />

                            <View className="flex-1">
                                <View className="flex-row items-center mb-1">
                                    <Text className="font-bold text-gray-900 mr-1">
                                        {selectedPost.user.firstName} {selectedPost.user.lastName}
                                    </Text>
                                    <Text className="text-gray-500 ml-1">@{selectedPost.user.username} · {formatDate(selectedPost.createdAt)}</Text>
                                </View>

                                {selectedPost.content && (
                                    <Text className="text-gray-900 text-base leading-5 mb-3">
                                        {selectedPost.content}
                                    </Text>
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
                                                <View
                                                    key={`${media.publicId || media.url}-${index}`}
                                                    style={{ width: sliderWidth, marginRight: slideGap }}
                                                >
                                                    <PostMediaItem media={media} />
                                                </View>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* COMMENTS LIST */}
                    {selectedPost.comments.map((comment) => (
                        <View key={comment._id} className="border-b border-gray-100 bg-white p-4">
                            <View className="flex-row">
                                <Image
                                    source={{ uri: comment.user.profilePicture }}
                                    className="w-10 h-10 rounded-full mr-3"
                                />

                                <View className="flex-1">
                                    <View className="mb-1 flex-row items-center justify-between">
                                        <View className="flex-row items-center pr-3">
                                            <Text className="font-bold text-gray-900 mr-1">
                                                {comment.user.firstName} {comment.user.lastName}
                                            </Text>
                                            <Text className="text-gray-500 text-sm ml-1">
                                                @{comment.user.username} · {formatDate(comment.createdAt)}
                                            </Text>
                                        </View>

                                        {currentUser?._id === comment.user._id && (
                                            <TouchableOpacity
                                                onPress={() => handleDeleteComment(comment._id)}
                                                disabled={isDeletingComment}
                                            >
                                                <Feather
                                                    name="trash-2"
                                                    size={16}
                                                    color={isDeletingComment ? "#9CA3AF" : "#EF4444"}
                                                />
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    <Text className="text-gray-900 text-base leading-5 mb-2">{comment.content}</Text>
                                </View>
                            </View>
                        </View>
                    ))}

                    {/* ADD COMMENT INPUT */}

                    <View className="p-4 border-t border-gray-100">
                        <View className="flex-row">
                            <Image
                                source={{ uri: currentUser?.profilePicture }}
                                className="size-10 rounded-full mr-3"
                            />

                            <View className="flex-1">
                                <TextInput
                                    className="border border-gray-200 rounded-lg p-3 text-base mb-3"
                                    placeholder="Write a comment..."
                                    value={commentText}
                                    onChangeText={setCommentText}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />

                                <TouchableOpacity
                                    className={`px-4 py-2 rounded-lg self-start ${commentText.trim() ? "bg-blue-500" : "bg-gray-300"
                                        }`}
                                    onPress={() => createComment(selectedPost._id)}
                                    disabled={isCreatingComment || !commentText.trim()}
                                >
                                    {isCreatingComment ? (
                                        <ActivityIndicator size={"small"} color={"white"} />
                                    ) : (
                                        <Text
                                            className={`font-semibold ${commentText.trim() ? "text-white" : "text-gray-500"
                                                }`}
                                        >
                                            Reply
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            )}
        </Modal>
    )
}

export default CommentsModal
