import React, { useCallback, useEffect, useState } from 'react';
import {StyleSheet, Platform, TouchableOpacity, TouchableWithoutFeedback, Switch, ScrollView, Alert} from 'react-native';
import { View, Input, Button, YStack, XStack, Text, H6, Label, TextArea, Select, Popover, useTheme } from "tamagui";
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { DatePickerModal, DatePickerInput , TimePickerModal } from 'react-native-paper-dates';
import {Dropdown} from 'react-native-element-dropdown';
import { useSQLiteContext } from "expo-sqlite";
import { deleteLogByLogID, getLogByLogID, insertLog, LogData, updateLog } from "../lib/db";
import { X } from '@tamagui/lucide-icons';

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
    const [start_date, setStartDate] = useState<Date>(new Date("2023-10-05T12:30:00"));
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);

    const [end_date, setEndDate] = useState(new Date("2023-10-05T1:00:00"));
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    // Other form fields
    const [description, setDescription] = useState('');
    const [channel, setChannel] = useState('');
    const [medium, setMedium] = useState('');

    const [dateError, setDateError] = useState(false);
    const [mediumError, setMediumError] = useState(false);

    const [channelError, setChannelError] = useState(false);

    const [motivationError, setMotivationError] = useState(false);
    const [descriptionError, setDescriptionError] = useState(false);

    const theme = useTheme()

    // Dropdown options for mediums
    const mediums = [
        { label: "Car Stereo", value: "Car Stereo" },
        { label: "Desktop Computer", value: "Desktop Computer" },
        { label: "eReader", value: "eReader" },
        { label: "Laptop Computer", value: "Laptop Computer" },
        { label: "Large Screen / Movie Theater", value: "Large Screen / Movie Theater" },
        { label: "Print Newspaper", value: "Print Newspaper" },
        { label: "Personal Computer", value: "Personal Computer" },
        { label: "Radio", value: "Radio" },
        { label: "Stereo System", value: "Stereo System" },
        { label: "Smart Phone", value: "Smart Phone" },
        { label: "Tablet", value: "Tablet" },
        { label: "Television", value: "Television" },
        { label: "Other Handheld Device", value: "Other Handheld Device" },
        { label: "Other Printed Material", value: "Other Printed Material" },
        { label: "Other", value: "Other" },
    ];

    // Whether the activity was intentional
    const [isIntentional, setIsIntentional] = useState(false);

    // Dropdown for primary motivation
    const [primaryMotivation, setPrimaryMotivation] = useState('');
    const motivations = [
        { label: "Ambient", value: "Ambient" },
        { label: "Entertainment", value: "Entertainment" },
        { label: "Escape", value: "Escape" },
        { label: "Information Seeking", value: "Information Seeking" },
        { label: "Job", value: "Job" },
        { label: "Social", value: "Social" },
        { label: "Schoolwork", value: "Schoolwork" },
        { label: "Other", value: "Other" },
    ];

    // Placeholder Texts for Channel based on mediums selected
    const channelPlaceholders: { [key: string]: string } = {
        "": "e.g., Enter platform here",    
        "Car Stereo": "e.g., FM Radio, Spotify",
        "Desktop Computer": "e.g., YouTube, Netflix",
        "eReader": "e.g., Kindle, Nook",
        "Laptop Computer": "e.g., Hulu, Amazon Prime",
        "Large Screen / Movie Theater": "e.g., AMC, Regal Cinemas",
        "Print Newspaper": "e.g., The New York Times, The Guardian",
        "Personal Computer": "e.g., Spotify, Audible",
        "Radio": "e.g., NPR, BBC Radio",
        "Stereo System": "e.g., Home Stereo, Bluetooth Speaker",
        "Smart Phone": "e.g., TikTok, Instagram",
        "Tablet": "e.g., Netflix, YouTube",
        "Television": "e.g., HBO, Disney+",
        "Other Handheld Device": "e.g., PS4, Portable DVD Player",
        "Other Printed Material": "e.g., Magazine, Brochure",
        "Other": "e.g., Enter platform here",
    };

    // Placeholder Texts for Description based on options selected
    const descriptionPlaceholders: { [key: string]: string } = {
        "": "e.g., Describe your activity here",
        "Ambient": "e.g., Background music while working",
        "Entertainment": "e.g., Watching a movie or playing a game",
        "Escape": "e.g., Reading a novel to unwind",
        "Information Seeking": "e.g., Researching a topic online",
        "Job": "e.g., Attending a virtual meeting",
        "Social": "e.g., Video calling with friends",
        "Schoolwork": "e.g., Studying or attending online classes",
        "Other": "e.g., Describe your activity here",
    };
    
    // Function to round date to  nearest 5 or 10 minutes
    function roundToNearest5(date: Date): Date {
        const ms = 1000 * 60 * 5; // 5 minutes in milliseconds
        return new Date(Math.round(date.getTime() / ms) * ms);
    }

    // Function checking if start and end dates are valid
    function validateDates(start_date: Date, end_date: Date) {
        start_date > end_date ? setDateError(true) : setDateError(false);
    }

    // Function to load an existing log from the database
    async function obtainLog(log_id: number) {
        const log: LogData | null = await getLogByLogID(db, log_id);
        if(!log){
            throw Error("cannot retrieve log data");
        }
        console.log(`Got the log ${log_id}`)
        setEditMode(true); // Set edit mode since this is an existing log
        setChannel(log.channel);
        setEndDate(new Date(log.end_date));
        setStartDate(new Date(log.start_date));
        setDescription(log.description);
        setIsIntentional(log.intentional == 1? true : false);
        setMedium(log.medium);
        setPrimaryMotivation(log.primary_motivation);
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
        setStartDate(roundToNearest5(new Date()));
        const incrementedDate = new Date();
        incrementedDate.setHours(incrementedDate.getHours() + 1);
        setEndDate(roundToNearest5(incrementedDate));
        setDescription("");
        setIsIntentional(false);
        setMedium("");
        setPrimaryMotivation("");
      }
    }, [
      logId,
      setEditMode,
      setChannel,
      setEndDate,
      setStartDate,
      setIsIntentional,
      setMedium,
      setPrimaryMotivation,
      setDescription,
    ])
  );

    // Handle form submission: insert or update log
    const handleSubmit = async () => {
        if(dateError){
            Alert.alert("Please fix date errors before submitting");
            return;
        }
        if(medium === ""){
            setMediumError(true);
        }
        if(channel === ""){
            setChannelError(true);
        }
        if(primaryMotivation === ""){
            setMotivationError(true);
        }   
        if(description === ""){
            setDescriptionError(true);
        }
        if(medium === "" || channel === "" || primaryMotivation === "" || description === ""){
            Alert.alert("Please fill in all required fields before submitting");
            return;
        }
        const log: LogData = {
            start_date: start_date.toISOString(),
            end_date: end_date.toISOString(), // Format as HH:MM:SS
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

    // Start date picker handlers
    const onDismissStartDate = React.useCallback(() => {
        setShowStartDatePicker(false);
    }, [setShowStartDatePicker]);

    const onConfirmStartDate = React.useCallback(
    (params) => {
        setShowStartDatePicker(false);  
        const new_date = params.date ? new Date(params.date.getFullYear(), params.date.getMonth(), params.date.getDate(), start_date.getHours(), start_date.getMinutes()) : start_date;
        setStartDate(new_date);
        validateDates(new_date, end_date);
    },
    [setShowStartDatePicker, setStartDate, start_date, end_date]
  );
    const onDismissStartTime = React.useCallback(() => {
        setShowStartTimePicker(false);
    }   , [setShowStartTimePicker]);

    const onConfirmStartTime = React.useCallback(
    (params) => {
      setShowStartTimePicker(false);
      const new_date = params.hours && params.minutes ? new Date(start_date.getFullYear(), start_date.getMonth(), start_date.getDate(), params.hours, params.minutes) : start_date;
      setStartDate(new_date);
      validateDates(new_date, end_date);},
    [setShowStartTimePicker, setStartDate, start_date, end_date]
  );

    // End date picker handlers
    const onDismissEndDate = React.useCallback(() => {
        setShowEndDatePicker(false);
    }, [setShowEndDatePicker]);

    const onConfirmEndDate = React.useCallback(
    (params) => {
        setShowEndDatePicker(false);
        const new_date = params.date ? new Date(params.date.getFullYear(), params.date.getMonth(), params.date.getDate(), end_date.getHours(), end_date.getMinutes()) : end_date
        setEndDate(new_date)
        validateDates(start_date, new_date);
    },
    [setShowEndDatePicker, setEndDate, end_date, start_date]
  );

    const onDismissEndTime = React.useCallback(() => {
        setShowEndTimePicker(false);
    }, [setShowEndTimePicker]);

    const onConfirmEndTime = React.useCallback(
    (params) => {
      setShowEndTimePicker(false);
      const new_date = params.hours && params.minutes ? new Date(end_date.getFullYear(), end_date.getMonth(), end_date.getDate(), params.hours, params.minutes) : end_date;
      setEndDate(new_date);
      validateDates(start_date, new_date);},
    [setShowEndTimePicker, setEndDate, end_date]
  );

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

                {/* Time Picker */}
                <XStack alignItems="center" gap="$4" paddingBottom="$4">
                    <Label>Started</Label>
                    <TouchableOpacity background="none" onPress={() => setShowStartDatePicker(true)}>
                        <Input color={dateError? "red" : theme.color.get()} onPress={() => setShowStartDatePicker(true)} value={start_date.toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            })} editable={false}/>
                    </TouchableOpacity>
                    <TouchableOpacity background="none" onPress={() => setShowStartTimePicker(true)}>
                        <Input color={dateError? "red" : theme.color.get()} onPress={() => setShowStartTimePicker(true)} value={start_date.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: 'numeric',
                            })} editable={false}/>
                    </TouchableOpacity>
                    <DatePickerModal
                        visible={showStartDatePicker}
                        mode='single'    
                        locale='en'
                        onDismiss={onDismissStartDate}
                        onConfirm={onConfirmStartDate}
                        date={start_date}
                    />            
                    <TimePickerModal
                        visible={showStartTimePicker}
                        onDismiss={onDismissStartTime}
                        onConfirm={onConfirmStartTime}
                        defaultInputType='keyboard'
                        hours={start_date.getHours()}
                        minutes={start_date.getMinutes()}
                        locale='en'
                    /> 
                </XStack>

                {/* Duration Picker */}
                <XStack alignItems="center" gap="$4" paddingBottom="$4">
                    <Label>Ended</Label>
                    <YStack>
                        <XStack>
                        <TouchableOpacity activeOpacity={1} onPress={() => setShowEndDatePicker(true)}>
                        <Input color={dateError? "red" : theme.color.get()} onPress={() => setShowEndDatePicker(true)} value={end_date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            })} editable={false} marginEnd={10}/>
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={1} onPress={() => setShowEndTimePicker(true)}>
                        <Input color={dateError? "red" : theme.color.get()} onPress={() => setShowEndTimePicker(true)} value={end_date.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: 'numeric',
                            })} editable={false}/>
                        </TouchableOpacity>
                        </XStack>
                        <Text style={{ color: dateError ? 'red' : 'black', marginLeft: 10 }}>
                        {dateError ? 'End time must be after start time' : ''}
                    </Text>
                        </YStack>
                    <DatePickerModal
                        visible={showEndDatePicker}
                        mode='single'    
                        locale='en'
                        onDismiss={onDismissEndDate}
                        onConfirm={onConfirmEndDate}
                        date={end_date}
                    />            
                    <TimePickerModal
                        visible={showEndTimePicker}
                        onDismiss={onDismissEndTime}
                        onConfirm={onConfirmEndTime}
                        defaultInputType='keyboard'
                        hours={end_date.getHours()}
                        minutes={end_date.getMinutes()}
                        locale='en'
                    />    
                </XStack>

                {/* Medium Dropdown */}
                <XStack alignItems="center" gap="$4" paddingBottom="$4">
                <Label style={{ minWidth: 90 }}>Media Type</Label>
                <YStack>
                    <Dropdown
                            data={mediums}
                            placeholder='Select Medium'
                            value={medium}
                            onChange={item => {setMedium(item.value); setMediumError(false);}}
                            style={{ width: 200, alignContent: 'center' }}
                            labelField={'label'}
                            valueField={'value'}
                            placeholderStyle={{ color: mediumError? "red" : theme.color.get(), fontSize: 16 }}
                            selectedTextProps={{ style: { color: mediumError? "red" : theme.color.get(), fontSize: 16 } }}
                    />
                    <Text paddingTop={5} style={{ color: mediumError ? 'red' : 'black', marginLeft: 10 }}>
                        {mediumError ? 'Must have a Media Type' : ''}
                    </Text>
                    </YStack>
                </XStack>

                {/* Channel Input */}
                <XStack alignItems="center" gap="$4" paddingBottom="$4">
                <Label >Platform</Label>
                <YStack>
                    <Input
                        maxW={600}
                        onChangeText={(value) => {setChannel(value); setChannelError(false)}} value={channel}
                        placeholder={channelPlaceholders[medium]}
                    />
                    <Text style={{ color: channelError ? 'red' : theme.color.get(), marginLeft: 10 }}>
                        {channelError ? 'Must have a motivation' : ''}
                    </Text>
                </YStack>
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
                <YStack>
                <Dropdown
                    maxHeight={300}
                    data={motivations}
                    style={{ width: 200, alignContent: 'center' }}
                    placeholder='Select Motivation'
                    value={primaryMotivation}
                    onChange={item => { setPrimaryMotivation(item.value); setMotivationError(false); }}
                    placeholderStyle={{ color: motivationError? "red" : theme.color.get(), fontSize: 16 }}
                    selectedTextProps={{ style: { color: motivationError? "red" : theme.color.get(), fontSize: 16 } }}
                    labelField={'label'}
                    valueField={'value'}
                />
                <Text paddingTop={5} style={{ color: motivationError ? 'red' : 'black', marginLeft: 10 }}>
                        {motivationError ? 'Must have a motivation' : ''}
                </Text>
                    </YStack>
                </XStack>
                

                {/* Description TextArea */}
                <YStack paddingBottom="$4">
                    <XStack alignItems="center" gap="$4" paddingBottom="$2">
                <Label >Description</Label> 
                <Text style={{ color: descriptionError ? 'red' : 'black', marginLeft: 10 }}>
                {descriptionError ? 'Must have a description' : ''}
                </Text>
                </XStack>
                <TextArea
                    size="$4" borderWidth={2}
                    width="100%"
                    paddingBottom="$4"
                    height={250}
                    placeholder={descriptionPlaceholders[primaryMotivation]}
                    value={description}
                    onChangeText={(value) => {setDescription(value); setDescriptionError(false)}}
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
