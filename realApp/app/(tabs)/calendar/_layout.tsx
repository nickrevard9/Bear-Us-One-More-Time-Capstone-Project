import React from "react";
import { Stack } from "expo-router";

export default function ItemsLayout() {
    return (
        <Stack screenOptions={{ headerBackVisible: true, gestureEnabled: true, headerBackTitle: "Back", headerShown: false }}>
            <Stack.Screen name="calendar" />
            <Stack.Screen name="_day_view" />
        </Stack>
    );
}