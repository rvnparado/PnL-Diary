import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebase';
import type { Trade, TradeStatus } from '../lib/trades';
import TradeService from '../lib/trades';
import RealTimeService from '../lib/realtime';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function TradeHistoryScreen() {
    const router = useRouter();
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadTrades();
        setupRealTimeUpdates();

        return () => {
            // Cleanup subscriptions
            const userId = auth.currentUser?.uid;
            if (userId) {
                RealTimeService.unsubscribe(`trades_${userId}`);
            }
        };
    }, []);

    const setupRealTimeUpdates = () => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        RealTimeService.subscribeUserTrades(
            userId,
            (updatedTrades) => {
                setTrades(updatedTrades.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
            },
            (error) => {
                console.error('Real-time update error:', error);
                Alert.alert('Error', 'Failed to receive trade updates');
            }
        );
    };

    const loadTrades = async () => {
        try {
            setLoading(true);
            const userId = auth.currentUser?.uid;
            if (!userId) {
                console.error('No user logged in');
                return;
            }

            const userTrades = await TradeService.getUserTrades(userId);
            const sortedTrades = userTrades.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setTrades(sortedTrades);
        } catch (error) {
            console.error('Error loading trades:', error);
            Alert.alert('Error', 'Failed to load trades');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            await loadTrades();
        } catch (error) {
            console.error('Error refreshing trades:', error);
            Alert.alert('Error', 'Failed to refresh trades');
        } finally {
            setRefreshing(false);
        }
    }, []);

    const getStatusColor = (status: TradeStatus) => {
        return '#1a1a1a'; // Using a dark gray color for all statuses
    };

    const getStatusText = (status: TradeStatus) => {
        switch (status) {
            case 'OPEN':
                return 'OPEN';
            case 'CLOSED':
                return 'CLOSED';
            case 'CANCELLED':
                return 'CANCELLED';
            case 'PENDING':
                return 'PENDING';
            default:
                return status;
        }
    };

    const getDirectionColor = (type: string) => {
        return type === 'BUY' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)';
    };

    const getDirectionTextColor = (type: string) => {
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

    const formatPnL = (value: number) => {
        if (isNaN(value)) return '$0.00';
        const absValue = Math.abs(value);
        if (Number.isInteger(absValue)) {
            return value < 0 ? `-$${absValue}` : `$${absValue}`;
        }
        return value < 0 ? `-$${absValue.toFixed(2)}` : `$${absValue.toFixed(2)}`;
    };

    const handleExport = async (format: 'CSV' | 'JSON') => {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                Alert.alert('Error', 'You must be logged in to export trades');
                return;
            }

            const userTrades = await TradeService.getUserTrades(userId);
            let fileContent = '';
            let fileName = '';
            let mimeType = '';

            const formatDate = (date: Date) => {
                return date.toISOString().slice(0, 19).replace('T', ' ');
            };

            if (format === 'CSV') {
                const csvData = [
                    ['Date', 'Pair', 'Type', 'Status', 'Entry Price', 'Exit Price', 'Quantity', 'P&L', 'P&L %', 'Strategies', 'Indicators', 'Tags', 'Notes', 'Mistakes'],
                    ...userTrades.map(trade => [
                        formatDate(new Date(trade.createdAt)),
                        trade.pair || '',
                        trade.type || '',
                        trade.status || '',
                        (trade.entryPrice || 0).toString(),
                        (trade.exitPrice || '').toString(),
                        (trade.quantity || 0).toString(),
                        (trade.profitLoss || 0).toString(),
                        (trade.profitLossPercentage || 0).toString(),
                        (trade.strategy || []).join('; '),
                        (trade.indicators || []).join('; '),
                        (trade.tags || []).join('; '),
                        trade.notes || '',
                        (trade.mistakes || []).join('; ')
                    ])
                ].map(row => row.join(',')).join('\n');
                fileContent = csvData;
                fileName = `trades_${new Date().toISOString().slice(0, 19).replace(/[-:]/g, '')}.csv`;
                mimeType = 'text/csv';
            } else {
                fileContent = JSON.stringify(userTrades, null, 2);
                fileName = `trades_${new Date().toISOString().slice(0, 19).replace(/[-:]/g, '')}.json`;
                mimeType = 'application/json';
            }

            const filePath = `${FileSystem.documentDirectory}${fileName}`;
            await FileSystem.writeAsStringAsync(filePath, fileContent);

            if (Platform.OS === 'android') {
                const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                if (permissions.granted) {
                    const uri = await FileSystem.StorageAccessFramework.createFileAsync(
                        permissions.directoryUri,
                        fileName,
                        mimeType
                    );
                    await FileSystem.writeAsStringAsync(uri, fileContent);
                    Alert.alert('Success', `File downloaded as ${fileName}`);
                }
            } else {
                // iOS and web platforms
                await Sharing.shareAsync(filePath, {
                    mimeType,
                    dialogTitle: 'Export Trades',
                    UTI: format === 'CSV' ? 'public.comma-separated-values' : 'public.json'
                });
            }
        } catch (error) {
            console.error('Error exporting trades:', error);
            Alert.alert('Error', 'Failed to export trades');
        }
    };

    const handleExportPress = () => {
        Alert.alert(
            'Export Trades',
            'Choose a format to download your trade history',
            [
                {
                    text: 'Download as CSV',
                    onPress: () => handleExport('CSV'),
                    style: 'default'
                },
                {
                    text: 'Download as JSON',
                    onPress: () => handleExport('JSON'),
                    style: 'default'
                },
                {
                    text: 'Cancel',
                    style: 'cancel'
                }
            ],
            {
                cancelable: true
            }
        );
    };

    const handleDeletePress = async (tradeId: string) => {
        try {
            await TradeService.deleteTrade(tradeId);
            Alert.alert(
                'Success',
                'Trade deleted successfully',
                [{ text: 'OK' }],
                { cancelable: false }
            );
            // Trade list will automatically update through real-time updates
        } catch (error) {
            console.error('Error deleting trade:', error);
            Alert.alert('Error', 'Failed to delete trade');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#2196F3']}
                        tintColor="#2196F3"
                    />
                }
            >
                <ThemedView style={styles.header}>
                    <View style={styles.headerContent}>
                        <View>
                            <ThemedText style={styles.title}>Trade History</ThemedText>
                            <ThemedText style={styles.totalTrades}>Total trades: {trades.length}</ThemedText>
                        </View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                style={styles.headerButton}
                                onPress={() => {
                                    // TODO: Implement filter functionality
                                    Alert.alert('Coming Soon', 'Filter functionality will be available soon!');
                                }}
                            >
                                <Ionicons name="filter" size={24} color="#2196F3" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.headerButton}
                                onPress={handleExportPress}
                            >
                                <Ionicons name="download-outline" size={24} color="#2196F3" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </ThemedView>

                <View style={styles.content}>
                    <View style={styles.tradesList}>
                        {trades.map((trade) => (
                            <TouchableOpacity
                                key={trade.id}
                                style={[
                                    styles.tradeItem,
                                    { backgroundColor: getDirectionColor(trade.type) }
                                ]}
                                onPress={() => router.push({
                                    pathname: '/(tabs)/trade-detail',
                                    params: { id: trade.id }
                                })}>
                                <View style={styles.tradeRow}>
                                    <View style={styles.tradeMainInfo}>
                                        <ThemedText style={styles.tradeSymbol}>{trade.pair}</ThemedText>
                                        <View style={styles.tradeLabels}>
                                            <ThemedText style={[
                                                styles.tradeDirection,
                                                { color: getDirectionTextColor(trade.type), backgroundColor: 'white' }
                                            ]}>
                                                {trade.type}
                                            </ThemedText>
                                            <ThemedText style={[
                                                styles.tradeStatus,
                                                { color: getStatusColor(trade.status), backgroundColor: '#fff' }
                                            ]}>
                                                {getStatusText(trade.status)}
                                            </ThemedText>
                                        </View>
                                    </View>
                                    {trade.status === 'CLOSED' && (
                                        <ThemedText
                                            style={[
                                                styles.tradePnLText,
                                                { color: calculatePnL(trade) >= 0 ? '#4caf50' : '#f44336' }
                                            ]}>
                                            {formatPnL(calculatePnL(trade))}
                                        </ThemedText>
                                    )}
                                </View>
                                <View style={styles.tradeRow}>
                                    <ThemedText style={styles.tradePrices}>
                                        {trade.entryPrice} → {trade.exitPrice || 'Open'}
                                    </ThemedText>
                                    {trade.status === 'CLOSED' && (
                                        <ThemedText style={[
                                            styles.tradePercentage,
                                            { color: calculatePnL(trade) >= 0 ? '#4caf50' : '#f44336' }
                                        ]}>
                                            {`${calculatePercentage(trade) >= 0 ? '+' : ''}${calculatePercentage(trade).toFixed(2)}%`}
                                        </ThemedText>
                                    )}
                                </View>
                                <View style={[styles.tradeRow, styles.lastRow]}>
                                    <View style={styles.tagContainer}>
                                        {trade.tags && trade.tags.map((tag, index) => (
                                            <View key={index} style={styles.tag}>
                                                <ThemedText style={styles.tagText}>{tag}</ThemedText>
                                            </View>
                                        ))}
                                    </View>
                                    <ThemedText style={styles.tradeDate}>
                                        {format(trade.createdAt, 'MMM d, h:mm a')}
                                    </ThemedText>
                                </View>
                                {trade.status === 'OPEN' && (
                                    <TouchableOpacity
                                        style={styles.closeButton}
                                        onPress={() => router.push({
                                            pathname: '/(tabs)/edit-trade',
                                            params: { id: trade.id }
                                        })}
                                    >
                                        <ThemedText style={styles.closeButtonText}>Close Trade</ThemedText>
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                        ))}
                        {trades.length === 0 && !loading && (
                            <ThemedText style={styles.noTradesText}>No trades found</ThemedText>
                        )}
                    </View>
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
    scrollView: {
        flex: 1,
    },
    header: {
        padding: 16,
        backgroundColor: 'white',
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
        gap: 16,
    },
    headerButton: {
        padding: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    content: {
        padding: 16,
    },
    tradesList: {
        gap: 16,
    },
    tradeItem: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    tradeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    tradeMainInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tradeSymbol: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    tradeLabels: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tradeDirection: {
        fontSize: 12,
        fontWeight: 'bold',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    tradeStatus: {
        fontSize: 12,
        fontWeight: '600',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    tradePnLText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    tradePrices: {
        fontSize: 12,
        color: '#666',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    tradePercentage: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'right',
        minWidth: 80,
    },
    tradeDate: {
        fontSize: 12,
        color: '#666',
    },
    tagContainer: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    tag: {
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#2196F3',
    },
    tagText: {
        fontSize: 10,
        color: '#2196F3',
        fontWeight: '500',
    },
    closeButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        alignSelf: 'flex-end',
        marginTop: 10,
    },
    closeButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    noTradesText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 24,
    },
    lastRow: {
        marginBottom: 0,
    },
    totalTrades: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
}); 