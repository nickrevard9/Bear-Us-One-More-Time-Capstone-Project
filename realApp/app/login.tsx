// app/login.tsx
import React, { useState, useCallback } from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { Button, Input, YStack, XStack, Text, H2 } from 'tamagui'
import { useSQLiteContext } from 'expo-sqlite'
import * as SecureStore from 'expo-secure-store'

import { API_BASE, USE_LOCAL_STORAGE } from './_layout'// toggle between local (SQLite) and server mode

// 🧱 import from local DB helpers
import {
  findUserByUsernameOrEmail,
  setCurrentUserId,
} from '../lib/db'

const LOGIN_URL = `${API_BASE}/login`

async function saveKV(key: string, val: string) {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, val)
    } catch {}
  } else {
    try {
      await SecureStore.setItemAsync(key, val)
    } catch {}
  }
}

async function fetchX(url: string, init: RequestInit = {}, ms = 10000) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    const text = await res.text()
    let json: any = null
    try {
      json = JSON.parse(text)
    } catch {}
    return { res, text, json }
  } finally {
    clearTimeout(t)
  }
}

export default function Login() {
  const db = useSQLiteContext()
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = identifier.trim().length > 0 && password.length > 0

  const onLogin = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)
    setMsg(USE_LOCAL_STORAGE ? 'Checking local user…' : 'Contacting server…')

    try {
      // ---------- LOCAL (SQLite) LOGIN ----------
      if (USE_LOCAL_STORAGE) {
        const user = await findUserByUsernameOrEmail(db, identifier)
        if (!user) {
          setMsg('❌ No user found with that username/email.')
          return
        }

        // simple password check for demo purposes
        if (user.password !== password) {
          setMsg('❌ Incorrect password.')
          return
        }

        await setCurrentUserId(user.id)
        await saveKV('user', JSON.stringify(user))

        setMsg('✅ Login successful (local)')
        Alert.alert('Welcome', `Logged in as ${user.username}`)
        router.replace('/(tabs)/home')
        return
      }

      // ---------- SERVER LOGIN ----------
      const payload = identifier.trim().includes('@')
        ? { EMAIL: identifier.trim(), PASSWORD: password }
        : { USERNAME: identifier.trim(), PASSWORD: password }

      const { res, text, json } = await fetchX(
        LOGIN_URL,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        10000
      )

      if (!res.ok) {
        const detail =
          json?.error ||
          (text && text.length < 200 ? text : '') ||
          `${res.status} ${res.statusText}`
        setMsg(`❌ ${detail}`)
        return
      }

      if (json?.accessToken) await saveKV('accessToken', json.accessToken)
      if (json?.user) await saveKV('user', JSON.stringify(json.user))

      setMsg('✅ Login successful')
      router.replace('/(tabs)/home')
    } catch (e: any) {
      setMsg(`🌐 Error: ${e?.message || String(e)}`)
    } finally {
      setSubmitting(false)
    }
  }, [USE_LOCAL_STORAGE, identifier, password, router, submitting])

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <XStack flex={1} justifyContent="center" alignItems="center">
          <YStack gap="$6" width="80%" maxWidth={520}>
            <H2 alignSelf="center">Welcome to Pawse!</H2>

            <YStack gap="$3">
              <Input
                placeholder="Email or Username"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
              />
              <Input
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                returnKeyType="go"
                onSubmitEditing={() => {
                  if (canSubmit) onLogin()
                }}
              />
              {!!msg && (
                <Text
                  color={msg.startsWith('✅') ? '$green10' : '$red10'}
                  fontSize="$4"
                >
                  {msg}
                </Text>
              )}
              {USE_LOCAL_STORAGE && (
                <Text fontSize="$2" color="$gray10">
                  Using local SQLite login
                </Text>
              )}
            </YStack>

            <YStack gap="$3">
              <Button
                onPress={onLogin}
                disabled={!canSubmit || submitting}
                opacity={!canSubmit || submitting ? 0.7 : 1}
              >
                {submitting
                  ? USE_LOCAL_STORAGE
                    ? 'Checking…'
                    : 'Logging in…'
                  : 'Log In'}
              </Button>
              <Link href="/register" alignSelf="center">
                <Text
                  fontStyle="italic"
                  color="$blue10"
                  hoverStyle={{ color: '$blue11' }}
                >
                  New to Pawse? Register here…
                </Text>
              </Link>
            </YStack>
          </YStack>
        </XStack>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}
