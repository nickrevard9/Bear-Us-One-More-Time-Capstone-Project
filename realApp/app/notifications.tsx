import React, { useEffect, useState } from "react";
import { YStack, XStack, Text, Button, Separator, H4, Spinner } from "tamagui";
import { useSQLiteContext } from "expo-sqlite";
import { getRecentNotifications } from "../lib/notifications";

type NotificationItem = {
  notification_id: number;
  title: string;
  description: string;
  timestamp: number; // stored as epoch seconds (UTC)
  user_id?: string | null;
};

// Group notifications by date
function groupNotifications(notifications: NotificationItem[]) {
  const today = new Date();
  const todayYMD = {
    y: today.getFullYear(),
    m: today.getMonth() + 1,
    d: today.getDate(),
  };
  
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayYMD = {
    y: yesterday.getFullYear(),
    m: yesterday.getMonth() + 1,
    d: yesterday.getDate(),
  };

  const sections = {
    today: [] as NotificationItem[],
    yesterday: [] as NotificationItem[],
    earlier: [] as NotificationItem[],
  };

  for (const n of notifications) {
    const date = new Date(n.timestamp);
    const ymd = {
      y: date.getFullYear(),
      m: date.getMonth() + 1,
      d: date.getDate(),
    };

    if (
      ymd.y === todayYMD.y &&
      ymd.m === todayYMD.m &&
      ymd.d === todayYMD.d
    ) {
      sections.today.push(n);
    } 
    else if (
      ymd.y === yesterdayYMD.y &&
      ymd.m === yesterdayYMD.m &&
      ymd.d === yesterdayYMD.d
    ) {
      sections.yesterday.push(n);
    } 
    else {
      sections.earlier.push(n);
    }
  }

  return sections;
}

/**
 * notification center page
 * groups notifications into general categories (today, yesterday, and earlier)
 * only gets notifications sent within the last 30 days
 * 
 * notifications are stored in UTC and then converted when displayed
 * @returns 
 */
export default function NotificationCenter() {
  const db = useSQLiteContext();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // get the most recent list of notifications (within 30 days)
  useEffect(() => {
    (async () => {
      try {
        const rows = (await getRecentNotifications(db, 30)) as NotificationItem[];
        setNotifications(rows);
      } catch (err) {
        console.error("[NotificationCenter] Load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [db]);

  if (loading) {
    return (
      <XStack flex={1} alignItems="center" justifyContent="center">
        <Spinner size="large" />
      </XStack>
    );
  }

  if (!notifications.length) {
    return (
      <XStack flex={1} alignItems="center" justifyContent="center">
        <Text color="$accentColor">No notifications in the past 30 days.</Text>
      </XStack>
    );
  }

  const sections = groupNotifications(notifications);

  return (
    <XStack flex={1} p="$4">
      <YStack gap="$8" width="100%">
        {Object.entries(sections).map(([section, items]) =>
          items.length ? (
            <YStack key={section}>
              <H4 mb="$3" alignSelf="center" textTransform="capitalize">
                {section}
              </H4>

              {items.map((n) => {
                // convert UTC epoch seconds to proper Date() in local time
                const localDate = new Date(n.timestamp);
                const timeString = localDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <React.Fragment key={n.notification_id}>
                    <Button
                      backgroundColor="automatic"
                      justifyContent="flex-start"
                      alignItems="center"
                      paddingVertical="$3"
                      paddingHorizontal="$4"
                    >
                      <YStack>
                        <Text fontWeight="600">{n.title}</Text>
                        <Text color="$accentColor">{n.description}</Text>
                        <Text fontSize="$2" color="$accentColor">
                          {timeString}
                        </Text>
                      </YStack>
                    </Button>
                    <Separator marginVertical={10} />
                  </React.Fragment>
                );
              })}
            </YStack>
          ) : null
        )}
      </YStack>
    </XStack>
  );
}
