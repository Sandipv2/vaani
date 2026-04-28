import { useQuery } from "@tanstack/react-query";
import { User } from "@/types";
import { useApiClient, userApi } from "@/utils/api";

export const useUserProfile = (username?: string) => {
    const api = useApiClient();

    const {
        data: user,
        isLoading,
        isRefetching,
        error,
        refetch,
    } = useQuery({
        queryKey: ["userProfile", username],
        queryFn: () => userApi.getUserProfile(api, username || ""),
        enabled: Boolean(username),
        select: (response) => response.data.user as User,
    });

    return {
        user,
        isLoading,
        isRefreshing: isRefetching,
        error,
        refetch,
    };
};
