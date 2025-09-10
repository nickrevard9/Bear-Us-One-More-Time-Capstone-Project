// app/index.tsx
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Welcome</Text>
      <Pressable onPress={() => router.push("/one")}>
        <Text>Go to One</Text>
      </Pressable>
    </View>
  );
}
