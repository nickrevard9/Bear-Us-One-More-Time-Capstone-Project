import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const ReportPage = () => {
    const [date, setDate] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [time, setTime] = useState<Date>(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);

    const [hours, setHours] = useState('');
    const [minutes, setMinutes] = useState('');
    const [description, setDescription] = useState('');

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
        <View style={styles.container}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
                <Text>{date.toDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={onChangeDate}
                />
            )}

            <Text style={styles.label}>Time (Hour)</Text>
            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.input}>
                <Text>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
            {showTimePicker && (
                <DateTimePicker
                    value={time}
                    mode="time"
                    display="default"
                    onChange={onChangeTime}
                />
            )}

            <Text style={styles.label}>Time Spent</Text>
            <View style={styles.timeSpentRow}>
                <TextInput
                    style={[styles.input, styles.timeInput]}
                    placeholder="Hours"
                    keyboardType="numeric"
                    value={hours}
                    onChangeText={setHours}
                />
                <Text style={styles.timeSeparator}>:</Text>
                <TextInput
                    style={[styles.input, styles.timeInput]}
                    placeholder="Minutes"
                    keyboardType="numeric"
                    value={minutes}
                    onChangeText={setMinutes}
                />
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput
                style={[styles.input, styles.descriptionInput]}
                placeholder="Enter description"
                multiline
                value={description}
                onChangeText={setDescription}
            />

            <Button title="Submit" onPress={handleSubmit} />
        </View>
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
});

export default ReportPage;