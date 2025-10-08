// app/(tabs)/profile.tsx
import React, { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";
import { Button, YStack, XStack, H2, Image, Group, Separator } from "tamagui";
import { CreditCard, Download, LogOut, Settings } from "@tamagui/lucide-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import * as SecureStore from "expo-secure-store";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import { getCurrentUser, markLoggedOut } from "../../lib/db";

async function delKV(key: string) {
  if (Platform.OS === "web") {
    try { localStorage.removeItem(key); } catch {}
  } else {
    try { await SecureStore.deleteItemAsync(key); } catch {}
  }
}

export default function Profile() {
  const router = useRouter();
  const db = useSQLiteContext();

  const [displayName, setDisplayName] = useState<string>("Your Name");

  // Refresh the name every time this tab gains focus
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const user = await getCurrentUser(db);
          if (user) {
            const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
            setDisplayName(full || user.username || user.email || "Your Name");
          } else {
            setDisplayName("Your Name");
          }
        } catch {
          setDisplayName("Your Name");
        }
      })();
    }, [db])
  );

  const onExportReport = async () => {
    try {
      const rows = [
        ["id", "title", "created_at", "status"],
        ["1", "My First Item", "2025-10-08 13:05:00", "completed"],
        ["2", "Another Item", "2025-10-08 13:06:00", "in_progress"],
        ["3", "Last Item", "2025-10-08 13:07:00", "pending"],
      ];

      const csv = rows
        .map((r) =>
          r
            .map((cell) => {
              const s = String(cell ?? "");
              const needsQuotes = /[",\n]/.test(s);
              const escaped = s.replace(/"/g, '""');
              return needsQuotes ? `"${escaped}"` : escaped;
            })
            .join(",")
        )
        .join("\n");

      const fileName = `report_${Date.now()}.csv`;
      const file = new File(Paths.document, fileName);

      try { file.create(); } catch {} // ignore if already exists
      file.write(csv); // string or TypedArray

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/csv",
          dialogTitle: "Export Report",
        });
      } else {
        Alert.alert("CSV saved", `Saved to:\n${file.uri}`);
      }
    } catch (err: any) {
      console.error("Export error:", err);
      Alert.alert("Export failed", err?.message ?? "Unknown error");
    }
  };

  const onLogout = useCallback(async () => {
    try {
      // Flip DB flag + clear any stored session
      await markLoggedOut(db);
      await delKV("user");
      await delKV("accessToken");

      // Update UI immediately (in case there's a frame before navigation)
      setDisplayName("Your Name");

      // Replace so there's no "back" into the tabs
      router.replace("/login");
    } catch (e: any) {
      Alert.alert("Logout failed", e?.message ?? "Unknown error");
    }
  }, [db, router]);

  return (
    <XStack flex={1} justifyContent="center" alignItems="center">
      <YStack gap="$8" width="100%">
        <YStack gap="$3">
          <H2 alignSelf="center">{displayName}</H2>
          <Image
            source={require("../../assets/images/pat-neff.png")}
            width={120}
            height={120}
            borderRadius={60}
            alignSelf="center"
          />
        </YStack>

        <Group>
          <Separator marginVertical={10} />
          <Button icon={CreditCard}>Edit Profile</Button>

          <Separator marginVertical={10} />
          <Button icon={Download} onPress={onExportReport}>
            Export Report
          </Button>

          <Separator marginVertical={10} />
          <Button icon={Settings} onPress={() => router.push("/settings")}>
            Settings
          </Button>

          <Separator marginVertical={10} />
          <Button icon={LogOut} onPress={onLogout}>
            Log Out
          </Button>

          <Separator marginVertical={10} />
        </Group>
      </YStack>
    </XStack>
  );
}
