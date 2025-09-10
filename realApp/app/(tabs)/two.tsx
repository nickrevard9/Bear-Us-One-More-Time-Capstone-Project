import { StyleSheet, Text, View } from "react-native";

export default function TwoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>This is the second page</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  text: { fontSize: 22, fontWeight: "bold", color: "#333" },
});
