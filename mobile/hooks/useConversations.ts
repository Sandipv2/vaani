import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi, useApiClient } from "@/utils/api";
import { Conversation } from "@/types";

const addConversationToResponse = (response: any, conversation: Conversation) => {
    if (!response?.data || !Array.isArray(response.data.conversations)) {
        return response;
    }

    const otherConversations = response.data.conversations.filter(
        (item: Conversation) => item._id !== conversation._id
    );

    return {
        ...response,
        data: {
            ...response.data,
            conversations: [conversation, ...otherConversations],
        },
    };
};

const removeConversationFromResponse = (response: any, conversationId: string) => {
    if (!response?.data || !Array.isArray(response.data.conversations)) {
        return response;
    }

    return {
        ...response,
        data: {
            ...response.data,
            conversations: response.data.conversations.filter(
                (item: Conversation) => item._id !== conversationId
            ),
        },
    };
};

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

            queryClient.setQueryData(["conversations"], (currentResponse: any) =>
                addConversationToResponse(currentResponse, conversation)
            );
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        },
    });

    const deleteConversationMutation = useMutation({
        mutationFn: (conversationId: string) => chatApi.deleteConversation(api, conversationId),
        onMutate: async (conversationId: string) => {
            await queryClient.cancelQueries({ queryKey: ["conversations"] });

            const previousConversations = queryClient.getQueryData(["conversations"]);

            queryClient.setQueryData(["conversations"], (currentResponse: any) =>
                removeConversationFromResponse(currentResponse, conversationId)
            );
            queryClient.removeQueries({ queryKey: ["messages", conversationId] });

            return { previousConversations };
        },
        onError: (_error, _conversationId, context) => {
            if (context?.previousConversations) {
                queryClient.setQueryData(["conversations"], context.previousConversations);
            }
        },
        onSettled: () => {
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
        deleteConversation: deleteConversationMutation.mutateAsync,
        isDeletingConversation: deleteConversationMutation.isPending,
    };
};
