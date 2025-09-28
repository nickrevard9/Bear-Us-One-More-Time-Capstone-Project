import React, { useState } from "react";
import { View, Text } from "react-native";
import { LineChart } from "react-native-chart-kit";

type ScreenTimeChartProps = {
  usageData: number[];
};

export default function ScreenTimeChart({ usageData }: ScreenTimeChartProps) {
  const usage = usageData;

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

  // Format data for LineChart
  const data = {
    labels: displayLabels,
    datasets: [
      {
        data: usage,
      },
    ],
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 10 }}>
        Screen Time
      </Text>
      <LineChart
        data={data}
        width={350}
        height={300}
        fromZero
        bezier
        withHorizontalLabels={false}
        chartConfig={{
          backgroundColor: "#fff",
          backgroundGradientFrom: "#fff",
          backgroundGradientTo: "#fff",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(76, 110, 245, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: { borderRadius: 16 },
          propsForBackgroundLines: { stroke: "#e3e3e3" },
        }}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
    </View>
  );
}