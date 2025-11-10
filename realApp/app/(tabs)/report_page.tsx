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
import { deleteLogByLogID, getLogByLogID, insertLog, LogData, updateLog } from "../../lib/db";
import Reporter from "../Reporter"

const ReportPage = () => {


    return (
        <Reporter/>
    );
};


export default ReportPage;