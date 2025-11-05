
import React, {use, useEffect, useState } from  'react';
import {StyleSheet, Alert } from "react-native";
import Modal from "react-native-modal";
import DateTimePicker, { DateType } from 'react-native-ui-datepicker';
import { View, Button, Card, Input, XStack, Text, ToggleGroup as ToggleGroupBase, styled } from "tamagui";

const Item = styled(
  ToggleGroupBase.Item,
  {
    variants: {
      active: {
        false: {},
        true: {
          backgroundColor: '$accentBackground',
          color: '#e4e0d5',
        },
      },
    },
  },
)

export function TimePicker(props: {onConfirm: (hoursAndMinutes: {hours: number, minutes: number}) => void, 
  isVisible: boolean, 
  onDismiss: () => void,
  hours: number,
  minutes: number
}) {
  const [hour, setHour] = useState(props.hours > 12 ? props.hours - 12 : props.hours)
  const [period, setPeriod] = useState(props.hours > 12 ? "PM" : "AM")
  const [minute, setMinute] = useState(props.minutes)

  const [hourError, setHourError] = useState(false)
  const [minuteError, setMinuteError] = useState(false)

  const Validate_Confirm = () => {
    if(hourError || minuteError){
      Alert.alert("Must input a valid time")
      return;
    }
    if(period == "PM" && hour < 12){
      props.onConfirm({hours: hour+12, minutes: minute})
    }
    else if(period == "AM" && hour == 12){
      props.onConfirm({hours: 0, minutes: minute})
    }
    else {
      props.onConfirm({hours: hour, minutes: minute})
    }
    
  }

  useEffect(() => {
    console.log(props.hours, props.minutes)
    setHour(props.hours > 12 ? props.hours - 12 : props.hours)
    setMinute(props.minutes)
    setPeriod(props.hours > 12 ? "PM" : "AM")
  }, [setHour,setMinute])

  const Validate_Hours = (s: String) => {
    const h = Number(s)
    setHour(h)
    if (h > 12 || h < 1){
      setHourError(true)
      return;
    }
    setHourError(false)
    setHour(h)
  }

  const Validate_Minutes = (s: String) => {
    const m = Number(s)
    if (m > 59 || m < 0){
      setMinuteError(true)
      return;
    }
    setMinuteError(false)
    setMinute(m)
  }
  return (
        <View style={{flex: 2}}>
      <Modal
      isVisible={props.isVisible} 
      onBackButtonPress={() => {
            props.onDismiss();
          }}
      onBackdropPress={() => {
          props.onDismiss();
        }}>
            <View style={styles.centeredView}>
              <Card style={styles.modalView}>
                <XStack alignContent='center' justifyContent='center'>
                  <Input keyboardType={"numeric"} defaultValue={String(hour)} style={hourError? styles.InputError: styles.Input} maxLength={2} onChangeText={(e)=> Validate_Hours(e)}/>
                  <Text style={styles.modalText} padding={10}>:</Text>
                  <Input keyboardType={"numeric"} defaultValue={String(minute)} style={minuteError? styles.InputError: styles.Input} maxLength={2} onChangeText={(e)=> Validate_Minutes(e)}/>
                </XStack> 
                                  <ToggleGroupBase value={'PM'} type='single' orientation='horizontal' padding={10} alignItems='center'>
                    <Item value='PM' active={period == "PM"} onPress={() => setPeriod("PM")}><Text>PM</Text></Item>
                    <Item value='AM' active={period == "AM"} onPress={() => setPeriod("AM")}><Text>AM</Text></Item>
                  </ToggleGroupBase>
      <Button onPress={Validate_Confirm}>Save</Button>
      </Card>
    </View>
    </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#949494ff',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  Input: {
    fontSize: 22,
    backgroundColor:"#bdbdbd28",
    width: 70, 
    height: 70,
    textAlign: 'center',
  },
    InputError: {
    color: "red",
    fontSize: 22,
    backgroundColor:"#bdbdbd28",
    width: 70, 
    height: 70,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 30,
    marginBottom: 15,
    textAlign: 'center',
  },
});