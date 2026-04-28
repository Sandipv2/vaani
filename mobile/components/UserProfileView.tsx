import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import type { ReactNode } from "react";
import { Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import PostsList from "@/components/PostsList";
import { User } from "@/types";

type UserProfileViewProps = {
  user: User;
  postCount: number;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  headerRight?: ReactNode;
  action?: ReactNode;
};

const DEFAULT_BANNER =
  "https://www.solidbackgrounds.com/images/1920x1080/1920x1080-light-blue-solid-color-background.jpg";
const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

const UserProfileView = ({
  user,
  postCount,
  isRefreshing = false,
  onRefresh,
  headerRight,
  action,
}: UserProfileViewProps) => {
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username;
  const joinedAt = user.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : null;

  return (
    <>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">{fullName}</Text>
        {headerRight}
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#1DA1F2" />
          ) : undefined
        }
      >
        <Image
          source={{ uri: user.bannerImage || DEFAULT_BANNER }}
          className="w-full h-48"
          resizeMode="cover"
        />

        <View className="px-4 pb-4 border-b border-gray-100">
          <View className="flex-row justify-between items-end -mt-16 mb-4">
            <Image
              source={{ uri: user.profilePicture || DEFAULT_AVATAR }}
              className="w-32 h-32 rounded-full border-4 border-white"
            />
            {action}
          </View>

          <View className="mb-4">
            <Text className="text-xl font-bold text-gray-900 mb-1">{fullName}</Text>
            <Text className="text-gray-500 mb-2">@{user.username}</Text>
            {!!user.bio && <Text className="text-gray-900 mb-3">{user.bio}</Text>}

            {!!user.location && (
              <View className="flex-row items-center mb-2">
                <Feather name="map-pin" size={16} color="#657786" />
                <Text className="text-gray-500 ml-2">{user.location}</Text>
              </View>
            )}

            {joinedAt && (
              <View className="flex-row items-center mb-3">
                <Feather name="calendar" size={16} color="#657786" />
                <Text className="text-gray-500 ml-2">Joined {joinedAt}</Text>
              </View>
            )}

            <View className="flex-row">
              <TouchableOpacity className="mr-6">
                <Text className="text-gray-900">
                  <Text className="font-bold">{user.following?.length || 0}</Text>
                  <Text className="text-gray-500"> Following</Text>
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className="mr-6">
                <Text className="text-gray-900">
                  <Text className="font-bold">{user.followers?.length || 0}</Text>
                  <Text className="text-gray-500"> Followers</Text>
                </Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text className="text-gray-900">
                  <Text className="font-bold">{postCount}</Text>
                  <Text className="text-gray-500"> Posts</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <PostsList username={user.username} />
      </ScrollView>
    </>
  );
};

export default UserProfileView;
