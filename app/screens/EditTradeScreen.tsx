import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
    Alert,
    ActivityIndicator,
    BackHandler,
} from 'react-native';
import ThemedText from '../components/ThemedText';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomDropdown from '../components/CustomDropdown';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import type { Trade, TradeType, TradeStatus, TradeResult } from '../lib/trades';
import TradeService from '../lib/trades';
import DateTimePicker from '@react-native-community/datetimepicker';
import RealTimeService from '../lib/realtime';
import { format } from 'date-fns';

const DEFAULT_STRATEGIES = [
    'Trend Following',
    'Breakout',
    'Mean Reversion',
    'Scalping',
    'Swing Trading',
];

const DEFAULT_INDICATORS = [
    'Moving Average',
    'RSI',
    'MACD',
    'Bollinger Bands',
    'Volume',
    'Support/Resistance',
];

export default function EditTradeScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [trade, setTrade] = useState<Trade | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [strategies, setStrategies] = useState<string[]>(DEFAULT_STRATEGIES);
    const [indicators, setIndicators] = useState<string[]>(DEFAULT_INDICATORS);
    const [showMistakes, setShowMistakes] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
    const [showTags, setShowTags] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showTime, setShowTime] = useState(true);

    useEffect(() => {
        loadTrade();
        loadStrategies();
        loadIndicators();
        setupRealTimeUpdates();

        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (hasUnsavedChanges) {
                Alert.alert(
                    'Discard Changes?',
                    'You have unsaved changes. Are you sure you want to leave this screen?',
                    [
                        {
                            text: "Don't Leave",
                            style: 'cancel',
                            onPress: () => { }
                        },
                        {
                            text: 'Discard',
                            style: 'destructive',
                            onPress: () => router.back()
                        }
                    ]
                );
                return true;
            }
            return false;
        });

        return () => {
            if (id) {
                RealTimeService.unsubscribe(`trade_${id}`);
            }
            backHandler.remove();
            setTrade(null);
            setHasUnsavedChanges(false);
        };
    }, [hasUnsavedChanges]);

    useEffect(() => {
        setTrade(null);
        setHasUnsavedChanges(false);
        loadTrade();
    }, [id]);

    const setupRealTimeUpdates = () => {
        if (!id) return;

        RealTimeService.subscribeSingleTrade(
            id as string,
            (updatedTrade) => {
                setTrade(updatedTrade);
            },
            (error) => {
                console.error('Real-time update error:', error);
                Alert.alert('Error', 'Failed to receive trade updates');
            }
        );
    };

    const loadTrade = async () => {
        try {
            if (!id) {
                Alert.alert('Error', 'Trade ID not found');
                return;
            }

            const tradeData = await TradeService.getTrade(id as string);
            setTrade(tradeData);
        } catch (error) {
            console.error('Error loading trade:', error);
            Alert.alert('Error', 'Failed to load trade');
        } finally {
            setLoading(false);
        }
    };

    const loadStrategies = async () => {
        try {
            const savedStrategies = await AsyncStorage.getItem('tradingStrategies');
            if (savedStrategies) {
                setStrategies(JSON.parse(savedStrategies));
            }
        } catch (error) {
            console.error('Error loading strategies:', error);
        }
    };

    const loadIndicators = async () => {
        try {
            const savedIndicators = await AsyncStorage.getItem('tradingIndicators');
            if (savedIndicators) {
                setIndicators(JSON.parse(savedIndicators));
            }
        } catch (error) {
            console.error('Error loading indicators:', error);
        }
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (!trade || !selectedDate) return;

        if (pickerMode === 'date') {
            const newDate = new Date(selectedDate);
            if (showTime) {
                newDate.setHours(trade.createdAt.getHours());
                newDate.setMinutes(trade.createdAt.getMinutes());
                setTrade({ ...trade, createdAt: newDate });
                setHasUnsavedChanges(true);
                if (Platform.OS === 'ios') {
                    setPickerMode('time');
                    setShowTimePicker(true);
                }
            } else {
                newDate.setHours(0, 0, 0, 0);
                setTrade({ ...trade, createdAt: newDate });
                setHasUnsavedChanges(true);
            }
        } else {
            const newDate = new Date(trade.createdAt);
            newDate.setHours(selectedDate.getHours());
            newDate.setMinutes(selectedDate.getMinutes());
            setTrade({ ...trade, createdAt: newDate });
            setHasUnsavedChanges(true);
        }

        if (Platform.OS === 'android') {
            setShowDatePicker(false);
            setShowTimePicker(false);
        }
    };

    const formatDateTime = () => {
        if (!trade) return '';
        return trade.createdAt.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const updateTrade = (updates: Partial<Trade>) => {
        setTrade(prev => {
            if (!prev) return prev;
            setHasUnsavedChanges(true);
            return { ...prev, ...updates };
        });
    };

    const handleSave = async () => {
        if (!trade || !id) return;

        Alert.alert(
            'Save Changes',
            'Are you sure you want to save the changes made to this trade?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Save',
                    onPress: async () => {
                        try {
                            setSaving(true);
                            await TradeService.updateTrade(id as string, trade);
                            setHasUnsavedChanges(false);
                            Alert.alert(
                                'Success',
                                'Trade updated successfully',
                                [{ text: 'OK', onPress: () => router.back() }]
                            );
                        } catch (error: any) {
                            console.error('Error updating trade:', error);
                            Alert.alert('Error', error.message || 'Failed to update trade');
                        } finally {
                            setSaving(false);
                        }
                    }
                }
            ]
        );
    };

    const handleCloseTrade = async () => {
        if (!trade || !id) return;

        Alert.alert(
            'Close Trade',
            'Are you sure you want to close this trade?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Close',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setSaving(true);
                            const now = new Date();
                            await TradeService.updateTrade(id as string, {
                                ...trade,
                                status: 'CLOSED',
                                closedAt: now,
                                updatedAt: now,
                            });
                            Alert.alert('Success', 'Trade closed successfully');
                            router.back();
                        } catch (error: any) {
                            console.error('Error closing trade:', error);
                            Alert.alert('Error', error.message || 'Failed to close trade');
                        } finally {
                            setSaving(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
            </SafeAreaView>
        );
    }

    if (!trade) {
        return (
            <SafeAreaView style={styles.container}>
                <ThemedText style={styles.errorText}>Trade not found</ThemedText>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView style={styles.scrollView}>
                    <View style={styles.formContainer}>
                        {/* Trade Details Section */}
                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>Trade Details</ThemedText>
                            <View style={styles.fieldContainer}>
                                <View style={styles.labelContainer}>
                                    <ThemedText style={styles.label}>
                                        Trading Pair <ThemedText style={styles.required}>*</ThemedText>
                                    </ThemedText>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    value={trade.pair}
                                    onChangeText={(text) => setTrade({ ...trade, pair: text })}
                                    placeholder="Enter trading pair (e.g., BTC/USD)"
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <View style={styles.fieldContainer}>
                                <ThemedText style={styles.label}>Trade Type</ThemedText>
                                <View style={styles.tradeTypeContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.tradeTypeButton,
                                            trade.type === 'BUY' ? styles.selectedBuyType : styles.buyButton
                                        ]}
                                        onPress={() => updateTrade({ type: 'BUY' })}
                                    >
                                        <ThemedText style={[
                                            styles.tradeTypeText,
                                            trade.type === 'BUY' && styles.selectedTradeTypeText
                                        ]}>
                                            BUY
                                        </ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.tradeTypeButton,
                                            trade.type === 'SELL' ? styles.selectedSellType : styles.sellButton
                                        ]}
                                        onPress={() => updateTrade({ type: 'SELL' })}
                                    >
                                        <ThemedText style={[
                                            styles.tradeTypeText,
                                            trade.type === 'SELL' && styles.selectedTradeTypeText
                                        ]}>
                                            SELL
                                        </ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Date Field */}
                            <View style={styles.fieldContainer}>
                                <View style={styles.labelContainer}>
                                    <ThemedText style={styles.label}>Date & Time</ThemedText>
                                    <TouchableOpacity
                                        style={[styles.timeToggle, showTime && styles.timeToggleActive]}
                                        onPress={() => setShowTime(!showTime)}
                                    >
                                        <Ionicons
                                            name={showTime ? "time" : "time-outline"}
                                            size={16}
                                            color={showTime ? "#fff" : "#666"}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => {
                                        setPickerMode('date');
                                        setShowDatePicker(true);
                                    }}
                                >
                                    <ThemedText>
                                        {format(trade.createdAt, showTime ? 'MMM d, yyyy h:mm a' : 'MMM d, yyyy')}
                                    </ThemedText>
                                    <Ionicons name="calendar" size={20} color="#666" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Price Section */}
                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>Price Information</ThemedText>
                            <View style={styles.fieldContainer}>
                                <View style={styles.labelContainer}>
                                    <ThemedText style={styles.label}>
                                        Entry Price <ThemedText style={styles.required}>*</ThemedText>
                                    </ThemedText>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    value={trade.entryPrice.toString()}
                                    onChangeText={(text) => {
                                        const value = text ? Number(text) : 0;
                                        setTrade({ ...trade, entryPrice: value });
                                    }}
                                    keyboardType="numeric"
                                    placeholder="Enter your entry price"
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <View style={styles.fieldContainer}>
                                <View style={styles.labelContainer}>
                                    <ThemedText style={styles.label}>
                                        Exit Price <ThemedText style={styles.optional}>(Optional)</ThemedText>
                                    </ThemedText>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    value={trade.exitPrice !== undefined ? trade.exitPrice.toString() : ''}
                                    onChangeText={(text) => {
                                        const value = text ? Number(text) : undefined;
                                        setTrade({ ...trade, exitPrice: value });
                                    }}
                                    keyboardType="numeric"
                                    placeholder="Enter your exit price (if trade is closed)"
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <View style={styles.fieldContainer}>
                                <View style={styles.labelContainer}>
                                    <ThemedText style={styles.label}>
                                        Quantity <ThemedText style={styles.required}>*</ThemedText>
                                    </ThemedText>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    value={trade.quantity.toString()}
                                    onChangeText={(text) => {
                                        const value = text ? Number(text) : 0;
                                        setTrade({ ...trade, quantity: value });
                                    }}
                                    keyboardType="numeric"
                                    placeholder="Enter trade quantity"
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>

                        {/* Strategy Section */}
                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>Strategy & Analysis</ThemedText>
                            <View style={styles.fieldContainer}>
                                <View style={styles.labelContainer}>
                                    <ThemedText style={styles.label}>
                                        Strategy <ThemedText style={styles.required}>*</ThemedText>
                                    </ThemedText>
                                </View>
                                <CustomDropdown
                                    items={strategies}
                                    selectedItems={trade.strategy}
                                    onSelect={(items) => setTrade({ ...trade, strategy: items })}
                                    placeholder="Select your trading strategies"
                                />
                            </View>

                            <View style={styles.fieldContainer}>
                                <View style={styles.labelContainer}>
                                    <ThemedText style={styles.label}>
                                        Indicators <ThemedText style={styles.optional}>(Optional)</ThemedText>
                                    </ThemedText>
                                </View>
                                <CustomDropdown
                                    items={indicators}
                                    selectedItems={trade.indicators || []}
                                    onSelect={(items) => setTrade({ ...trade, indicators: items })}
                                    placeholder="Select technical indicators used"
                                />
                            </View>

                            <View style={styles.fieldContainer}>
                                <ThemedText style={styles.label}>Reason for Trade</ThemedText>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={trade.reason}
                                    onChangeText={(text) => setTrade({ ...trade, reason: text })}
                                    placeholder="Why did you take this trade?"
                                    placeholderTextColor="#666"
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>
                        </View>

                        {/* Notes & Mistakes Section */}
                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>Additional Information</ThemedText>
                            <View style={styles.fieldContainer}>
                                <View style={styles.labelContainer}>
                                    <ThemedText style={styles.label}>
                                        Notes <ThemedText style={styles.optional}>(Optional)</ThemedText>
                                    </ThemedText>
                                </View>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={trade.notes}
                                    onChangeText={(text) => setTrade({ ...trade, notes: text })}
                                    placeholder="Add any additional notes about your trade"
                                    placeholderTextColor="#999"
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>

                            <View style={styles.fieldContainer}>
                                <TouchableOpacity
                                    style={styles.mistakesHeader}
                                    onPress={() => setShowTags(!showTags)}
                                >
                                    <View style={styles.labelContainer}>
                                        <ThemedText style={styles.label}>
                                            Tags <ThemedText style={styles.optional}>(Optional)</ThemedText>
                                        </ThemedText>
                                    </View>
                                    <Ionicons
                                        name={showTags ? 'chevron-up' : 'chevron-down'}
                                        size={24}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                                {showTags && (
                                    <CustomDropdown
                                        items={trade.tags || []}
                                        selectedItems={trade.tags || []}
                                        onSelect={(items) => setTrade({ ...trade, tags: items })}
                                        onAdd={handleAddTag}
                                        onRemove={handleRemoveTag}
                                        placeholder="Add or select tags for your trade"
                                    />
                                )}
                            </View>

                            <View style={styles.fieldContainer}>
                                <TouchableOpacity
                                    style={styles.mistakesHeader}
                                    onPress={() => setShowMistakes(!showMistakes)}
                                >
                                    <View style={styles.labelContainer}>
                                        <ThemedText style={styles.label}>
                                            Mistakes <ThemedText style={styles.optional}>(Optional)</ThemedText>
                                        </ThemedText>
                                    </View>
                                    <Ionicons
                                        name={showMistakes ? 'chevron-up' : 'chevron-down'}
                                        size={24}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                                {showMistakes && (
                                    <CustomDropdown
                                        items={[
                                            'FOMO',
                                            'Ignored Stop Loss',
                                            'Position Size Too Large',
                                            'No Clear Strategy',
                                            'Emotional Trading',
                                            'Poor Risk Management',
                                            'Ignored Market Conditions',
                                            'Chasing Entry',
                                            'Moving Stop Loss',
                                            'Averaging Down',
                                        ]}
                                        selectedItems={trade.mistakes || []}
                                        onSelect={(items) => setTrade({ ...trade, mistakes: items })}
                                        placeholder="Add or select mistakes made during trade"
                                    />
                                )}
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.saveButton, saving && styles.disabledButton]}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                <ThemedText style={styles.buttonText}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </ThemedText>
                            </TouchableOpacity>

                            {trade.status === 'OPEN' && (
                                <TouchableOpacity
                                    style={[styles.closeButton, saving && styles.disabledButton]}
                                    onPress={handleCloseTrade}
                                    disabled={saving}
                                >
                                    <ThemedText style={styles.buttonText}>Close Trade</ThemedText>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Date/Time Picker */}
            {(showDatePicker || showTimePicker) && (
                <DateTimePicker
                    value={trade.createdAt}
                    mode={pickerMode}
                    is24Hour={false}
                    onChange={handleDateChange}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    formContainer: {
        padding: 16,
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#1a1a1a',
    },
    fieldContainer: {
        marginBottom: 16,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    optionalText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    tradeTypeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    tradeTypeButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
    },
    selectedBuyType: {
        backgroundColor: '#4caf50',
        borderColor: '#4caf50',
    },
    selectedSellType: {
        backgroundColor: '#f44336',
        borderColor: '#f44336',
    },
    buyButton: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderColor: '#4caf50',
    },
    sellButton: {
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderColor: '#f44336',
    },
    tradeTypeText: {
        fontWeight: '600',
        color: '#666',
    },
    selectedTradeTypeText: {
        color: '#fff',
    },
    timeToggle: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ddd',
        marginLeft: 8,
    },
    timeToggleActive: {
        backgroundColor: '#2196F3',
        borderColor: '#2196F3',
    },
    dateButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#f9f9f9',
        minHeight: 48,
    },
    mistakesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    buttonContainer: {
        gap: 16,
        marginTop: 8,
    },
    saveButton: {
        backgroundColor: '#2196F3',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    closeButton: {
        backgroundColor: '#f44336',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        textAlign: 'center',
        marginTop: 24,
        fontSize: 16,
        color: '#666',
    },
    required: {
        color: '#f44336',
        fontSize: 14,
    },
    optional: {
        color: '#999',
        fontSize: 12,
        marginLeft: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
}); 