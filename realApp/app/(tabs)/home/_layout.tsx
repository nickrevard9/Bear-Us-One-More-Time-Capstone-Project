import React from "react";
import { Stack } from "expo-router";

export default function ItemsLayout() {
    return (
        <Stack screenOptions={{ headerBackVisible: true, gestureEnabled: false, headerBackTitle: "Back", headerShown: false, animation: "none", animationDuration: 0}}>
            {/* home_page is the first page that is opened to when home is clicked in tabs */}
            <Stack.Screen name="home_page" />
            <Stack.Screen name="calendar" />
            <Stack.Screen name="WeeklyView" />
        </Stack>
    );
}