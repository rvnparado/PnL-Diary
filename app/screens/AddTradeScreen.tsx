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
} from 'react-native';
import ThemedText from '../components/ThemedText';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomDropdown from '../components/CustomDropdown';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import type { Trade, NewTrade, TradeType, TradeStatus, TradeResult } from '../lib/trades';
import TradeService from '../lib/trades';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';

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

const DEFAULT_TAGS = [
    'crypto',
    'forex',
    'stocks'
];

interface FormData {
    pair: string;
    type: TradeType;
    status: TradeStatus;
    entryPrice: number;
    exitPrice?: number;
    quantity: number;
    strategy: string[];
    indicators?: string[];
    notes: string;
    mistakes?: string[];
    reason: string;
    date: Date;
    includeTime: boolean;
    result: TradeResult;
    profitLoss: number;
    profitLossPercentage: number;
    tags?: string[];
}

const initialFormState: FormData = {
    pair: '',
    type: 'BUY' as TradeType,
    status: 'PENDING' as TradeStatus,
    entryPrice: 0,
    exitPrice: undefined,
    quantity: 0,
    strategy: [],
    indicators: [],
    notes: '',
    mistakes: [],
    reason: '',
    date: new Date(),
    includeTime: false,
    result: 'UNKNOWN' as TradeResult,
    profitLoss: 0,
    profitLossPercentage: 0,
    tags: [],
};

