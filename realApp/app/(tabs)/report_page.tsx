import React, { useState } from 'react';
import {StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { View, Input, Button, YStack, XStack, Text, H2, Label, TextArea, Switch, 
    ScrollView, Popover } from "tamagui";
import { useRouter } from 'expo-router';
import { Calendar } from "@/components/calendar";
import { TimePicker } from "@/components/timepicker";
import { DateType } from 'react-native-ui-datepicker';
import DateTimePicker from '@react-native-community/datetimepicker'
import {Dropdown} from 'react-native-element-dropdown';

const ReportPage = () => {
    const router = useRouter();
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
            medium,
            isIntentional,
            primaryMotivation,
            description,
        });
    };

    return (
        <View paddingTop={50} paddingHorizontal={10}>
            <XStack alignItems="center" paddingBottom={20} >
                <TouchableOpacity onPress={() => router.replace('/home')} style={{ flex: 1 }}>
                    <Text style={{ fontSize: 28, fontWeight: 'bold', textAlign: 'left' }}>{'←'}</Text>
                </TouchableOpacity>
                <H2 style={{ flex: 2, textAlign: 'center'}}>Log</H2>
                <View style={{ flex: 1 }} />
            </XStack>
        <ScrollView paddingBottom="$4">
        <YStack justifyContent="left">
            <XStack justifyContent="left" alignItems="center" gap="$4" paddingBottom="$4">
                <Label>Date</Label>
                <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                    <Popover.Trigger asChild>
                        <Input
                            value={date.toDateString()}
                            editable={false}
                            onPress={() => setShowDatePicker(true)}
                            style={{ width: 150 }}
                        />
                    </Popover.Trigger>
                    <Popover.Content>
                        <Calendar
                            onclick={function (selected: DateType): void {
                                setDate(selected as Date);
                                setShowDatePicker(false);
                            }}
                        />
                    </Popover.Content>
                </Popover>
            </XStack>

            <XStack alignItems="center" gap="$4" paddingBottom="$4">
                <Label>Time (Hour)</Label>
                    <DateTimePicker
                        value={time}
                        minuteInterval={30}
                        mode="time"
                        is24Hour={false}
                        display="default"
                        onChange={(event, selectedTime) => {
                            setShowTimePicker(true);
                            if (selectedTime) setTime(selectedTime);
                        }}
                    />
                
            </XStack>

            <XStack alignItems="center" gap="$4" paddingBottom="$4">
                <Label style={{ minWidth: 90 }}>Time Spent</Label>
                <XStack alignItems="center" gap="$2">
                    <Input
                        placeholder="Hr"
                        keyboardType={(Platform.OS == 'ios') ? "number-pad" : "numeric"}
                        min={0}
                        max={23}
                        value={hours} // TODO: Add error handling for hours > 23
                        onChangeText={setHours}
                        style={{ width: 60, textAlign: 'center' }}
                    />
                    <Text>:</Text>
                    <Input
                        placeholder="Min"
                        keyboardType={(Platform.OS == 'ios') ? "number-pad" : "numeric"}
                        min={0}
                        max={59}
                        value={minutes}
                        onChangeText={setMinutes} // TODO: Add error handling for minutes > 59
                        style={{ width: 60, textAlign: 'center' }}
                    />
                </XStack>
            </XStack>

            <XStack alignItems="center" gap="$4" paddingBottom="$4">
            <Label style={{ minWidth: 90 }}>Medium</Label>
                <Dropdown
                        data={mediums}
                        placeholder='Select Medium'
                        value={medium}
                        onChange={item => setMedium(item)}
                        style={{ width: 200, alignContent: 'center' }}
                        labelField={'label'}
                        valueField={'value'}
                        placeholderStyle={{ color: '#888', fontSize: 16 }}
                        selectedTextProps={{ style: { color: '#888', fontSize: 16 } }}

                />
            </XStack>

            <XStack alignItems="center" gap="$4" paddingBottom="$4">
            <Label >Channel</Label>
            <Input
                
                placeholder="Enter Channel"
            />
            </XStack>

            <XStack alignItems="center" gap="$4" paddingBottom="$4">
            <Label >Intentional?</Label>
            <Text> No </Text>
            <Switch onClick={() => setIsIntentional(!isIntentional)} value={isIntentional} defaultChecked={isIntentional}>
            <Switch.Thumb animation="quicker" />
            </Switch>
            <Text> Yes </Text>
            </XStack>

            <XStack alignItems="center" gap="$4" paddingBottom="$4">
            <Label>Primary Motivation</Label>
            <Dropdown
                maxHeight={300}
                data={motivations}
                style={{ width: 200, alignContent: 'center' }}
                placeholder='Select Motivation'
                value={primaryMotivation}
                onChange={item => { setPrimaryMotivation(item.value)}}
                placeholderStyle={{ color: '#888', fontSize: 16 }}
                selectedTextProps={{ style: { color: '#888', fontSize: 16 } }}

                labelField={'label'}
                valueField={'value'}
            />
            </XStack>

            <YStack paddingBottom="$4">
            <Label >Description</Label>
            <TextArea
                size="$4" borderWidth={2}
                width="100%"
                paddingBottom="$4"
                height={250}
                placeholder="Enter description"
                value={description}
                onChangeText={setDescription}
            />
            </YStack>

            <Button onPress={handleSubmit}>Submit</Button>
            <XStack minHeight={100} maxHeight={200}>

            </XStack>
        </YStack>
        </ScrollView>
        </View>
    );
};


export default ReportPage;