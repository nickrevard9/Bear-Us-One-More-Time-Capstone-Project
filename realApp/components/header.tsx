import React from 'react';
import { Dimensions } from 'react-native';
import { YStack, XStack, Text, Button } from 'tamagui';
import { useRouter } from 'expo-router';
import { Bell } from '@tamagui/lucide-icons';

const { height: screenHeight } = Dimensions.get('window');

export function HeaderNotifications() {
  const router = useRouter();
  const headerHeight = screenHeight * 0.12; // making height of header reactive to the screen size

  return (
    <YStack
      backgroundColor="$background"
      height={headerHeight}
      justifyContent="flex-end"
      paddingHorizontal="$4"
      paddingBottom="$3"
      borderBottomWidth={1}
      borderColor="$borderColor"
    >
      <XStack alignItems="center" justifyContent="space-between">
        {/* TODO: add logo next to Pawse title? */}
        <Text fontSize="$7" fontWeight="600">{"Pawse"}</Text>
        {/* TODO: make notification bubble appear or change color of bell if there are unread notifictations? */}
        <Button unstyled onPress={() => router.push('/notifications')}>
          <Bell size={26} />
        </Button>
      </XStack>
    </YStack>
  );
}
