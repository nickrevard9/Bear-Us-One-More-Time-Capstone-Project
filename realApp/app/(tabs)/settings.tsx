import {Text, View } from "@tamagui/core";
import { StyleSheet } from "react-native";
import React from "react";


export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>This is the settings page</Text>
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
