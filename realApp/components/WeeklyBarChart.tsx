import React from "react";
import { View, Text, YStack } from "tamagui";
import { BarChart } from "react-native-gifted-charts";
import { useColorScheme } from "react-native";

const WeeklyBarChart = ({ data }) => {
  const convertHoursToHMS = (hours: number): string => {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    const hrStr = h > 0 ? `${h} hr ` : "";
    const minStr = m > 0 ? `${m} mins` : "";

    return `${hrStr}${minStr}`;
  };

  const chartData = data.map((d) => ({
    value: d.minutes,
    label: d.label,
  }));

  const colorScheme = useColorScheme()
    const colors = colorScheme === 'dark' 
    ? {
          background: "#2b2a23",
          gradientFrom: "#2b2a23",
          gradientTo: "#3a392f",
          line: "#f7d774",
          label: "#e4e0d5",
        }
      : {
          background: "#f4efe6",
          gradientFrom: "#f4efe6",
          gradientTo: "#ebe3d2",
          line: "#8fa47a",
          label: "#3e3b32",
        };

  return (
    <YStack alignItems="center" paddingVertical={20}>
      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 10 }}>
        Media Usage
      </Text>

      <BarChart
        disableScroll
        key={JSON.stringify(chartData)}
        data={chartData}
        width={320}
        barWidth={22}
        spacing={19}
        xAxisLabelTextStyle={{ color: "#999" }}
        yAxisTextStyle={{ color: "#999" }}
        barBorderRadius={6}
        frontColor="#88A77A"
        color={colors.line}
        noOfSections={6}
        yAxisColor="white"
        yAxisThickness={0}
        rulesType="dashed"
        rulesColor="gray"
        yAxisTextStyle={{color: 'gray'}}
        xAxisColor="lightgray"
        renderTooltip={(item, index) => {
          return (
            <View
              style={{
                height: 90,
                width: 100,
                justifyContent: "center",
                marginTop: -30,
                marginLeft: index % 2 === 0 ? 0 : -40, // adjust left/right if needed
              }}
            >
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: "white",
                }}
              >
                <Text style={{ fontWeight: "bold", textAlign: "center" }}>
                  {convertHoursToHMS(item.value)}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </YStack>
  );
};

export default WeeklyBarChart;
