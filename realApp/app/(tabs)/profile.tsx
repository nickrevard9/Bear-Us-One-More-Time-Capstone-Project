// app/(tabs)/profile.tsx
import React, { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";
import {
  Button,
  YStack,
  XStack,
  H2,
  H4,
  Image,
  Group,
  Separator,
  Text,
  Progress,
} from "tamagui";
import {
  CreditCard,
  Download,
  LogOut,
  Settings,
  Bell,
  Flame,
} from "@tamagui/lucide-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import * as SecureStore from "expo-secure-store";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import { getCurrentUser, markLoggedOut } from "../../lib/db";
import { scheduleNotification } from "../../lib/notifications";

// ---------- small helpers ----------
async function delKV(key: string) {
  if (Platform.OS === "web") {
    try {
      localStorage.removeItem(key);
    } catch {}
  } else {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
  }
}

const onNotificationTest = () => {
  scheduleNotification(3, "🔔 Test Notification 🔔", "This is a notification!").catch(
    (err) => Alert.alert("Notifications", err?.message ?? "Failed to schedule")
  );
};

// CSV cell & join
function csvCell(s: any): string {
  const val = String(s ?? "");
  const needsQuotes = /[",\n]/.test(val);
  const escaped = val.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}
function rowsToCSV(rows: (string | number | null | undefined)[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\n");
}

export default function Profile() {
  const router = useRouter();
  const db = useSQLiteContext();

  const [displayName, setDisplayName] = useState("Your Name");
  const [streakDays, setStreakDays] = useState<number>(0);

  // refresh display name + streak when tab focused
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const user = await getCurrentUser(db);
          if (user) {
            const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
            setDisplayName(full || user.username || user.email || "Your Name");

            // streak query
            const streak = await db.getFirstAsync<any>(
              `SELECT num_days
                 FROM streak
                WHERE user_id = ?
             ORDER BY streak_id DESC
                LIMIT 1`,
              [user.id]
            );
            //setStreakDays(streak?.num_days ?? 0);
            setStreakDays(3);
          } else {
            setDisplayName("Your Name");
            setStreakDays(0);
          }
        } catch {
          setDisplayName("Your Name");
          setStreakDays(0);
        }
      })();
    }, [db])
  );

  // -------- Export all data --------
  const onExportReport = async () => {
    try {
      const user = await getCurrentUser(db);
      if (!user?.id) {
        Alert.alert("No user", "Please log in before exporting.");
        return;
      }

      const userRows = await db.getAllAsync<any>(
        `SELECT id, username, email, firstName, lastName, createdAt FROM users WHERE id = ?`,
        [user.id]
      );
      const streakRows = await db.getAllAsync<any>(
        `SELECT streak_id, start_date_streak, num_days FROM streak WHERE user_id = ? ORDER BY streak_id ASC`,
        [user.id]
      );
      const logRows = await db.getAllAsync<any>(
        `SELECT log_id, date, start_time, duration, medium, channel, intentional, primary_motivation, description
           FROM log_data
          WHERE user_id = ?
          ORDER BY date DESC, start_time DESC, log_id DESC`,
        [user.id]
      );

      const parts: string[] = [];
      parts.push(
        rowsToCSV([
          ["SECTION", "users"],
          ["id", "username", "email", "firstName", "lastName", "createdAt"],
        ])
      );
      parts.push(rowsToCSV(userRows.map((r) => Object.values(r))));
      parts.push("");
      parts.push(
        rowsToCSV([["SECTION", "streak"], ["streak_id", "start_date_streak", "num_days"]])
      );
      parts.push(rowsToCSV(streakRows.map((r) => Object.values(r))));
      parts.push("");
      parts.push(
        rowsToCSV([
          ["SECTION", "log_data"],
          [
            "log_id",
            "date",
            "start_time",
            "duration",
            "medium",
            "channel",
            "intentional",
            "primary_motivation",
            "description",
          ],
        ])
      );
      parts.push(rowsToCSV(logRows.map((r) => Object.values(r))));
      const csv = parts.join("\n");

      const fileName = `pawse_export_${Date.now()}.csv`;
      const file = new File(Paths.document, fileName);
      try {
        file.create();
      } catch {}
      file.write(csv);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/csv",
          dialogTitle: "Export Pawse Data",
        });
      } else {
        Alert.alert(
          "CSV saved",
          `Saved to:\n${file.uri}\n\nRows exported:\nusers: ${userRows.length}\nstreak: ${streakRows.length}\nlogs: ${logRows.length}`
        );
      }
    } catch (err: any) {
      console.error("Export error:", err);
      Alert.alert("Export failed", err?.message ?? "Unknown error");
    }
  };

  // -------- Logout --------
  const onLogout = useCallback(async () => {
    try {
      await markLoggedOut(db);
      await delKV("user");
      await delKV("accessToken");
      setDisplayName("Your Name");
      router.replace("/login");
    } catch (e: any) {
      Alert.alert("Logout failed", e?.message ?? "Unknown error");
    }
  }, [db, router]);

  return (
    <XStack flex={1} justifyContent="center" alignItems="center">
      <YStack gap="$8" width="100%">
        {/* profile section */}
        <YStack gap="$3" alignItems="center">
          <H2>{displayName}</H2>
          <Image
            source={require("../../assets/images/pat-neff.png")}
            width={120}
            height={120}
            borderRadius={60}
          />

          {/* streak visual */}
          <YStack alignItems="center" marginTop="$2">
            <XStack alignItems="center" gap="$2">
              <Flame color="orange" size={22} />
              <H4>{streakDays}-day streak</H4>
            </XStack>
            <Progress
              value={(streakDays % 5) * (100 / 5)}
              width={200}
              marginTop="$2"
            >
              <Progress.Indicator backgroundColor="orange" />
            </Progress>
            <Text fontSize="$2" color="$gray10">
              Keep it going!
            </Text>
          </YStack>
        </YStack>

        {/* buttons */}
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
          <Button icon={Bell} onPress={onNotificationTest}>
            Notification Test
          </Button>
        </Group>
      </YStack>
    </XStack>
  );
}