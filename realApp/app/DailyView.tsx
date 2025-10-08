import React, { useState, useEffect, useCallback } from "react";
import { View, Text, XStack, H3, H6, YStack, Label, ScrollView } from "tamagui";
import ScreenTimeChart from "../components/ScreenTime";
import { getLogsByUserDate, LogData } from "../lib/db";
import { Alert } from "react-native";
import { useFocusEffect }  from "expo-router"
import { useSQLiteContext } from "expo-sqlite";

export const USE_LOCAL_STORAGE = true;

interface DailyViewProps {
  initialDate?: Date;
}

const DailyView: React.FC<DailyViewProps> = ({ initialDate }) => {
  const db = useSQLiteContext();
  const [date, setDate] = useState<Date>(initialDate || new Date());
  const [dailyMedia, setDailyMedia] = useState<LogData[]>([]);

  const recommendedMedia = [
    { channel: "Amazon Prime", medium: "Phone", duration: "2:01:00" },
  ];

  const formatDate = (date: Date) =>
    date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const retrieveLogs = useCallback(async () => {
    try {
      if (USE_LOCAL_STORAGE) {
        const media = await getLogsByUserDate(db, date.toDateString());
        setDailyMedia(media);
      } else {
        // TODO: Fetch from API
      }
    } catch (error: any) {
      Alert.alert(`Error retrieving reports: ${error.message}`);
    }
  }, [db, date]);

  useFocusEffect(() => {
    retrieveLogs();
  });

// Used to format the duration for the Daily Media Report and Recommended sections
function formatDuration(duration: string): string {
    // Expects 'HH:MM:SS' or 'H:MM:SS'
    const [h, m] = duration.split(':');
    const hours = parseInt(h, 10);
    const mins = parseInt(m, 10);
    let result = '';
    if (hours > 0) result += `${hours} hr${hours > 1 ? 's' : ''}`;
    if (mins > 0) result += `${result ? ' ' : ''}${mins} min${mins > 1 ? 's' : ''}`;
    return result || '0 mins';
}


function makeChartData(media: LogData[]): number[] {
    const data: number[] = Array.from({ length: 24 }, () => 0);

    try{ 
        media.forEach((item) => {
        const [timePart, period] = item.time.split(" "); // e.g. "3:30", "PM"
        const [hourStr, minuteStr] = timePart.split(":");
        let hour = parseInt(hourStr, 10);
        let minute = parseInt(minuteStr, 10);

        // Convert to 24-hour format
        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;

        // Duration in minutes
        const [durH, durM] = item.duration.split(":");
        let remaining = parseInt(durH, 10) * 60 + parseInt(durM, 10);

        // Distribute across hours
        while (remaining > 0) {
        const minutesThisHour = Math.min(60 - minute, remaining);
        data[hour] += minutesThisHour;

        // Move to next hour
        remaining -= minutesThisHour;
        hour = (hour + 1) % 24;
        minute = 0;
        }
    });
    }
    catch(error: any){
        console.log(`Error: ${error.message}`);
    }

    return data;
}

const usage = makeChartData(dailyMedia);

  const changeDay = (delta: number) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + delta);
    setDate(newDate);
  };

  return (
    <View style={{ flex: 1, padding: 25, width: "100%", margin: "0 auto" }}>
      <XStack justifyContent="center" width="100%" alignItems="center" marginBottom={24} marginTop={100}>
        <H3 onPress={() => changeDay(-1)}>&#8592;</H3>
        <H6 style={{ textAlign: "center", flex: 5 }}>{formatDate(date)}</H6>
        <H3 onPress={() => changeDay(1)}>&#8594;</H3>
      </XStack>

      <ScrollView>
                <YStack alignItems="center" paddingBottom={20}>
                    <ScreenTimeChart usageData={usage} />
                </YStack>
                <YStack>
                    <YStack>
                    <Label size="$4" style={{paddingTop: 10, textAlign: "center"}} fontWeight="bold">Your Daily Media</Label>
                    <XStack justifyContent="space-between" borderBottomWidth={2} borderTopWidth={0} borderColor="#99999996"/>
                    {/* Add daily media here */}
                    {dailyMedia.map((item, index) => (
                        <YStack key={index} paddingVertical={10}>
                        <XStack justifyContent="space-between" paddingVertical={10} paddingHorizontal={20}>
                            <Text>{item.channel}</Text>
                            <Text>{formatDuration(item.duration)}</Text>
                        </XStack>
                        <XStack justifyContent="space-between" paddingHorizontal={20} fontSize={11} opacity={0.7}>
                            <Text>{item.medium}</Text>
                        </XStack>
                        </YStack>
                    ))}
                    </YStack>
                    <YStack>
                    <Label size="$4" style={{paddingTop: 10, textAlign: "center"}} fontWeight="bold">Recommended</Label>
                    <XStack justifyContent="space-between" borderBottomWidth={2} borderTopWidth={0} borderColor="#99999996"/>
                    {/* Add recommended media here */}
                    {recommendedMedia.map((item, index) => (
                        <YStack key={index}>
                        <XStack justifyContent="space-between" paddingVertical={10} paddingHorizontal={20}>
                            <Text>{item.channel}</Text>
                            <Text>{formatDuration(item.duration)}</Text>
                        </XStack>
                        <XStack justifyContent="space-between" paddingHorizontal={20} fontSize={11} opacity={0.7}>
                            <Text>{item.medium}</Text>
                        </XStack>
                        </YStack>
                    ))}
                    </YStack>
                </YStack>
            </ScrollView>
    </View>
  );
};

export default DailyView;
