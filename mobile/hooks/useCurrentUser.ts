import { useQuery } from "@tanstack/react-query";
import { useApiClient, userApi } from "@/utils/api";

export const useCurrentUser = () => {
    const api = useApiClient();

    const {
        data: currentUser,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ["authUser"],
        queryFn: async () => {
            try {
                return await userApi.getCurrentUser(api);
            } catch (error: any) {
                if (error?.response?.status === 404) {
                    return userApi.syncUser(api);
                }

                throw error;
            }
        },
        select: (res) => res.data.user,
        retry: (failureCount, error: any) =>
            error?.response?.status !== 404 && failureCount < 2,
    });

    return { currentUser, isLoading, error, refetch }
}
