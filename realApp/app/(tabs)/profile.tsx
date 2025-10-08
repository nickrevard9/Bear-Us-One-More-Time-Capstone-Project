// app/(tabs)/profile.tsx
import React from "react";
import { Alert } from "react-native";
import { Button, YStack, XStack, H2, Image, Group, Separator } from "tamagui";
import { CreditCard, Download, LogOut, Settings } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

export default function Profile() {
  const router = useRouter();

  const onExportReport = async () => {
    try {
      const rows = [
        ["id", "title", "created_at", "status"],
        ["1", "My First Item", "2025-10-08 13:05:00", "completed"],
        ["2", "Another Item", "2025-10-08 13:06:00", "in_progress"],
        ["3", "Last Item", "2025-10-08 13:07:00", "pending"],
      ];

      const csv = rows
        .map(r =>
          r
            .map(cell => {
              const s = String(cell ?? "");
              const needsQuotes = /[",\n]/.test(s);
              const escaped = s.replace(/"/g, '""');
              return needsQuotes ? `"${escaped}"` : escaped;
            })
            .join(",")
        )
        .join("\n");

      // SDK 54+ File API
      const fileName = `report_${Date.now()}.csv`;
      const file = new File(Paths.document, fileName);

      // create() is optional; omit if you prefer to overwrite
      try { file.create(); } catch {} // ignore "already exists"

      // ✅ write expects a string or TypedArray (no options object)
      file.write(csv);

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

  return (
    <XStack flex={1} justifyContent="center" alignItems="center">
      <YStack gap="$8" width="100%">
        <YStack gap="$3">
          <H2 alignSelf="center">Your Name</H2>
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
          <Button icon={LogOut} onPress={() => router.push("/login")}>
            Log Out
          </Button>

          <Separator marginVertical={10} />
        </Group>
      </YStack>
    </XStack>
  );
}
