import React from "react";
import { Button, YStack, XStack, H2, Image, Group, Separator, View } from "tamagui";
import { CreditCard, Download, LogOut, Settings } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import {Calendar} from "@/components/calendar";
import { DateType } from "react-native-ui-datepicker";
import { Alert } from "react-native";
import ModeToggle from "@/components/ModeToggle";

export default function CalendarPage() {
  const router = useRouter(); 

  return (
    <View style={{ flex: 1, padding: 25, marginTop:20, width: "100%", margin: "0 auto"}}>
        <YStack space="$12" width="100%" >
          <ModeToggle mode="month"/>
        <Calendar onclick={function (selected: DateType): void {
            if(!selected){
                const error = "Must set a selected date to view";
                Alert.alert(error);
                throw Error(error)
            }

            //router.setParams({ initialDate: selected.toString() });
            router.prefetch({pathname:'/home/home_page', params: {initialDate: selected.toString()}});
            router.push({pathname:'/home/home_page', params: {initialDate: selected.toString()}});
        }}/>
        </YStack>
    </View>
  );
};