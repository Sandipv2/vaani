import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi, useApiClient } from "@/utils/api";
import { Conversation } from "@/types";

export const useConversations = () => {
    const api = useApiClient();
    const queryClient = useQueryClient();

    const conversationsQuery = useQuery({
        queryKey: ["conversations"],
        queryFn: () => chatApi.getConversations(api),
        select: (response) => response.data.conversations as Conversation[],
    });

    const createConversationMutation = useMutation({
        mutationFn: (targetUserId: string) => chatApi.getOrCreateConversation(api, targetUserId),
        onSuccess: (response) => {
            const conversation = response.data.conversation as Conversation;

            queryClient.setQueryData<Conversation[]>(["conversations"], (currentConversations = []) => {
                const withoutCurrent = currentConversations.filter((item) => item._id !== conversation._id);
                return [conversation, ...withoutCurrent];
            });
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        },
    });

    return {
        conversations: conversationsQuery.data || [],
        isLoading: conversationsQuery.isLoading,
        isRefreshing: conversationsQuery.isRefetching,
        error: conversationsQuery.error,
        refetch: conversationsQuery.refetch,
        getOrCreateConversation: createConversationMutation.mutateAsync,
        isCreatingConversation: createConversationMutation.isPending,
    };
};
