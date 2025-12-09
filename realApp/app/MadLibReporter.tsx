import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  Alert,
  TouchableOpacity,
  View as RNView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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
  duplicateLog,
  getLogByLogID,
  insertLog,
  LogData,
  updateLog,
  getCurrentStreak,
  getNonWorkMediaHoursForDate,
  updateStreak,
  calculateAchievements,
} from '../lib/db';
import type { Achievement } from '../lib/db';
import { CongratsModal } from '@/components/congratsmodal';
import { HelpCircle } from '@tamagui/lucide-icons';
import Tooltip from 'rn-tooltip';

// Define props for the Reporter component, with optional log_id for editing an existing log
interface ReporterProps {
  log_id?: number;
}

/**
 * roundToNearest5
 *
 * Rounds a Date object to the nearest 5 minutes.
 * Used to make start/end times snap to regular intervals.
 *
 * @param date - Date with time to be rounded
 * @returns Date rounded to nearest 5-minute mark
 */
function roundToNearest5(date: Date): Date {
  const ms = 1000 * 60 * 5; // 5 minutes in milliseconds
  return new Date(Math.round(date.getTime() / ms) * ms);
}

/**
 * getMediumConnector
 *
 * Returns a connector phrase to join the medium and channel
 * in the Mad Lib sentence (e.g. "to watch", "to listen to", "on").
 *
 * @param medium - current medium string
 * @returns connector phrase used in the sentence
 */
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

/**
 * ReporterMadlib
 *
 * Mad Lib–style logging component.
 * Builds a log entry via a sentence-style form and stores it in SQLite.
 */
