import { useAuth } from "@clerk/expo";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_ORIGIN } from "@/utils/api";
import { ChatMessage, Conversation } from "@/types";

const canUseRealtimeSocket = !API_ORIGIN.includes("vercel.app");

const addMessageToResponse = (response: any, message: ChatMessage) => {
    if (!response?.data || !Array.isArray(response.data.messages)) {
        return response;
    }

    const alreadyExists = response.data.messages.some(
        (item: ChatMessage) => item._id === message._id
    );

    if (alreadyExists) {
        return response;
    }

    return {
        ...response,
        data: {
            ...response.data,
            messages: [...response.data.messages, message],
        },
    };
};

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

export const useChatSocket = (enabled = true) => {
    const { getToken, isSignedIn } = useAuth();
    const queryClient = useQueryClient();
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!canUseRealtimeSocket || !enabled || !isSignedIn) {
            setSocket(null);
            return;
        }

        let chatSocket: Socket | null = null;
        let shouldConnect = true;

        const connectSocket = async () => {
            const token = await getToken();

            if (!token || !shouldConnect) {
                return;
            }

            chatSocket = io(API_ORIGIN, {
                transports: ["websocket"],
                auth: { token },
                reconnectionAttempts: 2,
                reconnectionDelay: 1000,
                timeout: 5000,
            });

            chatSocket.on("newMessage", (message: ChatMessage) => {
                queryClient.setQueryData(
                    ["messages", message.conversation],
                    (currentResponse: any) => addMessageToResponse(currentResponse, message)
                );
            });

            chatSocket.on("conversationUpdated", (conversation: Conversation) => {
                queryClient.setQueryData(["conversations"], (currentResponse: any) =>
                    addConversationToResponse(currentResponse, conversation)
                );
            });

            setSocket(chatSocket);
        };

        connectSocket();

        return () => {
            shouldConnect = false;
            chatSocket?.disconnect();
            setSocket(null);
        };
    }, [enabled, getToken, isSignedIn, queryClient]);

    return useMemo(() => ({ socket }), [socket]);
};
