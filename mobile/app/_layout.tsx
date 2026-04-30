import { Stack } from "expo-router";
import { ClerkProvider } from '@clerk/expo'
import { tokenCache } from '@clerk/expo/token-cache'
import "../global.css";
import { useEffect } from "react";
import { Platform } from "react-native";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  disableAppSwitcherProtectionAsync,
  enableAppSwitcherProtectionAsync,
  usePreventScreenCapture,
} from "expo-screen-capture";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StreamChatProvider } from "@/components/StreamChatProvider";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

const queryClient = new QueryClient();

const AppPrivacyGuard = () => {
  usePreventScreenCapture("vaani-global-privacy");

  useEffect(() => {
    if (Platform.OS !== "ios") {
      return;
    }

    enableAppSwitcherProtectionAsync(0.35);

    return () => {
      disableAppSwitcherProtectionAsync();
    };
  }, []);

  return null;
};

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppPrivacyGuard />
          <StreamChatProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            </Stack>
          </StreamChatProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
