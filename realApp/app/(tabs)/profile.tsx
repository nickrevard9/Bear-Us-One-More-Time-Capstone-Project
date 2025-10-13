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

  // -------- Export all data (users row for current user, streaks, logs) --------
  const onExportReport = async () => {
    try {
      // 1) Identify current user
      const user = await getCurrentUser(db);
      if (!user?.id) {
        Alert.alert("No user", "Please log in before exporting.");
        return;
      }

      // 2) Pull table data for this user
      const userRows = await db.getAllAsync<any>(
        `SELECT id, username, email, firstName, lastName, createdAt
           FROM users
          WHERE id = ?`,
        [user.id]
      );

      const streakRows = await db.getAllAsync<any>(
        `SELECT streak_id, start_date_streak, num_days
           FROM streak
          WHERE user_id = ?
          ORDER BY streak_id ASC`,
        [user.id]
      );

      const logRows = await db.getAllAsync<any>(
        `SELECT log_id, date, start_time, duration, medium, channel,
                intentional, primary_motivation, description
           FROM log_data
          WHERE user_id = ?
          ORDER BY date DESC, start_time DESC, log_id DESC`,
        [user.id]
      );

      // 3) Build CSV with labeled sections
      const parts: string[] = [];

      // users section
      parts.push(
        rowsToCSV([
          ["SECTION", "users"],
          ["id", "username", "email", "firstName", "lastName", "createdAt"],
        ])
      );
      parts.push(
        userRows.length
          ? rowsToCSV(
              userRows.map((r) => [
                r.id,
                r.username,
                r.email,
                r.firstName,
                r.lastName,
                r.createdAt,
              ])
            )
          : ""
      );

      parts.push("");

      // streak section
      parts.push(
        rowsToCSV([["SECTION", "streak"], ["streak_id", "start_date_streak", "num_days"]])
      );
      parts.push(
        streakRows.length
          ? rowsToCSV(streakRows.map((r) => [r.streak_id, r.start_date_streak, r.num_days]))
          : ""
      );

      parts.push("");

      // log_data section
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
      parts.push(
        logRows.length
          ? rowsToCSV(
              logRows.map((r) => [
                r.log_id,
                r.date,
                r.start_time,
                r.duration,
                r.medium,
                r.channel,
                r.intentional,
                r.primary_motivation,
                r.description,
              ])
            )
          : ""
      );

      const csv = parts.join("\n");

      // 4) Save & share
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

  // -------- Logout: clear DB flag + any stored session and replace route --------
  const onLogout = useCallback(async () => {
    try {
      await markLoggedOut(db);
      await delKV("user");
      await delKV("accessToken");

      setDisplayName("Your Name");
      router.replace("/login"); // prevents "back" into tabs
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