const ReporterMadlib: React.FC<ReporterProps> = ({ log_id }) => {
  const router = useRouter(); // Expo Router for navigation
  const db = useSQLiteContext(); // SQLite context for database access
  const theme = useTheme(); // Tamagui theme for colors

  // State to track the current log's ID (if editing)
  const [logId] = useState<number | null>(log_id ?? null);

  // Edit mode is true if editing an existing log
  const [editMode, setEditMode] = useState(false);

  // --------- Date / Time initial state setup ---------
  // Default start date is one hour before now, rounded to nearest 5 mins
  const incrementedDate = new Date();
  const startHours = incrementedDate.getHours() - 1;
  incrementedDate.setHours(startHours < 0 ? startHours + 24 : startHours);

  const [start_date, setStartDate] = useState<Date>(roundToNearest5(incrementedDate));
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);

  // Default end date is now, rounded to nearest 5 mins
  const [end_date, setEndDate] = useState<Date>(roundToNearest5(new Date()));
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // --------- Other form fields ---------
  const [description, setDescription] = useState('');
  const [channel, setChannel] = useState('');
  const [medium, setMedium] = useState('');

  // Validation error flags
  const [dateError, setDateError] = useState(false);
  const [mediumError, setMediumError] = useState(false);
  const [channelError, setChannelError] = useState(false);
  const [motivationError, setMotivationError] = useState(false);
  const [descriptionError, setDescriptionError] = useState(false);

  // Congrats Modal state for Achievements and Streaks
  const [showPopup, setShowPopup] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [streakChanged, setStreakChanged] = useState(false);
  const [new_achievements, setAchievements] = useState<Achievement[]>([]);
  const [haveAchievements, setHaveAchievements] = useState(false);

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

  // Whether the activity was intentional (true) or in the background (false)
  const [isIntentional, setIsIntentional] = useState(false);

  // Whether the medium has been selected
  const isMediumSelected = !!medium;

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

  // Placeholder texts for Channel based on medium selected
  const channelPlaceholders: { [key: string]: string } = {
    '': 'e.g., Enter platform here',
    'Car Stereo': 'e.g., FM Radio, Spotify',
    'Desktop Computer': 'e.g., YouTube, Netflix',
    'eReader': 'e.g., Book or article title',
    'Laptop Computer': 'e.g., Hulu, Amazon Prime',
    'Large Screen / Movie Theater': 'e.g., Movie or show title',
    'Print Newspaper': 'e.g., Newspaper name or article',
    'Personal Computer': 'e.g., Spotify, Audible',
    'Radio': 'e.g., NPR, BBC Radio',
    'Stereo System': 'e.g., Playlist or album',
    'Smart Phone': 'e.g., TikTok, Instagram',
    'Tablet': 'e.g., Netflix, YouTube',
    'Television': 'e.g., Channel or show title',
    'Other Handheld Device': 'e.g., Game title or app',
    'Other Printed Material': 'e.g., Magazine or brochure',
    'Other': 'e.g., Enter platform here',
  };

  // Placeholder texts for Description based on motivation selected
  const descriptionPlaceholders: { [key: string]: string } = {
    '': 'e.g., Describe your activity here',
    'Ambient': 'e.g., Background music while working',
    'Entertainment': 'e.g., Watching a movie or playing a game',
    'Escape': 'e.g., Reading a novel to unwind',
    'Information Seeking': 'e.g., Researching a topic online',
    'Job': 'e.g., Attending a virtual meeting',
    'Social': 'e.g., Video calling with friends',
    'Schoolwork': 'e.g., Studying or attending online classes',
    'Other': 'e.g., Describe your activity here',
  };

  /**
   * validateDates
   *
   * Sets dateError based on whether start is after end.
   * @param start - start date
   * @param end - end date
   */
  function validateDates(start: Date, end: Date) {
    setDateError(start > end);
  }

  /**
   * obtainLog
   *
   * Loads log data from the database by ID and populates form fields.
   * Sets editMode to true when an existing log is loaded.
   *
   * @param id - log_id of the log being edited
   */
  async function obtainLog(id: number) {
    const log: LogData | null = await getLogByLogID(db, id);
    if (!log) {
      throw Error('cannot retrieve log data');
    }
    setEditMode(true); // Set edit mode since this is an existing log
    setChannel(log.channel);
    setEndDate(new Date(log.end_date));
    setStartDate(new Date(log.start_date));
    setDescription(log.description);
    setIsIntentional(log.intentional === 1 ? true : false);
    setMedium(log.medium);
    setPrimaryMotivation(log.primary_motivation);
  }

  /**
   * checkIntervention
   *
   * Intervention check: calculates non-work media hours
   * for the last 3 days and alerts if each day exceeds 5 hours.
   */
  const checkIntervention = async () => {
    const now = new Date();

    // build 'YYYY-MM-DD' for a date
    const mkYmd = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
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
    const hoursArr: number[] = [];
    for (const ymd of days) {
      const h = await getNonWorkMediaHoursForDate(db, ymd);
      hoursArr.push(h);
    }

    // require strictly more than 5 hours on all 3 days
    const triggered = hoursArr.every((h) => h > 5);

    if (triggered) {
      Alert.alert(
        'Heads up',
        'You have been consuming a lot of media recently. Try limiting screentime in favor of time spent outside or with friends.'
      );
    }
  };

  /**
   * getStreak
   *
   * Checks and updates the user's current streak.
   * If no streak or last updated is today/yesterday, it updates via updateStreak.
   *
   * @returns boolean indicating whether streak changed
   */
  async function getStreak(): Promise<boolean> {
    // Let updateStreak decide what actually happened
    const result = await updateStreak(db); 
    // result looks like: { ok: boolean, action?: string, num_days?: number }

    if (!result || !result.ok) {
      // query failed or no log for today – don’t show popup
      setStreakChanged(false);
      return false;
    }

    // Keep the current streak count in state
    if (typeof result.num_days === 'number') {
      setCurrentStreak(result.num_days);
    }

    // Only treat as a "change" if action is not "noop"
    const changed =
      result.action === 'insert' ||
      result.action === 'update' ||
      result.action === 'reset-insert';

    setStreakChanged(changed);
    return changed;
  }



  /**
   * getAchievements
   *
   * Calculates and sets any new achievements earned by the user.
   * New achievements are stored in state.
   *
   * @returns boolean indicating whether new achievements were gained
   */
  async function getAchievements(): Promise<boolean> {
    const achievements = await calculateAchievements(db);
    if (achievements && achievements.length > 0) {
      setAchievements(achievements);
      setHaveAchievements(true);
      return true;
    }
    setHaveAchievements(false);
    return false;
  }

  /**
   * nextPage
   *
   * After a user submits a log, check for streak and achievements.
   * If either triggers, show the CongratsModal; otherwise, navigate back.
   */
  async function nextPage() {
    const a = await getStreak();
    const b = await getAchievements();
    if (a || b) {
      setShowPopup(true);
    } else {
      router.back();
    }
  }

  /**
   * isTodayOrYesterday
   *
   * Checks if a given date string corresponds to today or yesterday.
   * Used to see if streak should be updated.
   *
   * @param dateStr - date string of last streak update (from DB)
   * @returns true if date is today or yesterday, false otherwise
   */
  function isTodayOrYesterday(dateStr: string): boolean {
    const inputDate = new Date(dateStr);
    const now = new Date();

    // Normalize all dates to midnight for comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const input = new Date(
      inputDate.getFullYear(),
      inputDate.getMonth(),
      inputDate.getDate(),
    );

    return (
      input.getTime() === today.getTime() ||
      input.getTime() === yesterday.getTime()
    );
  }

  /**
   * useFocusEffect
   *
   * Runs whenever this screen gains focus.
   * If editing, loads existing log data; otherwise, resets form for a new log.
   */
  useFocusEffect(
    useCallback(() => {
      setHaveAchievements(false);
      setStreakChanged(false);
      setShowPopup(false);

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

  /**
   * handleSubmit
   *
   * Handles form submission: validates fields, builds a LogData object,
   * and either inserts or updates the log in the database.
   * Then runs intervention check and moves to next page (streaks/achievements).
   */
  const handleSubmit = async () => {
    // Check for date errors
    if (dateError) {
      Alert.alert('Please fix date errors before submitting');
      return;
    }

    // Required field validation
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
    if (
      medium === '' ||
      channel === '' ||
      primaryMotivation === '' ||
      description === ''
    ) {
      Alert.alert('Please fill in all required fields before submitting');
      return;
    }

    // Build report_date in YYYY-MM-DDThh:mm:00 format
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

    // Include log_id if editing
    if (logId) {
      log.log_id = logId;
    }

    try {
      if (editMode) {
        // Update existing log
        await updateLog(db, log);
      } else {
        // Insert new log
        await insertLog(db, log);
      }

      await checkIntervention();
      await nextPage();
    } catch (error) {
      console.error(error);
      Alert.alert('Could not save log');
    }
  };

  /**
   * handleDelete
   *
   * Handles deleting an existing log.
   * Only allowed in edit mode with a valid logId.
   */
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

  /**
   * handleDuplicate
   *
   * Duplicates the current log entry in the database
   * and then runs streak/achievement flow.
   */
  const handleDuplicate = async () => {
    try {
      if (!logId) {
        Alert.alert('Cannot duplicate this log');
        return;
      }
      await duplicateLog(db, logId);
      await nextPage();
    } catch (error) {
      console.error(error);
      Alert.alert('Could not duplicate log');
    }
  };

  // --------- START DATE + TIME PICKERS ---------

  /**
   * onDismissStartDate
   *
   * Handles dismissing the start date picker.
   */
  const onDismissStartDate = useCallback(() => {
    setShowStartDatePicker(false);
  }, []);

  /**
   * onConfirmStartDate
   *
   * Handles confirming a new start date (keeps the same time portion).
   */
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

  /**
   * onDismissStartTime
   *
   * Handles dismissing the start time picker.
   */
  const onDismissStartTime = useCallback(() => {
    setShowStartTimePicker(false);
  }, []);

  /**
   * onConfirmStartTime
   *
   * Handles confirming a new start time (keeps the same date).
   */
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

  // --------- END DATE + TIME PICKERS ---------

  /**
   * onDismissEndDate
   *
   * Handles dismissing the end date picker.
   */
  const onDismissEndDate = useCallback(() => {
    setShowEndDatePicker(false);
  }, []);

  /**
   * onConfirmEndDate
   *
   * Handles confirming a new end date (keeps the same time portion).
   */
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

  /**
   * onDismissEndTime
   *
   * Handles dismissing the end time picker.
   */
  const onDismissEndTime = useCallback(() => {
    setShowEndTimePicker(false);
  }, []);

  /**
   * onConfirmEndTime
   *
   * Handles confirming a new end time (keeps the same date).
   */
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

  // --------- RENDER ---------

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1 }} paddingHorizontal={10}>
        {/* Header with back arrow, title, and help tooltip */}
        <XStack
          alignItems="center"
          justifyContent="space-between"
          paddingBottom={20}
          paddingTop={10}
        >
          {/* Back navigation */}
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ fontSize: 28, fontWeight: 'bold' }}>{'←'}</Text>
          </TouchableOpacity>

          {/* Centered title */}
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

          {/* Tooltip explaining the Mad Lib style */}
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

        {/* Modal shown when streak/achievements change */}
        <CongratsModal
          achievements={new_achievements}
          streak_increased={streakChanged}
          streak={currentStreak}
          isVisible={showPopup}
          onConfirm={() => {
            setShowPopup(false);
            router.back();
          }}
        />

        {/* Main scrollable content */}
        <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
          <YStack gap="$4">
            {/* Sentence 1: time window (start/end dates and times) */}
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

            {/* Date & time pickers (hidden until toggled) */}
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

            {/* Date validation error message */}
            {dateError && <Text color="red">End time must be after start time</Text>}

            {/* Sentence 2: medium + channel + intentional */}
            <XStack flexWrap="wrap" alignItems="center">
              <Text>I used a/an </Text>

              {/* Medium dropdown with fixed width to stop layout shifting */}
              <RNView style={{ width: 200, marginRight: 6 }}>
                <Dropdown
                  data={mediums}
                  placeholder="medium"
                  value={medium || null} // important: null instead of '' when empty
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
                    color: '#777',
                    fontSize: 16,
                  }}
                  selectedTextProps={{
                    numberOfLines: 1,
                    ellipsizeMode: 'tail',
                    style: {
                      color: !isMediumSelected
                        ? '#777' // grey when nothing chosen
                        : mediumError
                        ? 'red' // red on error
                        : theme.color.get(), // normal sentence color when chosen
                      fontSize: 16,
                    },
                  }}
                />
              </RNView>

              {/* Dynamic connector based on medium (to watch / to listen to / on / etc.) */}
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

              {/* Intentional text toggle ("on purpose" vs "in the background") */}
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

            {/* Validation messages for medium / channel */}
            {mediumError && <Text color="red">Must have a media type</Text>}
            {channelError && <Text color="red">Must have a platform</Text>}

            {/* Sentence 3: motivation dropdown */}
            <XStack flexWrap="wrap" alignItems="center">
              <Text>My primary motivation was </Text>

              <RNView style={{ width: 200, marginRight: 6 }}>
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
              </RNView>

              <Text>.</Text>
            </XStack>

            {/* Motivation validation message */}
            {motivationError && <Text color="red">Must have a motivation</Text>}

            {/* Sentence 4 + TextArea: detailed description */}
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

              {/* Description validation */}
              {descriptionError && <Text color="red">Must have a description</Text>}
            </YStack>

            {/* Submit and Delete / Duplicate Buttons */}
            <YStack gap="$2" marginTop="$4">
              <Button onPress={handleSubmit}>{editMode ? 'Save' : 'Submit'}</Button>
              {editMode && (
                <RNView>
                  <Button onPress={handleDelete} variant="outlined">
                    Delete
                  </Button>
                  <Button onPress={handleDuplicate}>
                    Duplicate
                  </Button>
                </RNView>
              )}
            </YStack>
          </YStack>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ReporterMadlib;
