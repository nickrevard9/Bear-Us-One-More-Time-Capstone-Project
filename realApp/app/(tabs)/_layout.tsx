// app/(tabs)/_layout.tsx
import { HeaderNotifications } from '@/components/header'
import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ header: () => <HeaderNotifications />, tabBarActiveTintColor: '#007aff' }}>
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar', tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="report_page" options={{ title: 'report', tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
      {/* <Tabs.Screen name="_day_view" options={{ href: null }} /> */}
    </Tabs>
  )
}
