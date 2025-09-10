import { StyleSheet, Text, View } from "react-native";

export default function OneScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>This is the home page :-)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff", // 👈 set background here
  },
  text: { fontSize: 20, fontWeight: "bold" },
});
