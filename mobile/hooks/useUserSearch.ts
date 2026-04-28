import { useQuery } from "@tanstack/react-query";
import { User } from "@/types";
import { useApiClient, userApi } from "@/utils/api";

export const useUserSearch = (query: string) => {
    const api = useApiClient();
    const trimmedQuery = query.trim();

    const {
        data: users,
        isFetching,
        error,
    } = useQuery({
        queryKey: ["userSearch", trimmedQuery],
        queryFn: () => userApi.searchUsers(api, trimmedQuery),
        enabled: trimmedQuery.length > 0,
        select: (response) => response.data.users as User[],
    });

    return {
        users: users || [],
        isSearching: isFetching,
        error,
        hasQuery: trimmedQuery.length > 0,
    };
};
