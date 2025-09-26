// app/register.tsx
import React from "react";
import { Link } from "expo-router";
import { Button, Input, YStack, XStack, Text, H2 } from "tamagui";
import { useState } from "react";

export default function Register() {

  // states for all fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleRegistration() {
    console.log('tryin it')
    try {
      
      // replace this with your public ip (until we have a real server)
      const res = await fetch("http://1192.168.68.112:8888/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          USERNAME: username,
          EMAIL: email,
          PASSWORD: password,
          FIRST_NAME: firstName,
          LAST_NAME: lastName,
        }),
      });
      
      const data = await res.json();

      if (res.ok) {
        setMessage("boom");
      } else {
        setMessage("nooo");
      }
    } catch (err: any) {
      setMessage("error");
    }
  }

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
          <Input placeholder="First Name" value={firstName} onChangeText={setFirstName}/>
          <Input placeholder="Last Name" value={lastName} onChangeText={setLastName}/>
          <Input placeholder="Username" value={username} onChangeText={setUsername}/>
          <Input placeholder="Email" value={email} onChangeText={setEmail}/>
          <Input 
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </YStack>

        <YStack
          gap={'$3'}
        >
          <Button onPress={handleRegistration}>Register User</Button>
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