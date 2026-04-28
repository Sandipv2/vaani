import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserSearch } from "@/hooks/useUserSearch";
import { User } from "@/types";

const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

const SearchResult = ({ user }: { user: User }) => {
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username;

  return (
    <TouchableOpacity
      className="flex-row items-center px-4 py-3 border-b border-gray-100"
      activeOpacity={0.75}
      onPress={() =>
        router.push({
          pathname: "/user/[username]",
          params: { username: user.username },
        })
      }
    >
      <Image
        source={{ uri: user.profilePicture || DEFAULT_AVATAR }}
        className="w-12 h-12 rounded-full mr-3"
      />
      <View className="flex-1">
        <Text className="text-base font-bold text-gray-900">{fullName}</Text>
        <Text className="text-gray-500">@{user.username}</Text>
        {!!user.bio && <Text className="text-gray-700 mt-1" numberOfLines={2}>{user.bio}</Text>}
      </View>
      <Feather name="chevron-right" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
};

const SearchScreen = () => {
  const [query, setQuery] = useState("");
  const { users, isSearching, error, hasQuery } = useUserSearch(query);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-3">
          <Feather name="search" size={20} color="#657786" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search people"
            className="flex-1 ml-3 text-base text-gray-900"
            placeholderTextColor="#657786"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Feather name="x" size={18} color="#657786" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        {!hasQuery && (
          <View className="p-8 items-center">
            <Feather name="users" size={32} color="#9CA3AF" />
            <Text className="text-gray-500 mt-3 text-center">Search by name or username.</Text>
          </View>
        )}

        {hasQuery && isSearching && users.length === 0 && (
          <View className="p-8 items-center">
            <ActivityIndicator size="large" color="#1DA1F2" />
            <Text className="text-gray-500 mt-2">Searching users...</Text>
          </View>
        )}

        {hasQuery && error && (
          <View className="p-8 items-center">
            <Text className="text-gray-500 text-center">Failed to search users</Text>
          </View>
        )}

        {hasQuery && !isSearching && !error && users.length === 0 && (
          <View className="p-8 items-center">
            <Text className="text-gray-500 text-center">No users found</Text>
          </View>
        )}

        {users.map((user) => (
          <SearchResult key={user._id} user={user} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SearchScreen;
