import { useQuery } from "@tanstack/react-query";
import { chatApi, useApiClient } from "@/utils/api";
import { ChatMessage } from "@/types";

export const useMessages = (conversationId?: string) => {
    const api = useApiClient();

    const messagesQuery = useQuery({
        queryKey: ["messages", conversationId],
        queryFn: () => chatApi.getMessages(api, conversationId || ""),
        enabled: Boolean(conversationId),
        select: (response) => response.data.messages as ChatMessage[],
    });

    return {
        messages: messagesQuery.data || [],
        isLoading: messagesQuery.isLoading,
        error: messagesQuery.error,
        refetch: messagesQuery.refetch,
    };
};
