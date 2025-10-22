// lib/notifications.ts
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 👇 NAME + export must be exactly "scheduleNotification"
export async function scheduleNotification(
  seconds: number,
  title: string,
  body: string
) {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission not granted');
  }

  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: { seconds },
  });
}
