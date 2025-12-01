import React, { useCallback, useState } from 'react';
import {TouchableOpacity, Switch, ScrollView, Alert, StyleSheet} from 'react-native';
import { View, Input, Button, YStack, XStack, Text, H6, Label, TextArea, useTheme, Paragraph } from "tamagui";
import { useFocusEffect, useRouter } from 'expo-router';
import { DatePicker } from '@/components/datepicker';
import {Dropdown} from 'react-native-element-dropdown';
import { useSQLiteContext } from "expo-sqlite";
import { deleteLogByLogID, getLogByLogID, insertLog, LogData, updateLog, getCurrentStreak, 
    insertStreak, updateStreak } from "../lib/db";
import { HelpCircle } from '@tamagui/lucide-icons';
import { TimePicker } from '@/components/timepicker';
import Tooltip from "rn-tooltip";
import { KeyboardAvoidingView, Platform, TextInput } from 'react-native';


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
    const incrementedDate = new Date();
    const hours = incrementedDate.getHours() - 1;
    incrementedDate.setHours(hours< 0? hours + 24 : hours)
    const [start_date, setStartDate] = useState<Date>(roundToNearest5(incrementedDate));
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);

    const [end_date, setEndDate] = useState(roundToNearest5(new Date()));
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

    // Congrats Modal for Achievements and Streaks
    const [showPopup, setShowPopup] = useState(false);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [streakChanged, setStreakChanged] = useState(false);
    const [new_achievements, setAchievements] = useState<Achievement[]>([]);
    const [haveAchievements, setHaveAchievements] = useState(false);

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
        setHaveAchievements(false);
        setStreakChanged(false);
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
        setEndDate(roundToNearest5(new Date()));
        const incrementedDate = new Date();
        const hours = incrementedDate.getHours() - 1;
        incrementedDate.setHours(hours< 0? hours + 24 : hours)
        setStartDate(roundToNearest5(incrementedDate));
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

    const handleDuplicate = async () => {
        if(!log_id){
            Alert.alert("Cannot duplicate this log");
        }
        else{
            await duplicateLog(db, log_id);
            nextPage();
        }
    }

    const checkIntervention = async () => {
      const now = new Date();

      // build 'YYYY-MM-DD' for today
      const mkYmd = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };

      // collect the three most recent calendar days
      const days: string[] = [];
      for (let offset = 0; offset < 3; offset++) {
        const d = new Date(now);
        d.setDate(now.getDate() - offset);
        days.push(mkYmd(d));
      }

      // query db for each day’s non-work media hours
      const hours: number[] = [];
      for (const ymd of days) {
        const h = await getNonWorkMediaHoursForDate(db, ymd);
        hours.push(h);
      }

      // require strictly more than 5 hours on all 3 days
      const triggered = hours.every((h) => h > 5);
    //   const triggered = true; // for testing purposes

      if (triggered) {
        Alert.alert(
          "Heads up",
          "You have been consuming a lot of media recently. Try limiting screentime in favor of time spent outside or with friends."
        );
      }
    };

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
        
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        const log: LogData = {
            start_date: start_date.toISOString(),
            end_date: end_date.toISOString(), // Format as HH:MM:SS
            medium,
            channel,
            intentional: isIntentional? 1 : 0,
            primary_motivation: primaryMotivation,
            report_date: `${year}-${month}-${day}T${hours}:${minutes}:00`,
            description,
        };
        if (logId){
            log.log_id = logId; // Include log ID if editing
        }

        try {   

            if(editMode){
                await updateLog(db, log); // Update existing log
            }   
            else{
                await insertLog(db, log); // Insert new log
            }

            await checkIntervention();
            await nextPage();
            return;
        }
        catch (error){
            console.log(error);
            Alert.alert("Could not save log")
        }
        //add streak update here
        //check if the streak needs to be updated
        
        //if it is within 24 hour window then update accordingly

        //If there was no active streak create a new one

        //checking if the streak was active or not should be done elsewhere
    };

    async function getStreak(): Promise<boolean>{
        const curr_streak = await getCurrentStreak(db);
        if (!curr_streak || isTodayOrYesterday(curr_streak.last_updated)) {
            const streak = await updateStreak(db); // Streak is active, update it
            setCurrentStreak(streak.num_days);
            setStreakChanged(true);
            return true;
        }
        setStreakChanged(false);
        return false;
    }

    async function getAchievements(): Promise<boolean> {
        const achievements = await calculateAchievements(db)
        if(achievements && achievements.length > 0){
            setAchievements(achievements);
            setHaveAchievements(true);
            return true;
        }
        setHaveAchievements(false);
        return false;
    }


    async function nextPage(){
        const a = await getStreak();
        const b = await getAchievements();
        if(a || b){
            setShowPopup(true);
        } else {
            router.back() // Navigate back to home
            return;
        }
    }


    function isTodayOrYesterday(dateStr: string): boolean {
        const inputDate = new Date(dateStr);
        const now = new Date();

        // Normalize all dates to midnight for comparison
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const input = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());

        return input.getTime() === today.getTime() || input.getTime() === yesterday.getTime();
    }

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
    (params: {hours: number, minutes: number}) => {
      setShowStartTimePicker(false);
      const new_date = new Date(start_date.getFullYear(), start_date.getMonth(), start_date.getDate(), params.hours, params.minutes);
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
    (params: {hours: number, minutes: number}) => {
      setShowEndTimePicker(false);
      const new_date = new Date(end_date.getFullYear(), end_date.getMonth(), end_date.getDate(), params.hours, params.minutes);
      setEndDate(new_date);
      validateDates(start_date, new_date);},
    [setShowEndTimePicker, setEndDate, end_date]
  );

    return (
            <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={{ flex: 1 }}
    >

        <View style={{ flex: 1 }} paddingHorizontal={10}>
            {/* Header with back arrow and title */}
            <XStack alignItems="center" justifyContent="space-between" paddingBottom={20} paddingTop={10}>
                <H6 style={{ textAlign: 'center', fontWeight: "600", position: 'absolute', left: 0, right: 0 }}>
                    Log
                </H6>
                <Tooltip
                actionType='press'
                height={150}
                width={200}
                withOverlay={false}
                backgroundColor= "#7f8f67"
                    popover={<Paragraph color="#e4e0d5">This is where you track your media! Click on the labels if you're confused on what to type.</Paragraph>}
                >
                    <HelpCircle />
                </Tooltip>
            </XStack>

            <CongratsModal 
                achievements={new_achievements} 
                streak_increased={streakChanged} 
                streak={currentStreak} 
                isVisible={showPopup} 
                onConfirm={() => {router.back(); setShowPopup(false)}}
            />


            <ScrollView paddingBottom="$4">
            <YStack justifyContent="left">
                {/* Time Picker */}
                <XStack alignItems="center" gap="$4" paddingBottom="$4">
                    <Tooltip 
                    backgroundColor= "#7f8f67"
                    withOverlay={false}
                    actionType='press'
                    width={300}
                    popover={<Text color="#e4e0d5">When you began watching/listening/reading</Text>}>
                        <Text style={{ fontWeight: "bold", fontSize: 16}}>Started</Text>
                    </Tooltip>
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
                    <DatePicker
                        isVisible={showStartDatePicker}
                        onDismiss={onDismissStartDate}
                        onConfirm={onConfirmStartDate}
                        date={start_date}
                    />        
                    <TimePicker 
                    key={start_date.toISOString()}
                    isVisible={showStartTimePicker} 
                    onDismiss={onDismissStartTime} 
                    hours={start_date.getHours()}
                    minutes={start_date.getMinutes()}
                    onConfirm= {(d) => onConfirmStartTime(d)
                    }/>    
                </XStack>

                {/* Duration Picker */}
                <XStack alignItems="center" gap="$4" paddingBottom="$4">
                    <Tooltip 
                    backgroundColor= "#7f8f67"
                    withOverlay={false}
                    actionType='press'
                    width={300}
                    popover={<Text color="#e4e0d5">When you stopped</Text>}>
                        <Text style={{ fontWeight: "bold", fontSize: 16}}>Ended</Text>
                    </Tooltip>
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
                    <DatePicker
                        isVisible={showEndDatePicker}
                        onDismiss={onDismissEndDate}
                        onConfirm={onConfirmEndDate}
                        date={end_date}
                    />            
                    <TimePicker
                        key={end_date.toISOString()}
                        isVisible={showEndTimePicker}
                        onDismiss={onDismissEndTime}
                        onConfirm={onConfirmEndTime}
                        hours={end_date.getHours()}
                        minutes={end_date.getMinutes()}
                    />    
                </XStack>

                {/* Medium Dropdown */}
                <XStack alignItems="center" gap="$4" paddingBottom="$4">
                <Tooltip 
                    backgroundColor= "#7f8f67"
                    withOverlay={false}
                    actionType='press'
                    width={300}
                    popover={<Text color="#e4e0d5">The device used</Text>}>
                    <Text style={{ fontWeight: "bold", fontSize: 16}}>Media Type</Text>
                </Tooltip>
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
                <Tooltip 
                    backgroundColor= "#7f8f67"
                    withOverlay={false}
                    actionType='press'
                    width={300}
                    popover={<Text color="#e4e0d5">What app or channel was used</Text>}>
                    <Text style={{ fontWeight: "bold", fontSize: 16}}>Platform</Text>
                </Tooltip>
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
                <Tooltip 
                    backgroundColor= "#7f8f67"
                    withOverlay={false}
                    actionType='press'
                    width={300}
                    popover={<Text color="#e4e0d5">On purpose or not (e.g. radio in the grocery store)</Text>}>
                    <Text style={{ fontWeight: "bold", fontSize: 16}} >Intentional?</Text>
                </Tooltip>
                <Text> No </Text>
                <Switch onValueChange={setIsIntentional} value={isIntentional}>
                </Switch>
                <Text> Yes </Text>
                </XStack>

                {/* Primary Motivation Dropdown */}
                <XStack alignItems="center" gap="$4" paddingBottom="$4">
                    <Tooltip 
                    backgroundColor= "#7f8f67"
                    withOverlay={false}
                    actionType='press'
                    width={300}
                    popover={<Text color="#e4e0d5">Why did you consume it?</Text>}>
                        <Text style={{ fontWeight: "bold", fontSize: 16}}>Primary Motivation</Text>
                    </Tooltip>
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
                <YStack   paddingBottom="$4"
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 200 }}>
                    <XStack alignItems="center" gap="$4" paddingBottom="$2">
                        <Tooltip 
                            backgroundColor= "#7f8f67"
                            withOverlay={false}
                            actionType='press'
                            width={300}
                            popover={<Text color="#e4e0d5">More detail about what you did</Text>}>
                                <Text style={{ fontWeight: "bold", fontSize: 16}}>Description</Text> 
                        </Tooltip>
                        <Text style={{ color: descriptionError ? 'red' : 'black', marginLeft: 10 }}>
                        {descriptionError ? 'Must have a description' : ''}
                        </Text>
                    </XStack>
                    <TextArea
                       size="$4"
                        borderWidth={2}
                        width="100%"
                        height={250}
                        placeholder={descriptionPlaceholders[primaryMotivation]}
                        value={description}
                        onChangeText={(value) => {
                            setDescription(value)
                            setDescriptionError(false)
                        }}
                        padding="$4"

                    />
                </YStack>

                {/* Submit and Delete Buttons */}
                <YStack gap={"$2"}>
                    <Button onPress={handleSubmit}>
                        {editMode? "Save" : "Submit"}
                    </Button>
                    {editMode && <View><Button onPress={handleDelete} variant='outlined'>
                        Delete
                    </Button>
                    <Button onPress={handleDuplicate}>
                        Duplicate
                    </Button>
                    </View>}
                </YStack>

                <XStack minHeight={100} maxHeight={200}>
                    {/* Empty space for padding or future content */}
                </XStack>
            </YStack>
            </ScrollView>
        </View>
        </KeyboardAvoidingView>

    );
};

export default Reporter;
