// app/register.tsx
import { Link } from "expo-router";
import { Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from "react-native";
import { Button, Input, YStack, XStack, Text, H2 } from "tamagui";

export default function Register() {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
              <Button
                backgroundColor={'$green10'}
              >
                Register User
              </Button>
              <Link 
                href="/login"
                alignSelf="center"
              >
                <Text 
                  fontStyle="italic" 
                  width={'100%'}
                  color={'$green10'}
                >
                  Already have an account? Log in here...
                </Text>
              </Link>
            </YStack>
          </YStack>
        </XStack>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
