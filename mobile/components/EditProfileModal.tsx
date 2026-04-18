import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface EditProfileModalProps {
  isVisible: boolean;
  onClose: () => void;
  formData: {
    firstName: string;
    lastName: string;
    bio: string;
    location: string;
    profilePicture: string;
    bannerImage: string;
  };
  saveProfile: () => void;
  updateFormField: (field: string, value: string) => void;
  pickImage: (field: "profilePicture" | "bannerImage") => void;
  isUpdating: boolean;
}

const EditProfileModal = ({
  formData,
  isUpdating,
  isVisible,
  onClose,
  saveProfile,
  updateFormField,
  pickImage,
}: EditProfileModalProps) => {
  const handleSave = () => {
    saveProfile();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-blue-500 text-lg">Cancel</Text>
          </TouchableOpacity>

          <Text className="text-lg font-semibold">Edit Profile</Text>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isUpdating}
            className={`${isUpdating ? "opacity-50" : ""}`}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#1DA1F2" />
            ) : (
              <Text className="text-blue-500 text-lg font-semibold">Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 py-6">
          <View className="space-y-4">
            <View>
              <Text className="text-gray-500 text-sm mb-2">Cover Photo</Text>
              <Image
                source={{
                  uri:
                    formData.bannerImage ||
                    "https://www.solidbackgrounds.com/images/1920x1080/1920x1080-light-blue-solid-color-background.jpg",
                }}
                className="w-full h-40 rounded-xl bg-gray-100"
                resizeMode="cover"
              />
              <TouchableOpacity
                className="mt-3 border border-gray-300 rounded-lg py-3 items-center"
                onPress={() => pickImage("bannerImage")}
              >
                <Text className="text-gray-900 font-medium">Change cover photo</Text>
              </TouchableOpacity>
            </View>

            <View>
              <Text className="text-gray-500 text-sm mb-2">Profile Picture</Text>
              <View className="items-center">
                <Image
                  source={{ uri: formData.profilePicture }}
                  className="w-28 h-28 rounded-full bg-gray-100"
                />
                <TouchableOpacity
                  className="mt-3 border border-gray-300 rounded-lg py-3 px-6 items-center"
                  onPress={() => pickImage("profilePicture")}
                >
                  <Text className="text-gray-900 font-medium">Change profile picture</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View>
              <Text className="text-gray-500 text-sm mb-2">First Name</Text>
              <TextInput
                className="border border-gray-200 rounded-lg p-3 text-base"
                value={formData.firstName}
                onChangeText={(text) => updateFormField("firstName", text)}
                placeholder="Your first name"
              />
            </View>

            <View>
              <Text className="text-gray-500 text-sm mb-2">Last Name</Text>
              <TextInput
                className="border border-gray-200 rounded-lg px-3 py-3 text-base"
                value={formData.lastName}
                onChangeText={(text) => updateFormField("lastName", text)}
                placeholder="Your last name"
              />
            </View>

            <View>
              <Text className="text-gray-500 text-sm mb-2">Bio</Text>
              <TextInput
                className="border border-gray-200 rounded-lg px-3 py-3 text-base"
                value={formData.bio}
                onChangeText={(text) => updateFormField("bio", text)}
                placeholder="Tell us about yourself"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View>
              <Text className="text-gray-500 text-sm mb-2">Location</Text>
              <TextInput
                className="border border-gray-200 rounded-lg px-3 py-3 text-base"
                value={formData.location}
                onChangeText={(text) => updateFormField("location", text)}
                placeholder="Where are you located?"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default EditProfileModal;
