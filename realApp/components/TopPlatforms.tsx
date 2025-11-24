import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PieChart } from "react-native-gifted-charts";
import { View, Text, useTheme, XStack } from "tamagui";

type PlatformChartProps = {
    platform_counts: {channel: string, value: number}[];
};

export default function PlatformChart({platform_counts}: PlatformChartProps) {
    const [pieData, setPieData] = useState<{channel: string, value: number, color: string, focused: boolean}[]>(apply_colors(platform_counts));
    const [focused_media, setFocusedMedia] = useState<{channel: string, value: number} | null>(getFirst(pieData));
    const theme = useTheme()
    
    const DEFAULT_COLOR = "#838383ff";

    function apply_colors(
    data: { channel: string, value: number }[]
    ): { channel: string, value: number, color: string, focused: boolean }[] {
        console.log(data);
        const color_list: {[key: string]: string} = {
            0: "#838383ff",    
            1: "#FF7F97",
            2: "#8F80F3",
            3: "#3BE9DE",
            4: "#006DFF",
            5: "#a90ed8ff", // Other
        };
    let final = data? data.map((item, i) => ({
        ...item,
        color: color_list[i] ?? DEFAULT_COLOR,
        focused: i === 0 ? true : false,
    })) : [];

    return final;
    }

    function getFirst(data: { channel: string, value: number, color: string, focused: boolean }[]){
        return data.find(item => item.focused) || null;
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
                            <Text>{item.channel.charAt(0).toUpperCase() + item.channel.slice(1)}</Text>
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
      
        {(pieData && pieData.length > 0)? (
            <View style={{padding: 20, alignItems: 'center'}}>
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 10 }}>
        Top 5 Platforms
      </Text>
        <PieChart
          data={pieData}
          donut
          focusOnPress
          sectionAutoFocus
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
                    {focused_media && focused_media.channel.toString().charAt(0).toUpperCase() + focused_media.channel.slice(1)}
                </Text>
              </View>
            );
          }}
        />
        </View>)
        : <Text> </Text>
        }
      
      {pieData && pieData.length > 0 && renderLegendComponent()}
    </View>
  </View>);
}