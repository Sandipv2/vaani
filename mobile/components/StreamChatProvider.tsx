import { useAuth } from "@clerk/expo";
import axios, { isAxiosError } from "axios";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { StreamChat } from "stream-chat";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { API_ORIGIN } from "@/utils/api";

type Props = {
  children: ReactNode;
};

type ChatContextValue = {
  client: StreamChat | null;
  error: string | null;
  isConnecting: boolean;
  reconnect: () => void;
  unreadCount: number;
};

const StreamChatContext = createContext<ChatContextValue>({
  client: null,
  error: null,
  isConnecting: false,
  reconnect: () => undefined,
  unreadCount: 0,
});

export const useStreamChat = () => useContext(StreamChatContext);

const StreamChatConnection = ({ children }: Props) => {
  const { getToken } = useAuth();
  const { currentUser } = useCurrentUser();
  const getTokenRef = useRef(getToken);
  const [client, setClient] = useState<StreamChat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const userData = useMemo(() => {
    if (!currentUser) {
      return null;
    }

    const name =
      `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() ||
      currentUser.username;

    return {
      id: currentUser._id,
      name,
      image: currentUser.profilePicture || undefined,
      username: currentUser.username,
    };
  }, [currentUser]);

  useEffect(() => {
    let isMounted = true;
    let nextClient: StreamChat | null = null;

    const connect = async () => {
      if (!userData) {
        setClient(null);
        setIsConnecting(false);
        return;
      }

      setIsConnecting(true);
      setError(null);

      try {
        const authToken = await getTokenRef.current();
        const response = await axios.get(`${API_ORIGIN}/api/v1/chat/token`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        });
        const credentials = response.data as {
          apiKey: string;
          token: string;
        };

        nextClient = StreamChat.getInstance(credentials.apiKey);

        await nextClient.connectUser(userData, credentials.token);

        if (!isMounted) {
          await nextClient.disconnectUser();
          return;
        }

        setClient(nextClient);
        setUnreadCount(Number((nextClient.user as any)?.total_unread_count || 0));

        const subscription = nextClient.on((event: any) => {
          if (
            event.total_unread_count !== undefined ||
            event.type === "message.new" ||
            event.type === "notification.mark_read"
          ) {
            setUnreadCount(
              Number(
                event.total_unread_count ??
                  (nextClient?.user as any)?.total_unread_count ??
                  0
              )
            );
          }
        });

        return () => subscription.unsubscribe();
      } catch (connectError) {
        if (isMounted) {
          setError(
            isAxiosError(connectError)
              ? connectError.response?.data?.error ||
                  connectError.response?.data?.message ||
                  connectError.message
              : connectError instanceof Error
                ? connectError.message
              : "Unable to connect to chat"
          );
          setClient(null);
        }
      } finally {
        if (isMounted) {
          setIsConnecting(false);
        }
      }
    };

    let unsubscribe: (() => void) | undefined;

    connect().then((cleanup) => {
      unsubscribe = cleanup;
    });

    return () => {
      isMounted = false;
      unsubscribe?.();
      nextClient?.disconnectUser();
      setClient(null);
    };
  }, [reconnectCount, userData]);

  return (
    <StreamChatContext.Provider
      value={{
        client,
        error,
        isConnecting,
        reconnect: () => setReconnectCount((count) => count + 1),
        unreadCount,
      }}
    >
      {children}
    </StreamChatContext.Provider>
  );
};

export const StreamChatProvider = ({ children }: Props) => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded || !isSignedIn) {
    return <>{children}</>;
  }

  return <StreamChatConnection>{children}</StreamChatConnection>;
};
