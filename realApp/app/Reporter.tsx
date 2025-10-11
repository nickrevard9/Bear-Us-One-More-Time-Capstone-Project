import React, { useCallback, useEffect, useState } from 'react';
import {StyleSheet, Platform, TouchableOpacity, TouchableWithoutFeedback, Switch, ScrollView, Alert} from 'react-native';
import { View, Input, Button, YStack, XStack, Text, H6, Label, TextArea, 
 Popover } from "tamagui";
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar } from "@/components/calendar";
import { TimePicker } from "@/components/timepicker";
import { DateType } from 'react-native-ui-datepicker';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {Dropdown} from 'react-native-element-dropdown';
import { useSQLiteContext } from "expo-sqlite";
import { deleteLogByLogID, getLogByLogID, insertLog, LogData, updateLog } from "../lib/db";

// Define props for the Reporter component, with optional log_id for editing an existing log
interface ReporterProps {
  log_id?: number;
}

const Reporter: React.FC<ReporterProps> = ({log_id}) => {
    const router = useRouter(); // Expo Router for navigation
    const db = useSQLiteContext(); // SQLite context for database access

    // State to track the current log's ID
    const [ logId, setLogID ] = useState(log_id || null);

    // Edit mode is true if editing an existing log
    const [editMode, setEditMode] = useState(false);
    
    // States for date and time pickers
    const [date, setDate] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [time, setTime] = useState<Date>(new Date("2023-10-05T12:30:00"));
    const [showTimePicker, setShowTimePicker] = useState(false);

    const [duration, setDuration] = useState(new Date("2023-10-05T1:00:00"));
    const [showDurationPicker, setShowDurationPicker] = useState(false);

    // Other form fields
    const [description, setDescription] = useState('');
    const [channel, setChannel] = useState('');
    const [medium, setMedium] = useState('');
    const [focus, setIsFocus] = useState(false);

    // Dropdown options for mediums
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

    // Whether the activity was intentional
    const [isIntentional, setIsIntentional] = useState(false);

    // Dropdown for primary motivation
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

    // Function to load an existing log from the database
    async function obtainLog(log_id: number) {
        const log: LogData | null = await getLogByLogID(db, log_id);
        if(!log){
            throw Error("cannot retrieve log data");
        }
        console.log(`Got the log ${log_id}`)
        setEditMode(true); // Set edit mode since this is an existing log
        setChannel(log.channel);
        setDuration(new Date("2023-10-05T"+log.duration));
        setTime(new Date(log.start_time));
        setDescription(log.description);
        setIsIntentional(log.intentional == 1? true : false);
        setMedium(log.medium);
        setPrimaryMotivation(log.primary_motivation);
        const [month, day, year] = log.date.split('/');
        const date = new Date(+year, +month - 1, +day);
        setDate(new Date(date));
    }

    // useFocusEffect runs whenever this screen gains focus
    useFocusEffect(
    useCallback(() => {
      if (logId) { // If editing an existing log
        try {
          obtainLog(logId);
        } catch (error) {
          Alert.alert("Cannot retrieve log");
          throw error;
        }
      } else { // Reset form fields for a new log
        setEditMode(false);
        setChannel("");
        setDuration(new Date("2023-10-05T1:00:00"));
        setTime(new Date("2023-10-05T12:30:00"));
        setDescription("");
        setIsIntentional(false);
        setMedium("");
        setPrimaryMotivation("");
        setDate(new Date());
      }
    }, [
      logId,
      setEditMode,
      setChannel,
      setDate,
      setDuration,
      setTime,
      setIsIntentional,
      setMedium,
      setPrimaryMotivation,
      setDescription,
    ])
  );

    // Handle form submission: insert or update log
    const handleSubmit = async () => {
        const log: LogData = {
            date: date.toLocaleDateString(),
            start_time: time.toISOString(),
            duration: duration.toTimeString().split(' ')[0], // Format as HH:MM:SS
            medium,
            channel,
            intentional: isIntentional? 1 : 0,
            primary_motivation: primaryMotivation,
            description,
        };
        if (logId){
            log.log_id = logId; // Include log ID if editing
        }

        console.log(log);

        try {   
            if(editMode){
                await updateLog(db, log); // Update existing log
            }   
            else{
                await insertLog(db, log); // Insert new log
            }  
            router.push('/(tabs)/home') // Navigate back to home
            return;
        }
        catch (error){
            Alert.alert("Could not save log")
        }
        
    };

    // Handle deleting an existing log
    const handleDelete = async () => {
        try{
            if(!editMode){
                throw Error("Cannot delete a new log")
            }
            if(!logId){
                throw Error("Cannot delete a log with no log_id")
            }
            if(await deleteLogByLogID(db,logId)){
                router.back(); // Navigate back if deletion succeeds
                return;
            }
            throw Error("Cannot delete this log")
        }
        catch(error){
            Alert.alert("Cannot delete log");
        }
    };

    return (
        <View paddingTop={50} paddingHorizontal={10}>
            {/* Header with back arrow and title */}
            <XStack alignItems="center" paddingBottom={20} >
                <TouchableOpacity onPress={() => router.back()} style={{ flex: 1 }}>
                    <Text style={{ fontSize: 28, fontWeight: 'bold', textAlign: 'left' }}>{'←'}</Text>
                </TouchableOpacity>
                <H6 style={{ flex: 2, textAlign: 'center', fontWeight: "600",}}>Log</H6>
                <View style={{ flex: 1 }} />
            </XStack>

            <ScrollView paddingBottom="$4">
            <YStack justifyContent="left">

                {/* Date Picker */}
                <XStack justifyContent="left" alignItems="center" gap="$4" paddingBottom="$4">
                    <Label>Date</Label>
                    <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                        <Popover.Trigger asChild>
                            <Input
                                value={date.toDateString()}
                                editable={false}
                                onPress={() => setShowDatePicker(true)}
                                style={{ width: 150 }}
                            />
                        </Popover.Trigger>
                        </TouchableOpacity>
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

                {/* Time Picker */}
                <XStack alignItems="center" gap="$4" paddingBottom="$4">
                    <Label>Time</Label>
                    <TouchableOpacity background="none" onPress={() => setShowTimePicker(true)}>
                        <Input onPress={() => setShowTimePicker(true)} value={time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} editable={false}/>
                    </TouchableOpacity>
                    <DateTimePickerModal
                        isVisible={showTimePicker}
                        mode="time"
                        minuteInterval={30}
                        onConfirm={(time) => {setShowTimePicker(false); setTime(time)}}
                        onCancel={() => setShowTimePicker(false)}
                    />
                </XStack>

                {/* Duration Picker */}
                <XStack alignItems="center" gap="$4" paddingBottom="$4">
                    <Label>Duration</Label>
                    <TouchableOpacity activeOpacity={1} onPress={() => setShowDurationPicker(true)}>
                        <Input onPress={() => setShowDurationPicker(true)} value={(duration.toTimeString().split(' ')[0])} editable={false}/>
                    </TouchableOpacity>
                    <DateTimePickerModal
                        isVisible={showDurationPicker}
                        mode="time"
                        locale="en_GB"
                        onConfirm={(time) => {setShowDurationPicker(false); setDuration(time)}}
                        is24Hour={true}
                        onCancel={() => setShowDurationPicker(false)}
                    />                
                </XStack>

                {/* Medium Dropdown */}
                <XStack alignItems="center" gap="$4" paddingBottom="$4">
                <Label style={{ minWidth: 90 }}>Medium</Label>
                    <Dropdown
                            data={mediums}
                            placeholder='Select Medium'
                            value={medium}
                            onChange={item => setMedium(item.value)}
                            style={{ width: 200, alignContent: 'center' }}
                            labelField={'label'}
                            valueField={'value'}
                            placeholderStyle={{ color: '#888', fontSize: 16 }}
                            selectedTextProps={{ style: { color: '#888', fontSize: 16 } }}
                    />
                </XStack>

                {/* Channel Input */}
                <XStack alignItems="center" gap="$4" paddingBottom="$4">
                <Label >Channel</Label>
                <Input
                    onChangeText={setChannel} value={channel}
                    placeholder="Enter Channel"
                />
                </XStack>

                {/* Intentional Switch */}
                <XStack alignItems="center" gap="$4" paddingBottom="$4">
                <Label >Intentional?</Label>
                <Text> No </Text>
                <Switch onValueChange={setIsIntentional} value={isIntentional}>
                </Switch>
                <Text> Yes </Text>
                </XStack>

                {/* Primary Motivation Dropdown */}
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

                {/* Description TextArea */}
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

                {/* Submit and Delete Buttons */}
                <YStack gap={"$2"}>
                    <Button onPress={handleSubmit}>
                        {editMode? "Save" : "Submit"}
                    </Button>
                    {editMode && <Button onPress={handleDelete} variant='outlined'>
                        Delete
                    </Button>}
                </YStack>

                <XStack minHeight={100} maxHeight={200}>
                    {/* Empty space for padding or future content */}
                </XStack>
            </YStack>
            </ScrollView>
        </View>
    );
};

export default Reporter;
