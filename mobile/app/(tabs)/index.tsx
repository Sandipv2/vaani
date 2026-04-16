import { ScrollView, View, Image, RefreshControl } from 'react-native'
import React, { useCallback, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import SignOutButton from '@/components/SignOutButton'
import { useUserSync } from '@/hooks/useUserSync'
import PostComposer from '@/components/PostComposer'
import PostsList from '@/components/PostsList'
import { useQueryClient } from '@tanstack/react-query'

const HomeScreen = () => {
  useUserSync();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      await Promise.allSettled([
        queryClient.refetchQueries({ queryKey: ['posts'], exact: true }),
        queryClient.refetchQueries({ queryKey: ['authUser'], exact: true }),
        queryClient.refetchQueries({ queryKey: ['notifications'], exact: true }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  return (
    <SafeAreaView className="flex-1 bg-white">

      <View className="relative items-center justify-center px-4 py-3 border-b border-gray-100">
        <Image
          source={require('../../assets/images/vaani_logo.png')}
          className="w-20 h-8"
          resizeMode="contain"
        />

        <View className="absolute right-4">
          <SignOutButton />
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <PostComposer />
        <PostsList/>
      </ScrollView>

    </SafeAreaView>
  )
}

export default HomeScreen
