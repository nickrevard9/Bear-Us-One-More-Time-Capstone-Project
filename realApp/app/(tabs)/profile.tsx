// app/(tabs)/profile.tsx
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Platform, ScrollView, Switch } from "react-native";
import {
  Button,
  YStack,
  XStack,
  H2,
  H4,
  Image,
  Group,
  Separator, Text,
  Text,
  Progress,
} from "tamagui";
import {
  CreditCard,
  Download,
  LogOut as LogOutIcon,
  Settings, Bell,
  Bell,
  Flame,
} from "@tamagui/lucide-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import * as SecureStore from "expo-secure-store";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import DateTimePicker from "@react-native-community/datetimepicker";

import { getCurrentUser, markLoggedOut } from "../../lib/db";
import {
  scheduleDailyNotification,
  cancelAllScheduled,
  listScheduled,
  runNotificationDiagnostics,
  ensurePermission,
} from "../../lib/notifications";
import { loadPrefs, savePrefs } from "../../lib/reminderPrefs";

/* ------------------------------------------
 * Small helpers
 * ------------------------------------------ */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function delKV(key: string) {
  if (Platform.OS === "web") {
    try { localStorage.removeItem(key); } catch {}
  } else {
    try { await SecureStore.deleteItemAsync(key); } catch {}
  }
}

