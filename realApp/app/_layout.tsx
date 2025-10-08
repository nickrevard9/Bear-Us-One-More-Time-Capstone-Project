// app/_layout.tsx
import React from 'react'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { useColorScheme, View, ActivityIndicator } from 'react-native'
import { useFonts } from 'expo-font'
import { SQLiteProvider } from 'expo-sqlite'
import { initDb } from '../lib/db'   // ✅ from app/ to lib/
import '../tamagui-web.css';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '../tamagui.config';

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  })
  if (!loaded) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>
  }

  return (
        <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme!}>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SQLiteProvider databaseName="pawse.db" onInit={initDb}>
        <Stack>
          <Stack.Screen name="login" options={{ title: 'Login' }} />
          <Stack.Screen name="register" options={{ title: 'Register' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </SQLiteProvider>
    </ThemeProvider>
    </TamaguiProvider>
  )
}
