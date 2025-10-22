// app/login.tsx
import React, { useEffect, useState, useCallback } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { Button, YStack, XStack, Text, H2, Paragraph, Separator } from 'tamagui'
import { useSQLiteContext } from 'expo-sqlite'
import * as SecureStore from 'expo-secure-store'

import { API_BASE, USE_LOCAL_STORAGE } from './_layout'
import { ensureAuthStateRow, getAuthState, markLoggedIn, setCurrentUserId } from '../lib/db'

// ---------- small KV helpers ----------
async function saveKV(key: string, val: string) {
  if (Platform.OS === 'web') {
    try { localStorage.setItem(key, val) } catch {}
  } else {
    try { await SecureStore.setItemAsync(key, val) } catch {}
  }
}
async function delKV(key: string) {
  if (Platform.OS === 'web') {
    try { localStorage.removeItem(key) } catch {}
  } else {
    try { await SecureStore.deleteItemAsync(key) } catch {}
  }
}

// ---------- local guest bootstrap (SQLite) ----------
async function ensureGuestUser(db: ReturnType<typeof useSQLiteContext>) {
  // Create a deterministic guest record if it doesn't exist yet
  await db.execAsync(`
    INSERT OR IGNORE INTO users (id, username, email, firstName, lastName, password, createdAt)
    VALUES ('guest', 'guest', 'guest@local', 'Guest', 'User', '', datetime('now'))
  `)
  // Read back a minimal object for storage
  const rows = await db.getAllAsync<any>(`SELECT * FROM users WHERE id = 'guest' LIMIT 1`)
  return rows?.[0] ?? {
    id: 'guest',
    username: 'guest',
    email: 'guest@local',
    firstName: 'Guest',
    lastName: 'User',
    createdAt: new Date().toISOString(),
  }
}

export default function NewUserChooser() {
  const db = useSQLiteContext()
  const router = useRouter()

  const [bootChecking, setBootChecking] = useState(true)
  const [msg, setMsg] = useState<string>('')

  // On mount: respect existing session
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await ensureAuthStateRow(db)
        const state = await getAuthState(db)
        if (!cancelled && state.is_logged_in === 1) {
          setMsg('🔐 Session found — opening app…')
          router.replace('/(tabs)/home')
          return
        }
      } finally {
        if (!cancelled) setBootChecking(false)
      }
    })()
    return () => { cancelled = true }
  }, [db, router])

  const onContinueAsGuest = useCallback(async () => {
    try {
      setMsg('Setting up guest session…')

      // Clear any stale tokens (server mode)
      await delKV('accessToken')

      // Always maintain a local session flag for app flow
      const guestUser = USE_LOCAL_STORAGE
        ? await ensureGuestUser(db)
        : // Server mode: we still use a local "virtual" guest identity
          { id: 'guest', username: 'guest', email: 'guest@local', firstName: 'Guest', lastName: 'User' }

      await setCurrentUserId(guestUser.id)
      await saveKV('user', JSON.stringify(guestUser))
      await markLoggedIn(db, String(guestUser.id))

      Alert.alert('Welcome', 'Continuing as Guest')
      router.replace('/(tabs)/home')
    } catch (e: any) {
      setMsg(`❌ Could not start guest session: ${e?.message || String(e)}`)
    }
  }, [db, router])

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <XStack flex={1} justifyContent="center" alignItems="center">
          <YStack gap="$6" width="86%" maxWidth={520} paddingVertical="$6">
            <H2 alignSelf="center">Welcome to Pawse!</H2>
            {bootChecking ? (
              <Text fontSize="$4" color="$gray10" alignSelf="center">
                {msg || 'Checking session…'}
              </Text>
            ) : (
              <>
                <Paragraph size="$4" color="$gray11" textAlign="center">
                  New here? You can jump right in as a guest (no sign-up required), or create an account to
                  personalize your experience.
                </Paragraph>

                <YStack gap="$3">
                  <Button size="$5" onPress={() => router.push('/register')}>
                    Create an Account
                  </Button>
                  <Button size="$5" variant="outlined" onPress={onContinueAsGuest}>
                    Continue as Guest
                  </Button>

                  {!!msg && (
                    <Text
                      color={msg.startsWith('❌') ? '$red10' : '$green10'}
                      fontSize="$3"
                      alignSelf="center"
                    >
                      {msg}
                    </Text>
                  )}

                  <Separator />

                  {/* Optional path for existing users to sign in with password */}
                  <YStack gap="$2" alignItems="center">
                    <Text color="$gray10">Already have an account?</Text>
                    {/* If you want to keep your old password login screen, put it at /login*/}
                    <Link href="/login">
                      <Text color="$blue10" hoverStyle={{ color: '$blue11' }}>
                        Sign in with password
                      </Text>
                    </Link>
                  </YStack>

                  {/* Mode hint */}
                  <Text fontSize="$2" color="$gray9" alignSelf="center">
                    {USE_LOCAL_STORAGE ? 'Mode: Local (SQLite)' : `Mode: Server (${API_BASE})`}
                  </Text>
                </YStack>
              </>
            )}
          </YStack>
        </XStack>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}
