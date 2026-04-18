import { useState } from "react";
import { Alert } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { ProfileImageFile, useApiClient, userApi } from "../utils/api";
import { useCurrentUser } from "./useCurrentUser";

const getMimeType = (asset: ImagePicker.ImagePickerAsset) => {
    if (asset.mimeType) return asset.mimeType;

    const extension = asset.uri.split(".").pop()?.toLowerCase();
    const mimeTypeMap: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
    };

    return mimeTypeMap[extension || ""] || "image/jpeg";
};

const getFileName = (asset: ImagePicker.ImagePickerAsset, fieldName: "profilePicture" | "bannerImage") => {
    if (asset.fileName) return asset.fileName;

    const mimeType = getMimeType(asset);
    const fallbackExtension = mimeType.split("/")[1] || "jpg";

    return `${fieldName}-${Date.now()}.${fallbackExtension}`;
};

export const useProfile = () => {
    const api = useApiClient();

    const queryClient = useQueryClient();
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        bio: "",
        location: "",
        profilePicture: "",
        bannerImage: "",
    });
    const [selectedImages, setSelectedImages] = useState<{
        profilePicture: ProfileImageFile | null;
        bannerImage: ProfileImageFile | null;
    }>({
        profilePicture: null,
        bannerImage: null,
    });
    const { currentUser } = useCurrentUser();

    const updateProfileMutation = useMutation({
        mutationFn: (profileData: {
            firstName: string;
            lastName: string;
            bio: string;
            location: string;
            profilePicture?: ProfileImageFile | null;
            bannerImage?: ProfileImageFile | null;
        }) => userApi.updateProfile(api, profileData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
            setIsEditModalVisible(false);
            setSelectedImages({
                profilePicture: null,
                bannerImage: null,
            });
            Alert.alert("Success", "Profile updated successfully!");
        },
        onError: (error: any) => {
            Alert.alert("Error", error.response?.data?.error || "Failed to update profile");
        },
    });

    const openEditModal = () => {
        if (currentUser) {
            setFormData({
                firstName: currentUser.firstName || "",
                lastName: currentUser.lastName || "",
                bio: currentUser.bio || "",
                location: currentUser.location || "",
                profilePicture: currentUser.profilePicture || "",
                bannerImage: currentUser.bannerImage || "",
            });
        }
        setSelectedImages({
            profilePicture: null,
            bannerImage: null,
        });
        setIsEditModalVisible(true);
    };

    const updateFormField = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const pickImage = async (field: "profilePicture" | "bannerImage") => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.status !== "granted") {
            Alert.alert("Permission needed", "Please grant permission to access your media library");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: field === "profilePicture" ? [1, 1] : [16, 9],
            quality: 0.8,
        });

        if (result.canceled) return;

        const asset = result.assets[0];
        const selectedFile = {
            uri: asset.uri,
            name: getFileName(asset, field),
            type: getMimeType(asset),
        };

        setSelectedImages((prev) => ({
            ...prev,
            [field]: selectedFile,
        }));

        setFormData((prev) => ({
            ...prev,
            [field]: asset.uri,
        }));
    };

    const saveProfile = () => {
        updateProfileMutation.mutate({
            firstName: formData.firstName,
            lastName: formData.lastName,
            bio: formData.bio,
            location: formData.location,
            profilePicture: selectedImages.profilePicture,
            bannerImage: selectedImages.bannerImage,
        });
    };

    return {
        isEditModalVisible,
        formData,
        openEditModal,
        closeEditModal: () => setIsEditModalVisible(false),
        saveProfile,
        updateFormField,
        pickImage,
        isUpdating: updateProfileMutation.isPending,
        refetch: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
    };
}
