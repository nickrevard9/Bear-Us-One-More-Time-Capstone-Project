import { StyleSheet, Text, View, Button } from "react-native";

export default function OneScreen() {
  return (
    <>
      <View style={styles.container}>
        <Text style={styles.text}>This is the home page :-)</Text>
        <View style={{
          backgroundColor: 'darkgreen',
          borderRadius: 100,
          padding: 10,
          marginHorizontal: 40,
          marginTop: 10,
          marginBottom: 10,
          alignItems: 'center',
        }}>
          <Button
            onPress={handlePress}
            title="Press Me"
            color="#fff"
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  text: { fontSize: 20, fontWeight: "bold" },
});

function handlePress() {
  alert('You pressed the button!\n It will take 5 seconds to work again.');
  setTimeout(() => {}, 5000);
}