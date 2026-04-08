import { ScrollView, View, Image } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import SignOutButton from '@/components/SignOutButton'
import { useUserSync } from '@/hooks/useUserSync'
import PostComposer from '@/components/PostComposer'
import PostsList from '@/components/PostsList'

const HomeScreen = () => {
  useUserSync();
  return (
    <SafeAreaView className="flex-1 bg-white">

      <View className="relative items-center justify-center px-4 py-3 border-b border-gray-100">
        <Image
          source={require('../../assets/images/vaani_logo_color.png')}
          className="w-20 h-8"
          resizeMode="contain"
        />

        <View className="absolute right-4">
          <SignOutButton />
        </View>
      </View>

      <ScrollView>
        <PostComposer />
        <PostsList/>
      </ScrollView>

    </SafeAreaView>
  )
}

export default HomeScreen
