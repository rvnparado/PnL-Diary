import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    Alert,
    RefreshControl,
} from 'react-native';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import TradeService, { Trade } from '../lib/trades';
import { format } from 'date-fns';
import RealTimeService from '../lib/realtime';
import HybridAnalytics from '../lib/analytics/hybrid';
import { PerformanceMetrics } from '../lib/analytics';

export default function HomeScreen() {
    const router = useRouter();
    const [showExportModal, setShowExportModal] = useState(false);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
        setupRealTimeUpdates();

        return () => {
            const userId = auth.currentUser?.uid;
            if (userId) {
                RealTimeService.unsubscribe(`trades_${userId}`);
            }
        };
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const userId = auth.currentUser?.uid;
            if (!userId) {
                return;
            }

            const userTrades = await TradeService.getUserTrades(userId);
            const sortedTrades = userTrades.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setTrades(sortedTrades);

            const performanceMetrics = await HybridAnalytics.getMetrics(userId, true);
            setMetrics(performanceMetrics);
        } catch (error) {
            Alert.alert('Error', 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const setupRealTimeUpdates = () => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        RealTimeService.subscribeUserTrades(
            userId,
            async (updatedTrades) => {
                const sortedTrades = updatedTrades.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                setTrades(sortedTrades);

                await HybridAnalytics.onTradeUpdate(userId);
                const performanceMetrics = await HybridAnalytics.getMetrics(userId);
                setMetrics(performanceMetrics);
            },
            (error) => {
                Alert.alert('Error', 'Failed to receive trade updates');
            }
        );
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            await loadData();
        } catch (error) {
            Alert.alert('Error', 'Failed to refresh data');
        } finally {
            setRefreshing(false);
        }
    }, []);

    const getDirectionColor = (type: string) => {
        return type === 'BUY' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)';
    };

    const getDirectionTextColor = (type: string) => {
        return type === 'BUY' ? '#4caf50' : '#f44336';
    };

    const calculatePnL = (trade: Trade) => {
        if (!trade.exitPrice || trade.status !== 'CLOSED') return 0;
        const multiplier = trade.type === 'BUY' ? 1 : -1;
        const pnl = (trade.exitPrice - trade.entryPrice) * trade.quantity * multiplier;
        return Number(pnl.toFixed(2));
    };

    const calculatePercentage = (trade: Trade) => {
        if (!trade.exitPrice || trade.status !== 'CLOSED') return 0;
        const pnl = calculatePnL(trade);
        const investment = trade.entryPrice * trade.quantity;
        return Number((pnl / investment * 100).toFixed(2));
    };

    const formatPnL = (pnl: number) => {
        if (isNaN(pnl)) return '$0.00';
        const absValue = Math.abs(pnl);
        if (Number.isInteger(absValue)) {
            return pnl < 0 ? `-$${absValue}` : `$${absValue}`;
        }
        return pnl < 0 ? `-$${absValue.toFixed(2)}` : `$${absValue.toFixed(2)}`;
    };

    const handleExport = (format: 'CSV' | 'JSON') => {
        // TODO: Implement actual export functionality
        Alert.alert(
            'Export Successful',
            `Your trades have been exported as ${format}`,
            [{ text: 'OK', onPress: () => setShowExportModal(false) }]
        );
    };

    const showMetricInfo = (title: string, content: string) => {
        Alert.alert(title, content);
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
                        <ThemedText style={styles.title}>PnL Diary</ThemedText>
                    </View>
                </ThemedView>

                <View style={styles.content}>
                    {/* Performance Summary Section */}
                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>
                            Performance Summary
                            {metrics?.isDefaultData && (
                                <ThemedText style={styles.defaultDataBadge}> (Sample Data)</ThemedText>
                            )}
                        </ThemedText>
                        <View style={styles.performanceGrid}>
                            <View style={styles.performanceItem}>
                                <View style={styles.metricHeader}>
                                    <ThemedText style={styles.performanceValue}>
                                        {metrics ? `${(metrics.winRate || 0).toFixed(1)}%` : '-'}
                                    </ThemedText>
                                    <TouchableOpacity
                                        onPress={() => showMetricInfo(
                                            'Win Rate Calculation',
                                            `Win Rate = (Number of Winning Trades / Total Closed Trades) × 100\n\nCurrent Values:\nWinning Trades: ${metrics?.winningTrades || 0}\nLosing Trades: ${metrics?.losingTrades || 0}\nTotal Closed Trades: ${(metrics?.winningTrades || 0) + (metrics?.losingTrades || 0)}\nOpen Trades: ${(metrics?.totalTrades || 0) - ((metrics?.winningTrades || 0) + (metrics?.losingTrades || 0))}\n\nCalculation: (${metrics?.winningTrades || 0} / ${(metrics?.winningTrades || 0) + (metrics?.losingTrades || 0)}) × 100 = ${(metrics?.winRate || 0).toFixed(1)}%\n\nNote: Only CLOSED trades with valid exit prices are counted. Trades might be filtered out if:\n- Status is not 'CLOSED'\n- Exit price is missing or 0\n- Trade dates are outside the calculation period`
                                        )}>
                                        <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
                                    </TouchableOpacity>
                                </View>
                                <ThemedText style={styles.performanceLabel}>Win Rate</ThemedText>
                            </View>
                            <View style={styles.performanceItem}>
                                <View style={styles.metricHeader}>
                                    <ThemedText style={[
                                        styles.performanceValue,
                                        { color: (metrics?.totalPnL || 0) >= 0 ? '#4caf50' : '#f44336' }
                                    ]}>
                                        {metrics ? formatPnL(metrics.totalPnL || 0) : '-'}
                                    </ThemedText>
                                    <TouchableOpacity
                                        onPress={() => showMetricInfo(
                                            'Total P&L Calculation',
                                            `Total P&L = Sum of all closed trades' P&L\n\nFor each trade:\nLong (BUY): P&L = (Exit Price - Entry Price) × Quantity\nShort (SELL): P&L = (Entry Price - Exit Price) × Quantity\n\nCurrent Values:\nTotal P&L: ${formatPnL(metrics?.totalPnL || 0)}\nWinning Trades Total: ${formatPnL(metrics?.averageWinSize || 0)}\nLosing Trades Total: ${formatPnL(Math.abs(metrics?.averageLossSize || 0))}\nLargest Win: ${formatPnL(metrics?.largestWin || 0)}\nLargest Loss: ${formatPnL(Math.abs(metrics?.largestLoss || 0))}\n\nNote: P&L is only calculated for CLOSED trades with:\n- Valid entry and exit prices\n- Positive quantity\n- Status marked as 'CLOSED'`
                                        )}>
                                        <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
                                    </TouchableOpacity>
                                </View>
                                <ThemedText style={styles.performanceLabel}>Total P&L</ThemedText>
                            </View>
                            <View style={styles.performanceItem}>
                                <View style={styles.metricHeader}>
                                    <ThemedText style={styles.performanceValue}>
                                        {metrics ? metrics.totalTrades : '-'}
                                    </ThemedText>
                                    <TouchableOpacity
                                        onPress={() => showMetricInfo(
                                            'Total Trades Count',
                                            `Total Trades = All trades (both open and closed)\n\nCurrent Values:\nTotal Trades: ${metrics?.totalTrades || 0}\nOpen Trades: ${(metrics?.totalTrades || 0) - ((metrics?.winningTrades || 0) + (metrics?.losingTrades || 0))}\nClosed Trades: ${(metrics?.winningTrades || 0) + (metrics?.losingTrades || 0)}\n- Winning: ${metrics?.winningTrades || 0}\n- Losing: ${metrics?.losingTrades || 0}\n\nNote: A trade is considered:\nOpen if:\n- Status is 'OPEN'\n- No exit price set\nClosed if:\n- Status is 'CLOSED'\n- Has valid exit price`
                                        )}>
                                        <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
                                    </TouchableOpacity>
                                </View>
                                <ThemedText style={styles.performanceLabel}>Total Trades</ThemedText>
                            </View>
                            <View style={styles.performanceItem}>
                                <View style={styles.metricHeader}>
                                    <ThemedText style={styles.performanceValue}>
                                        {metrics ? (metrics.profitFactor || 0).toFixed(2) : '-'}
                                    </ThemedText>
                                    <TouchableOpacity
                                        onPress={() => showMetricInfo(
                                            'Profit Factor Calculation',
                                            `Profit Factor = Total Winning Amount / |Total Losing Amount|\n\nCurrent Values:\nTotal Winning Amount: ${formatPnL(metrics?.averageWinSize || 0)}\nTotal Losing Amount: ${formatPnL(Math.abs(metrics?.averageLossSize || 0))}\nAverage Win: ${formatPnL((metrics?.averageWinSize || 0) / (metrics?.winningTrades || 1))}\nAverage Loss: ${formatPnL(Math.abs((metrics?.averageLossSize || 0) / (metrics?.losingTrades || 1)))}\n\nCalculation: ${formatPnL(metrics?.averageWinSize || 0)} / ${formatPnL(Math.abs(metrics?.averageLossSize || 0))} = ${(metrics?.profitFactor || 0).toFixed(2)}\n\nNote: Only considers closed trades with:\n- Valid P&L values\n- Status marked as 'CLOSED'\nHigher values indicate better risk-adjusted returns`
                                        )}>
                                        <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
                                    </TouchableOpacity>
                                </View>
                                <ThemedText style={styles.performanceLabel}>Profit Factor</ThemedText>
                            </View>
                        </View>
                    </View>

                    {/* Recent Trades Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <ThemedText style={styles.sectionTitle}>Recent Trades</ThemedText>
                            <TouchableOpacity onPress={() => router.push('/history')}>
                                <ThemedText style={styles.viewAllButton}>View All</ThemedText>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.tradesList}>
                            {trades.slice(0, 3).map((trade) => (
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
                                    <View style={styles.tradeInfo}>
                                        <View style={styles.tradeHeader}>
                                            <ThemedText style={styles.tradeSymbol}>{trade.pair}</ThemedText>
                                            <ThemedText style={[
                                                styles.tradeDirection,
                                                {
                                                    color: getDirectionTextColor(trade.type),
                                                    backgroundColor: 'white'
                                                }
                                            ]}>
                                                {trade.type}
                                            </ThemedText>
                                        </View>
                                        <View style={styles.tradeDetails}>
                                            <ThemedText style={styles.tradeDate}>
                                                {format(new Date(trade.createdAt), 'MMM d, h:mm a')}
                                            </ThemedText>
                                            <ThemedText style={styles.tradePrices}>
                                                {trade.entryPrice} → {trade.exitPrice}
                                            </ThemedText>
                                        </View>
                                    </View>
                                    <View style={styles.tradePnL}>
                                        <ThemedText
                                            style={[
                                                styles.tradePnLText,
                                                { color: calculatePnL(trade) >= 0 ? '#4caf50' : '#f44336' }
                                            ]}>
                                            {formatPnL(calculatePnL(trade))}
                                        </ThemedText>
                                        <ThemedText
                                            style={[
                                                styles.tradePercentage,
                                                { color: calculatePnL(trade) >= 0 ? '#4caf50' : '#f44336' }
                                            ]}>
                                            {`${calculatePercentage(trade) >= 0 ? '+' : ''}${calculatePercentage(trade).toFixed(2)}%`}
                                        </ThemedText>
                                    </View>
                                </TouchableOpacity>
                            ))}
                            {trades.length === 0 && !loading && (
                                <ThemedText style={styles.noTradesText}>No recent trades found</ThemedText>
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Export Modal */}
            <Modal
                visible={showExportModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowExportModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ThemedText style={styles.modalTitle}>Export Trades</ThemedText>
                        <ThemedText style={styles.modalSubtitle}>Choose export format:</ThemedText>

                        <TouchableOpacity
                            style={styles.exportOption}
                            onPress={() => handleExport('CSV')}>
                            <Ionicons name="document-text-outline" size={24} color="#2196F3" />
                            <View style={styles.exportOptionText}>
                                <ThemedText style={styles.exportOptionTitle}>CSV Format</ThemedText>
                                <ThemedText style={styles.exportOptionDescription}>
                                    Export as spreadsheet-compatible CSV file
                                </ThemedText>
                            </View>
                            <Ionicons name="chevron-forward-outline" size={24} color="#666" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.exportOption}
                            onPress={() => handleExport('JSON')}>
                            <Ionicons name="code-outline" size={24} color="#2196F3" />
                            <View style={styles.exportOptionText}>
                                <ThemedText style={styles.exportOptionTitle}>JSON Format</ThemedText>
                                <ThemedText style={styles.exportOptionDescription}>
                                    Export as structured JSON file
                                </ThemedText>
                            </View>
                            <Ionicons name="chevron-forward-outline" size={24} color="#666" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowExportModal(false)}>
                            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Add Trade Button */}
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('/add-trade')}>
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        padding: 8,
    },
    content: {
        padding: 16,
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    viewAllButton: {
        color: '#2196F3',
        fontSize: 14,
    },
    performanceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        gap: 16,
    },
    performanceItem: {
        flex: 1,
        minWidth: '45%',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    performanceValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2196F3',
        marginBottom: 4,
    },
    performanceLabel: {
        fontSize: 12,
        color: '#666',
    },
    tradesList: {
        gap: 12,
    },
    tradeItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    tradeInfo: {
        flex: 1,
    },
    tradeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    tradeSymbol: {
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
    tradeDirection: {
        fontSize: 12,
        fontWeight: 'bold',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: '#f5f5f5',
    },
    tradeDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tradeDate: {
        fontSize: 12,
        color: '#666',
    },
    tradePrices: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'monospace',
    },
    tradePnL: {
        alignItems: 'flex-end',
    },
    tradePnLText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    tradePercentage: {
        fontSize: 12,
    },
    addButton: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    exportOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        marginBottom: 12,
    },
    exportOptionText: {
        flex: 1,
        marginLeft: 12,
    },
    exportOptionTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    exportOptionDescription: {
        fontSize: 12,
        color: '#666',
    },
    cancelButton: {
        padding: 16,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
    },
    noTradesText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 16,
    },
    defaultDataBadge: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic'
    },
    metricHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
});