import React, { useState, useEffect, useCallback } from "react";
import { View, Text, XStack, H3, H6, YStack, Label, ScrollView, Button } from "tamagui";
import ScreenTimeChart from "../components/ScreenTime";
import { Edit3, Plus } from "@tamagui/lucide-icons"
import { getLogsByUserDate, LogData } from "../lib/db";
import { Alert, TouchableOpacity } from "react-native";
import { useRouter, useFocusEffect }  from "expo-router"
import { useSQLiteContext } from "expo-sqlite";
import { Platform } from 'react-native';

export const USE_LOCAL_STORAGE = true;

interface DailyViewProps {
  initialDate?: Date;
  notHome?: Boolean
}

const DailyView: React.FC<DailyViewProps> = ({ initialDate, notHome }) => {
    const router = useRouter();
    const db = useSQLiteContext();

    const [date, setDate] = useState<Date>(initialDate || new Date());
    console.log(date.toDateString());
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

    async function retrieveLogs() {
        try {
            if (USE_LOCAL_STORAGE) {
                const media = await getLogsByUserDate(db, date.toLocaleDateString());
                setDailyMedia(media);
            } else {
                // TODO: Fetch from API
            }
        } catch (error: any) {
            Alert.alert(`Error retrieving reports: ${error.message}`);
        }
    }

    useFocusEffect(
    useCallback(() => {
        retrieveLogs();
    }, [date])
    );


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

    const TopBar = () => {
        return (
        <XStack alignItems="center" paddingBottom={20} >
            <TouchableOpacity onPress={() => router.back()} style={{ flex: 1 }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', textAlign: 'left' }}>{'←'}</Text>
            </TouchableOpacity>
            <H6 style={{ flex: 2, textAlign: 'center', fontWeight: "600",}}>Log</H6>
            <View style={{ flex: 1 }} />
        </XStack>);
    }


    function makeChartData(media: LogData[]): number[] {
        const data: number[] = Array.from({ length: 24 }, () => 0);

        try{ 
            media.forEach((item: LogData) => {
            console.log(item);
            const [timePart, period] = (new Date(item.start_time)).toLocaleTimeString().split(" "); // e.g. "3:30", "PM"
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
            {notHome && <TopBar/>}
        <XStack justifyContent="center" width="100%" alignItems="center" marginBottom={24}>
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
                            <TouchableOpacity key={index} onPress={() => {
                                router.prefetch({pathname:'/edit_page', params: {log_id: item.log_id}});
                                router.push({pathname:'/edit_page', params: {log_id: item.log_id}});}} 
                                style={{ flex: 1 }}>
                            <YStack paddingVertical={10}>
                            <XStack justifyContent="space-between" paddingVertical={10} paddingHorizontal={20}>
                                <Text>{item.channel}</Text>
                                <Text>{formatDuration(item.duration)}</Text>
                            </XStack>
                            <XStack justifyContent="space-between" paddingHorizontal={20} fontSize={11} opacity={0.7}>
                                <Text>{item.medium}</Text>
                            </XStack>
                            </YStack>
                            </TouchableOpacity>
                        ))}
                        </YStack>
                        <YStack>
                        <Label size="$4" style={{paddingTop: 10, textAlign: "center"}} fontWeight="bold">Suggested Media</Label>
                        <XStack justifyContent="space-between" borderBottomWidth={2} borderTopWidth={0} borderColor="#99999996"/>
                        {Platform.OS === 'ios' ? (
                            <YStack>
                            <XStack justifyContent="space-between" paddingVertical={10} paddingHorizontal={20}>
                                <Text>Future Feature Incoming...</Text>
                            </XStack>
                            <XStack justifyContent="space-between" paddingHorizontal={20} fontSize={11} opacity={0.7}>
                                <Text>Screen Time data will be imported from your phone! 
                                    To view this data, navigate to your phone's Settings App and then to the "Screen Time" tab.</Text>
                            </XStack>
                            </YStack>
                        ) : (
                            <>
                                {/* Add recommended media here */}
                                {recommendedMedia.map((item, index) => (
                                    <YStack key={index}>
                                        <XStack justifyContent="space-between" paddingVertical={10} paddingHorizontal={20}>
                                            <Text>{item.channel}</Text>
                                            <Text>{formatDuration(item.duration)}</Text>
                                        </XStack>
                                        <XStack justifyContent="space-between" paddingHorizontal={20} fontSize={11} opacity={0.7}>
                                            <Text>{item.medium}</Text>
                                            <Button size={"$1"}><Plus/></Button>
                                        </XStack>
                                    </YStack>
                                ))}
                            </>
                        )}
                        </YStack>
                    </YStack>
                </ScrollView>
        </View>
    );
};

export default DailyView;
