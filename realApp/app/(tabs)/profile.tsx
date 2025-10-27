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
import { getCurrentUser, markLoggedOut, getCurrentStreak, getLogsByUserDate } from "../../lib/db";
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

async function updateStreak(db, user_id) {
  console.log("entered");
  if (!user_id) return { ok: false, reason: "no-user" };
  console.log("I have an id");
  const current_streak = true;
  const now = todayLocalIso();
  console.log("hi");

  const yesterday = previousDayLocalIso();
  console.log("hi");

  const current = await getCurrentStreak(db, user_id);
  console.log("hi");
try {
  console.log("updateStreak: user_id =", user_id, "now =", now);

  // choose the available method
  const queryAll = db.getAllAsync || db.getAll || db.all || db.allAsync || null;
  const queryFirst = db.getFirstAsync || db.getFirst || null;

  if (!queryAll && !queryFirst && !db.runAsync) {
    console.error("No suitable DB query method found on db:", Object.keys(db));
    return { ok: false, reason: "no-db-method" };
  }

  // get a sample row
  const first_row = queryAll
    ? await queryAll.call(db, `SELECT * FROM log_data WHERE user_id = ? LIMIT 1`, [user_id])
    : // fallback to getFirst-like behavior
      (await queryFirst.call(db, `SELECT * FROM log_data WHERE user_id = ? LIMIT 1`, [user_id]) ? [await queryFirst.call(db, `SELECT * FROM log_data WHERE user_id = ? LIMIT 1`, [user_id])] : []);

  console.log("first_row:", JSON.stringify(first_row));

  // check today's log
// if your log_data.date is stored like "MM/DD/YYYY" (example shows "10/26/2025")
const todayFormatted = todayLocalMMDDYYYY(); // new helper shown below

const lastLogRows = queryAll
  ? await queryAll.call(db, `SELECT 1 FROM log_data WHERE user_id = ? AND date = ? LIMIT 1`, [user_id, todayFormatted])
  : (await queryFirst.call(db, `SELECT 1 FROM log_data WHERE user_id = ? AND date = ? LIMIT 1`, [user_id, todayFormatted]))
    ? [await queryFirst.call(db, `SELECT 1 FROM log_data WHERE user_id = ? AND date = ? LIMIT 1`, [user_id, todayFormatted])]
    : [];

  console.log("lastLogRows:", JSON.stringify(lastLogRows));
  const hasTodayLog = Array.isArray(lastLogRows) ? lastLogRows.length > 0 : Boolean(lastLogRows);
  console.log("hasTodayLog:", hasTodayLog);

  if (!hasTodayLog) return { ok: false, reason: "no-today-log" };
  
  // continue with rest of updateStreak...
} catch (err) {
  console.error("updateStreak query error:", err);
  return { ok: false, reason: "query-error", error: err };
}

  try {
    if (!current) {
      console.log("inserted new streak");

      await db.runAsync(
        `INSERT INTO streak (start_date_streak,  num_days, user_id) VALUES (?, ?, ?)`,
        [now, 1, user_id]
      );
      return { ok: true, action: "insert", num_days: 1 };
    }

    const lastDate = (current.last_updated || "").slice(0, 10);

    if (lastDate === now) return { ok: true, action: "noop", num_days: current.num_days };

    if (lastDate === yesterday) {
      const newDays = (current.num_days || 0) + 1;
      await db.runAsync(
        `UPDATE streak SET num_days = ?, last_updated = ? WHERE streak_id = ? AND user_id = ?`,
        [newDays, now, current.streak_id, user_id]
      );
      return { ok: true, action: "update", num_days: newDays };
    }

    await db.runAsync(
      `INSERT INTO streak (start_date_streak, last_updated, num_days, user_id) VALUES (?, ?, ?, ?)`,
      [now, now, 1, user_id]
    );
    return { ok: true, action: "reset-insert", num_days: 1 };
  } catch (err) {
    console.error("updateStreak db-error:", err);
 
    return { ok: false, reason: "db-error", error: err };
  }
}
function todayLocalMMDDYYYY() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}
function todayLocalIso() {
  const now = new Date();
  
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function previousDayLocalIso() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}


// async function getCurrentStreak(db: SQLiteDatabase, user_id) {
//   console.log("row");

//   const row = await db.getFirstAsync<any>(
//     `SELECT streak_id, user_id, num_days, last_updated
//        FROM streak
//       WHERE user_id = ?
//    ORDER BY streak_id DESC
//       LIMIT 1`,
//     [user_id]
//   );
//   console.log("row");
//   return row || null;
// }



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
          const result = await updateStreak(db, user.id);
          console.log("updateStreak result:", result?.reason);


          if (user) {
            const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
            setDisplayName(full || user.username || user.email || "Your Name");
            const today = todayLocalIso();
            const yesterday = previousDayLocalIso();

            // streak query
            const streak = await db.getFirstAsync<any>(
              `SELECT num_days
                 FROM streak
                WHERE user_id = ?
             ORDER BY streak_id DESC
                LIMIT 1`,
              [user.id, today, yesterday]
            );
            setStreakDays(streak?.num_days ?? 0);
            //setStreakDays(3);
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