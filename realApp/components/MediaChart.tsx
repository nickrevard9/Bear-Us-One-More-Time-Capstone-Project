import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PieChart } from "react-native-gifted-charts";
import { View, Text, useTheme, XStack } from "tamagui";

type MediaChartProps = {
    media_counts: {medium: string, value: number}[];
};

export default function MediaChart({media_counts}: MediaChartProps) {
    const [pieData, setPieData] = useState<{medium: string, value: number, color: string}[]>(apply_colors(media_counts));
    const [focused_media, setFocusedMedia] = useState<{medium: string, value: number} | null>(null);
    const theme = useTheme()
    
    const DEFAULT_COLOR = "#838383ff";

    function apply_colors(
    data: { medium: string, value: number }[]
    ): { medium: string, value: number, color: string }[] {
        const color_list: {[key: string]: string} = {
            " ": "#838383ff",    
            "Car Stereo": "#FF7F97",
            "Desktop Computer": "#8F80F3",
            "eReader": "#3BE9DE",
            "Laptop Computer": "#006DFF",
            "Large Screen / Movie Theater": "#FFA500",
            "Print Newspaper": "#800080",
            "Personal Computer": "#00FF00",
            "Radio": "#FFC0CB",
            "Stereo System": "#FFFF00",
            "Smart Phone": "#00FFFF",
            "Tablet": "#FF0000",
            "Television": "#A52A2A",
            "Other Handheld Device": "#a5a5a5ff",
            "Other Printed Material": "#4b4b4bff",
            "Other": "#838383ff",
        };
    return data.map(item => ({
        ...item,
        color: color_list[item.medium] ?? DEFAULT_COLOR,
    }));
    }

    const renderDot = color => {
        return (
            <View
            style={{
                height: 10,
                width: 10,
                borderRadius: 5,
                backgroundColor: color,
                marginRight: 10,
            }}
            />
        );
    };

    const renderLegendComponent = () => {
        return (
            <XStack
                style={{
                flexDirection: 'row',
                flexWrap: "wrap",
                justifyContent: 'left',
                marginBottom: 10,
                }}>
                    {pieData.map((item, index) => {
                    return(
                        <XStack
                            key={index}
                            style={{
                                alignItems: 'center',
                                paddingEnd: 10,
                                marginVertical: 4,
                            }}
                            >
                            {renderDot(item.color)}
                            <Text>{item.medium}</Text>
                        </XStack>
                    );
                    })}
            </XStack>
        );
    };

    return ( 
       <View
    style={{
      flex: 1,
    }} >
    <View
      style={{
        margin: 20,
        padding: 16,
        borderRadius: 20,
        backgroundColor: '$color',
      }}>
      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 10 }}>
        Media Types Used
      </Text>
      <View style={{padding: 20, alignItems: 'center'}}>
        {(pieData && pieData.length > 0)? 
        <PieChart
          data={pieData}
          donut
          focusOnPress
          onPress={(item, index) => setFocusedMedia(item)}
          radius={100}
          innerRadius={70}
          innerCircleColor={theme.background.get()}
          centerLabelComponent={() => {
            return (
              <View style={{justifyContent: 'center', alignItems: 'center'}}>
                <Text
                  style={{fontSize: 22, fontWeight: 'bold'}}>
                  {focused_media && focused_media.value.toString() + "%"}
                </Text>
                <Text style={{fontSize: 12}}>
                    {focused_media && focused_media.medium.toString()}
                </Text>
              </View>
            );
          }}
        />
        : <Text> No logs from this month to show</Text>
        }
      </View>
      {pieData && pieData.length > 0 && renderLegendComponent()}
    </View>
  </View>);
}