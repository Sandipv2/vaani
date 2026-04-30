import { useAuth } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import React from 'react'
import { Redirect, Tabs } from 'expo-router'
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStreamChat } from "@/components/StreamChatProvider";
import { useUserSync } from "@/hooks/useUserSync";

const MessagesTabIcon = ({ color, size }: { color: string; size: number }) => {
    const { unreadCount } = useStreamChat();

    return (
        <View>
            <Feather name="mail" size={size} color={color} />
            {unreadCount > 0 && (
                <View className="absolute -right-2 -top-1 min-w-4 items-center justify-center rounded-full bg-red-500 px-1">
                    <Text className="text-[10px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </Text>
                </View>
            )}
        </View>
    );
};

const TabsLayout = () => {
    useUserSync();

    const insets = useSafeAreaInsets();
    const { isLoaded, isSignedIn } = useAuth();

    if (!isLoaded) {
        return null;
    }

    if (!isSignedIn) {
        return <Redirect href="/(auth)" />;
    }

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: "#1DA1F2",
                tabBarInactiveTintColor: "#657786",
                tabBarStyle: {
                    backgroundColor: "#fff",
                    borderTopWidth: 1,
                    borderTopColor: "#E1E8ED",
                    paddingTop: 8,
                    height: 60 + insets.bottom
                },
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name='index'
                options={{
                    title: "",
                    tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />
                }}
            />
            <Tabs.Screen
                name='search'
                options={{
                    title: "",
                    tabBarIcon: ({ color, size }) => <Feather name="search" size={size} color={color} />
                }}
            />
            <Tabs.Screen
                name='notifications'
                options={{
                    title: "",
                    tabBarIcon: ({ color, size }) => <Feather name="bell" size={size} color={color} />
                }}
            />
            <Tabs.Screen
                name='messages'
                options={{
                    title: "",
                    tabBarIcon: ({ color, size }) => <MessagesTabIcon color={color} size={size} />
                }}
            />
            <Tabs.Screen
                name='profile'
                options={{
                    title: "",
                    tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />
                }}
            />
        </Tabs>
    )
}

export default TabsLayout
