import React from "react";
import { Stack } from "expo-router";

export default function ItemsLayout() {
    return (
        <Stack screenOptions={{ headerBackVisible: true, gestureEnabled: false, headerBackTitle: "Back", headerShown: false, animation: "none", animationDuration: 0}}>
            <Stack.Screen name="home_page" />
            <Stack.Screen name="calendar" />
        </Stack>
    );
}