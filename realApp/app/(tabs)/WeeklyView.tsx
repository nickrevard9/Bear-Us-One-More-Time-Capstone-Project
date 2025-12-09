import React, { useState, useCallback, useRef } from "react";
import { View, Text, XStack, H3, H6, YStack, ScrollView, Label, Button } from "tamagui";
import { useSQLiteContext } from "expo-sqlite";
import { getLogsByUserDate, LogData } from "../../lib/db";
import { Alert, Animated, Easing, TouchableOpacity } from "react-native";
import WeeklyBarChart from "../../components/WeeklyBarChart";
import ModeToggle from "@/components/ModeToggle";
import { router, useFocusEffect } from "expo-router";
import GestureRecognizer from "react-native-swipe-gestures";

// use local storage for data
export const USE_LOCAL_STORAGE = true;

/**
 * weekly view page
 * navigation from view toggle
 */
const WeeklyView: React.FC = () => {
  const db = useSQLiteContext();

  /**
   * get starting date of the requested week
   * @param d 
   * @returns Date (start of week)
   */
  const getStartOfWeek = (d: Date) => {
    const cloned = new Date(d);
    cloned.setHours(0, 0, 0, 0);
    const weekday = cloned.getDay();
    cloned.setDate(cloned.getDate() - weekday);
    return cloned;
  };

  const [weekStart, setWeekStart] = useState(() => getStartOfWeek(new Date()));
  const [weeklyLogs, setWeeklyLogs] = useState<LogData[]>([]);
  const [weekData, setWeekData] = useState<
    { label: string; minutes: number; dayIndex: number }[]
  >([]);
  const translateX = useRef(new Animated.Value(0)).current;
  
  /**
   * get minutes left over from the hour(s)
   * @param start 
   * @param end 
   * @returns 
   */
  const getMinutes = (start: Date, end: Date) =>
    Math.abs(end.getTime() - start.getTime()) / (1000 * 60);

  /**
   * aggregates total minutes of activity per day for a single week
   * 
   * Given a list of logs (each with a start and end timestamp), this function
   * splits logs across day boundaries and sums up the minutes that fall on each
   * day of the target week. It returns an array of 7 objects (Sun–Sat or
   * whatever locale dictates), each containing:
   *   - `dayIndex` (0–6)
   *   - `label` (weekday short name)
   *   - `minutes` (total minutes for that day)
   * 
   * @param logs 
   * @param startOfWeek 
   * @returns 
   */
  const aggregateWeek = (logs: LogData[], startOfWeek: Date) => {
    const weekArray = Array.from({ length: 7 }, (_, i) => ({
      dayIndex: i,
      label: new Date(startOfWeek.getTime() + i * 86400000).toLocaleDateString(
        undefined,
        { weekday: "short" }
      ),
      minutes: 0,
    }));

    logs.forEach((log) => {
      let currentStart = new Date(log.start_date);
      const logEnd = new Date(log.end_date);

      while (currentStart < logEnd) {
        // end of the current day
        const endOfDay = new Date(currentStart);
        endOfDay.setHours(24, 0, 0, 0);

        // minutes for this day slice
        const minutesThisDay = Math.min(
          (endOfDay.getTime() - currentStart.getTime()) / (1000 * 60),
          (logEnd.getTime() - currentStart.getTime()) / (1000 * 60)
        );

        // offset in week
        const dayOffset = Math.floor(
          (currentStart.setHours(0, 0, 0, 0) - startOfWeek.getTime()) / 86400000
        );

        if (dayOffset >= 0 && dayOffset < 7) {
          weekArray[dayOffset].minutes += minutesThisDay;
        }

        // move to next day
        currentStart = endOfDay;
      }
    });

    return weekArray;
  };

  /**
   * converts a total number of minutes into a formatted
   * string showing hours and minutes.
   * @param totalMinutes 
   * @returns string in format "X hr Y mins".
   */
  function convertMinutesToHMS(totalMinutes: number): string {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = Math.floor(totalMinutes % 60);

      const hr = hours > 0 ? `${hours} hr ` : '';
      const mins = minutes > 0 ? `${minutes} mins` : '';

      return `${hr} ${mins}`;
  }

  /**
   * get weekly logs for that week
   */
  const retrieveWeeklyLogs = useCallback(async () => {
    try {
      const logs: LogData[] = [];

      if (USE_LOCAL_STORAGE) {
        // Fetch all logs for each day of the week
        for (let i = 0; i < 7; i++) {
          const day = new Date(weekStart.getTime() + i * 86400000);
          const dayLogs = await getLogsByUserDate(db, day);
          logs.push(...dayLogs);
        }

        // remove duplicates (some logs may appear in multiple days)
        const seen = new Set<string>();
        const uniqueLogs = logs.filter((log) => {
          if (seen.has(log.log_id)) return false;
          seen.add(log.log_id);
          return true;
        });

        setWeeklyLogs(uniqueLogs);
        setWeekData(aggregateWeek(uniqueLogs, weekStart));
      }
    } catch (err: any) {
      Alert.alert("Error loading weekly logs", err.message);
    }
  }, [weekStart, db]);

  // update logs needed
  useFocusEffect(
    useCallback(() => {
      retrieveWeeklyLogs();
    }, [weekStart, retrieveWeeklyLogs])
  );

  /**
   * change week being shown
   * @param delta 
   */
  const changeWeek = (delta: number) => {
    // Animate out
        Animated.timing(translateX, {
        toValue: delta === -1 ? 300 : -300, // swipe left
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
    }).start(() => {
        // Change content after animation out
        const newStart = new Date(weekStart);
        newStart.setDate(newStart.getDate() + delta * 7);
        setWeekStart(getStartOfWeek(newStart));

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
    // add swiping functionality
    <GestureRecognizer
      onSwipeLeft={() => changeWeek(1)}
      onSwipeRight={() => changeWeek(-1)}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, padding: 25, marginTop: 20 }}>
        {/* mode toggle is present */}
        <ModeToggle mode="week" />

        <YStack>
          <XStack justifyContent="center" width="100%" alignItems="center" marginBottom={24}>
            <H3 onPress={() => changeWeek(-1)}>&#8592;</H3>

            <H6 style={{ flex: 5, textAlign: "center"}}>
              Week of{" "}
              {weekStart.toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
              })}
            </H6>

            <H3 onPress={() => changeWeek(1)}>&#8594;</H3>
          </XStack>
          {/* ability to go to current week */}
          {weekStart.toDateString() !== getStartOfWeek(new Date()).toDateString() && (
            <Button size="$2" onPress={() => setWeekStart(getStartOfWeek(new Date()))}>
              Show This Week
            </Button>
          )}
        </YStack>

        <ScrollView>
          {/* animate week changing */}
          <Animated.View
            style={[
              { transform: [{ translateX }] }
            ]}
          >
            <WeeklyBarChart
              key={weekStart.toISOString()}
              data={weekData.map((d) => ({
                ...d,
                minutes: d.minutes / 60, // convert minutes → hours for chart
              }))}
              weekStart={weekStart}
              pointerConfig={{
                activatePointersOnLongPress: true,
                pointerStripColor: "lightgray",
                pointerStripWidth: 2,
                pointerLabelComponent: (items) => (
                  <View
                    style={{
                      padding: 10,
                      borderRadius: 12,
                      backgroundColor: "white",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontWeight: "bold" }}>{items[0].label}</Text>
                    <Text>{convertMinutesToHMS(items[0].value * 60)}</Text>
                  </View>
                ),
              }}
            />

            {/* show all logs in that week */}
            <YStack marginTop={20}>
              <Label size="$4" style={{ paddingTop: 10, textAlign: "center" }} fontWeight="bold">
                Your Weekly Media
              </Label>
              <XStack justifyContent="space-between" borderBottomWidth={2} borderTopWidth={0} borderColor="#8fa47a" />

              {weeklyLogs.length > 0 ? (
                weeklyLogs.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      router.prefetch({ pathname: "/edit_page", params: { log_id: item.log_id } });
                      router.push({ pathname: "/edit_page", params: { log_id: item.log_id } });
                    }}
                    style={{ flex: 1 }}
                  >
                    <YStack paddingVertical={10}>
                      <XStack justifyContent="space-between" paddingVertical={10} paddingHorizontal={20}>
                        <Text>{item.channel}</Text>
                        <Text>{convertMinutesToHMS(getMinutes(new Date(item.start_date), new Date(item.end_date)))}</Text>
                      </XStack>
                      <XStack justifyContent="space-between" paddingHorizontal={20} fontSize={11} opacity={0.7}>
                        <Text>{item.medium}</Text>
                      </XStack>
                    </YStack>
                  </TouchableOpacity>
                ))
              ) : (
                <YStack paddingVertical={10}>
                  {/* show this when there are no logs */}
                  <XStack justifyContent="space-between" paddingVertical={10} paddingHorizontal={20}>
                    <Text>Nothing here yet...</Text>
                  </XStack>
                </YStack>
              )}
            </YStack>
          </Animated.View>
        </ScrollView>
      </View>
    </GestureRecognizer>
  );
};

export default WeeklyView;
