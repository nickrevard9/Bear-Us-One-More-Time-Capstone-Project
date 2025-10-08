// app/register.tsx
import React, { useState } from 'react'
import { Link } from 'expo-router'
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native'
import { Button, Input, YStack, XStack, Text, H2 } from 'tamagui'

// ✅ import SQLite helpers
import { useSQLiteContext } from 'expo-sqlite'
import {
  addLocalUser,
  emailExists,
  usernameExists,
  setCurrentUserId,
} from '../lib/db'

const USE_LOCAL_STORAGE = true // 👈 change this to false to go back to server mode

export default function Register() {
  const db = useSQLiteContext()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleRegistration() {
    if (submitting) return
    setSubmitting(true)
    setMessage('🔄 Registering…')

    // ---------- LOCAL STORAGE MODE ----------
    if (USE_LOCAL_STORAGE) {
      try {
        // simple validation
        if (!firstName || !lastName || !username || !email || !password) {
          setMessage('❌ Please fill out all fields.')
          return
        }

        if (await usernameExists(db, username)) {
          setMessage('❌ Username already exists.')
          return
        }

        if (await emailExists(db, email)) {
          setMessage('❌ Email already registered.')
          return
        }

        const newUser = await addLocalUser(db, {
          username,
          email,
          firstName,
          lastName,
          password, // only for demo
        })

        // store current user id for “logged in” session
        await setCurrentUserId(newUser.id)

        setMessage('✅ Registration successful!')
        Alert.alert('Registration Complete', 'Account saved locally.', [
          {
            text: 'OK',
            onPress: () => {
              // router.push('/login')
            },
          },
        ])
      } catch (err: any) {
        console.error(err)
        setMessage(`❌ Local DB error: ${err.message || err}`)
      } finally {
        setSubmitting(false)
      }
      return
    }

    // ---------- SERVER MODE ----------
    try {
      const res = await fetch('http://192.168.68.112:8888/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          USERNAME: username.trim(),
          EMAIL: email.trim(),
          PASSWORD: password,
          FIRST_NAME: firstName.trim(),
          LAST_NAME: lastName.trim(),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('✅ Registration successful!')
        Alert.alert('Registration Complete', 'Your account has been created!', [
          { text: 'OK' },
        ])
      } else {
        setMessage(data?.error || '❌ Registration failed.')
      }
    } catch (err: any) {
      setMessage(`🌐 Network error: ${err.message || err}`)
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit =
    firstName && lastName && username && email && password && !submitting

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <XStack flex={1} justifyContent="center" alignItems="center">
          <YStack gap="$6" width="80%" maxWidth={520}>
            <H2 alignSelf="center">Create Your Pawse Account</H2>

            <YStack gap="$3">
              <Input
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
              <Input
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
              <Input
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Input
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
              <Input
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              {!!message && (
                <Text
                  fontSize="$4"
                  color={message.startsWith('✅') ? '$green10' : '$red10'}
                >
                  {message}
                </Text>
              )}
            </YStack>

            <YStack gap="$3">
              <Button
                onPress={handleRegistration}
                disabled={!canSubmit}
                opacity={!canSubmit ? 0.7 : 1}
              >
                {submitting ? 'Registering…' : 'Register'}
              </Button>

              <Link href="/login" alignSelf="center">
                <Text
                  fontStyle="italic"
                  color="$blue10"
                  hoverStyle={{ color: '$blue11' }}
                >
                  Already have an account? Log in here…
                </Text>
              </Link>
            </YStack>
          </YStack>
        </XStack>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}
