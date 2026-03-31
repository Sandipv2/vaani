import { useClerk } from "@clerk/expo";
import { useRouter } from "expo-router";
import { Alert } from "react-native";

export const useSignOut = () => {
    const { signOut } = useClerk();
    const router = useRouter();

    const handleSignOut = () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: async () => {
                    await signOut();
                    router.replace("/(auth)");
                },
            }
        ])
    }

    return { handleSignOut }
}
