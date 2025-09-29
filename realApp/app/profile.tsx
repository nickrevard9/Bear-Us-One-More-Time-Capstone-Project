// app/login.tsx
import { Button, YStack, XStack, H2, Image, Group, Separator } from "tamagui";
import { CreditCard, Download, LogOut, Settings } from '@tamagui/lucide-icons';

export default function Profile() {
  return (
    <XStack
      flex={1}
      justifyContent={'center'}
      alignItems={'center'}
    >
      {/* TODO: create back button, find way to determine/set screen dimensions */}
      <YStack
        gap={'$8'}
        width={'100%'}
      >
        <YStack gap={'$3'}>
          <H2 alignSelf="center">Your Name</H2>
          <Image
            source={require('../assets/images/pat-neff.png')}
            width={120}
            height={120}
            borderRadius={60}   // must be half of the width and height to make it a circle
            alignSelf="center"
          />
        </YStack>

        <Group>
          <Separator marginVertical={10} />
          <Button 
            backgroundColor="automatic"
            icon={CreditCard}
          >
            Edit Profile
          </Button>
          <Separator marginVertical={10} />
          <Button 
            backgroundColor="automatic"
            icon={Download}
          >
            Export Report
          </Button>
          <Separator marginVertical={10} />
          <Button 
            backgroundColor="automatic"
            icon={Settings}
          >
            Settings
          </Button>
          <Separator marginVertical={10} />
          <Button 
            backgroundColor="automatic"
            icon={LogOut}
          >
            Log Out
          </Button>
          <Separator marginVertical={10} />
        </Group>
      </YStack>
    </XStack>
  );
}
