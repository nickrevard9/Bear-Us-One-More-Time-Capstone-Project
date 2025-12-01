import React, { useState } from "react";
import { LineChart } from "react-native-gifted-charts";
import { View, Text, useColorScheme } from "react-native";
import { Button } from "tamagui";
import { tamaguiConfig } from '../tamagui.config';

type ScreenTimeChartProps = {
  usageData: { value: number; time: string }[];
  focus?: boolean;
};

export default function ScreenTimeChart({usageData, focus} : ScreenTimeChartProps) {
  const data = usageData;
  const maxValue = 120;
  const [_focus, setFocus] = useState(focus || false);

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
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
          <LineChart
          areaChart
          data={data}
          width={320}
          spacing={13}
          hideDataPoints
          color={colors.line}
          thickness={2}
          startFillColor={colors.line}
          endFillColor={colors.gradientTo}
          startOpacity={0.9}
          endOpacity={0.2}
          initialSpacing={0}
          noOfSections={6}
          maxValue={maxValue}
          yAxisColor="white"
          yAxisThickness={0}
          rulesType="dashed"
          disableScroll
          rulesColor="gray"
          yAxisTextStyle={{color: 'gray'}}
          xAxisColor="lightgray"
          pointerConfig={{
            pointerStripHeight: 160,
            pointerStripColor: 'lightgray',
            pointerStripWidth: 2,
            persistPointer: _focus,
            pointerColor: 'lightgray',
            radius: 6,
            pointerLabelWidth: 100,
            pointerLabelHeight: 90,
            activatePointersOnLongPress: false,
            autoAdjustPointerLabelPosition: false,
            pointerLabelComponent: items => {
              return (
                <View
                  style={{
                    height: 180,
                    width: 100,
                    justifyContent: 'center',
                    marginTop: -30,
                    marginLeft: items[0].time.split(" ")[1] == "AM"  ? 0 : -100,
                  }}>
  
                  <View style={{width: 130, paddingHorizontal:15, paddingVertical:6, borderRadius:16, backgroundColor:'white', flexDirection: 'row'}}>
                    <Text style={{fontWeight: 'bold',textAlign:'center'}}>
                      {items[0].value + " mins at " + items[0].time}
                    </Text>
                  </View>
                </View>
              );
            },
          }}
        />
    </View>
  );
}