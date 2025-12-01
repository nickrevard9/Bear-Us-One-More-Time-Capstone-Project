// app/new user.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Button, YStack, XStack, H2, Paragraph, Input, Text, Separator } from 'tamagui'
import { useSQLiteContext } from 'expo-sqlite'
import AsyncStorage from '@react-native-async-storage/async-storage'

import {
  addLocalUser,
  ensureAuthStateRow,
  getAuthState,
  markLoggedIn,
  setCurrentUserId,
} from '../lib/db'
import { API_BASE, USE_LOCAL_STORAGE } from './_layout'

export default function RegisterPage() {
  const db = useSQLiteContext()
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<string>('')
  const [bootChecking, setBootChecking] = useState(true)

  const canSubmit = useMemo(
    () => firstName.trim().length > 0 && lastName.trim().length > 0 && !submitting,
    [firstName, lastName, submitting]
  )

    useMemo(() => {
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


  const createLocalAccount = useCallback(async () => {
    setSubmitting(true)
    setMsg('')

    try {
      await ensureAuthStateRow(db)
      // 1) add user
      const created = await addLocalUser(db as any, {
        username: "user",
        email: "email",
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password: '', // no password for local-only
        createdAt: new Date(),
        profilePicture: "pat-neff.png",
      })

      // 2) Persist session + navigate
      await setCurrentUserId(created.id!)
      await AsyncStorage.setItem('user', JSON.stringify(created))
      await markLoggedIn(db as any, String(created.id))

      console.log('[register] created user:', created) // ← logs what was created
      setMsg(`✅ Created ${created.firstName} ${created.lastName} (@${created.username})`)
      router.replace('/(tabs)/home')
    } catch (e: any) {
      console.error('[register] create failed:', e)
      setMsg(`❌ ${e?.message || String(e)}`)
      Alert.alert('Registration failed', e?.message || String(e))
    } finally {
      setSubmitting(false)
    }
  }, [db, firstName, lastName, router])

  const onSubmit = useCallback(async () => {
    if (!canSubmit) return
    if (!USE_LOCAL_STORAGE) {
      // If you later wire up a server endpoint, you can branch here.
      // For now, we use local-only flow.
      console.warn(`[register] Server mode detected (${API_BASE}) — using local flow for now.`)
    }
    await createLocalAccount()
  }, [canSubmit, createLocalAccount])

  if (!bootChecking) return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <XStack flex={1} justifyContent="center" alignItems="center">
          <YStack gap="$6" width="86%" maxWidth={520} paddingVertical="$6">
            <H2 alignSelf="center">Welcome to Pawse!</H2>
            <Paragraph size="$4" color="$gray11" textAlign="center">
              Just enter your first and last name to get started!
            </Paragraph>  

            <YStack gap="$3">
              <YStack gap="$2">
                <Text fontSize="$3" color="$gray11">First name</Text>
                <Input
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="e.g., Spencer"
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!submitting}
                />
              </YStack>

              <YStack gap="$2">
                <Text fontSize="$3" color="$gray11">Last name</Text>
                <Input
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="e.g., Hammack"
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!submitting}
                />
              </YStack>

              <Button
                size="$5"
                onPress={onSubmit}
                disabled={!canSubmit}
                theme={canSubmit ? 'active' : 'alt2'}
              >
                {submitting ? 'Creating…' : 'Create Account'}
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

              <Text fontSize="$2" color="$gray9" alignSelf="center">
                {USE_LOCAL_STORAGE ? 'Mode: Local (SQLite)' : `Mode: Server (${API_BASE})`}
              </Text>
            </YStack>
          </YStack>
        </XStack>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  ); else {
    return null
  }
}