import { useSSO } from "@clerk/expo";
import { useState } from "react"
import { Alert } from "react-native";

type SocialStrategy = "oauth_google" | "oauth_apple";

export const useSocialAuth = () => {
    const [loadingStrategy, setLoadingStrategy] = useState<SocialStrategy | null>(null);
    const { startSSOFlow } = useSSO();

    const handleSocialAuth = async (strategy: SocialStrategy) => {
        setLoadingStrategy(strategy);
        try {
            const { createdSessionId, setActive } = await startSSOFlow({ strategy });
            if (createdSessionId && setActive) {
                await setActive({ session: createdSessionId });
            }
        } catch (error) {
            console.log("Error in social auth", error);
            const provider = strategy === "oauth_apple" ? "Apple" : "Google";
            Alert.alert("Error", `Failed to sign in with ${provider}. Please try again`);
        } finally {
            setLoadingStrategy(null);
        }
    }

    return { loadingStrategy, handleSocialAuth }
}