const onNotificationTest = () => {
  scheduleNotification(3, '🔔 Test Notification 🔔', 'This is a notification!')
    .catch(err => Alert.alert('Notifications', err?.message ?? 'Failed to schedule'));
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



/** Compute a safe next-occurrence (avoid “now”) */
function computeSafeDailyTarget(base: Date): Date {
  const now = new Date();
  const target = new Date(now);
  target.setHours(base.getHours(), base.getMinutes(), 0, 0);
  if (target.getTime() <= now.getTime() + 5000) {
    target.setMinutes(target.getMinutes() + 1);
  }
  return target;
}

/* ------------------------------------------
 * Main Component
 * ------------------------------------------ */
export default function Profile() {
  const router = useRouter();
  const db = useSQLiteContext();
  const [displayName, setDisplayName] = useState("Your Name");

  // Reminders
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [time, setTime] = useState(() => {
    const d = new Date();
    d.setSeconds(0, 0);
    return d;
  });
  const [scheduledId, setScheduledId] = useState<string | null>(null);

  // Time picker state
  const [showPicker, setShowPicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());

  /* Refresh display name when tab gains focus */
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
          } else setDisplayName("Your Name");
            setStreakDays(0);
        } catch {
          setDisplayName("Your Name");
          setStreakDays(0);
        }
      })();


    }, [db])
  );

  /* Load persisted reminder prefs on mount */
  useEffect(() => {
    (async () => {
      const { enabled, hour, minute, id } = await loadPrefs();
      const d = new Date();
      d.setHours(hour, minute, 0, 0);
      setRemindersEnabled(enabled);
      setTime(d);
      setScheduledId(id);
    })();
  }, []);

  /* Export CSV */
  const onExportReport = useCallback(async () => {
    try {
      const user = await getCurrentUser(db);
      if (!user?.id) {
        Alert.alert("No user", "Please log in before exporting.");
        return;
      }

      const userRows = await db.getAllAsync<any>(
        `SELECT username, email, firstName, lastName
           FROM users
          WHERE id = ?`,
        [user.id]
      );
      const streakRows = await db.getAllAsync<any>(
        `SELECT streak_id, start_date_streak, num_days FROM streak WHERE user_id = ? ORDER BY streak_id ASC`,
        [user.id]
      );
      const logRows = await db.getAllAsync<any>(
        `SELECT date(start_date, 'localtime') as start_date, ROUND(ABS((julianday(start_date) - julianday(end_date))* 24 * 60)) || ' mins' AS duration, medium, channel,
                intentional, primary_motivation, description
           FROM log_data
          WHERE user_id = ?
          ORDER BY start_date DESC, log_id DESC`,
        [user.id]
      );

      const parts: string[] = [];
      parts.push(
        rowsToCSV([
          ["SECTION", "users"],
          ["username", "email", "firstName", "lastName",],
        ])
      );
      parts.push(
        userRows.length
          ? rowsToCSV(
              userRows.map((r) => [
                r.username,
                r.email,
                r.firstName,
                r.lastName,
              ])
            )
          : ""
      );

      parts.push("");
      parts.push(rowsToCSV([["SECTION", "streak"], ["streak_id", "start_date_streak", "num_days"]]));
      if (streakRows.length) {
        parts.push(rowsToCSV(streakRows.map(r => [r.streak_id, r.start_date_streak, r.num_days])));
      }
      parts.push("");
      parts.push(
        rowsToCSV([
          ["SECTION", "log_data"],
          [
            "Start Date",
            "Duration",
            "Medium",
            "Channel",
            "Intentional",
            "Primary Motivation",
            "Desciription",
          ],
        ])
      );
      parts.push(
        logRows.length
          ? rowsToCSV(
              logRows.map((r) => [
                r.start_date,
                r.duration,
                r.medium,
                r.channel,
                r.intentional == 1 ? "Yes" : "No",
                r.primary_motivation,
                r.description,
              ])
            )
          : ""
      );

      parts.push(rowsToCSV(logRows.map((r) => Object.values(r))));
      const csv = parts.join("\n");
      const fileName = `pawse_export_${Date.now()}.csv`;
      const file = new File(Paths.document, fileName);
      try { file.create(); } catch {}
      file.write(csv);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: "text/csv", dialogTitle: "Export Pawse Data" });
      } else {
        Alert.alert("CSV saved", file.uri);
      }
    } catch (err: any) {
      console.error("Export error:", err);
      Alert.alert("Export failed", err?.message ?? "Unknown error");
    }
  }, [db]);

  /* Logout */
  const onLogout = useCallback(async () => {
    try {
      await markLoggedOut(db);
      await delKV("user");
      await delKV("accessToken");
      setDisplayName("Your Name");
      router.replace("/new user");
    } catch (e: any) {
      Alert.alert("Logout failed", e?.message ?? "Unknown error");
    }
  }, [db, router]);

  /* Toggle daily reminders (with defensive logging + polling list) */
  const onToggleReminders = useCallback(
    async (value: boolean) => {
      setRemindersEnabled(value);
      const finalTime = computeSafeDailyTarget(time);
      const hour = finalTime.getHours();
      const minute = finalTime.getMinutes();

      if (value) {
        const ok = await ensurePermission();
        if (!ok) {
          Alert.alert("Notifications", "Permission not granted.");
          setRemindersEnabled(false);
          await savePrefs(false, hour, minute, null);
          return;
        }
        await cancelAllScheduled();

        const id = await scheduleDailyNotification(
          hour,
          minute,
          "⏰ Daily check-in",
          "Don’t forget to log your activity today!"
        );
        console.log("[Profile] Scheduled daily reminder ID:", id);
        setScheduledId(id);
        await savePrefs(true, hour, minute, id);

        // Poll OS list a few times (Expo/OS may delay surfacing repeating triggers)
        for (let i = 0; i < 3; i++) {
          await sleep(400);
          await listScheduled();
        }
      } else {
        await cancelAllScheduled();
        setScheduledId(null);
        await savePrefs(false, hour, minute, null);
        await sleep(200);
        await listScheduled();
      }
    },
    [time]
  );

  /* Time picker handlers */
  const openTimePicker = useCallback(() => {
    const d = new Date(time);
    d.setSeconds(0, 0);
    setTempTime(d);
    setShowPicker(true);
  }, [time]);

  const onPickerChange = useCallback((event: any, selected?: Date) => {
    if (Platform.OS === "android") {
      if (event?.type === "dismissed") {
        setShowPicker(false);
        return;
      }
      if (event?.type === "set" && selected) {
        selected.setSeconds(0, 0);
        setTempTime(selected);
      }
    } else if (selected) {
      selected.setSeconds(0, 0);
      setTempTime(selected);
    }
  }, []);

  const onSaveTime = useCallback(async () => {
    setShowPicker(false);

    const oldH = time.getHours(), oldM = time.getMinutes();
    const newH = tempTime.getHours(), newM = tempTime.getMinutes();
    if (oldH === newH && oldM === newM) return;

    const finalTime = computeSafeDailyTarget(tempTime);
    setTime(finalTime);
    const hour = finalTime.getHours();
    const minute = finalTime.getMinutes();

    if (remindersEnabled) {
      await cancelAllScheduled();
      const id = await scheduleDailyNotification(
        hour,
        minute,
        "⏰ Daily check-in",
        "Don’t forget to log your activity today!"
      );
      console.log("[Profile] Re-scheduled daily reminder ID:", id);
      setScheduledId(id);
      await savePrefs(true, hour, minute, id);

      for (let i = 0; i < 3; i++) {
        await sleep(400);
        await listScheduled();
      }
    } else {
      await savePrefs(false, hour, minute, scheduledId);
    }
  }, [remindersEnabled, scheduledId, tempTime, time]);

  const onCancelTime = useCallback(() => setShowPicker(false), []);


  /* ------------------------------------------
   * UI
   * ------------------------------------------ */
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        alignItems: "center",
        justifyContent: "flex-start",
        paddingVertical: 40,
        paddingHorizontal: 20,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <YStack gap="$8" width="100%" maxWidth={500}>
        {/* Header */}
        <YStack gap="$3" alignItems="center">
          <H2>{displayName}</H2>
          <Image
            source={require("../../assets/images/pat-neff.png")}
            width={120}
            height={120}
            borderRadius={60}
          />
        </YStack>

        {/* buttons */}
        <Group>
          <Separator marginVertical={10} width={'85%'} alignSelf="center" />
          <Button backgroundColor="automatic" icon={CreditCard}>Edit Profile</Button>

          <Separator marginVertical={10} width={'85%'} alignSelf="center" />
          <Button backgroundColor="automatic" icon={Download} onPress={onExportReport}>
            Export Report
          </Button>

          <Separator marginVertical={10} width={'85%'} alignSelf="center" />
          <Button backgroundColor="automatic" icon={Settings} onPress={() => router.push("/settings")}>
            Settings
          </Button>

          <Separator marginVertical={10} width={'85%'} alignSelf="center" />
          <Button backgroundColor="automatic" icon={LogOutIcon} onPress={onLogout}>
            Log Out
          </Button>

          {/* Reminders */}
          <Separator marginVertical={10} />
          <H2>Reminders</H2>

          <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$2">
            <XStack alignItems="center" gap="$2">
              <Bell size={18} />
              <Text>Daily reminder</Text>
            </XStack>
            <Switch value={remindersEnabled} onValueChange={onToggleReminders} />
          </XStack>

          <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$2">
            <Text>Time</Text>
            <Button size="$3" onPress={openTimePicker} icon={Bell}>
              {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Button>
          </XStack>

          {showPicker && (
            <>
              <DateTimePicker
                value={tempTime}
                mode="time"
                is24Hour={false}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onPickerChange}
              />
              <XStack gap="$2" justifyContent="flex-end" paddingHorizontal="$2" marginTop="$2">
                <Button onPress={onCancelTime} variant="outlined">Cancel</Button>
                <Button onPress={onSaveTime}>Save</Button>
              </XStack>
            </>
          )}
          <Separator marginVertical={10} width={'85%'} alignSelf="center" />
        </Group>
      </YStack>
    </ScrollView>
  );
}
