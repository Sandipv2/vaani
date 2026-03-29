import { useClerk } from "@clerk/expo";
import { View, Text, TouchableOpacity } from "react-native";

export default function() {
    const { signOut } = useClerk();
    return (
        <View className="h-[100vh] justify-center">
            <Text className="text-center mt-5 font-bold text-xl">Home Page</Text>

            <TouchableOpacity
                onPress={() => signOut()}
                className="mt-5 px-5"
            >
                <Text className="font-bold bg-slate-400 rounded-full text-center p-3 text-2xl">Logout</Text>
            </TouchableOpacity>
        </View>
    )
}