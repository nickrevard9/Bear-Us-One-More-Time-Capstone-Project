import React, { useCallback, useState } from 'react';
import { ScrollView, Alert, TouchableOpacity } from 'react-native';
import {
  View,
  Input,
  Button,
  YStack,
  XStack,
  Text,
  H6,
  TextArea,
  useTheme,
  Paragraph,
} from 'tamagui';
import { useFocusEffect, useRouter } from 'expo-router';
import { DatePicker } from '@/components/datepicker';
import { TimePicker } from '@/components/timepicker';
import { Dropdown } from 'react-native-element-dropdown';
import { useSQLiteContext } from 'expo-sqlite';
import {
  deleteLogByLogID,
  getLogByLogID,
  insertLog,
  LogData,
  updateLog,
  getCurrentStreak,
  updateStreak,
} from '../lib/db';
import { HelpCircle } from '@tamagui/lucide-icons';
import Tooltip from 'rn-tooltip';

// Define props for the Reporter component, with optional log_id for editing an existing log
interface ReporterProps {
  log_id?: number;
}

// Function to round date to nearest 5 minutes
function roundToNearest5(date: Date): Date {
  const ms = 1000 * 60 * 5; // 5 minutes in milliseconds
  return new Date(Math.round(date.getTime() / ms) * ms);
}

// How the sentence connects the medium to the blank, based on medium
function getMediumConnector(medium: string): string {
  // Watch-type media
  if (
    medium === 'Large Screen / Movie Theater' ||
    medium === 'Television'
  ) {
    return ' to watch ';
  }

  // Listen-type media
  if (
    medium === 'Car Stereo' ||
    medium === 'Radio' ||
    medium === 'Stereo System'
  ) {
    return ' to listen to ';
  }

  // Read-type media
  if (
    medium === 'eReader' ||
    medium === 'Print Newspaper' ||
    medium === 'Other Printed Material'
  ) {
    return ' to read ';
  }

  // Default case: apps, feeds, generic devices
  return ' on ';
}

