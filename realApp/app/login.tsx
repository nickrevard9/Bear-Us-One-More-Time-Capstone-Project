// app/login.tsx
import React, { useState } from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { Button, Input, YStack, XStack, Text, H2 } from 'tamagui'
import * as SecureStore from 'expo-secure-store'

const API_BASE = 'http://192.168.68.112:8888' // dev machine on Wi-Fi
const LOGIN_URL = `${API_BASE}/login`

// Cross-platform KV
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

// fetch with timeout + tolerant JSON parse
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
  const router = useRouter()
  const [identifier, setIdentifier] = useState('') // email or username
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onLogin = async () => {
    if (submitting) return
    setSubmitting(true)
    setMsg('🔄 contacting server…')

    try {
      const payload =
        identifier.trim().includes('@')
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
        setSubmitting(false)
        return
      }

      if (json?.accessToken) await saveKV('accessToken', json.accessToken)
      if (json?.user) await saveKV('user', JSON.stringify(json.user))

      setMsg('✅ login successful')
      // Make sure this route exists (e.g., app/(tabs)/home.tsx)
      router.replace('/(tabs)/home')
    } catch (e: any) {
      if (e?.name === 'AbortError') setMsg('⏱️ timeout: server didn’t respond.')
      else setMsg(`🌐 network error: ${e?.message || String(e)}`)
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = identifier.trim().length > 0 && password.length > 0

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
                <Text color={msg.startsWith('✅') ? '$green10' : '$red10'} fontSize="$4">
                  {msg}
                </Text>
              )}
            </YStack>

            <YStack gap="$3">
              <Button
                onPress={onLogin}
                disabled={!canSubmit || submitting}
                opacity={!canSubmit || submitting ? 0.7 : 1}
              >
                {submitting ? 'Logging in…' : 'Log In'}
              </Button>

              <Link href="/register" alignSelf="center" hoverStyle={{ color: '$blue10' }}>
                <Text fontStyle="italic">New to Pawse? Register here…</Text>
              </Link>
            </YStack>
          </YStack>
        </XStack>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}
