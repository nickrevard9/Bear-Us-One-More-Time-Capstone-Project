import React, {use, useEffect, useState } from  'react';
import {StyleSheet, Alert, useColorScheme } from "react-native";
import Modal from "react-native-modal";
import DateTimePicker, { DateType, useDefaultStyles } from 'react-native-ui-datepicker';
import { View, Button, Card } from "tamagui";

export function DatePicker(props: {onConfirm: (params: any) => void, 
  isVisible: boolean, 
  onDismiss: () => void,
  date: Date
}) {

  const colorScheme = useColorScheme()
    const colors = colorScheme === 'dark' 
    ? {
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
            <DateTimePicker
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
            date={props.date}
            onChange={(e) => props.onConfirm(e)}
            mode="single"
            />
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