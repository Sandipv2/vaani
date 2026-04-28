import { useAuth } from "@clerk/expo";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_ORIGIN } from "@/utils/api";
import { ChatMessage, Conversation } from "@/types";

export const useChatSocket = () => {
    const { getToken, isSignedIn } = useAuth();
    const queryClient = useQueryClient();
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!isSignedIn) {
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
            });

            chatSocket.on("newMessage", (message: ChatMessage) => {
                queryClient.setQueryData<ChatMessage[]>(
                    ["messages", message.conversation],
                    (currentMessages = []) => {
                        const alreadyExists = currentMessages.some((item) => item._id === message._id);
                        return alreadyExists ? currentMessages : [...currentMessages, message];
                    }
                );
            });

            chatSocket.on("conversationUpdated", (conversation: Conversation) => {
                queryClient.setQueryData<Conversation[]>(["conversations"], (currentConversations = []) => {
                    const withoutUpdated = currentConversations.filter((item) => item._id !== conversation._id);
                    return [conversation, ...withoutUpdated];
                });
            });

            setSocket(chatSocket);
        };

        connectSocket();

        return () => {
            shouldConnect = false;
            chatSocket?.disconnect();
        };
    }, [getToken, isSignedIn, queryClient]);

    return useMemo(() => ({ socket }), [socket]);
};
