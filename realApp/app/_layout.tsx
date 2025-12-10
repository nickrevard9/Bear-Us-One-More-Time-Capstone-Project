// app/_layout.tsx
import React, { useEffect } from 'react'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { useColorScheme, View, ActivityIndicator } from 'react-native'
import { useFonts } from 'expo-font'
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite'
import { getCurrentUser, initDb } from '../lib/db'
import '../tamagui-web.css';
import { TamaguiProvider, Theme } from 'tamagui';
import { tamaguiConfig } from '../tamagui.config';
import * as Notifications from "expo-notifications";
import { logNotification } from '@/lib/notifications';
import { HeaderNotifications } from '@/components/header';


// toggle between local (SQLite) and server mode
export const USE_LOCAL_STORAGE = true
export const API_BASE = 'http://192.168.68.112:8888'
export const LOGIN_URL = `${API_BASE}/login`

/**
 * Navigation themes for light and dark modes
 */
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

/**
 * RootLayout 
 * 
 * The main layout component for the application, setting up theming, navigation, and database context.
 * @returns The root layout for the entire application
 */
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
            {/* apply the notification listener to the overarching layout */}
            <NotificationListenerWrapper>
              {/** Stack maps different pages of the app
               * Each Stack.Screen represents a different page with its own options
               * headerShown controls the visibility of the header for each page
               * Custom headers can be provided for specific pages
               */}
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                {/* Tabs has its own _layout to define its pages in the stack */}
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                {/* the options below attach a basic back button the the top left of the specified page */}
                <Stack.Screen
                  name="settings"
                  options={{
                    headerShown: true,
                    title: 'Settings',
                    headerBackTitle: 'Back',
                    headerBackVisible: true,
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
                  headerBackVisible: true,
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
                    headerBackVisible: true,
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
                <Stack.Screen
                  name="edit_profile"
                  options={{
                    headerShown: true,
                    title: 'Edit Profile',
                    headerBackTitle: 'Back',
                    headerBackVisible: true,
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
                {/* this applys the custom header with the notification center */}
                <Stack.Screen
                  name="edit_page" options={{header: () => <HeaderNotifications route_name={undefined} />}}
                />
                <Stack.Screen name="+not-found" />
              </Stack>
            </NotificationListenerWrapper>
          </SQLiteProvider>
        </ThemeProvider>
      </Theme>
    </TamaguiProvider>
  )
}

/**
 * listens for push notifications sent to the user
 * this really only tracks the "🔥 Save Your Streak" notifications right now
 * @param param0 
 * @returns a notification listener
 */
function NotificationListenerWrapper({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(async (notification) => {
      const { title, body } = notification.request.content;
      const user = await getCurrentUser(db);
      const userId = user?.id ?? null;

      logNotification(db, title ?? "No title", body ?? "", userId);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const { title, body } = response.notification.request.content;
      const user = await getCurrentUser(db);
      const userId = user?.id ?? null;

      logNotification(db, title ?? "No title", body ?? "", userId);
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, [db]);

  return <>{children}</>;
}
