import React from 'react';
import { Dimensions, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, Button } from 'tamagui';
import { useRouter } from 'expo-router';
import { Bell } from '@tamagui/lucide-icons';

const { height: screenHeight } = Dimensions.get('window');

export function HeaderNotifications(props: {route_name?: any}) {
  const router = useRouter();
  const headerHeight = screenHeight * 0.135; // making height of header reactive to the screen size

  return (
    <YStack
      backgroundColor="$backgroundStrong"
      height={headerHeight}
      justifyContent="flex-end"
      paddingHorizontal="$4"
      paddingBottom="$3"
      borderBottomWidth={1}
      borderColor="$backgroundStrong"
    >
      <XStack alignItems="center" justifyContent="space-between">
        {(props.route_name && props.route_name == "report_page" || props.route_name == "edit_page")  && 
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 28, fontWeight: 'bold' }} onPress={() => router.back()}>{'←'}</Text>
        </TouchableOpacity>}
        {/* TODO: add logo next to Pawse title? */}
        <Text fontSize="$7" fontWeight="600">{"Pawse"}</Text>
        {/* TODO: make notification bubble appear or change color of bell if there are unread notifictations? */}
        <Button unstyled onPress={() => router.push('/notifications')}>
          <Bell size={26} color={'$primary'}/>
        </Button>
      </XStack>
    </YStack>
  );
}
