import axios, { AxiosInstance } from "axios";
import { useAuth } from "@clerk/expo";

const API_BASE_URL = `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1` || "https://vaani-coral.vercel.app/api/v1";

export type UploadMediaFile = {
    uri: string;
    name: string;
    type: string;
};

export type ProfileImageFile = {
    uri: string;
    name: string;
    type: string;
};

type UpdateProfilePayload = {
    firstName: string;
    lastName: string;
    bio: string;
    location: string;
    profilePicture?: ProfileImageFile | null;
    bannerImage?: ProfileImageFile | null;
};

type CreatePostPayload = {
    content: string;
    media?: UploadMediaFile[];
};

export const createApiClient = (getToken: () => Promise<string | null>): AxiosInstance => {
    const api = axios.create({ baseURL: API_BASE_URL });

    api.interceptors.request.use(async (config) => {
        const token = await getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    })

    return api;
}

export const useApiClient = (): AxiosInstance => {
    const { getToken } = useAuth();
    return createApiClient(getToken);
};

export const userApi = {
    syncUser: (api: AxiosInstance) => api.post("/users/sync"),
    getCurrentUser: (api: AxiosInstance) => api.get("/users/me"),
    updateProfile: (api: AxiosInstance, data: UpdateProfilePayload) => {
        const formData = new FormData();

        formData.append("firstName", data.firstName);
        formData.append("lastName", data.lastName);
        formData.append("bio", data.bio);
        formData.append("location", data.location);

        if (data.profilePicture) {
            formData.append("profilePicture", {
                uri: data.profilePicture.uri,
                name: data.profilePicture.name,
                type: data.profilePicture.type,
            } as any);
        }

        if (data.bannerImage) {
            formData.append("bannerImage", {
                uri: data.bannerImage.uri,
                name: data.bannerImage.name,
                type: data.bannerImage.type,
            } as any);
        }

        return api.put("/users/profile", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
};

export const postApi = {
    createPost: (api: AxiosInstance, data: CreatePostPayload) => {
        const formData = new FormData();

        if (data.content) {
            formData.append("content", data.content);
        }

        data.media?.forEach((file) => {
            formData.append("media", {
                uri: file.uri,
                name: file.name,
                type: file.type,
            } as any);
        });

        return api.post("/posts", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
    getPosts: (api: AxiosInstance) => api.get("/posts"),
    getUserPosts: (api: AxiosInstance, username: string) => api.get(`/posts/user/${username}`),
    likePost: (api: AxiosInstance, postId: string) => api.post(`/posts/${postId}/like`),
    deletePost: (api: AxiosInstance, postId: string) => api.delete(`/posts/${postId}`),
};

export const commentApi = {
    createComment: (api: AxiosInstance, postId: string, content: string) =>
        api.post(`/comments/post/${postId}`, { content }),
    deleteComment: (api: AxiosInstance, commentId: string) =>
        api.delete(`/comments/${commentId}`),
};
