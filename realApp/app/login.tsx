// app/login.tsx
import { Link } from "expo-router";
import { Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from "react-native";
import React, { useState } from "react";
import { Link, useRouter } from "expo-router";
import { Platform } from "react-native";
import { Button, Input, YStack, XStack, Text, H2 } from "tamagui";
import * as SecureStore from "expo-secure-store";

const API_BASE = "http://192.168.68.112:8888"; // your server.js runs on 8888
const LOGIN_URL = `${API_BASE}/login`;

// save tokens cross-platform (SecureStore on native, localStorage on web)
async function saveKV(key: string, val: string) {
  if (Platform.OS === "web") {
    try { localStorage.setItem(key, val); } catch {}
  } else {
    try { await SecureStore.setItemAsync(key, val); } catch {}
  }
}

// fetch with timeout + robust parsing
async function fetchX(url: string, init: RequestInit = {}, ms = 10000) {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch {}
    return { res, text, json };
  } finally {
    clearTimeout(to);
  }
}

export default function Login() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(""); // email or username
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const onLogin = async () => {
    setMsg("🔄 contacting server…");

    try {
      // Backend expects UPPERCASE keys: EMAIL or USERNAME + PASSWORD
      const payload =
        identifier.includes("@")
          ? { EMAIL: identifier.trim(), PASSWORD: password }
          : { USERNAME: identifier.trim(), PASSWORD: password };

      const { res, text, json } = await fetchX(
        LOGIN_URL,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        10000
      );

      if (!res.ok) {
        const detail =
          json?.error ||
          (text && text.length < 200 ? text : "") ||
          `${res.status} ${res.statusText}`;
        setMsg(`❌ ${detail}`);
        return;
      }

      // Expect: { message, user?, accessToken? }
      if (json?.accessToken) await saveKV("accessToken", json.accessToken);
      if (json?.user) await saveKV("user", JSON.stringify(json.user));

      setMsg("✅ login successful");
      // Send authenticated users into your tabbed app
      router.replace("/(tabs)/home");
    } catch (e: any) {
      if (e?.name === "AbortError") setMsg("⏱️ timeout: server didn’t respond.");
      else setMsg(`🌐 network error: ${e?.message || String(e)}`);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <XStack
          flex={1}
          justifyContent={'center'}
          alignItems={'center'}
        >
          <YStack
            gap={'$6'}
            width={'80%'}
          >
            <H2
              alignSelf="center"
            >
              Pawse
            </H2>

            <YStack
              gap={'$3'}
            >
              <Input placeholder="Email" />
              <Input placeholder="Password" />
            </YStack>
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
          />
          <Input
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {!!msg && (
            <Text color="$red10" fontSize="$4">
              {msg}
            </Text>
          )}
        </YStack>

            <YStack
              gap={'$3'}
            >
              <Button
                backgroundColor={'$green10'}
              >
                Log In
              </Button>
              <Link 
                href="/register"
                alignSelf="center"
              >
                <Text 
                  fontStyle="italic" 
                  width={'100%'}
                  color={'$green10'}
                >
                  New to Pawse? Register here...
                </Text>
              </Link>
            </YStack>
          </YStack>
        </XStack>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
        <YStack gap="$3">
          <Button onPress={onLogin}>Log In</Button>
          <Link href="/register" alignSelf="center" hoverStyle={{ color: "$blue10" }}>
            <Text fontStyle="italic">New to Pawse? Register here...</Text>
          </Link>
        </YStack>
      </YStack>
    </XStack>
  );
}
