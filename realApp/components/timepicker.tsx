
import React, {useState } from  'react';
import DateTimePicker, { DateType, useDefaultStyles } from 'react-native-ui-datepicker';

export function TimePicker(props: {onclick: (date: DateType) => void}) {
  const defaultStyles = useDefaultStyles();
  const [selected, setSelected] = useState<DateType>();

  return (
    <DateTimePicker
      mode="single"
      date={selected}
      use12Hours={true}
      timePicker={true}
      initialView='time'
      onChange={({ date }) =>  {
        setSelected(date); 
        props.onclick(date)}}
      styles={defaultStyles}
    />
  );
}