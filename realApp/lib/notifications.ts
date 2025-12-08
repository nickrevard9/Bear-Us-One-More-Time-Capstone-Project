// lib/notifications.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { SQLiteDatabase } from "expo-sqlite";

/* Foreground handler */
// Show notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/* Android channel */
// Ensure the notification channel exists on Android
async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("daily-default", {
    name: "Daily Reminders",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

/* Permissions */
// Ensure notification permissions are granted
// Will prompt the user if not already granted
export async function ensurePermission(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.status === "granted") return true;
  const req = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: true },
  });
  return req.status === "granted";
}

/* One-shot (seconds) — uses TIME_INTERVAL type */
// Used to schedule a notification after a certain number of seconds
// sound can be true (default), false (no sound), or a string for custom sound

// (mainly used for testing the notifications)
export async function scheduleNotification(
  seconds: number,
  title: string,
  body: string,
  sound: boolean | string = true
) {
  await ensureAndroidChannel();
  const ok = await ensurePermission();
  if (!ok) throw new Error("Notification permission not granted");

  const trigger: Notifications.TimeIntervalTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds,
    repeats: false,
    // channelId only matters on Android; safe to include
    channelId: Platform.OS === "android" ? "daily-default" : undefined,
  };

  console.log("[Notifications] Scheduling one-shot:", { seconds, title, body, trigger });

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: sound === true ? "default" : (sound || undefined),
    },
    trigger,
  });

  console.log("[Notifications] One-shot scheduled with ID:", id);
  return id;
}

/* Calendar ONE-SHOT (fires at a specific Date) — uses CALENDAR type */
// Used to schedule a notification at a specific date and time (non-repeating)
// CALENDAR type is used to target specific date/time
export async function scheduleCalendarOneShot(date: Date, title: string, body: string) {
  await ensureAndroidChannel();
  const ok = await ensurePermission();
  if (!ok) throw new Error("Notification permission not granted");

  const trigger: Notifications.CalendarTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
    date, // non-repeating
    channelId: Platform.OS === "android" ? "daily-default" : undefined,
  };

  console.log("[Notifications] Scheduling calendar one-shot:", { date: date.toString(), title, body, trigger });

  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: "default" },
    trigger,
  });
  console.log("[Notifications] Calendar one-shot scheduled with ID:", id);
  return id;
}

/* Daily repeating (calendar-based) — uses CALENDAR type */
// Used to schedule a daily repeating notification at a specific hour and minute
// CALENDAR type is used to target specific time
export async function scheduleDailyNotification(
  hour: number,
  minute: number,
  title: string,
  body: string
): Promise<string> {
  await ensureAndroidChannel();
  const ok = await ensurePermission();
  if (!ok) throw new Error("Notification permission not granted");

  const trigger: Notifications.CalendarTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
    hour,
    minute,
    repeats: true,
    channelId: Platform.OS === "android" ? "daily-default" : undefined,
  };

  console.log("[Notifications] Scheduling daily reminder:", { hour, minute, title, body, trigger });

  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: "default" },
    trigger,
  });

  console.log("[Notifications] Daily scheduled with ID:", id);
  return id;
}

/* Utilities */
// Used to cancel a specific scheduled notification by its ID
export async function cancelScheduledNotification(id: string) {
  try {
    console.log("[Notifications] Cancelling ID:", id);
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (err) {
    console.error("[Notifications] Cancel error:", err);
  }
}


// Used to cancel all scheduled notifications
export async function cancelAllScheduled() {
  try {
    console.log("[Notifications] Cancelling ALL scheduled notifications...");
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    console.error("[Notifications] Cancel all error:", err);
  }
}

// List all scheduled notifications
// This is mainly for debugging purposes
export async function listScheduled() {
  try {
    const list = await Notifications.getAllScheduledNotificationsAsync();
    console.log("[Notifications] Currently scheduled:", JSON.stringify(list, null, 2));
    return list;
  } catch (err) {
    console.error("[Notifications] List error:", err);
    return [];
  }
}

/* Diagnostics */
// Run a series of notification tests
// 1) one-shot in 10s
// 2) calendar one-shot at next minute boundary
// 3) daily repeating at specified hour:minute

// Also lists scheduled notifications a few times with increasing delays
// Strictly for testing purposes
export async function runNotificationDiagnostics(hour: number, minute: number) {
  console.log("[Diag] Starting notification diagnostics…");

  // 1) seconds one-shot in 10s
  await scheduleNotification(10, "Diag: seconds", "This should arrive in ~10s.");

  // 2) calendar one-shot for next minute boundary (non-repeating)
  const now = new Date();
  const nextMinute = new Date(now);
  nextMinute.setSeconds(0, 0);
  nextMinute.setMinutes(now.getMinutes() + 1);
  await scheduleCalendarOneShot(nextMinute, "Diag: calendar one-shot", "Next minute.");

  // 3) daily repeating at (hour:minute)
  await scheduleDailyNotification(hour, minute, "Diag: daily repeating", "Repeats daily at set time.");

  // Poll OS listing a few times with increasing delays
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
  for (const wait of [200, 600, 1200, 2000]) {
    await sleep(wait);
    console.log(`[Diag] Listing after ${wait}ms…`);
    await listScheduled();
  }
}

/**
 * log a notification into the database.
 */
export async function logNotification(
  db: SQLiteDatabase,
  title: string,
  description: string,
  userId?: string | null
) {
  // time collected automatically by SQLite's CURRENT_TIMESTAMP in db (UTC)
  await db.runAsync(
    `INSERT INTO notification (title, description, user_id)
     VALUES (?, ?, ?)`,
    [title, description, userId ?? null]
  );

  console.log(`---- message has been logged: ${title} : ${description} : ${userId} ----`)
}

/**
 * retrieve notifications within a certain number of days (default 30).
 */
export async function getRecentNotifications(db: SQLiteDatabase, days = 30) {
  const cutoff = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;
  return db.getAllAsync(
    `SELECT * FROM notification WHERE timestamp >= ? ORDER BY timestamp DESC`,
    [cutoff]
  );
}
