import React, { useCallback, useState } from "react";
import { Button, YStack, XStack, H2, Image, Group, Separator, View, ScrollView } from "tamagui";
import { CreditCard, Download, LogOut, Settings } from "@tamagui/lucide-icons";
import { useRouter, useFocusEffect } from "expo-router";
import {Calendar} from "@/components/calendar";
import { DateType } from "react-native-ui-datepicker";
import { Alert } from "react-native";
import ModeToggle from "@/components/ModeToggle";
import MediaChart from "@/components/MediaChart";
import { getMediumCountByDate, getChannelCountByDate } from "@/lib/db";
import { useSQLiteContext } from "expo-sqlite";
import PlatformChart from "@/components/TopPlatforms";


export default function CalendarPage() {
  const router = useRouter(); 
  const db = useSQLiteContext();
  const [month, setMonth] = useState(new Date().getMonth()+1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [medium_counts, setMediumCounts] = useState<{
    medium: string, 
    value: number}[]>([]);

  const [platform_counts, setPlatformCounts] = useState<{
    channel: string, 
    value: number}[]>([]);

  async function fetchMediumCounts(month: number, year: number) {
    try {
        const media = await getMediumCountByDate(db, month, year);
        setMediumCounts(media);
  } catch (error: any) {
      Alert.alert(`Error retrieving media: ${error.message}`);
  }
  };

  async function fetchPlatformCounts(month: number, year: number) {
    try {
        const media = await getChannelCountByDate(db, month, year);
        setPlatformCounts(media);
  } catch (error: any) {
      Alert.alert(`Error retrieving media: ${error.message}`);
  }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMediumCounts(month, year);
      fetchPlatformCounts(month, year);
    }, [])      
  );

  function onMonthChange(m: number){
    setMonth(m);
    fetchMediumCounts(m+1 % 12, year);
    fetchPlatformCounts(m+1 % 12, year);
  }  
function onYearChange(y: number){
    setYear(y);
    fetchMediumCounts(month, y);
    fetchPlatformCounts(month, y);
  }

  return (
    <View style={{ flex: 1, padding: 25, marginTop:20, marginBottom:100, width: "100%", margin: "0 auto"}}>
      <YStack space="$6" width="100%" >
        <ModeToggle mode="month"/>
        <ScrollView> 
        <Calendar onclick={function (selected: DateType): void {
            if(!selected){
                const error = "Must set a selected date"
                Alert.alert(error);
                throw Error(error)
            }

            //router.setParams({ initialDate: selected.toString() });
            router.prefetch({pathname:'/home/home_page', params: {initialDate: selected.toString()}});
            router.push({pathname:'/home/home_page', params: {initialDate: selected.toString()}});
        }}
          monthChange={onMonthChange}
          yearChange={setYear}
        />
        <MediaChart key={medium_counts[0] ? medium_counts[0].medium : medium_counts[0]} media_counts={medium_counts}/>

        <PlatformChart key={platform_counts[0] ? platform_counts[0].channel : platform_counts[0]} platform_counts={platform_counts}/>
        </ScrollView>
        </YStack>
    </View>
  );
};