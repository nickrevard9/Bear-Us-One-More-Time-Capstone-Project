import React, { useState } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity} from 'react-native';
import {Input, Button, YStack, XStack, Text, H2, Label, TextArea, Switch, ScrollView} from "tamagui";
import { Calendar } from "@/components/calendar";
import { TimePicker } from "@/components/timepicker";
import { DateType } from 'react-native-ui-datepicker';
import DateTimePicker from '@react-native-community/datetimepicker'
import {Dropdown} from 'react-native-element-dropdown';

const ReportPage = () => {
    const [date, setDate] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [time, setTime] = useState<Date>(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);

    const [hours, setHours] = useState('');
    const [minutes, setMinutes] = useState('');
    const [description, setDescription] = useState('');

    const [medium, setMedium] = useState('');
    const [focus, setIsFocus] = useState(false);
    const mediums = [
        { label: "Print Newspaper", value: "Print Newspaper" },
        { label: "Other Printed Material", value: "Other Printed Material" },
        { label: "Television", value: "Television" },
        { label: "Radio", value: "Radio" },
        { label: "eReader", value: "eReader" },
        { label: "Large Screen / Movie Theater", value: "Large Screen / Movie Theater" },
        { label: "Stereo System", value: "Stereo System" },
        { label: "Car Stereo", value: "Car Stereo" },
        { label: "Personal Computer", value: "Personal Computer" },
        { label: "Laptop Computer", value: "Laptop Computer" },
        { label: "Desktop Computer", value: "Desktop Computer" },
        { label: "Smart Phone", value: "Smart Phone" },
        { label: "Tablet", value: "Tablet" },
        { label: "Other Handheld Device", value: "Other Handheld Device" },
        { label: "Other", value: "Other" },
    ];

    const [isIntentional, setIsIntentional] = useState(false);

    const [primaryMotivation, setPrimaryMotivation] = useState('');
    const motivations = [
        { label: "Entertainment", value: "Entertainment" },
        { label: "Social", value: "Social" },
        { label: "Information Seeking", value: "Information Seeking" },
        { label: "Escape", value: "Escape" },
        { label: "Schoolwork", value: "Schoolwork" },
        { label: "Job", value: "Job" },
        { label: "Ambient", value: "Ambient" },
        { label: "Other", value: "Other" },
    ];

    const onChangeDate = (_: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) setDate(selectedDate);
    };

    const onChangeTime = (_: any, selectedTime?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selectedTime) setTime(selectedTime);
    };

    const handleSubmit = () => {
        // Handle form submission logic here
        // Example: send data to backend or update state
        console.log({
            date: date.toDateString(),
            time: time.toLocaleTimeString(),
            hours,
            minutes,
            description,
        });
    };

    return (
        <ScrollView>
        <YStack style={styles.container}>
            <XStack justifyContent="left" witdh="50%" alignItems="center" gap="$4" paddingBottom="$4">
            <Label style={styles.label}>Date</Label>
                <Input onPress={() => setShowDatePicker(!showDatePicker)} value={date.toDateString()}></Input>
            {showDatePicker && <Calendar onclick={function (date: DateType): void {
                    setDate(date as Date);
                    setShowDatePicker(false);
                } }></Calendar>}
            </XStack>

            <XStack justifyContent="left" alignItems="center" gap="$4" paddingBottom="$4">
                <Label style={styles.label}>Time (Hour)</Label>
                    <Input 
                    onPress={() => setShowTimePicker(!showTimePicker)}
                    value ={time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}></Input>
                {showTimePicker && DateTimePicker}
            </XStack>

            <XStack justifyContent="left" alignItems="center" gap="$4" paddingBottom="$4">
            <Label style={styles.label}>Time Spent</Label>
            <View style={styles.timeSpentRow}>
                <Input
                    style={[styles.input, styles.timeInput]}
                    placeholder="Hours"
                    type="numeric"
                    min={0}
                    max={23}
                    value={hours}
                    onChangeText={setHours}
                />
                <Text style={styles.timeSeparator}>:</Text>
                <Input
                    style={[styles.input, styles.timeInput]}
                    placeholder="Minutes"
                    type="numeric"
                    min={0}
                    max={59}
                    value={minutes}
                    onChangeText={setMinutes}
                />
            </View>
            </XStack>

            <XStack justifyContent="left" alignItems="center" gap="$4" paddingBottom="$4">
            <Label style={styles.label}>Medium</Label>
            <Dropdown
                maxHeight={300}
                data={mediums}
                placeholder='Select Medium'
                value={medium}
                onChange={item => { setMedium(item.value)}}
                style={styles.input}
                labelField={'label'}
                valueField={'value'}
            />
            </XStack>

            <XStack justifyContent="left" alignItems="center" gap="$4" paddingBottom="$4">
            <Label style={styles.label}>Channel</Label>
            <Input
                style={[styles.input]}
                placeholder="Enter Channel"
            />
            </XStack>

            <XStack justifyContent="left" alignItems="center" gap="$4" paddingBottom="$4">
            <Label style={styles.label}>Intentional?</Label>
            <Text> No </Text>
            <Switch onClick={() => setIsIntentional(!isIntentional)} value={isIntentional} defaultChecked={isIntentional}>
            <Switch.Thumb animation="quicker" />
            </Switch>
            <Text> Yes </Text>
            </XStack>

            <XStack justifyContent="left" alignItems="center" gap="$4" paddingBottom="$4">
            <Label style={styles.label}>Primary Motivation</Label>
            <Dropdown
                maxHeight={300}
                data={motivations}
                placeholder='Select Motivation'
                value={primaryMotivation}
                onChange={item => { setPrimaryMotivation(item.value)}}
                style={styles.input}
                labelField={'label'}
                valueField={'value'}
            />
            </XStack>

            <YStack paddingBottom="$4">
            <Label style={styles.label}>Description</Label>
            <TextArea
                size="$4" borderWidth={2}
                width="70%"
                paddingBottom="$4"
                style={[styles.input, styles.descriptionInput]}
                placeholder="Enter description"
                value={description}
                onChangeText={setDescription}
            />
            </YStack>

            <Button style={styles.button} onPress={handleSubmit}>Submit</Button>
        </YStack>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    label: {
        marginTop: 16,
        marginBottom: 4,
        fontWeight: 'bold',
        fontSize: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        padding: 10,
        backgroundColor: '#f9f9f9',
    },
    timeSpentRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeInput: {
        flex: 1,
        marginRight: 4,
        marginLeft: 4,
    },
    timeSeparator: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    descriptionInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    button: {
        backgroundColor: 'forestgreen',
    }
});

export default ReportPage;