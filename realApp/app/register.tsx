// app/register.tsx
import { Link } from "expo-router";
import { Button, Input, YStack, XStack, Text, H2 } from "tamagui";

export default function Register() {
  return (
    <XStack
      flex={1}
      justifyContent={'center'}
      alignItems={'center'}
    >
      <YStack
        gap={'$6'}
        width={'80%'}
      >
        <H2
          alignSelf="center"
        >
          Welcome to Pawse!
        </H2>

        <YStack
          gap={'$3'}
        >
          <Input placeholder="First Name" />
          <Input placeholder="Last Name" />
          <Input placeholder="Email" />
          <Input placeholder="Password" />
        </YStack>

        <YStack
          gap={'$3'}
        >
          <Button>Register User</Button>
          <Link 
            href="/login"
            alignSelf="center"
            hoverStyle={{
              color: '$blue10'
            }}
          >
            <Text 
              fontStyle="italic" 
              width={'100%'}
              hoverStyle={{
                color: '$blue10'
              }}
            >
              Already have an account? Log in here...
            </Text>
          </Link>
        </YStack>
      </YStack>
    </XStack>
  );
}
