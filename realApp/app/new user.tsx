// app/new user.tsx
import React, { useCallback, useMemo, useState, useEffect } from 'react'
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
  emailExists,
  ensureAuthStateRow,
  markLoggedIn,
  setCurrentUserId,
  usernameExists,
  getAuthState,
} from '../lib/db'
import { API_BASE, USE_LOCAL_STORAGE } from './_layout'
 
function slugifyName(s: string) {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 24)
}
 
export default function RegisterPage() {
  const db = useSQLiteContext()
  const router = useRouter()
 
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<string>('')
  const [bootChecking, setBootChecking] = useState(true)
 
  // 👇 THIS is the “skip if user exists” logic (same idea as login.tsx)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureAuthStateRow(db)
        const state = await getAuthState(db)
        if (!cancelled && state.is_logged_in === 1) {
          // already have a user/session — go to app
          router.replace('/(tabs)/home')
          return
        }
 
        // optional: if you also want to honor AsyncStorage directly
        const stored = await AsyncStorage.getItem('pawse.currentUserId')
        if (!cancelled && stored) {
          router.replace('/(tabs)/home')
          return
        }
      } catch (err) {
        console.warn('[register] boot check failed:', err)
      } finally {
        if (!cancelled) setBootChecking(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [db, router])
 
  const canSubmit = useMemo(
    () => firstName.trim().length > 0 && lastName.trim().length > 0 && !submitting,
    [firstName, lastName, submitting]
  )
 
  const createLocalAccount = useCallback(async () => {
    setSubmitting(true)
    setMsg('')
 
    try {
      await ensureAuthStateRow(db)
 
      // 1) Derive base slugs
      const f = slugifyName(firstName)
      const l = slugifyName(lastName)
      let base = f && l ? `${f}.${l}` : f || l || 'user'
 
      // 2) ensure unique username/email
      let candidateUsername = base
      let candidateEmail = `${base}@local`
      let suffix = 0
 
      while (
        (await usernameExists(db as any, candidateUsername)) ||
        (await emailExists(db as any, candidateEmail))
      ) {
        suffix += 1
        candidateUsername = `${base}${suffix}`
        candidateEmail = `${base}${suffix}@local`
        if (suffix > 9999) throw new Error('Could not generate a unique username/email')
      }
 
      // 3) insert
      const created = await addLocalUser(db as any, {
        username: candidateUsername,
        email: candidateEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password: '', // local-only
        createdAt: new Date(),
        profilePicture: "pat-neff.png"
      })
 
      // 4) persist + mark logged in
      await setCurrentUserId(created.id!)
      await AsyncStorage.setItem('user', JSON.stringify(created))
      await markLoggedIn(db as any, String(created.id))
 
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
      console.warn(`[register] Server mode detected (${API_BASE}) — using local flow for now.`)
    }
    await createLocalAccount()
  }, [canSubmit, createLocalAccount])
 
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
                Checking for existing user…
              </Text>
            ) : (
              <>
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
              </>
            )}
          </YStack>
        </XStack>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}
 