
import React, {useState } from  'react';
import DateTimePicker, { DateType, useDefaultStyles } from 'react-native-ui-datepicker';



export function Calendar(props: {onclick: (date: DateType) => void, 
  monthChange?: Function,
  yearChange?: Function,  
}) {
  const defaultStyles = useDefaultStyles();
  const [selected, setSelected] = useState<DateType>();

  return (
    <DateTimePicker
      mode="single"
      date={selected}
      onMonthChange={(month) => props.monthChange ? props.monthChange(month) : null}
      onYearChange={(year) => props.yearChange ? props.yearChange(year) : null  }
      onChange={({ date }) =>  {
        setSelected(date); 
        props.onclick(date)}}
      styles={defaultStyles}
    />
  );
}