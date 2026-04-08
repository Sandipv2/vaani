import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import { postApi, useApiClient } from "../utils/api";

export type SelectedFile = {
    uri: string;
    name: string;
    type: string;
    thumbnailUri?: string;
};

const getMimeType = (asset: ImagePicker.ImagePickerAsset) => {
    if (asset.mimeType) return asset.mimeType;

    const extension = asset.uri.split(".").pop()?.toLowerCase();
    const mimeTypeMap: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        mp4: "video/mp4",
        webm: "video/webm",
        mov: "video/quicktime",
    };

    return mimeTypeMap[extension || ""] || "image/jpeg";
};

const getFileName = (asset: ImagePicker.ImagePickerAsset, index: number) => {
    if (asset.fileName) return asset.fileName;

    const mimeType = getMimeType(asset);
    const fallbackExtension = mimeType.split("/")[1] || "jpg";

    return `media-${Date.now()}-${index}.${fallbackExtension}`;
};

const buildSelectedFile = async (asset: ImagePicker.ImagePickerAsset, index: number): Promise<SelectedFile> => {
    const type = getMimeType(asset);
    const isVideo = type.startsWith("video/");

    let thumbnailUri: string | undefined;

    if (isVideo) {
        try {
            const thumbnail = await VideoThumbnails.getThumbnailAsync(asset.uri, {
                time: 0,
            });
            thumbnailUri = thumbnail.uri;
        } catch (error) {
            console.log("Failed to generate video thumbnail:", error);
        }
    }

    return {
        uri: asset.uri,
        name: getFileName(asset, index),
        type,
        thumbnailUri,
    };
};

export const useCreatePost = () => {
    const [content, setContent] = useState("");
    const [selectedMedia, setSelectedMedia] = useState<SelectedFile[]>([]);
    const api = useApiClient();
    const queryClient = useQueryClient();

    const createPostMutation = useMutation({
        mutationFn: async (postData: { content: string; media?: SelectedFile[] }) =>
            postApi.createPost(api, postData),
        onSuccess: () => {
            setContent("");
            setSelectedMedia([]);
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            Alert.alert("Success", "Post created successfully!");
        },
        onError: () => {
            Alert.alert("Error", "Failed to create post. Please try again.");
        },
    });

    const addSelectedAssets = async (assets: ImagePicker.ImagePickerAsset[]) => {
        const files = await Promise.all(
            assets.map((asset, index) => buildSelectedFile(asset, index))
        );

        setSelectedMedia((currentMedia) => [...currentMedia, ...files].slice(0, 10));
    };

    const handleCameraCapture = async (mediaType: "images" | "videos") => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.status !== "granted") {
            Alert.alert("Permission needed", "Please grant permission to access your camera");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: [mediaType],
            //   allowsEditing: mediaType === "images",
            quality: 0.8,
            videoMaxDuration: mediaType === "videos" ? 60 : undefined,
        });

        if (result.canceled) return;
        await addSelectedAssets(result.assets);
    };

    const handleGalleryPicker = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.status !== "granted") {
            Alert.alert("Permission needed", "Please grant permission to access your media library");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images", "videos"],
            allowsMultipleSelection: true,
            selectionLimit: 10,
            quality: 0.8,
        });

        if (result.canceled) return;
        await addSelectedAssets(result.assets);
    };

    const takePhotoOrVideo = () => {
        Alert.alert("Camera", "Choose what you want to capture", [
            { text: "Take Photo", onPress: () => handleCameraCapture("images") },
            { text: "Record Video", onPress: () => handleCameraCapture("videos") },
            { text: "Cancel", style: "cancel" },
        ]);
    };

    const createPost = () => {
        if (!content.trim() && selectedMedia.length === 0) {
            Alert.alert("Empty Post", "Please write something or add media before posting!");
            return;
        }

        createPostMutation.mutate({
            content: content.trim(),
            media: selectedMedia,
        });
    };

    return {
        content,
        setContent,
        selectedMedia,
        isCreating: createPostMutation.isPending,
        pickMediaFromGallery: handleGalleryPicker,
        takePhotoOrVideo,
        removeMedia: (uri: string) =>
            setSelectedMedia((currentMedia) => currentMedia.filter((file) => file.uri !== uri)),
        createPost,
    };
};
