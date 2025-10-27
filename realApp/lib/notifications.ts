// lib/notifications.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

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
export async function cancelScheduledNotification(id: string) {
  try {
    console.log("[Notifications] Cancelling ID:", id);
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (err) {
    console.error("[Notifications] Cancel error:", err);
  }
}

export async function cancelAllScheduled() {
  try {
    console.log("[Notifications] Cancelling ALL scheduled notifications...");
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    console.error("[Notifications] Cancel all error:", err);
  }
}

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
