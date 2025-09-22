import { StyleSheet, Text, View, TextInput } from "react-native";

export default function FourScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>This is the profile page 👤</Text>
      <TextInput 
        style={{
          height: 40,
          borderColor: 'gray',
          borderWidth: 1,
          width: 200,
          paddingHorizontal: 10,
          borderRadius: 500,
          marginTop: 20,
          color: 'black',
        }}
        placeholder="Enter your name"
        placeholderTextColor="black"
      />
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
