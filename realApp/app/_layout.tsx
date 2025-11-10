// app/_layout.tsx
import React from 'react'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { useColorScheme, View, ActivityIndicator } from 'react-native'
import { useFonts } from 'expo-font'
import { SQLiteProvider } from 'expo-sqlite'
import { initDb } from '../lib/db'
import '../tamagui-web.css';
import { TamaguiProvider, Theme } from 'tamagui';
import { tamaguiConfig } from '../tamagui.config';

// toggle between local (SQLite) and server mode
export const USE_LOCAL_STORAGE = true
export const API_BASE = 'http://192.168.68.112:8888'
export const LOGIN_URL = `${API_BASE}/login`

const navLight = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f4efe6', // match earthyLight.background
    card: '#e9e1d3',       
    text: '#3e3b32',
    border: '#a17f60',
    primary: '#8fa47a',
  },
}
const navDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#2b2a23',
    card: '#3a372e',
    text: '#e4e0d5',
    border: '#bfa58c',
    primary: '#7f8f67',
  },
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const colors = colorScheme === 'dark' ? tamaguiConfig.themes.dark : tamaguiConfig.themes.light

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  })
  if (!loaded) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>
  }

  return (
    <TamaguiProvider config={tamaguiConfig}>
      <Theme name={colorScheme === 'dark' ? 'dark' : 'light'}>
        <ThemeProvider value={colorScheme === 'dark' ? navDark : navLight}>
          <SQLiteProvider databaseName="pawse.db" onInit={initDb}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ title: 'index' }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="settings"
                options={{
                  headerShown: true,
                  title: 'Settings',
                  headerBackTitle: 'Back',
                  headerBackTitleVisible: true,
                  headerStyle: {
                    backgroundColor: colors?.backgroundStrong.val,
                  },
                  headerTintColor: colors?.color.val,
                  headerTitleStyle: {
                    fontSize: 30,     // same as '$7' font size (custom header font size)
                    fontWeight: '600',
                    color: colors?.color.val,
                  },
                }}
              />
              <Stack.Screen
                name="achievements_page"
                options={{
                  headerShown: true,
                  title: 'Achievements',
                  headerBackTitle: 'Back',
                  headerBackTitleVisible: true,
                  headerStyle: {
                    backgroundColor: colors?.backgroundStrong.val,
                  },
                  headerTintColor: colors?.color.val,
                  headerTitleStyle: {
                    fontSize: 30,     // same as '$7' font size (custom header font size)
                    fontWeight: '600',
                    color: colors?.color.val,
                  },
                }}
              />
              <Stack.Screen
                name="notifications"
                options={{
                  headerShown: true,
                  title: 'Notifications',
                  headerBackTitle: 'Back',
                  headerBackTitleVisible: true,
                  headerStyle: {
                    backgroundColor: colors?.backgroundStrong.val,
                  },
                  headerTintColor: colors?.color.val,
                  headerTitleStyle: {
                    fontSize: 30,
                    fontWeight: '600',
                    color: colors?.color.val,
                  },
                }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
          </SQLiteProvider>
        </ThemeProvider>
      </Theme>
    </TamaguiProvider>
  )
}
