
import React, {useState } from  'react';
import { useColorScheme } from 'react-native';
import DateTimePicker, { DateType, useDefaultStyles } from 'react-native-ui-datepicker';
import { View, Text, Button, H3, XStack, H6 } from "tamagui";
import MonthYearPicker from "aekimena-month-year-picker";
import { ChevronLeft, ChevronRight } from '@tamagui/lucide-icons';
import { TouchableOpacity } from 'react-native';
import { hide } from 'expo-router/build/utils/splash';


export function Calendar(props: {onclick: (date: DateType) => void, 
  monthChange?: Function,
  yearChange?: Function,  
}) {
  const defaultStyles = useDefaultStyles();
  const [selected, setSelected] = useState<DateType>();
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const getMonthNameFromDate = (monthNumber: number): string => {
    const date = new Date(2000, monthNumber);
    return date.toLocaleString('default', { month: 'long' });
  };

  const colorScheme = useColorScheme()
    const colors = colorScheme === 'dark' ? {
      background: "#2b2a23",
      gradientFrom: "#2b2a23",
      gradientTo: "#3a392f",
      selected: "#f7d674c7",
      today: "#f7d674a9",
      label: "#e4e0d5",
      selected_label: "#e4e0d5",
    }
    : {
      background: "#f4efe6",
      gradientFrom: "#f4efe6",
      gradientTo: "#ebe3d2",
      selected: "#8fa47a",
      selected_label: "#f4efe6",
      today: "#8fa47a96",
      label: "#3e3b32",
  };

  function onMonthChangeLeft(){
    const m = ((month-1) + 12) % 12;
    if(m == 11) {
      setYear(year - 1)
      if(props.yearChange){
        props.yearChange(year - 1)
      }
    }
    setMonth(m);
    if(props.monthChange){
      props.monthChange(m)
    }
  }
  function onMonthChangeRight(){
    const m = (month+1) % 12;
    if(m == 0) {
      setYear(year + 1)
      if(props.yearChange){
        props.yearChange(year + 1)
      }
    }
    setMonth(m);
    if(props.monthChange){
      props.monthChange(m)
    }
  }

  const handleConfirm = (text: string) => {
    const date = new Date(text)
    console.log(date.getMonth())
    setMonth(date.getMonth());
    setYear(date.getFullYear());
    if(props.monthChange){
      props.monthChange(date.getMonth());
    }
    if(props.yearChange){
      props.yearChange(date.getFullYear());
    }
    setDatePickerVisible(false);
  }

  function hideDatePicker(){
    setDatePickerVisible(false);
  }

  return (
    <View>
    <XStack style={{ justifyContent:"center", width:"100%", alignItems:"center", margin: "0 auto"}}> 
      <H3 onPress={onMonthChangeLeft}><ChevronLeft/></H3>
      <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
      <H6 style={{ textAlign: "center", flex: 5 }}>{getMonthNameFromDate(month)} {year}</H6>
      </TouchableOpacity>
      {isDatePickerVisible && (<MonthYearPicker
        visible={isDatePickerVisible}
        onRequestClose={hideDatePicker}
        onBackgroundPress={hideDatePicker}
        showDays={false}
        onConfirm={handleConfirm}
      />)}
      <H3 onPress={onMonthChangeRight}><ChevronRight/></H3>
    </XStack>
    <DateTimePicker
      hideHeader
      disableMonthPicker={true}
      disableYearPicker={true}
      styles={{
        day_label: { color: colors.label },
        month_selector_label: { color: colors.label },
        month_label: { color: colors.label },
        year_label: { color: colors.label },
        year_selector_label: { color: colors.label },
        weekday_label: { color: colors.label },
        today: { borderColor: colors.today, borderWidth: 4, borderRadius: 20}, // Add a border to today's date
        selected: { backgroundColor: colors.selected, borderRadius: 20 }, // Highlight the selected day
        selected_label: { color: colors.selected_label }, // Highlight the selected day label
      }}
      mode="single"
      month={month}
      year={year}
      date={selected}
      onChange={({ date }) =>  {
        setSelected(date); 
        props.onclick(date)}}
    />
    </View>
  );
}