export default function AddTradeScreen() {
    const router = useRouter();
    const [formData, setFormData] = useState<FormData>(initialFormState);
    const [strategies, setStrategies] = useState<string[]>(DEFAULT_STRATEGIES);
    const [indicators, setIndicators] = useState<string[]>(DEFAULT_INDICATORS);
    const [showMistakes, setShowMistakes] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
    const [tags, setTags] = useState<string[]>(DEFAULT_TAGS);
    const [showTags, setShowTags] = useState(false);
    const [entryPriceText, setEntryPriceText] = useState('');
    const [exitPriceText, setExitPriceText] = useState('');
    const [quantityText, setQuantityText] = useState('');

    useEffect(() => {
        loadStrategies();
        loadIndicators();
        loadTags();
    }, []);

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

    const loadTags = async () => {
        try {
            const savedTags = await AsyncStorage.getItem('tradingTags');
            if (savedTags) {
                setTags(JSON.parse(savedTags));
            }
        } catch (error) {
            console.error('Error loading tags:', error);
        }
    };

    const saveStrategies = async (newStrategies: string[]) => {
        try {
            await AsyncStorage.setItem('tradingStrategies', JSON.stringify(newStrategies));
        } catch (error) {
            console.error('Error saving strategies:', error);
        }
    };

    const saveIndicators = async (newIndicators: string[]) => {
        try {
            await AsyncStorage.setItem('tradingIndicators', JSON.stringify(newIndicators));
        } catch (error) {
            console.error('Error saving indicators:', error);
        }
    };

    const saveTags = async (newTags: string[]) => {
        try {
            await AsyncStorage.setItem('tradingTags', JSON.stringify(newTags));
        } catch (error) {
            console.error('Error saving tags:', error);
        }
    };

    const handleAddStrategy = (newStrategy: string) => {
        const newStrategies = [...strategies, newStrategy];
        setStrategies(newStrategies);
        saveStrategies(newStrategies);
    };

    const handleRemoveStrategy = (strategyToRemove: string) => {
        const newStrategies = strategies.filter(strategy => strategy !== strategyToRemove);
        setStrategies(newStrategies);
        saveStrategies(newStrategies);
        setFormData({
            ...formData,
            strategy: formData.strategy.filter(s => s !== strategyToRemove)
        });
    };

    const handleAddIndicator = (newIndicator: string) => {
        const newIndicators = [...indicators, newIndicator];
        setIndicators(newIndicators);
        saveIndicators(newIndicators);
    };

    const handleRemoveIndicator = (indicatorToRemove: string) => {
        const newIndicators = indicators.filter(indicator => indicator !== indicatorToRemove);
        setIndicators(newIndicators);
        saveIndicators(newIndicators);
        setFormData({
            ...formData,
            indicators: formData.indicators?.filter(i => i !== indicatorToRemove)
        });
    };

    const handleAddTag = (newTag: string) => {
        const newTags = [...tags, newTag];
        setTags(newTags);
        saveTags(newTags);
    };

    const handleRemoveTag = (tagToRemove: string) => {
        const newTags = tags.filter(tag => tag !== tagToRemove);
        setTags(newTags);
        saveTags(newTags);
        setFormData({
            ...formData,
            tags: formData.tags?.filter(t => t !== tagToRemove)
        });
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (selectedDate) {
            if (pickerMode === 'date') {
                const newDate = new Date(selectedDate);
                if (formData.includeTime) {
                    newDate.setHours(formData.date.getHours());
                    newDate.setMinutes(formData.date.getMinutes());
                } else {
                    newDate.setHours(0, 0, 0, 0);
                }
                setFormData({ ...formData, date: newDate });
                if (formData.includeTime) {
                    setShowTimePicker(true);
                }
            } else {
                const newDate = new Date(formData.date);
                newDate.setHours(selectedDate.getHours());
                newDate.setMinutes(selectedDate.getMinutes());
                setFormData({ ...formData, date: newDate });
            }
        }
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
            setShowTimePicker(false);
        }
    };

    const formatDateTime = () => {
        return formData.date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: formData.includeTime ? '2-digit' : undefined,
            minute: formData.includeTime ? '2-digit' : undefined,
        });
    };

    const validateForm = () => {
        if (!formData.pair) {
            Alert.alert('Error', 'Please enter the trading pair');
            return false;
        }
        if (!formData.pair.match(/^[A-Z0-9/]+$/)) {
            Alert.alert('Error', 'Trading pair must be in capital letters (e.g., BTC/USDT)');
            return false;
        }
        if (!formData.entryPrice || isNaN(Number(formData.entryPrice))) {
            Alert.alert('Error', 'Please enter a valid entry price');
            return false;
        }
        if (formData.exitPrice && isNaN(Number(formData.exitPrice))) {
            Alert.alert('Error', 'Please enter a valid exit price');
            return false;
        }
        if (!formData.quantity || isNaN(Number(formData.quantity))) {
            Alert.alert('Error', 'Please enter a valid quantity');
            return false;
        }
        if (formData.strategy.length === 0) {
            Alert.alert('Error', 'Please select at least one strategy');
            return false;
        }
        if (!formData.reason.trim()) {
            Alert.alert('Error', 'Please enter a reason for the trade');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            const userId = auth.currentUser?.uid;
            if (!userId) {
                Alert.alert('Error', 'You must be logged in to add a trade');
                return;
            }

            const status: TradeStatus = formData.exitPrice ? 'CLOSED' : 'OPEN';
            const now = new Date();

            const newTrade: Partial<Trade> = {
                userId,
                pair: formData.pair.toUpperCase(),
                type: formData.type,
                status,
                entryPrice: Number(formData.entryPrice),
                exitPrice: formData.exitPrice ? Number(formData.exitPrice) : 0,
                quantity: Number(formData.quantity),
                strategy: formData.strategy,
                indicators: formData.indicators,
                notes: formData.notes,
                mistakes: formData.mistakes,
                reason: formData.reason,
                createdAt: formData.date,
                updatedAt: now,
                closedAt: status === 'CLOSED' ? now : undefined,
                tags: formData.tags,
            };

            await TradeService.createTrade(newTrade);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Trade added successfully');
            setFormData(initialFormState);
            router.back();
        } catch (error: any) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            console.error('Error adding trade:', error);
            Alert.alert('Error', error.message || 'Failed to add trade');
        } finally {
            setLoading(false);
        }
    };

    const handleTypeChange = async (type: TradeType) => {
        await Haptics.selectionAsync();
        setFormData({ ...formData, type });
    };

    return (
        <SafeAreaView style={styles.mainContainer} edges={['top', 'right', 'left']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView style={styles.scrollView}>
                    <View style={styles.formContainer}>
                        {/* Trade Pair Section */}
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
                                    value={formData.pair}
                                    onChangeText={(text) => setFormData({ ...formData, pair: text.toUpperCase() })}
                                    placeholder="Enter trading pair (BTC/USDT)"
                                    placeholderTextColor="#999"
                                    autoCapitalize="characters"
                                />
                            </View>

                            {/* Trade Type */}
                            <View style={styles.fieldContainer}>
                                <ThemedText style={styles.label}>Trade Type</ThemedText>
                                <View style={styles.tradeTypeContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.tradeTypeButton,
                                            formData.type === 'BUY' ? styles.selectedBuyType : styles.buyButton
                                        ]}
                                        onPress={() => handleTypeChange('BUY')}
                                        accessible={true}
                                        accessibilityLabel="Buy trade type"
                                        accessibilityHint="Double tap to select buy trade type"
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: formData.type === 'BUY' }}
                                    >
                                        <ThemedText style={[
                                            styles.tradeTypeText,
                                            formData.type === 'BUY' && styles.selectedTradeTypeText
                                        ]}>
                                            BUY
                                        </ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.tradeTypeButton,
                                            formData.type === 'SELL' ? styles.selectedSellType : styles.sellButton
                                        ]}
                                        onPress={() => handleTypeChange('SELL')}
                                        accessible={true}
                                        accessibilityLabel="Sell trade type"
                                        accessibilityHint="Double tap to select sell trade type"
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: formData.type === 'SELL' }}
                                    >
                                        <ThemedText style={[
                                            styles.tradeTypeText,
                                            formData.type === 'SELL' && styles.selectedTradeTypeText
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
                                        style={[styles.timeToggle, formData.includeTime && styles.timeToggleActive]}
                                        onPress={() => setFormData({ ...formData, includeTime: !formData.includeTime })}
                                        accessible={true}
                                        accessibilityLabel="Include time in trade"
                                        accessibilityHint="Double tap to toggle time inclusion"
                                        accessibilityRole="switch"
                                        accessibilityState={{ checked: formData.includeTime }}
                                    >
                                        <Ionicons
                                            name={formData.includeTime ? "time" : "time-outline"}
                                            size={16}
                                            color={formData.includeTime ? "#fff" : "#666"}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => {
                                        setPickerMode('date');
                                        setShowDatePicker(true);
                                    }}
                                    accessible={true}
                                    accessibilityLabel="Select trade date"
                                    accessibilityHint="Double tap to open date picker"
                                    accessibilityRole="button"
                                >
                                    <ThemedText>{formatDateTime()}</ThemedText>
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
                                    value={entryPriceText}
                                    onChangeText={(text) => {
                                        setEntryPriceText(text);
                                        const value = text ? Number(text) : 0;
                                        if (!isNaN(value)) {
                                            setFormData({ ...formData, entryPrice: value });
                                        }
                                    }}
                                    keyboardType="decimal-pad"
                                    placeholder="Enter entry price"
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
                                    value={exitPriceText}
                                    onChangeText={(text) => {
                                        setExitPriceText(text);
                                        const value = text ? Number(text) : 0;
                                        if (!text || !isNaN(value)) {
                                            setFormData({ ...formData, exitPrice: text ? value : undefined });
                                        }
                                    }}
                                    keyboardType="decimal-pad"
                                    placeholder="Enter exit price for closed trades"
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
                                    value={quantityText}
                                    onChangeText={(text) => {
                                        setQuantityText(text);
                                        const value = text ? Number(text) : 0;
                                        if (!isNaN(value)) {
                                            setFormData({ ...formData, quantity: value });
                                        }
                                    }}
                                    keyboardType="decimal-pad"
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
                                    selectedItems={formData.strategy}
                                    onSelect={(items) => setFormData({ ...formData, strategy: items })}
                                    placeholder="Select trading strategies"
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
                                    selectedItems={formData.indicators || []}
                                    onSelect={(items) => setFormData({ ...formData, indicators: items })}
                                    placeholder="Select technical indicators"
                                />
                            </View>

                            <View style={styles.fieldContainer}>
                                <ThemedText style={styles.label}>Reason for Trade</ThemedText>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={formData.reason}
                                    onChangeText={(text) => setFormData({ ...formData, reason: text })}
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
                                    value={formData.notes}
                                    onChangeText={(text) => setFormData({ ...formData, notes: text })}
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
                                        items={tags}
                                        selectedItems={formData.tags || []}
                                        onSelect={(items) => setFormData({ ...formData, tags: items })}
                                        onAdd={handleAddTag}
                                        onRemove={handleRemoveTag}
                                        placeholder="Add tags for your trade"
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
                                        selectedItems={formData.mistakes || []}
                                        onSelect={(items) => setFormData({ ...formData, mistakes: items })}
                                        placeholder="Add mistakes made during trade"
                                    />
                                )}
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.disabledButton]}
                            onPress={handleSubmit}
                            disabled={loading}
                            accessible={true}
                            accessibilityLabel={loading ? "Adding trade" : "Add trade"}
                            accessibilityHint="Double tap to submit the trade"
                            accessibilityRole="button"
                            accessibilityState={{ disabled: loading }}
                        >
                            <ThemedText style={styles.submitButtonText}>
                                {loading ? 'Adding Trade...' : 'Add Trade'}
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Date/Time Picker */}
            {(showDatePicker || showTimePicker) && (
                <DateTimePicker
                    value={formData.date}
                    mode={pickerMode}
                    is24Hour={false}
                    onChange={handleDateChange}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    formContainer: {
        padding: 16,
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
    buyButton: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderColor: '#4caf50',
    },
    sellButton: {
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderColor: '#f44336',
    },
    selectedBuyType: {
        backgroundColor: '#4caf50',
        borderColor: '#4caf50',
    },
    selectedSellType: {
        backgroundColor: '#f44336',
        borderColor: '#f44336',
    },
    tradeTypeText: {
        fontWeight: '600',
        color: '#666',
    },
    selectedTradeTypeText: {
        color: '#fff',
    },
    dateTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 48,
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
    mistakesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    submitButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    disabledButton: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
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
    required: {
        color: '#f44336',
        fontSize: 14,
    },
    optional: {
        color: '#999',
        fontSize: 12,
        marginLeft: 4,
    },
    dropdownPlaceholder: {
        color: '#999',
        fontSize: 14,
    },
}); 