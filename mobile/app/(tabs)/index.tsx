import { Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import SignOutButton from '@/components/SignOutButton'

const HomeScreen = () => {
  return (
    <SafeAreaView>
      <Text>index</Text>
      <SignOutButton/>
    </SafeAreaView>
  )
}

export default HomeScreen