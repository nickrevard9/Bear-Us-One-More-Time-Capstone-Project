import React, { useState, useEffect } from "react";
import { View, Text, Button, XStack, H3, H4, H6, YStack, Label, ScrollView } from "tamagui";
import { BarChart } from "react-native-chart-kit";
import ScreenTimeChart from "./ScreenTime";

interface DailyViewProps {
    initialDate?: Date;
}

const formatDate = (date: Date) =>
    date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

const dailyMedia = [
    { channel: "Spotify", medium: "Phone", duration: "1:00:00", time: "8:00:00 AM" },
    { channel: "Netflix", medium: "Television", duration: "2:28:00",  time: "4:00:00 PM"  },
    { channel: "Overleaf", medium: "Laptop Computer", duration: "1:32:00",  time: "8:00:00 AM"  },
    { channel: "Safari", medium: "Laptop Computer", duration: "4:30:00", time: "12:00:00 PM" },
];

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

const recommendedMedia = [
    { channel: "Amazon Prime", medium: "Phone", duration: "2:01:00 PM" },
];


const DailyView: React.FC<DailyViewProps> = ({ initialDate }) => {
    const [date, setDate] = useState<Date>(initialDate || new Date());

    const changeDay = (delta: number) => {
        const newDate = new Date(date);
        newDate.setDate(date.getDate() + delta);
        setDate(newDate);
    };

    return (
        <View style={{ flex: 1, padding: 25, width: "100%", margin: "0 auto" }}>
            <XStack justifyContent="center" width="100%" alignItems="center" marginBottom={24} marginTop={100} paddingHorizontal={20}>
                <H3
                    aria-label="Previous day"
                    onPress={() => changeDay(-1)}
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        textAlign: "left",
                    }}
                >
                    &#8592;
                </H3>
                <H6 style={{textAlign: "center", flex: 5,}} >{formatDate(date)}</H6>
                <H3
                    aria-label="Next day"
                    onPress={() => changeDay(1)}
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        textAlign: "right",
                    }}
                >
                    &#8594;
                </H3>
            </XStack>
            <ScrollView>
                <YStack alignItems="center" paddingBottom={20}>
                    {/* <BarChart
                        data={{
                            labels: labels,
                            datasets: [{
                                data: data
                            }]
                        }}
                        width={350}
                        height={200}
                        yAxisLabel=""
                        chartConfig={{
                            backgroundGradientFrom: "#fff",
                            backgroundGradientTo: "#fff",
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            style: {
                                borderRadius: 16
                            },
                            propsForDots: {
                                r: "6",
                                strokeWidth: "2",
                                stroke: "#ffa726"
                            }
                        }}
                        style={{
                            marginVertical: 8,
                            borderRadius: 16
                        }}
                    /> */}

                    <ScreenTimeChart/>
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