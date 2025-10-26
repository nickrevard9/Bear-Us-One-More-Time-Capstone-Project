// lib/reminderPrefs.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const K_ENABLED = "reminder_enabled";
const K_HOUR = "reminder_hour";
const K_MINUTE = "reminder_minute";
const K_ID = "reminder_id";

export async function loadPrefs() {
  const [[, e], [, h], [, m], [, id]] = await AsyncStorage.multiGet([
    K_ENABLED, K_HOUR, K_MINUTE, K_ID
  ]);
  return {
    enabled: e ? JSON.parse(e) as boolean : false,
    hour: h ? parseInt(h, 10) : 9,
    minute: m ? parseInt(m, 10) : 0,
    id: id || null,
  };
}

export async function savePrefs(enabled: boolean, hour: number, minute: number, id: string | null) {
  await AsyncStorage.multiSet([
    [K_ENABLED, JSON.stringify(enabled)],
    [K_HOUR, String(hour)],
    [K_MINUTE, String(minute)],
    [K_ID, id ?? ""],
  ]);
}
