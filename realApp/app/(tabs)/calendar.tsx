import React from "react";
import { Button, YStack, XStack, H2, Image, Group, Separator, View } from "tamagui";
import { CreditCard, Download, LogOut, Settings } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import {Calendar} from "@/components/calendar";
import { DateType } from "react-native-ui-datepicker";
import DailyView from "../DailyView";
import { Alert } from "react-native";

export default function CalendarPage() {
  const router = useRouter(); 

  return (
    <View style={{
        flex: 1, // Makes the container take the full screen
    justifyContent: 'center', // Centers content vertically
    alignItems: 'center', // Centers content horizontally
    padding:30,
    }}>
        <YStack>
        <Calendar onclick={function (selected: DateType): void {
            if(!selected){
                const error = "Must set a selected date to view";
                Alert.alert(error);
                throw Error(error)
            }

            //router.setParams({ initialDate: selected.toString() });
            router.prefetch({pathname:'/(tabs)/_day_view', params: {initialDate: selected.toString()}});
            router.push({pathname:'/(tabs)/_day_view', params: {initialDate: selected.toString()}});
        }}/>
        </YStack>
    </View>
  );
};