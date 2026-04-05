import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, Modal, Pressable, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { SelectedFile, useCreatePost } from '@/hooks/useCreatePost'
import { useUser } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';

const MediaPreviewModal = ({
    media,
    onClose,
}: {
    media: SelectedFile | null;
    onClose: () => void;
}) => {
    const player = useVideoPlayer(media?.type.startsWith("video/") ? media.uri : null, (videoPlayer) => {
        videoPlayer.pause();
    });

    return (
        <Modal visible={Boolean(media)} transparent animationType="fade" onRequestClose={onClose}>
            <View className="flex-1 bg-black/90 justify-center items-center px-4">
                <Pressable className="absolute top-14 right-6 z-10" onPress={onClose}>
                    <Feather name="x" size={28} color="white" />
                </Pressable>

                {media?.type.startsWith("video/") ? (
                    <VideoView
                        player={player}
                        nativeControls
                        allowsFullscreen
                        style={{ width: "100%", height: 320, borderRadius: 24 }}
                    />
                ) : media ? (
                    <Image
                        source={{ uri: media.uri }}
                        style={{ width: "100%", height: 320, borderRadius: 24 }}
                        resizeMode="contain"
                    />
                ) : null}
            </View>
        </Modal>
    );
};

const PostComposer = () => {
    const [previewMedia, setPreviewMedia] = useState<SelectedFile | null>(null);

    const {
        content,
        setContent,
        selectedMedia,
        isCreating,
        pickMediaFromGallery,
        takePhotoOrVideo,
        removeMedia,
        createPost
    } = useCreatePost();

    const { user } = useUser();

    return (
        <View className="border-b border-gray-100 p-4 bg-white">
            <MediaPreviewModal media={previewMedia} onClose={() => setPreviewMedia(null)} />

            <View className="flex-row">
                <Image source={{ uri: user?.imageUrl }} className="w-12 h-12 rounded-full mr-3" />
                <View className="flex-1">
                    <TextInput
                        className="text-gray-900 text-lg"
                        placeholder="What's happening?"
                        placeholderTextColor="#657786"
                        multiline
                        value={content}
                        onChangeText={setContent}
                        maxLength={280}
                    />
                </View>
            </View>

            {selectedMedia.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mt-3 ml-15"
                    contentContainerStyle={{ gap: 12 }}
                >
                    {selectedMedia.map((media) => {
                        const isVideo = media.type.startsWith("video/");

                        return (
                            <View key={media.uri} className="relative">
                                <TouchableOpacity activeOpacity={0.9} onPress={() => setPreviewMedia(media)}>
                                    {isVideo ? (
                                        <View className="w-48 h-48 rounded-2xl overflow-hidden bg-gray-900">
                                            {media.thumbnailUri ? (
                                                <Image
                                                    source={{ uri: media.thumbnailUri }}
                                                    className="w-full h-full"
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <View className="w-full h-full items-center justify-center px-4">
                                                    <Feather name="video" size={28} color="white" />
                                                    <Text className="text-white text-xs mt-3 text-center" numberOfLines={2}>
                                                        {media.name}
                                                    </Text>
                                                </View>
                                            )}

                                            <View className="absolute inset-0 items-center justify-center">
                                                <View className="w-12 h-12 rounded-full bg-black/50 items-center justify-center">
                                                    <Feather name="play" size={20} color="white" />
                                                </View>
                                            </View>
                                        </View>
                                    ) : (
                                        <Image
                                            source={{ uri: media.uri }}
                                            className="w-48 h-48 rounded-2xl"
                                            resizeMode="cover"
                                        />
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full items-center justify-center"
                                    onPress={() => removeMedia(media.uri)}
                                >
                                    <Feather name="x" size={16} color="white" />
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </ScrollView>
            )}

            <View className="flex-row justify-between items-center mt-3">
                <View className="flex-row">
                    <TouchableOpacity className="mr-4" onPress={pickMediaFromGallery}>
                        <Feather name="image" size={20} color="#1DA1F2" />
                    </TouchableOpacity>
                    <TouchableOpacity className="mr-4" onPress={takePhotoOrVideo}>
                        <Feather name="camera" size={20} color="#1DA1F2" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    className="bg-blue-500 px-4 py-2 rounded-full"
                    onPress={createPost}
                    disabled={isCreating}
                >
                    {isCreating ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text className='font-semibold text-white'>
                            Post
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default PostComposer
