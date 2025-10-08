// app/(tabs)/profile.tsx
import React from "react";
import { Button, YStack, XStack, H2, Image, Group, Separator } from "tamagui";
import { CreditCard, Download, LogOut, Settings } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";

export default function Profile() {
  const router = useRouter(); 

  return (
    <XStack flex={1} justifyContent="center" alignItems="center">
      <YStack gap="$8" width="100%">
        <YStack gap="$3">
          <H2 alignSelf="center">Your Name</H2>
          <Image
            source={require("../../assets/images/pat-neff.png")}
            width={120}
            height={120}
            borderRadius={60}
            alignSelf="center"
          />
        </YStack>

        <Group>
          <Separator marginVertical={10} />
          <Button backgroundColor="automatic" icon={CreditCard}>
            Edit Profile
          </Button>

          <Separator marginVertical={10} />
          <Button backgroundColor="automatic" icon={Download}>
            Export Report
          </Button>

          <Separator marginVertical={10} />
          <Button
            backgroundColor="automatic"
            icon={Settings}
            
            onPress={() => {
              console.log("Settings pressed");
              router.push("/settings")
            }}
          >
            Settings
          </Button>

          <Separator marginVertical={10} />
          <Button backgroundColor="automatic" icon={LogOut}
            backgroundColor="automatic"
            
            onPress={() => {
              console.log("Settings pressed");
              router.push("/login")
            }}
          >
            Log Out
          </Button>

          <Separator marginVertical={10} />
        </Group>
      </YStack>
    </XStack>
  );
}