const ReporterMadlib: React.FC<ReporterProps> = ({ log_id }) => {
  const router = useRouter(); // Expo Router for navigation
  const db = useSQLiteContext(); // SQLite context for database access
  const theme = useTheme();

  // State to track the current log's ID
  const [logId] = useState<number | null>(log_id ?? null);

  // Edit mode is true if editing an existing log
  const [editMode, setEditMode] = useState(false);

  // States for date and time pickers
  const incrementedDate = new Date();
  const startHours = incrementedDate.getHours() - 1;
  incrementedDate.setHours(startHours < 0 ? startHours + 24 : startHours);

  const [start_date, setStartDate] = useState<Date>(roundToNearest5(incrementedDate));
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);

  const [end_date, setEndDate] = useState<Date>(roundToNearest5(new Date()));
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

  // Dropdown options for mediums
  const mediums = [
    { label: 'Car Stereo', value: 'Car Stereo' },
    { label: 'Desktop Computer', value: 'Desktop Computer' },
    { label: 'eReader', value: 'eReader' },
    { label: 'Laptop Computer', value: 'Laptop Computer' },
    { label: 'Large Screen / Movie Theater', value: 'Large Screen / Movie Theater' },
    { label: 'Print Newspaper', value: 'Print Newspaper' },
    { label: 'Personal Computer', value: 'Personal Computer' },
    { label: 'Radio', value: 'Radio' },
    { label: 'Stereo System', value: 'Stereo System' },
    { label: 'Smart Phone', value: 'Smart Phone' },
    { label: 'Tablet', value: 'Tablet' },
    { label: 'Television', value: 'Television' },
    { label: 'Other Handheld Device', value: 'Other Handheld Device' },
    { label: 'Other Printed Material', value: 'Other Printed Material' },
    { label: 'Other', value: 'Other' },
  ];

  // Whether the activity was intentional
  const [isIntentional, setIsIntentional] = useState(false);

  // Dropdown for primary motivation
  const [primaryMotivation, setPrimaryMotivation] = useState('');
  const motivations = [
    { label: 'Ambient', value: 'Ambient' },
    { label: 'Entertainment', value: 'Entertainment' },
    { label: 'Escape', value: 'Escape' },
    { label: 'Information Seeking', value: 'Information Seeking' },
    { label: 'Job', value: 'Job' },
    { label: 'Social', value: 'Social' },
    { label: 'Schoolwork', value: 'Schoolwork' },
    { label: 'Other', value: 'Other' },
  ];

  // Placeholder Texts for Channel based on medium selected
  const channelPlaceholders: { [key: string]: string } = {
    '': 'e.g., Enter platform here',
    'Car Stereo': 'e.g., FM Radio, Spotify',
    'Desktop Computer': 'e.g., YouTube, Netflix',
    eReader: 'e.g., Book or article title',
    'Laptop Computer': 'e.g., Hulu, Amazon Prime',
    'Large Screen / Movie Theater': 'e.g., Movie or show title',
    'Print Newspaper': 'e.g., Newspaper name or article',
    'Personal Computer': 'e.g., Spotify, Audible',
    Radio: 'e.g., NPR, BBC Radio',
    'Stereo System': 'e.g., Playlist or album',
    'Smart Phone': 'e.g., TikTok, Instagram',
    Tablet: 'e.g., Netflix, YouTube',
    Television: 'e.g., Channel or show title',
    'Other Handheld Device': 'e.g., Game title or app',
    'Other Printed Material': 'e.g., Magazine or brochure',
    Other: 'e.g., Enter platform here',
  };

  // Placeholder Texts for Description based on motivation selected
  const descriptionPlaceholders: { [key: string]: string } = {
    '': 'e.g., Describe your activity here',
    Ambient: 'e.g., Background music while working',
    Entertainment: 'e.g., Watching a movie or playing a game',
    Escape: 'e.g., Reading a novel to unwind',
    'Information Seeking': 'e.g., Researching a topic online',
    Job: 'e.g., Attending a virtual meeting',
    Social: 'e.g., Video calling with friends',
    Schoolwork: 'e.g., Studying or attending online classes',
    Other: 'e.g., Describe your activity here',
  };

  // Function checking if start and end dates are valid
  function validateDates(start: Date, end: Date) {
    setDateError(start > end);
  }

  // Function to load an existing log from the database
  async function obtainLog(log_id: number) {
    const log: LogData | null = await getLogByLogID(db, log_id);
    if (!log) {
      throw Error('cannot retrieve log data');
    }
    console.log(`Got the log ${log_id}`);
    setEditMode(true); // Set edit mode since this is an existing log
    setChannel(log.channel);
    setEndDate(new Date(log.end_date));
    setStartDate(new Date(log.start_date));
    setDescription(log.description);
    setIsIntentional(log.intentional === 1 ? true : false);
    setMedium(log.medium);
    setPrimaryMotivation(log.primary_motivation);
  }

  // useFocusEffect runs whenever this screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (logId) {
        // If editing an existing log
        obtainLog(logId).catch((error) => {
          console.error(error);
          Alert.alert('Cannot retrieve log');
        });
      } else {
        // Reset form fields for a new log
        setEditMode(false);
        setChannel('');
        setEndDate(roundToNearest5(new Date()));
        const newStart = new Date();
        const h = newStart.getHours() - 1;
        newStart.setHours(h < 0 ? h + 24 : h);
        setStartDate(roundToNearest5(newStart));
        setDescription('');
        setIsIntentional(false);
        setMedium('');
        setPrimaryMotivation('');
        setDateError(false);
        setMediumError(false);
        setChannelError(false);
        setMotivationError(false);
        setDescriptionError(false);
      }
    }, [logId]),
  );

  // Handle form submission: insert or update log
  const handleSubmit = async () => {
    if (dateError) {
      Alert.alert('Please fix date errors before submitting');
      return;
    }
    if (medium === '') {
      setMediumError(true);
    }
    if (channel === '') {
      setChannelError(true);
    }
    if (primaryMotivation === '') {
      setMotivationError(true);
    }
    if (description === '') {
      setDescriptionError(true);
    }
    if (medium === '' || channel === '' || primaryMotivation === '' || description === '') {
      Alert.alert('Please fill in all required fields before submitting');
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
      end_date: end_date.toISOString(),
      medium,
      channel,
      intentional: isIntentional ? 1 : 0,
      primary_motivation: primaryMotivation,
      report_date: `${year}-${month}-${day}T${hours}:${minutes}:00`,
      description,
    };
    if (logId) {
      log.log_id = logId; // Include log ID if editing
    }

    console.log(log);

    try {
      if (editMode) {
        await updateLog(db, log); // Update existing log
      } else {
        await insertLog(db, log); // Insert new log
      }

      const curr_streak = await getCurrentStreak(db);
      console.log(curr_streak);

      if (!curr_streak) {
        await updateStreak(db); // No streak yet, start one
      } else if (isTodayOrYesterday(curr_streak.last_updated)) {
        await updateStreak(db); // Streak is active, update it
      }

      router.back(); // Navigate back to home
      return;
    } catch (error) {
      console.error(error);
      Alert.alert('Could not save log');
    }
  };

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
    try {
      if (!editMode) {
        throw Error('Cannot delete a new log');
      }
      if (!logId) {
        throw Error('Cannot delete a log with no log_id');
      }
      const deleted = await deleteLogByLogID(db, logId);
      if (deleted) {
        router.back(); // Navigate back if deletion succeeds
        return;
      }
      throw Error('Cannot delete this log');
    } catch (error) {
      console.error(error);
      Alert.alert('Cannot delete log');
    }
  };

  // Start date picker handlers
  const onDismissStartDate = useCallback(() => {
    setShowStartDatePicker(false);
  }, []);

  const onConfirmStartDate = useCallback(
    (params: { date?: Date }) => {
      setShowStartDatePicker(false);
      const picked = params.date ?? start_date;
      const new_date = new Date(
        picked.getFullYear(),
        picked.getMonth(),
        picked.getDate(),
        start_date.getHours(),
        start_date.getMinutes(),
      );
      setStartDate(new_date);
      validateDates(new_date, end_date);
    },
    [start_date, end_date],
  );

  const onDismissStartTime = useCallback(() => {
    setShowStartTimePicker(false);
  }, []);

  const onConfirmStartTime = useCallback(
    (params: { hours: number; minutes: number }) => {
      setShowStartTimePicker(false);
      const new_date = new Date(
        start_date.getFullYear(),
        start_date.getMonth(),
        start_date.getDate(),
        params.hours,
        params.minutes,
      );
      setStartDate(new_date);
      validateDates(new_date, end_date);
    },
    [start_date, end_date],
  );

  // End date picker handlers
  const onDismissEndDate = useCallback(() => {
    setShowEndDatePicker(false);
  }, []);

  const onConfirmEndDate = useCallback(
    (params: { date?: Date }) => {
      setShowEndDatePicker(false);
      const picked = params.date ?? end_date;
      const new_date = new Date(
        picked.getFullYear(),
        picked.getMonth(),
        picked.getDate(),
        end_date.getHours(),
        end_date.getMinutes(),
      );
      setEndDate(new_date);
      validateDates(start_date, new_date);
    },
    [start_date, end_date],
  );

  const onDismissEndTime = useCallback(() => {
    setShowEndTimePicker(false);
  }, []);

  const onConfirmEndTime = useCallback(
    (params: { hours: number; minutes: number }) => {
      setShowEndTimePicker(false);
      const new_date = new Date(
        end_date.getFullYear(),
        end_date.getMonth(),
        end_date.getDate(),
        params.hours,
        params.minutes,
      );
      setEndDate(new_date);
      validateDates(start_date, new_date);
    },
    [start_date, end_date],
  );

  return (
    <View paddingHorizontal={10}>
      {/* Header with back arrow and title */}
      <XStack
        alignItems="center"
        justifyContent="space-between"
        paddingBottom={20}
        paddingTop={10}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 28, fontWeight: 'bold' }}>{'←'}</Text>
        </TouchableOpacity>
        <H6
          style={{
            textAlign: 'center',
            fontWeight: '600',
            position: 'absolute',
            left: 0,
            right: 0,
          }}
        >
          Log
        </H6>
        <Tooltip
          actionType="press"
          height={150}
          width={200}
          withOverlay={false}
          backgroundColor="#7f8f67"
          popover={
            <Paragraph color="#e4e0d5">
              This is where you track your media! Each blank is a part of a sentence.
            </Paragraph>
          }
        >
          <HelpCircle />
        </Tooltip>
      </XStack>

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <YStack gap="$4">
          {/* Sentence 1: time window */}
          <XStack flexWrap="wrap" alignItems="center" gap="$2">
            {/* Chunk 1: On [start date] */}
            <XStack alignItems="center">
              <Text>On </Text>
              <Input
                size="$2"
                value={start_date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
                editable={false}
                onPress={() => setShowStartDatePicker(true)}
                color={dateError ? 'red' : theme.color.get()}
                style={{
                  paddingHorizontal: 8,
                  fontSize: 14,
                }}
              />
            </XStack>

            {/* Chunk 2: at [start time] */}
            <XStack alignItems="center">
              <Text> at </Text>
              <Input
                size="$2"
                value={start_date.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: 'numeric',
                })}
                editable={false}
                onPress={() => setShowStartTimePicker(true)}
                color={dateError ? 'red' : theme.color.get()}
                style={{
                  paddingHorizontal: 8,
                  fontSize: 14,
                }}
              />
            </XStack>

            {/* Chunk 3: until [end date] */}
            <XStack alignItems="center">
              <Text> until </Text>
              <Input
                size="$2"
                value={end_date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
                editable={false}
                onPress={() => setShowEndDatePicker(true)}
                color={dateError ? 'red' : theme.color.get()}
                style={{
                  paddingHorizontal: 8,
                  fontSize: 14,
                }}
              />
            </XStack>

            {/* Chunk 4: at [end time], */}
            <XStack alignItems="center">
              <Text> at </Text>
              <Input
                size="$2"
                value={end_date.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: 'numeric',
                })}
                editable={false}
                onPress={() => setShowEndTimePicker(true)}
                color={dateError ? 'red' : theme.color.get()}
                style={{
                  paddingHorizontal: 8,
                  fontSize: 14,
                }}
              />
              <Text>,</Text>
            </XStack>
          </XStack>

          {/* Date & time pickers */}
          <DatePicker
            isVisible={showStartDatePicker}
            onDismiss={onDismissStartDate}
            onConfirm={onConfirmStartDate}
            date={start_date}
          />
          <TimePicker
            key={`start-${start_date.toISOString()}`}
            isVisible={showStartTimePicker}
            onDismiss={onDismissStartTime}
            onConfirm={onConfirmStartTime}
            hours={start_date.getHours()}
            minutes={start_date.getMinutes()}
          />
          <DatePicker
            isVisible={showEndDatePicker}
            onDismiss={onDismissEndDate}
            onConfirm={onConfirmEndDate}
            date={end_date}
          />
          <TimePicker
            key={`end-${end_date.toISOString()}`}
            isVisible={showEndTimePicker}
            onDismiss={onDismissEndTime}
            onConfirm={onConfirmEndTime}
            hours={end_date.getHours()}
            minutes={end_date.getMinutes()}
          />

          {dateError && <Text color="red">End time must be after start time</Text>}

          {/* Sentence 2: medium + channel + intentional */}
          <XStack flexWrap="wrap" alignItems="center">
            <Text>I used a/an </Text>

            {/* Medium dropdown with fixed width to stop layout shifting */}
            <View style={{ width: 200, marginRight: 6 }}>
              <Dropdown
                data={mediums}
                placeholder="device"
                value={medium}
                onChange={(item: any) => {
                  setMedium(item.value);
                  setMediumError(false);
                }}
                style={{
                  width: '100%',
                  alignContent: 'center',
                }}
                labelField="label"
                valueField="value"
                placeholderStyle={{
                  color: mediumError ? 'red' : theme.color.get(),
                  fontSize: 16,
                }}
                selectedTextProps={{
                  numberOfLines: 1,
                  ellipsizeMode: 'tail',
                  style: {
                    color: mediumError ? 'red' : theme.color.get(),
                    fontSize: 16,
                  },
                }}
              />
            </View>

            {/* Dynamic connector based on medium */}
            <Text>{getMediumConnector(medium)}</Text>

            {/* Channel / content blank */}
            <Input
              unstyled
              maxWidth={220}
              borderBottomWidth={1}
              borderColor={channelError ? 'red' : theme.color.get()}
              paddingHorizontal={4}
              placeholder={channelPlaceholders[medium] ?? channelPlaceholders['']}
              placeholderTextColor="rgba(255,255,255,0.6)"
              color="white"
              value={channel}
              onChangeText={(value) => {
                setChannel(value);
                setChannelError(false);
              }}
            />

            <Text>, and it was </Text>

            {/* Intentional text toggle */}
            <TouchableOpacity onPress={() => setIsIntentional(!isIntentional)}>
              <Text
                style={{
                  textDecorationLine: 'underline',
                  color: theme.color.get(),
                }}
              >
                {isIntentional ? 'on purpose' : 'in the background'}
              </Text>
            </TouchableOpacity>

            <Text>.</Text>
          </XStack>

          {mediumError && <Text color="red">Must have a media type</Text>}
          {channelError && <Text color="red">Must have a platform</Text>}

          {/* Sentence 3: motivation */}
          <XStack flexWrap="wrap" alignItems="center">
            <Text>My primary motivation was </Text>

            <View style={{ width: 200, marginRight: 6 }}>
              <Dropdown
                data={motivations}
                value={primaryMotivation}
                onChange={(item: any) => {
                  setPrimaryMotivation(item.value);
                  setMotivationError(false);
                }}
                style={{
                  width: '100%',
                  alignContent: 'center',
                }}
                placeholder="select one"
                labelField="label"
                valueField="value"
                placeholderStyle={{
                  color: motivationError ? 'red' : theme.color.get(),
                  fontSize: 16,
                }}
                selectedTextProps={{
                  numberOfLines: 1,
                  ellipsizeMode: 'tail',
                  style: {
                    color: motivationError ? 'red' : theme.color.get(),
                    fontSize: 16,
                  },
                }}
              />
            </View>

            <Text>.</Text>
          </XStack>

          {motivationError && <Text color="red">Must have a motivation</Text>}

          {/* Sentence 4 + TextArea: description */}
          <YStack gap="$2">
            <Paragraph fontSize={16}>
              <Text>In more detail, I…</Text>
            </Paragraph>

            <TextArea
              size="$4"
              borderWidth={2}
              width="100%"
              height={200}
              placeholder={
                descriptionPlaceholders[primaryMotivation] ??
                descriptionPlaceholders['']
              }
              placeholderTextColor="rgba(255,255,255,0.6)"
              color="white"
              value={description}
              onChangeText={(value) => {
                setDescription(value);
                setDescriptionError(false);
              }}
            />

            {descriptionError && <Text color="red">Must have a description</Text>}
          </YStack>

          {/* Submit and Delete Buttons */}
          <YStack gap="$2" marginTop="$4">
            <Button onPress={handleSubmit}>{editMode ? 'Save' : 'Submit'}</Button>
            {editMode && (
              <Button onPress={handleDelete} variant="outlined">
                Delete
              </Button>
            )}
          </YStack>
        </YStack>
      </ScrollView>
    </View>
  );
};

export default ReporterMadlib;
