import React, { useEffect, useState } from "react";
import { YStack, XStack, Input, Button, Image, H3 } from "tamagui";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useSQLiteContext } from "expo-sqlite";
import { getCurrentUser, UserData } from "../lib/db";
import { Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from "react-native";

import { KeyboardAvoidingView, Platform } from "react-native";

export default function EditProfile() {
  const router = useRouter();
  const db = useSQLiteContext(); 
  const [user, setUser] = useState<UserData | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profilePicture, setProfilePicture] = useState<string>("");

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

<<<<<<< HEAD
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          padding="$4"
          gap="$4"
          flexShrink={0}     // this prevents compression
        >
          <H3>Edit Profile</H3>
=======
return (
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
>>>>>>> SCRUM-109/AndroidFix

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

<<<<<<< HEAD
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
            <Button onPress={handleSave}>Save</Button>
          </XStack>
        </YStack>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
=======
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
>>>>>>> SCRUM-109/AndroidFix
}
