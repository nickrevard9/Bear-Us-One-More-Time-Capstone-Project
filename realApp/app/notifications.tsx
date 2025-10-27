import React from "react";
import { YStack, XStack, Text, Button, Separator, H4 } from "tamagui";
import { MessageSquare, UserPlus, CheckCircle, Lock } from "@tamagui/lucide-icons";

// notification data may change after connecting with backend
const notifications = {
  today: [
    {
      id: 1,
      title: "New comment on your post",
      description: "Alex left a comment: 'Looks great!'",
      icon: MessageSquare,
      time: "10:24 AM",
    },
    {
      id: 2,
      title: "New follower",
      description: "Jamie started following you",
      icon: UserPlus,
      time: "9:10 AM",
    },
  ],
  yesterday: [
    {
      id: 3,
      title: "System update completed",
      description: "Your weekly scan finished successfully",
      icon: CheckCircle,
      time: "6:45 PM",
    },
  ],
  earlier: [
    {
      id: 4,
      title: "Password changed",
      description: "Your password was changed 3 days ago",
      icon: Lock,
      time: "Oct 23",
    },
  ],
};

export default function Notifications() {
  return (
    <XStack flex={1} p="$4">
      <YStack gap="$8" width="100%">
        {Object.entries(notifications).map(([section, items]) => (
          <YStack key={section}>
            <H4 mb="$3" alignSelf="center" textTransform="capitalize">
              {section}
            </H4>
            {items.map((n) => (
              // use react fragment so we can include a separator after each message
              <React.Fragment key={n.id}>
                {/* use buttons so we can attach icons easily */}
                <Button
                  backgroundColor="automatic"
                  icon={n.icon}
                  justifyContent="flex-start"
                  alignItems="center"
                  paddingVertical="$3"
                  paddingHorizontal="$4"
                >
                  <YStack>
                    <Text fontWeight="600">{n.title}</Text>
                    <Text color="$colorSubtitle">{n.description}</Text>
                    <Text fontSize="$2" color="$gray10">{n.time}</Text>
                  </YStack>
                </Button>
                <Separator marginVertical={10} />
              </React.Fragment>
            ))}
          </YStack>
        ))}
      </YStack>
    </XStack>
  );
}
