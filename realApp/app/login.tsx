// app/login.tsx
import React, { useState, useCallback } from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { Button, Input, YStack, XStack, Text, H2 } from 'tamagui'
import * as SecureStore from 'expo-secure-store'

const DEMO_MODE = true
const API_BASE = 'http://192.168.68.112:8888'
const LOGIN_URL = `${API_BASE}/login`

async function saveKV(key: string, val: string) {
  if (Platform.OS === 'web') {
    try { localStorage.setItem(key, val) } catch {}
  } else {
    try { await SecureStore.setItemAsync(key, val) } catch {}
  }
}

async function fetchX(url: string, init: RequestInit = {}, ms = 10000) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    const text = await res.text()
    let json: any = null
    try { json = JSON.parse(text) } catch {}
    return { res, text, json }
  } finally {
    clearTimeout(t)
  }
}

export default function Login() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = identifier.trim().length > 0 && password.length > 0

  const onLogin = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)
    setMsg(DEMO_MODE ? 'demo: faking login…' : ' contacting server…')

    try {
      if (DEMO_MODE) {
        // ---- demo path ----
        await new Promise((r) => setTimeout(r, 700))
        await saveKV('accessToken', 'demo-token-123')
        await saveKV('user', JSON.stringify({
          id: 1,
          username: identifier.trim() || 'demo_user',
          email: identifier.includes('@') ? identifier.trim() : 'demo@pawse.app',
        }))
        setMsg('✅ login successful (demo)')
        router.replace('/(tabs)/home')
        return
      }

      // ---- real server path (enable when ready) ----
      /*
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
        const detail = json?.error || (text && text.length < 200 ? text : '') || `${res.status} ${res.statusText}`
        setMsg(`❌ ${detail}`)
        return
      }

      if (json?.accessToken) await saveKV('accessToken', json.accessToken)
      if (json?.user) await saveKV('user', JSON.stringify(json.user))

      setMsg('✅ login successful')
      router.replace('/(tabs)/home')
      */
    } catch (e: any) {
      setMsg(`🌐 error: ${e?.message || String(e)}`)
    } finally {
      setSubmitting(false)
    }
  }, [DEMO_MODE, identifier, password, router, submitting])

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
                onSubmitEditing={() => { if (canSubmit) onLogin() }}
              />
              {!!msg && (
                <Text color={msg.startsWith('✅') ? '$green10' : '$red10'} fontSize="$4">
                  {msg}
                </Text>
              )}
              {DEMO_MODE && <Text fontSize="$2" color="$gray10">Demo mode is ON — no server calls.</Text>}
            </YStack>

            <YStack gap="$3">
              <Button onPress={onLogin} disabled={!canSubmit || submitting} opacity={!canSubmit || submitting ? 0.7 : 1}>
                {submitting ? (DEMO_MODE ? 'Faking…' : 'Logging in…') : 'Log In'}
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
