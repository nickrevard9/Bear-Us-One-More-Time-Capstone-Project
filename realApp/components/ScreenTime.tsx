import React, { useState } from "react";
import { View, Text } from "react-native";
import { LineChart } from "react-native-gifted-charts";

type ScreenTimeChartProps = {
  usageData: { value: number; time: string }[];
  focus?: boolean;
  point?: {value: number; time: string, label?: string, "labelTextStyle"?: {color: string, width?: number}} ;
};

export default function ScreenTimeChart({usageData, focus, point} : ScreenTimeChartProps) {
  const data = usageData;
  const maxValue = 120;
  const [_focus, setFocus] = useState(focus || false);
  const [_point, set_Point] = useState(point || {value:0, time:""});  

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 10 }}>
        Media Usage
      </Text>
          <LineChart
          areaChart
          data={data}
          width={320}
          spacing={13}
          hideDataPoints
          color="#007423ff"
          curved
          thickness={2}
          startFillColor="rgba(0, 180, 60, 0.3)"
          endFillColor="rgba(77, 49, 9, 0.01)"
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
                    height: 90,
                    width: 100,
                    justifyContent: 'center',
                    marginTop: -30,
                    marginLeft: items[0].time.split(" ")[1] == "AM"  ? 0 : -80,
                  }}>
                  <Text style={{color: 'white', fontSize: 14, marginBottom:6,textAlign:'center'}}>
                    {items[0].time}
                  </Text>
  
                  <View style={{paddingHorizontal:14,paddingVertical:6, borderRadius:16, backgroundColor:'white'}}>
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