// app/login.tsx
import React, { useState } from "react";
import { Link, useRouter } from "expo-router";
import { Button, Input, YStack, XStack, Text, H2 } from "tamagui";
import * as SecureStore from "expo-secure-store";

// Update this to your API (e.g., your LAN IP or Expo tunnel URL)
const API_BASE = "http://10.62.163.7:3000";

export default function Login() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(""); // email or username
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onLogin = async () => {
    if (!identifier || !password) {
      setError("Please enter your email/username and password.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const body =
        identifier.includes("@")
          ? { email: identifier, password }
          : { username: identifier, password };

      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Login failed");
      }

      // Expecting: { user, accessToken, expiresAt? }
      await SecureStore.setItemAsync("accessToken", data.accessToken);
      await SecureStore.setItemAsync("user", JSON.stringify(data.user));

      router.replace("/one"); // change if your signed-in route differs
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <XStack flex={1} justifyContent="center" alignItems="center">
      <YStack gap="$6" width="80%">
        <H2 alignSelf="center">Welcome to Pawse!</H2>

        <YStack gap="$3">
          <Input
            placeholder="Email or Username"
            autoCapitalize="none"
            autoCorrect={false}
            value={identifier}
            onChangeText={setIdentifier}
          />
          <Input
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {error && (
            <Text color="$red10" fontSize="$4">
              {error}
            </Text>
          )}
        </YStack>

        <YStack gap="$3">
          <Button onPress={onLogin} disabled={submitting}>
            {submitting ? "Logging in..." : "Log In"}
          </Button>
          <Link
            href="/register"
            alignSelf="center"
            hoverStyle={{ color: "$blue10" }}
          >
            <Text fontStyle="italic" width="100%" hoverStyle={{ color: "$blue10" }}>
              New to Pawse? Register here...
            </Text>
          </Link>
        </YStack>
      </YStack>
    </XStack>
  );
}
