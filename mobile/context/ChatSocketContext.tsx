import { createContext, ReactNode, useContext } from "react";
import { Socket } from "socket.io-client";
import { useChatSocket } from "@/hooks/useChatSocket";

type ChatSocketContextValue = {
  socket: Socket | null;
};

const ChatSocketContext = createContext<ChatSocketContextValue>({ socket: null });

export const ChatSocketProvider = ({ children }: { children: ReactNode }) => {
  const value = useChatSocket();

  return (
    <ChatSocketContext.Provider value={value}>
      {children}
    </ChatSocketContext.Provider>
  );
};

export const useChatSocketContext = () => useContext(ChatSocketContext);
