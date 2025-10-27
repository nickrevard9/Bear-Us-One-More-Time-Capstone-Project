import React, { useState } from "react";
import { View, Text, useColorScheme } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { tamaguiConfig } from '../tamagui.config';

type ScreenTimeChartProps = {
  usageData: number[];
};

export default function ScreenTimeChart({ usageData }: ScreenTimeChartProps) {
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

  const usage = usageData;
  const maxValue = 100;

  // Generate hourly labels
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 === 0 ? 12 : i % 12;
    const period = i < 12 ? "AM" : "PM";
    return `${hour}${period}`;
  });

  // Replace all labels except 12AM, 6AM, 12PM, 6PM with ""
  const displayLabels = hours.map((h) =>
    ["12AM", "6AM", "12PM", "6PM"].includes(h) ? h : ""
  );

//   function* yLabel() {
//   yield* ["", midValue, maxValue];
// }
//   const yLabelIterator = yLabel();


  // Format data for LineChart
  const data = {
    labels: displayLabels,
    datasets: [
      {
        data: usage,
      },
      {
        data: [maxValue], // max
        withDots: false,
      },
    ],
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 10, color: colors.label }}>
        Screen Time
      </Text>
      <LineChart
        data={data}
        width={350}
        height={300}
        fromZero
        // segments={2}
        // formatYLabel={() => yLabelIterator.next().value}
        bezier
        chartConfig={{
          backgroundColor: colors.background,
          backgroundGradientFrom: colors.gradientFrom,
          backgroundGradientTo: colors.gradientTo,
          decimalPlaces: 0,
          color: (opacity = 1) => colors.line,
          labelColor: (opacity = 1) => colors.label,
          style: { borderRadius: 16 },
          propsForBackgroundLines: { stroke: "none" },
        }}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
    </View>
  );
}