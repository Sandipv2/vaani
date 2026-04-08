import { useSocialAuth } from "@/hooks/useSocialAuth";
import { Image, TouchableOpacity, View, Text, ActivityIndicator } from "react-native";

export default function Index() {
  const { loadingStrategy, handleSocialAuth } = useSocialAuth();
  const isGoogleLoading = loadingStrategy === "oauth_google";
  const isAppleLoading = loadingStrategy === "oauth_apple";
  const isLoading = loadingStrategy !== null;

  return (
    <View className="flex-1 bg-white px-8 justify-center">
      <View className="items-center mb-10">
        <Image
          source={require("../../assets/images/vaani_logo.png")}
          className="w-56 h-24"
          resizeMode="contain"
        />
      </View>

      <View className="gap-3">
        <TouchableOpacity
          className="flex-row items-center justify-center bg-white border border-gray-300 rounded-full py-3 px-6"
          onPress={() => handleSocialAuth("oauth_google")}
          disabled={isLoading}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          {isGoogleLoading ? (
            <ActivityIndicator color="#4285F4" className="size-10" />
          ) : (
            <View className="flex-row items-center justify-center">
              <Image
                source={require("../../assets/images/google.png")}
                className="size-10 mr-3"
                resizeMode="contain"
              />
              <Text>Continue with Google</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center justify-center bg-white border border-gray-300 rounded-full py-3 px-6"
          onPress={() => handleSocialAuth("oauth_apple")}
          disabled={isLoading}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          {isAppleLoading ? (
            <ActivityIndicator color="#4285F4" className="size-10" />
          ) : (
            <View className="flex-row items-center justify-center">
              <Image
                source={require("../../assets/images/apple.png")}
                className="size-10 mr-3"
                resizeMode="contain"
              />
              <Text>Continue with Apple</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text className="text-center text-gray-500 text-xs mt-6 px-2">
        By signing up, you agree to our <Text className="text-blue-500">Terms</Text>
        {", "}
        <Text className="text-blue-500">Privacy Policy</Text>
        {", and "}
        <Text className="text-blue-500">Cookie Use</Text>.
      </Text>
    </View>
  );
}
