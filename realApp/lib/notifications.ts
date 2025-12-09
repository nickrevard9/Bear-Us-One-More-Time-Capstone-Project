// lib/notifications.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { SQLiteDatabase } from "expo-sqlite";

/* Foreground handler */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/* Android channel */
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
export async function ensurePermission(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.status === "granted") return true;
  const req = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: true },
  });
  return req.status === "granted";
}

/* One-shot (seconds) — uses TIME_INTERVAL type */
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

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: sound === true ? "default" : (sound || undefined),
    },
    trigger,
  });

  return id;
}

/* Calendar ONE-SHOT (fires at a specific Date) — uses CALENDAR type */
export async function scheduleCalendarOneShot(date: Date, title: string, body: string) {
  await ensureAndroidChannel();
  const ok = await ensurePermission();
  if (!ok) throw new Error("Notification permission not granted");

  const trigger: Notifications.CalendarTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
    date, // non-repeating
    channelId: Platform.OS === "android" ? "daily-default" : undefined,
  };

  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: "default" },
    trigger,
  });
  return id;
}

/* Daily repeating (calendar-based) — uses CALENDAR type */
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

  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: "default" },
    trigger,
  });

  return id;
}

/* Utilities */
export async function cancelScheduledNotification(id: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (err) {
    console.error("[Notifications] Cancel error:", err);
  }
}

export async function cancelAllScheduled() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    console.error("[Notifications] Cancel all error:", err);
  }
}

export async function listScheduled() {
  try {
    const list = await Notifications.getAllScheduledNotificationsAsync();
    return list;
  } catch (err) {
    console.error("[Notifications] List error:", err);
    return [];
  }
}

/* Diagnostics */
export async function runNotificationDiagnostics(hour: number, minute: number) {
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
    await listScheduled();
  }
}

/**
 * log a notification into the database
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

}

/**
 * retrieve notifications within a certain number of days (default 30).
 */
export async function getRecentNotifications(db: SQLiteDatabase, days = 30) {
  const cutoff = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;

  const rows = await db.getAllAsync(
    `SELECT * FROM notification WHERE timestamp >= ? ORDER BY timestamp DESC`,
    [cutoff]
  );

  // Fix timestamp into ISO for React Native
  return rows.map((r) => ({
    ...r,
    timestamp: r.timestamp.replace(" ", "T") + "Z",
  }));
}
