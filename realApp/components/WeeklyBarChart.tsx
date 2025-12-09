import React from "react";
import { View, Text, YStack } from "tamagui";
import { BarChart } from "react-native-gifted-charts";
import { useColorScheme } from "react-native";

const WeeklyBarChart = ({ data, weekStart }) => {
  const convertHoursToHMS = (hours: number): string => {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    const hrStr = h > 0 ? `${h} hr ` : "";
    const minStr = m > 0 ? `${m} mins` : "";

    return `${hrStr}${minStr}`;
  };

  const chartData = data.map((d, idx) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + idx);

    const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "short" }); // add day of week if wanted
    const day = date.getDate();
    const month = date.getMonth() + 1; // Java months are zero indexed

    // gifted charts bar graphs don't support multi-line labels (x-axis)
    return {
      value: d.minutes,
      label: `${dayOfWeek}\n${month}/${day}`,
    };
  });

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
    <YStack alignItems="center" paddingBottom={20}>
      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 10 }}>
        Media Usage
      </Text>

      <BarChart
        disableScroll                   // disable scroll on chart
        key={JSON.stringify(chartData)}
        data={chartData}
        width={320}                     // match width of daily graph
        barWidth={22}
        spacing={19}
        xAxisLabelTextStyle={{ 
          color: colors.label,
          textAlign: "center", 
        }}
        yAxisTextStyle={{ color: "gray" }}
        barBorderRadius={6}
        showGradient                    // add gradient
        frontColor={colors.gradientTo}  // beginning of gradient
        gradientColor={colors.line}     // end of gradient
        color={colors.line}
        noOfSections={6}
        yAxisColor="white"
        yAxisThickness={0}
        rulesType="dashed"
        rulesColor="gray"
        xAxisColor={colors.line}
        xAxisThickness={2}
        maxValue={24}                   // limit y-axis to 24 hours
        noOfSections={6}                // number of sections
        stepValue={4}                   // section spacing
        xAxisTextNumberOfLines={2}
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
