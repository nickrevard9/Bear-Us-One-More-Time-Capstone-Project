import React, { useEffect, useState } from "react";
import { YStack, XStack, Input, Button, Image, H3 } from "tamagui";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useSQLiteContext } from "expo-sqlite";
import { getCurrentUser, UserData } from "../lib/db";
import { Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from "react-native";

/**
 * this is the edit profile page
 * 
 * It allows users to add their own custom photos as their profile picture.
 * It also allows them to edit their name.
 * 
 * @returns edit profile page
 */
export default function EditProfile() {
  const router = useRouter();
  const db = useSQLiteContext(); 
  const [user, setUser] = useState<UserData | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profilePicture, setProfilePicture] = useState<string>("");

  // get user information
  useEffect(() => {
    (async () => {
      const current = await getCurrentUser(db);
      if (current) {
        setUser(current);
        setFirstName(current.firstName);
        setLastName(current.lastName);
        setProfilePicture(current.profilePicture);
      }
    })();
  }, [db]);

  // allow user to pick their own image
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  // save the changes the user made
  const handleSave = async () => {
    if (!user) return;

    await db.runAsync(
      `
      UPDATE users
      SET firstName = ?, lastName = ?, profilePicture = ?
      WHERE id = ?;
      `,
      [firstName.trim(), lastName.trim(), profilePicture || "", user.id]
    );

    router.back();
  };

return (
  // make sure the keyboard doesn't block view of the text input fields
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
  >
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="$4"
      gap="$4"
    >
      <H3>Edit Profile</H3>

          <Button onPress={pickImage}>
            {profilePicture ? "Change Picture" : "Pick Profile Picture"}
          </Button>

          {profilePicture ? (
            <Image
              source={
                profilePicture.includes("pat-neff.png")
                  ? require("../assets/images/pat-neff.png")
                  : { uri: profilePicture }
              }
              width={120}
              height={120}
              borderRadius={60}
            />
          ) : null}

      <Input
        width="80%"
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />

      <Input
        width="80%"
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
      />

      <XStack gap="$3" marginTop="$4">
        <Button theme="gray" onPress={() => router.back()}>
          Cancel
        </Button>
        <Button onPress={handleSave}>Save</Button>
      </XStack>
    </YStack>
  </KeyboardAvoidingView>
);
}
