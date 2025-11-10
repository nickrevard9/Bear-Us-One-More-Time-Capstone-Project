import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, XStack, H3, H6, YStack, Label, ScrollView, Button, useTheme, ToggleGroup } from "tamagui";
import ScreenTimeChart from "../components/ScreenTime";
import { Edit3, Plus, CalendarDays, Calendar1, Sun } from "@tamagui/lucide-icons"
import { getLogsByUserDate, LogData } from "../lib/db";
import { Alert, TouchableOpacity } from "react-native";
import { useRouter, useFocusEffect }  from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Platform,  Animated, Easing } from 'react-native';
import GestureRecognizer from "react-native-swipe-gestures";
import ModeToggle from "@/components/ModeToggle";
import * as FileSystem from 'expo-file-system';


export const USE_LOCAL_STORAGE = true;

interface DailyViewProps {
  initialDate?: Date;
  notHome?: Boolean
}

const resetDatabase = async () => {
  const dbName = 'your-db-name.db'; // replace with your actual DB name
  const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;

  const exists = await FileSystem.getInfoAsync(dbPath);
  if (exists.exists) {
    await FileSystem.deleteAsync(dbPath, { idempotent: true });
    console.log('Database deleted');
  } else {
    console.log('Database file not found');
  }
};

const DailyView: React.FC<DailyViewProps> = ({ initialDate, notHome }) => {
    const theme = useTheme()
    const translateX = useRef(new Animated.Value(0)).current;
    const router = useRouter();
    const db = useSQLiteContext();

    const [date, setDate] = useState<Date>(initialDate || new Date());
    const [dailyMedia, setDailyMedia] = useState<LogData[]>([]);

    const incrementDate = new Date();
    incrementDate.setHours(date.getHours() + 1);
    const recommendedMedia = [
        { channel: "Amazon Prime", medium: "Phone", start_date: (new Date().toISOString()), end_date: incrementDate.toISOString()},
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
                const media = await getLogsByUserDate(db, date);
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

    function getDurationBetweenDates(date1: Date, date2: Date): number {
        // Get the difference in milliseconds
        const diffInMs = Math.abs(date2.getTime() - date1.getTime());

        // Convert milliseconds to minutes
        const diffInMinutes = diffInMs / (1000 * 60);

        return diffInMinutes;
    }

    function convertMinutesToHMS(totalMinutes: number): string {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.floor(totalMinutes % 60);

        const hr = hours > 0 ? `${hours} hr ` : '';
        const mins = minutes > 0 ? `${minutes} mins` : '';

        return `${hr} ${mins}`;
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


    function makeChartData(media: LogData[]): {value: number, time: string, label?: string, labelTextStyle?: {}}[] {
        const data: number[] = Array.from({ length: 24 }, () => 0);
        const formatted_data: {value: number, time:string}[] = [];

        try{ 
            media.forEach((item: LogData) => {
            // Get start time and date
            const timeString = new Date(item.start_date).toLocaleTimeString();
            
            const match = timeString.match(/(\d{1,2}:\d{2}:\d{2})\s*(AM|PM)?/);

            if (match) {
            let timePart = match[1]; // "10:30"
            let period = match[2]; // "AM" or "PM"

            const start = new Date(item.start_date).getDay();
            const today = date.getDay();
            if (today != start) {
                timePart = "12:00";
                period = "AM";
            }
            

            const [hourStr, minuteStr] = timePart.split(":");
            let hour = parseInt(hourStr, 10);
            let minute = parseInt(minuteStr, 10);

            // Convert to 24-hour format
            if (period === "PM" && hour !== 12) hour += 12;
            if (period === "AM" && hour === 12) hour = 0;

            // Duration in minutes
            let remaining = getDurationBetweenDates(new Date(item.start_date), new Date(item.end_date));

            // Distribute across hours
            while (remaining > 0) {
            const minutesThisHour = Math.min(60 - minute, remaining);
            data[hour] += minutesThisHour;

            // Move to next hour
            remaining -= minutesThisHour;
            if (hour === 23) {
                break; // Stop if we reach the end of the day
            }
            hour = hour + 1;
            minute = 0;
            }
        }
            
        });

        formatted_data.push(...data.map((value, index) => {
            const hourLabel = index % 24;
            const period = hourLabel >= 12 ? "PM" : "AM";
            const hour12 = hourLabel % 12 === 0 ? 12 : hourLabel % 12;
            if (hourLabel % 6 === 0) {
                return { value, time: `${hour12} ${period}`, label: `${hour12} ${period}`, labelTextStyle: { color: theme.color.get(), width: 60}};
            }
            return { value, time: `${hour12} ${period}` };   
        }) );

        }
        catch(error: any){
            console.log(`Error: ${error.message}`);
        }

        return formatted_data;
    }

    const usage = makeChartData(dailyMedia);

    const changeDay = (delta: number) => {
        // Animate out
        Animated.timing(translateX, {
        toValue: delta === -1 ? 300 : -300, // swipe left
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
    }).start(() => {
        // Change content after animation out
        const newDate = new Date(date);
        newDate.setDate(date.getDate() + delta);
        setDate(newDate);

        // Instantly move the next content in from the right
        translateX.setValue(delta === -1 ? -300 : 300);

        // Animate it into place
        Animated.timing(translateX, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
      }).start();
    });
    };

    return (
        <View style={{ flex: 1, padding: 25, marginTop:20, width: "100%", margin: "0 auto" }}>
            {/* {notHome && <TopBar/>} */}
            <ModeToggle mode="day"/>
            <YStack>
        <XStack justifyContent="center" width="100%" alignItems="center" marginBottom={24}>
            <H3 onPress={() => changeDay(-1)}>&#8592;</H3>
            <H6 style={{ textAlign: "center", flex: 5 }}>{formatDate(date)}</H6>
            <H3 onPress={() => changeDay(1)}>&#8594;</H3>
        </XStack>
        {(new Date().getDate() != date.getDate()) &&  <Button size="$2" onPress={() => setDate(new Date())}>Show Today</Button>}
        </YStack>

        <ScrollView>
            <Animated.View
          style={[
            { transform: [{ translateX }] }
          ]}
        >
            <GestureRecognizer onSwipeLeft={changeDay.bind(this, 1)} onSwipeRight={changeDay.bind(this, -1)}>
                    <YStack alignItems="center" paddingBottom={20}>
                        <ScreenTimeChart usageData={usage} focus={false}/>
                    </YStack>
                    <YStack>
                        <YStack>
                        <Label size="$4" style={{paddingTop: 10, textAlign: "center"}} fontWeight="bold">Your Daily Media</Label>
                        <XStack justifyContent="space-between" borderBottomWidth={2} borderTopWidth={0} borderColor="#8fa47a"/>
                        {/* Add daily media here */}
                        {dailyMedia.map((item, index) => (
                            <TouchableOpacity key={index} onPress={() => {
                                router.prefetch({pathname:'/edit_page', params: {log_id: item.log_id}});
                                router.push({pathname:'/edit_page', params: {log_id: item.log_id}});}} 
                                style={{ flex: 1 }}>
                            <YStack paddingVertical={10}>
                            <XStack justifyContent="space-between" paddingVertical={10} paddingHorizontal={20}>
                                <Text>{item.channel}</Text>
                                <Text>{convertMinutesToHMS(getDurationBetweenDates(new Date(item.start_date), new Date(item.end_date)))}</Text>
                            </XStack>
                            <XStack justifyContent="space-between" paddingHorizontal={20} fontSize={11} opacity={0.7}>
                                <Text>{item.medium}</Text>
                            </XStack>
                            </YStack>
                            </TouchableOpacity>
                        ))}
                        </YStack>
                        <YStack>
                        <Label size="$4" style={{paddingTop: 10, textAlign: "center"}} fontWeight="bold">Suggested Media From Your Activity</Label>
                        <XStack justifyContent="space-between" borderBottomWidth={2} borderTopWidth={0} borderColor="#8fa47a"/>
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
                                            <Text>{convertMinutesToHMS(getDurationBetweenDates(new Date(item.start_date), new Date(item.end_date)))}</Text>
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
                    </GestureRecognizer>
                    </Animated.View>
                </ScrollView>
        </View>
    );
};

export default DailyView;