
import React, {useState } from  'react';
import DateTimePicker, { DateType, useDefaultStyles } from 'react-native-ui-datepicker';
import { View, Text, Button, H3, XStack, H6 } from "tamagui";
import { ChevronLeft, ChevronRight } from '@tamagui/lucide-icons';


export function Calendar(props: {onclick: (date: DateType) => void, 
  monthChange?: Function,
  yearChange?: Function,  
}) {
  const defaultStyles = useDefaultStyles();
  const [selected, setSelected] = useState<DateType>();
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())

  const getMonthNameFromDate = (monthNumber: number): string => {
  const date = new Date(2000, monthNumber);
  return date.toLocaleString('default', { month: 'long' });
};

  function onMonthChangeLeft(){
    const m = (month-1) % 12;
    setMonth(m);
    if(props.monthChange){
      props.monthChange(m)
    }
  }
  function onMonthChangeRight(){
    const m = (month+1) % 12;
    setMonth(m);
    if(props.monthChange){
      props.monthChange(m)
    }
  }

  return (
    <View>
    <XStack style={{ justifyContent:"center", width:"100%", alignItems:"center", margin: "0 auto"}}> 
      <H3 onPress={onMonthChangeLeft}><ChevronLeft/></H3>
      <H6 style={{ textAlign: "center", flex: 5 }}>{getMonthNameFromDate(month)}</H6>
      <H3 onPress={onMonthChangeRight}><ChevronRight/></H3>
    </XStack>
    <DateTimePicker
    hideHeader
    disableMonthPicker={true}
    disableYearPicker={true}
      mode="single"
      month={month}
      year={year}
      date={selected}
      onChange={({ date }) =>  {
        setSelected(date); 
        props.onclick(date)}}
      styles={defaultStyles}
      
    />
    </View>
  );
}