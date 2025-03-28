import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ThemedText from '../components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { Trade, TradeType, TradeStatus } from '../lib/trades';
import TradeService from '../lib/trades';
import { format } from 'date-fns';
import RealTimeService from '../lib/realtime';

export default function TradeDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [trade, setTrade] = useState<Trade | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTrade();
        setupRealTimeUpdates();

        return () => {
            if (id) {
                RealTimeService.unsubscribe(`trade_${id}`);
            }
        };
    }, [id]);

    const setupRealTimeUpdates = () => {
        if (!id) {
            console.error('No trade ID provided');
            return;
        }

        try {
            RealTimeService.subscribeSingleTrade(
                id as string,
                (updatedTrade) => {
                    if (!updatedTrade) {
                        console.error('Received null trade data');
                        return;
                    }
                    setTrade(updatedTrade);
                },
                (error) => {
                    console.error('Real-time update error:', error);
                    Alert.alert(
                        'Update Error',
                        'Failed to receive trade updates. Please refresh the screen.',
                        [
                            {
                                text: 'Refresh',
                                onPress: loadTrade
                            },
                            {
                                text: 'Cancel',
                                style: 'cancel'
                            }
                        ]
                    );
                }
            );
        } catch (error) {
            console.error('Error setting up real-time updates:', error);
        }
    };

    const loadTrade = async () => {
        try {
            setLoading(true);
            if (!id) {
                throw new Error('Trade ID not found');
            }

            const tradeData = await TradeService.getTrade(id as string);
            if (!tradeData) {
                throw new Error('Trade not found');
            }

            setTrade(tradeData);
        } catch (error: any) {
            console.error('Error loading trade:', error);
            Alert.alert(
                'Error',
                error.message || 'Failed to load trade details',
                [
                    {
                        text: 'Retry',
                        onPress: loadTrade
                    },
                    {
                        text: 'Go Back',
                        onPress: () => router.back()
                    }
                ]
            );
        } finally {
            setLoading(false);
        }
    };

    const handleEditPress = () => {
        if (!trade) {
            Alert.alert('Error', 'Trade not found');
            return;
        }

        Alert.alert(
            'Edit Trade',
            'Are you sure you want to edit this trade?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Edit',
                    onPress: () => router.push({
                        pathname: '/(tabs)/edit-trade',
                        params: { id: trade.id }
                    }),
                },
            ],
        );
    };

    const handleDeletePress = () => {
        if (!trade) {
            Alert.alert('Error', 'Trade not found');
            return;
        }

        Alert.alert(
            'Delete Trade',
            'Are you sure you want to delete this trade? This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await TradeService.deleteTrade(trade.id);
                            Alert.alert(
                                'Success',
                                'Trade deleted successfully',
                                [{ text: 'OK', onPress: () => router.back() }]
                            );
                        } catch (error) {
                            console.error('Error deleting trade:', error);
                            Alert.alert('Error', 'Failed to delete trade');
                        }
                    },
                },
            ],
        );
    };

    const getStatusColor = (status: TradeStatus) => {
        return '#1a1a1a';
    };

    const getDirectionColor = (type: TradeType) => {
        return type === 'BUY' ? '#4caf50' : '#f44336';
    };

    const calculatePnL = (trade: Trade) => {
        if (!trade.exitPrice || trade.status !== 'CLOSED') return 0;
        const multiplier = trade.type === 'BUY' ? 1 : -1;
        return (trade.exitPrice - trade.entryPrice) * trade.quantity * multiplier;
    };

    const calculatePercentage = (trade: Trade) => {
        if (!trade.exitPrice || trade.status !== 'CLOSED') return 0;
        const pnl = calculatePnL(trade);
        const investment = trade.entryPrice * trade.quantity;
        return (pnl / investment) * 100;
    };

    const formatCurrency = (value: number) => {
        if (isNaN(value)) return '$0.00';
        const absValue = Math.abs(value);
        if (Number.isInteger(absValue)) {
            return value < 0 ? `-$${absValue}` : `$${absValue}`;
        }
        return value < 0 ? `-$${absValue.toFixed(2)}` : `$${absValue.toFixed(2)}`;
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
            <ScrollView style={styles.scrollView}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <ThemedText style={styles.tradePair}>{trade.pair}</ThemedText>
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                style={styles.headerButton}
                                onPress={handleEditPress}
                            >
                                <Ionicons name="pencil" size={24} color="#2196F3" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.headerButton}
                                onPress={handleDeletePress}
                            >
                                <Ionicons name="trash-outline" size={24} color="#f44336" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.tradeLabels}>
                        <View style={[
                            styles.badge,
                            { backgroundColor: trade.type === 'BUY' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)' }
                        ]}>
                            <ThemedText style={[
                                styles.badgeText,
                                { color: getDirectionColor(trade.type) }
                            ]}>
                                {trade.type}
                            </ThemedText>
                        </View>
                        <View style={[
                            styles.badge,
                            { backgroundColor: '#f5f5f5' }
                        ]}>
                            <ThemedText style={[
                                styles.badgeText,
                                { color: getStatusColor(trade.status) }
                            ]}>
                                {trade.status}
                            </ThemedText>
                        </View>
                    </View>
                </View>

                {/* Trade Details Section */}
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Trade Details</ThemedText>
                    <View style={styles.detailRow}>
                        <ThemedText style={styles.detailLabel}>Entry Price</ThemedText>
                        <ThemedText style={styles.detailValue}>{formatCurrency(trade.entryPrice)}</ThemedText>
                    </View>
                    {trade.exitPrice > 0 && (
                        <View style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>Exit Price</ThemedText>
                            <ThemedText style={styles.detailValue}>{formatCurrency(trade.exitPrice)}</ThemedText>
                        </View>
                    )}
                    <View style={styles.detailRow}>
                        <ThemedText style={styles.detailLabel}>Quantity</ThemedText>
                        <ThemedText style={styles.detailValue}>{trade.quantity}</ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                        <ThemedText style={styles.detailLabel}>Date</ThemedText>
                        <ThemedText style={styles.detailValue}>
                            {format(trade.createdAt, 'MMM d, yyyy h:mm a')}
                        </ThemedText>
                    </View>
                    {trade.status === 'CLOSED' && (
                        <>
                            <View style={styles.detailRow}>
                                <ThemedText style={styles.detailLabel}>Closed Date</ThemedText>
                                <ThemedText style={styles.detailValue}>
                                    {format(trade.closedAt!, 'MMM d, yyyy h:mm a')}
                                </ThemedText>
                            </View>
                            <View style={styles.detailRow}>
                                <ThemedText style={styles.detailLabel}>Profit/Loss</ThemedText>
                                <ThemedText style={[
                                    styles.detailValue,
                                    { color: calculatePnL(trade) >= 0 ? '#4caf50' : '#f44336' }
                                ]}>
                                    {formatCurrency(calculatePnL(trade))}
                                    {' '}
                                    <ThemedText style={styles.percentageText}>
                                        ({calculatePercentage(trade) >= 0 ? '+' : ''}{calculatePercentage(trade).toFixed(2)}%)
                                    </ThemedText>
                                </ThemedText>
                            </View>
                        </>
                    )}
                </View>

                {/* Strategy Section */}
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Strategy & Analysis</ThemedText>
                    <View style={styles.detailRow}>
                        <ThemedText style={styles.detailLabel}>Strategies</ThemedText>
                        <View style={styles.tagContainer}>
                            {trade.strategy.map((strategy, index) => (
                                <View key={index} style={styles.tag}>
                                    <ThemedText style={styles.tagText}>{strategy}</ThemedText>
                                </View>
                            ))}
                        </View>
                    </View>
                    {trade.indicators && trade.indicators.length > 0 && (
                        <View style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>Indicators</ThemedText>
                            <View style={styles.tagContainer}>
                                {trade.indicators.map((indicator, index) => (
                                    <View key={index} style={styles.tag}>
                                        <ThemedText style={styles.tagText}>{indicator}</ThemedText>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                    <View style={styles.detailRow}>
                        <ThemedText style={styles.detailLabel}>Reason</ThemedText>
                        <ThemedText style={styles.detailText}>{trade.reason}</ThemedText>
                    </View>
                </View>

                {/* Additional Information */}
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Additional Information</ThemedText>
                    {trade.tags && trade.tags.length > 0 && (
                        <View style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>Tags</ThemedText>
                            <View style={styles.tagContainer}>
                                {trade.tags.map((tag, index) => (
                                    <View key={index} style={styles.tag}>
                                        <ThemedText style={styles.tagText}>{tag}</ThemedText>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                    {trade.notes && (
                        <View style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>Notes</ThemedText>
                            <ThemedText style={styles.detailValue}>{trade.notes}</ThemedText>
                        </View>
                    )}
                    {trade.mistakes && trade.mistakes.length > 0 && (
                        <View style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>Mistakes</ThemedText>
                            <View style={styles.mistakesList}>
                                {trade.mistakes.map((mistake, index) => (
                                    <ThemedText key={index} style={styles.mistakeItem}>• {mistake}</ThemedText>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
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
    header: {
        backgroundColor: 'white',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    headerButton: {
        padding: 8,
    },
    tradePair: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    tradeLabels: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    typeLabel: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    typeLabelText: {
        fontSize: 14,
        fontWeight: '600',
    },
    statusLabel: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusLabelText: {
        fontSize: 14,
        fontWeight: '600',
    },
    section: {
        backgroundColor: 'white',
        margin: 16,
        padding: 16,
        borderRadius: 12,
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
    detailRow: {
        marginBottom: 16,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '500',
    },
    detailText: {
        fontSize: 16,
        lineHeight: 24,
    },
    percentageText: {
        fontSize: 14,
        color: '#666',
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    tag: {
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#2196F3',
    },
    tagText: {
        fontSize: 12,
        color: '#2196F3',
        fontWeight: '500',
    },
    mistakesList: {
        marginTop: 4,
    },
    mistakeItem: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    errorText: {
        textAlign: 'center',
        marginTop: 24,
        fontSize: 16,
        color: '#666',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginRight: 8,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    editButton: {
        padding: 8,
    },
}); 