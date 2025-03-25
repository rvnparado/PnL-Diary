import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Platform, Text, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Calendar, DateData, MarkedDates } from 'react-native-calendars';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import CustomMetricsDashboard from '../components/CustomMetricsDashboard';
import AITradeAnalysis from '../components/AITradeAnalysis';
import { MaterialIcons } from '@expo/vector-icons';
import { format, isAfter, startOfToday } from 'date-fns';

const Tab = createMaterialTopTabNavigator();

const theme = {
    backgroundColor: '#ffffff',
    calendarBackground: '#ffffff',
    textSectionTitleColor: '#333',
    selectedDayBackgroundColor: '#2196F3',
    selectedDayTextColor: '#ffffff',
    todayTextColor: '#2196F3',
    dayTextColor: '#333',
    textDisabledColor: '#d9e1e8',
    dotColor: '#2196F3',
    selectedDotColor: '#ffffff',
    arrowColor: '#2196F3',
    monthTextColor: '#333',
    textDayFontSize: 16,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 14,
    textDayFontWeight: '400',
    textMonthFontWeight: '600',
    textDayHeaderFontWeight: '500'
};

const disabledTheme = {
    ...theme,
    calendarBackground: '#f8f9fa',
    textSectionTitleColor: '#adb5bd',
    dayTextColor: '#adb5bd',
    arrowColor: '#adb5bd',
    monthTextColor: '#adb5bd',
    textDisabledColor: '#dee2e6',
    selectedDayBackgroundColor: '#e9ecef',
    selectedDayTextColor: '#adb5bd',
    todayTextColor: '#adb5bd',
    dotColor: '#adb5bd'
};

export default function AnalyticsScreen() {
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [isAllTime, setIsAllTime] = useState(true);

    const today = startOfToday();
    const maxDate = format(today, 'yyyy-MM-dd');

    const handleDayPress = (day: DateData) => {
        if (isAllTime) return;
        const selectedDate = new Date(day.timestamp);
        if (isAfter(selectedDate, today)) return;

        if (!startDate || (startDate && endDate)) {
            setStartDate(selectedDate);
            setEndDate(null);
        } else {
            if (isAfter(selectedDate, startDate)) {
                setEndDate(selectedDate);
            } else {
                setEndDate(startDate);
                setStartDate(selectedDate);
            }
        }
    };

    const toggleAllTime = () => {
        setIsAllTime(!isAllTime);
        if (!isAllTime) {
            setStartDate(null);
            setEndDate(null);
        }
    };

    const formatDateDisplay = () => {
        if (isAllTime || !startDate) return 'All Time';
        if (!endDate) return format(startDate, 'M/d/yy');
        return `${format(startDate, 'M/d/yy')} - ${format(endDate, 'M/d/yy')}`;
    };

    const getMarkedDates = (): MarkedDates => {
        if (!startDate) return {};

        const markedDates: MarkedDates = {
            [format(startDate, 'yyyy-MM-dd')]: {
                startingDay: true,
                color: '#2196F3',
                textColor: 'white'
            }
        };

        if (endDate) {
            markedDates[format(endDate, 'yyyy-MM-dd')] = {
                endingDay: true,
                color: '#2196F3',
                textColor: 'white'
            };

            let currentDate = new Date(startDate);
            while (currentDate < endDate) {
                currentDate.setDate(currentDate.getDate() + 1);
                if (currentDate < endDate) {
                    markedDates[format(currentDate, 'yyyy-MM-dd')] = {
                        color: '#2196F3',
                        textColor: 'white'
                    };
                }
            }
        }

        return markedDates;
    };

    return (
        <SafeAreaView style={styles.container}>
            <Tab.Navigator>
                <Tab.Screen name="Overview">
                    {() => (
                        <AnalyticsDashboard
                            startDate={startDate}
                            endDate={endDate}
                            onDatePickerPress={() => setShowCalendar(true)}
                        />
                    )}
                </Tab.Screen>
                <Tab.Screen name="Custom" component={CustomMetricsDashboard} />
                <Tab.Screen name="AI Analysis" component={AITradeAnalysis} />
            </Tab.Navigator>

            <Modal
                visible={showCalendar}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCalendar(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.calendarContainer}>
                        <View style={styles.calendarHeader}>
                            <View style={styles.allTimeToggle}>
                                <Switch
                                    value={isAllTime}
                                    onValueChange={toggleAllTime}
                                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                                    thumbColor={isAllTime ? '#2196F3' : '#f4f3f4'}
                                />
                                <Text style={styles.allTimeText}>All Time</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setShowCalendar(false)}
                            >
                                <MaterialIcons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.dateFieldsContainer}>
                            <View style={styles.dateField}>
                                <Text style={styles.dateFieldLabel}>Start Date</Text>
                                <Text style={[styles.dateFieldValue, isAllTime && styles.disabledText]}>
                                    {startDate ? format(startDate, 'M/d/yy') : '--/--/--'}
                                </Text>
                            </View>
                            <View style={styles.dateFieldSeparator} />
                            <View style={styles.dateField}>
                                <Text style={styles.dateFieldLabel}>End Date</Text>
                                <Text style={[styles.dateFieldValue, isAllTime && styles.disabledText]}>
                                    {endDate ? format(endDate, 'M/d/yy') : '--/--/--'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.calendarWrapper}>
                            <Calendar
                                onDayPress={handleDayPress}
                                markedDates={getMarkedDates()}
                                markingType="period"
                                theme={isAllTime ? disabledTheme : theme}
                                maxDate={maxDate}
                                enableSwipeMonths={!isAllTime}
                                disableArrowLeft={isAllTime}
                                disableArrowRight={isAllTime}
                                disableAllTouchEventsForDisabledDays={true}
                            />
                            {isAllTime && <View style={styles.calendarOverlay} />}
                        </View>

                        <TouchableOpacity
                            style={styles.applyButton}
                            onPress={() => setShowCalendar(false)}
                        >
                            <Text style={styles.applyButtonText}>Apply</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    calendarContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        width: '90%',
        maxWidth: 400,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    allTimeToggle: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    allTimeText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#333',
    },
    closeButton: {
        padding: 4,
    },
    dateFieldsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    dateField: {
        flex: 1,
    },
    dateFieldLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    dateFieldValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    dateFieldSeparator: {
        width: 20,
        height: 1,
        backgroundColor: '#ddd',
        marginHorizontal: 8,
        alignSelf: 'center',
        marginTop: 12,
    },
    applyButton: {
        backgroundColor: '#2196F3',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    applyButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        maxWidth: '70%',
    },
    dateButtonText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 6,
    },
    calendarWrapper: {
        position: 'relative',
    },
    calendarOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(248, 249, 250, 0.6)',
        zIndex: 1,
    },
    disabledText: {
        color: '#adb5bd',
    },
}); 