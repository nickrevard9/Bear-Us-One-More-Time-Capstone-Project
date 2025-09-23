// app/_layout.tsx
import { TamaguiProvider, View, createTamagui } from '@tamagui/core'
import { defaultConfig } from '@tamagui/config/v4'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import React from 'react';

// you usually export this from a tamagui.config.ts file
const config = createTamagui(defaultConfig)

type Conf = typeof config

// make imports typed
declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <TamaguiProvider config={config}>
        <Stack>
          {/* The tabs group */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* Optional: 404 fallback */}
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
    </TamaguiProvider>
    
  );
}
