import { useMutation } from "@tanstack/react-query";
import { chatApi, useApiClient } from "@/utils/api";

export const useConversations = () => {
    const api = useApiClient();

    const createChannelMutation = useMutation({
        mutationFn: (targetUserId: string) => chatApi.getOrCreateChannel(api, targetUserId),
    });

    const hideChannelMutation = useMutation({
        mutationFn: (channelId: string) => chatApi.hideChannel(api, channelId),
    });

    return {
        getOrCreateConversation: createChannelMutation.mutateAsync,
        isCreatingConversation: createChannelMutation.isPending,
        deleteConversation: hideChannelMutation.mutateAsync,
        isDeletingConversation: hideChannelMutation.isPending,
    };
};
