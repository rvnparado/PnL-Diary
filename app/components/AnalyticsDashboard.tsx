import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity, RefreshControl } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { DataTable, Menu, Portal, Dialog } from 'react-native-paper';
import ThemedText from './ThemedText';
import ThemedView from './ThemedView';
import AnalyticsService, { PerformanceMetrics } from '../lib/analytics';
import { auth } from '../config/firebase';
import { format } from 'date-fns';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { MaterialIcons } from '@expo/vector-icons';
import TooltipIcon from './TooltipIcon';

const screenWidth = Dimensions.get('window').width;

interface ChartConfig {
    backgroundColor: string;
    backgroundGradientFrom: string;
    backgroundGradientTo: string;
    decimalPlaces: number;
    color: (opacity: number) => string;
    labelColor: (opacity: number) => string;
    style: {
        borderRadius: number;
    };
    propsForDots: {
        r: string;
        strokeWidth: string;
        stroke: string;
    };
}

const chartConfig: ChartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
        borderRadius: 16,
    },
    propsForDots: {
        r: '6',
        strokeWidth: '2',
        stroke: '#2196F3',
    },
};

interface Props {
    startDate: Date | null;
    endDate: Date | null;
    onDatePickerPress: () => void;
}

export default function AnalyticsDashboard({ startDate, endDate, onDatePickerPress }: Props) {
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);

    useEffect(() => {
        loadMetrics();
    }, [startDate, endDate]);

    const loadMetrics = async () => {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                console.error('No user logged in');
                return;
            }

            // Calculate metrics with date range
            const data = await AnalyticsService.calculatePerformanceMetrics(
                userId,
                startDate,
                endDate
            );
            setMetrics(data);
        } catch (error) {
            console.error('Error loading metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportAnalytics = async () => {
        if (!metrics) return;

        const csvContent = [
            'Metric,Value',
            `Total Trades,${metrics.totalTrades}`,
            `Win Rate,${metrics.winRate.toFixed(2)}%`,
            `Total P&L,${metrics.totalPnL.toFixed(2)}`,
            `Average P&L,${metrics.averagePnL.toFixed(2)}`,
            `Largest Win,${metrics.largestWin.toFixed(2)}`,
            `Largest Loss,${metrics.largestLoss.toFixed(2)}`,
            `Profit Factor,${metrics.profitFactor.toFixed(2)}`,
            `Sharpe Ratio,${metrics.sharpeRatio.toFixed(2)}`,
            `Max Drawdown,${(metrics.maxDrawdown * 100).toFixed(2)}%`,
            `Risk/Reward Ratio,${metrics.riskRewardRatio.toFixed(2)}`,
            '',
            'Common Mistakes,Count,Impact',
            ...metrics.commonMistakes.map(m => `${m.description},${m.count},${m.impact.toFixed(2)}`),
            '',
            'Strategies,P&L,Win Rate',
            ...metrics.mostProfitableStrategies.map(s =>
                `${s.strategy},${s.pnl.toFixed(2)},${s.winRate.toFixed(2)}%`
            ),
            '',
            'Indicators,Count,Success Rate',
            ...metrics.mostUsedIndicators.map(i =>
                `${i.indicator},${i.count},${i.successRate.toFixed(2)}%`
            ),
        ].join('\n');

        const fileName = `trading_analytics_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        const filePath = `${FileSystem.documentDirectory}${fileName}`;

        try {
            await FileSystem.writeAsStringAsync(filePath, csvContent);
            await Sharing.shareAsync(filePath);
        } catch (error) {
            console.error('Error exporting analytics:', error);
        }
    };

    const showTooltip = (tooltipId: string) => {
        setTooltipVisible(tooltipId);
    };

    const hideTooltip = () => {
        setTooltipVisible(null);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadMetrics();
        setRefreshing(false);
    };

    const formatDateRange = () => {
        if (!startDate) return 'All Time';
        if (!endDate) return format(startDate, 'MMM d, yyyy');
        return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
    };

    const formatPnL = (value: number) => {
        const absValue = Math.abs(value);
        const hasDecimals = absValue % 1 !== 0;
        const formattedValue = hasDecimals ? absValue.toFixed(2) : Math.floor(absValue).toString();
        return value < 0 ? `-$${formattedValue}` : `$${formattedValue}`;
    };

    if (loading || !metrics) {
        return (
            <View style={styles.container}>
                <ThemedText>Loading analytics...</ThemedText>
            </View>
        );
    }

    return (
        <>
            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={onDatePickerPress}>
                        <MaterialIcons name="date-range" size={24} color="#666" />
                        <ThemedText style={styles.dateButtonText}>
                            {formatDateRange()}
                        </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.exportButton} onPress={exportAnalytics}>
                        <MaterialIcons name="file-download" size={24} color="#2196F3" />
                        <ThemedText style={styles.exportButtonText}>Export</ThemedText>
                    </TouchableOpacity>
                </View>

                <ThemedView style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>Performance Overview</ThemedText>
                        <TooltipIcon text="Key metrics showing your overall trading performance." />
                    </View>
                    <ThemedText style={styles.sectionDescription}>
                        Key metrics showing your overall trading performance.
                    </ThemedText>
                    <View style={styles.metricsGrid}>
                        <View style={styles.metricItem}>
                            <ThemedText style={styles.metricValue}>{metrics.totalTrades}</ThemedText>
                            <ThemedText style={styles.metricLabel}>Total Trades</ThemedText>
                        </View>
                        <View style={styles.metricItem}>
                            <ThemedText style={styles.metricValue}>
                                {metrics.winRate.toFixed(1)}%
                            </ThemedText>
                            <ThemedText style={styles.metricLabel}>Win Rate</ThemedText>
                        </View>
                        <View style={styles.metricItem}>
                            <ThemedText
                                style={[
                                    styles.metricValue,
                                    { color: metrics.totalPnL >= 0 ? '#4caf50' : '#f44336' },
                                ]}>
                                {formatPnL(metrics.totalPnL)}
                            </ThemedText>
                            <ThemedText style={styles.metricLabel}>Total P&L</ThemedText>
                        </View>
                        <View style={styles.metricItem}>
                            <ThemedText style={styles.metricValue}>
                                {metrics.profitFactor.toFixed(2)}
                            </ThemedText>
                            <ThemedText style={styles.metricLabel}>Profit Factor</ThemedText>
                        </View>
                    </View>
                </ThemedView>

                <ThemedView style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>Risk Metrics</ThemedText>
                        <TooltipIcon text="Advanced metrics to help you understand and manage your trading risk exposure." />
                    </View>
                    <ThemedText style={styles.sectionDescription}>
                        Advanced metrics to help you understand and manage your trading risk exposure.
                    </ThemedText>
                    <View style={styles.metricsGrid}>
                        <View style={styles.metricItem}>
                            <ThemedText style={styles.metricValue}>
                                {metrics.sharpeRatio.toFixed(2)}
                            </ThemedText>
                            <ThemedText style={styles.metricLabel}>Sharpe Ratio</ThemedText>
                        </View>
                        <View style={styles.metricItem}>
                            <ThemedText style={styles.metricValue}>
                                {(metrics.maxDrawdown * 100).toFixed(1)}%
                            </ThemedText>
                            <ThemedText style={styles.metricLabel}>Max Drawdown</ThemedText>
                        </View>
                        <View style={styles.metricItem}>
                            <ThemedText style={styles.metricValue}>
                                {metrics.riskRewardRatio.toFixed(2)}
                            </ThemedText>
                            <ThemedText style={styles.metricLabel}>Risk/Reward</ThemedText>
                        </View>
                    </View>
                </ThemedView>

                <ThemedView style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>Strategy Analysis</ThemedText>
                        <TooltipIcon text="Analysis of your most profitable trading strategies" />
                    </View>
                    <ThemedText style={styles.sectionDescription}>
                        Analysis of your most profitable trading strategies.
                    </ThemedText>
                    <DataTable>
                        <DataTable.Header>
                            <DataTable.Title style={styles.strategyColumn}>Strategy</DataTable.Title>
                            <DataTable.Title numeric>P&L</DataTable.Title>
                            <DataTable.Title numeric>Win Rate</DataTable.Title>
                        </DataTable.Header>

                        {metrics.mostProfitableStrategies.map((strategy, index) => (
                            <DataTable.Row key={index}>
                                <DataTable.Cell style={styles.strategyColumn}>
                                    <ThemedText style={styles.tableText} numberOfLines={3}>
                                        {strategy.strategy}
                                    </ThemedText>
                                </DataTable.Cell>
                                <DataTable.Cell numeric>
                                    <ThemedText style={[styles.tableText, { color: strategy.pnl >= 0 ? '#4CAF50' : '#F44336' }]}>
                                        {formatPnL(strategy.pnl)}
                                    </ThemedText>
                                </DataTable.Cell>
                                <DataTable.Cell numeric>
                                    <ThemedText style={styles.tableText}>{strategy.winRate.toFixed(1)}%</ThemedText>
                                </DataTable.Cell>
                            </DataTable.Row>
                        ))}
                    </DataTable>
                </ThemedView>

                <ThemedView style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>Common Mistakes</ThemedText>
                        <TooltipIcon text="Analysis of common trading mistakes and their impact" />
                    </View>
                    <ThemedText style={styles.sectionDescription}>
                        Analysis of common trading mistakes and their impact.
                    </ThemedText>
                    <DataTable>
                        <DataTable.Header>
                            <DataTable.Title style={styles.mistakeColumn}>Mistake</DataTable.Title>
                            <DataTable.Title numeric>Count</DataTable.Title>
                            <DataTable.Title numeric>Impact</DataTable.Title>
                        </DataTable.Header>

                        {metrics.commonMistakes.map((mistake, index) => (
                            <DataTable.Row key={index}>
                                <DataTable.Cell style={styles.mistakeColumn}>
                                    <ThemedText style={styles.tableText} numberOfLines={3}>
                                        {mistake.description}
                                    </ThemedText>
                                </DataTable.Cell>
                                <DataTable.Cell numeric>
                                    <ThemedText style={styles.tableText}>{mistake.count}</ThemedText>
                                </DataTable.Cell>
                                <DataTable.Cell numeric>
                                    <ThemedText style={[styles.tableText, { color: '#F44336' }]}>
                                        {formatPnL(mistake.impact)}
                                    </ThemedText>
                                </DataTable.Cell>
                            </DataTable.Row>
                        ))}
                    </DataTable>
                </ThemedView>

                <ThemedView style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>Trading Behavior</ThemedText>
                        <TooltipIcon text="Insights into your trading patterns and most successful trading hours." />
                    </View>
                    <ThemedText style={styles.sectionDescription}>
                        Insights into your trading patterns and most successful trading hours.
                    </ThemedText>
                    <View style={styles.behaviorMetrics}>
                        <ThemedText style={styles.subsectionTitle}>Best Trading Hours</ThemedText>
                        {Object.entries(metrics.behavioralPatterns.timeOfDay)
                            .sort((a, b) => b[1].winRate - a[1].winRate)
                            .slice(0, 3)
                            .map(([time, data], index) => (
                                <View key={index} style={styles.behaviorMetric}>
                                    <ThemedText>{time}</ThemedText>
                                    <ThemedText>Win Rate: {data.winRate.toFixed(1)}%</ThemedText>
                                    <ThemedText>Trades: {data.trades}</ThemedText>
                                </View>
                            ))}
                    </View>
                </ThemedView>
            </ScrollView>

            <Portal>
                <Dialog visible={tooltipVisible !== null} onDismiss={hideTooltip}>
                    <Dialog.Title>Info</Dialog.Title>
                    <Dialog.Content>
                        <ThemedText style={styles.tooltipText}>
                            {tooltipVisible === 'performance' && (
                                <>
                                    Your trading performance at a glance:
                                    {'\n\n'}• Total Trades: The number of completed trades in this period
                                    {'\n\n'}• Win Rate: The percentage of profitable trades - aim for consistency above 50%
                                    {'\n\n'}• Total P&L: Your total profit or loss across all trades
                                    {'\n\n'}• Profit Factor: Ratio of winning trades to losing trades - a value above 1.0 means you're profitable overall
                                </>
                            )}
                            {tooltipVisible === 'risk' && (
                                <>
                                    Understanding your risk metrics:
                                    {'\n\n'}• Sharpe Ratio: Measures how much return you're getting for the risk you're taking. A higher ratio (above 1) means better risk-adjusted returns. Think of it as your "trading efficiency score"
                                    {'\n\n'}• Max Drawdown: The largest drop from a peak in your account value, shown as a percentage. It helps you understand your worst-case scenarios and plan your risk management
                                    {'\n\n'}• Risk/Reward: Compares your average winning trade to your average losing trade. A ratio of 2.0 means your winning trades are typically twice as large as your losing trades - aim for 1.5 or higher
                                </>
                            )}
                            {tooltipVisible === 'strategy' && (
                                <>
                                    Your trading strategies broken down:
                                    {'\n\n'}• Shows your most successful trading strategies
                                    {'\n\n'}• P&L shows how much each strategy has made or lost
                                    {'\n\n'}• Win Rate shows how often each strategy leads to profitable trades
                                    {'\n\n'}Use this to focus on your most effective strategies and improve or phase out underperforming ones
                                </>
                            )}
                            {tooltipVisible === 'mistakes' && (
                                <>
                                    Learn from your trading mistakes:
                                    {'\n\n'}• Lists your most common trading mistakes
                                    {'\n\n'}• Shows how often each mistake occurs
                                    {'\n\n'}• Impact shows how much each type of mistake typically costs you
                                    {'\n\n'}Use this information to identify and correct patterns that are hurting your performance
                                </>
                            )}
                            {tooltipVisible === 'behavior' && (
                                <>
                                    Your trading behavior patterns:
                                    {'\n\n'}• Shows your most successful trading hours
                                    {'\n\n'}• Identifies when you make your best trades
                                    {'\n\n'}• Helps you understand your optimal trading times
                                    {'\n\n'}Use this to plan your trading schedule around your most profitable hours
                                </>
                            )}
                        </ThemedText>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <TouchableOpacity onPress={hideTooltip} style={styles.dialogButton}>
                            <ThemedText style={styles.dialogButtonText}>Got it</ThemedText>
                        </TouchableOpacity>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
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
    exportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
    },
    exportButtonText: {
        marginLeft: 4,
        color: '#2196F3',
        fontSize: 14,
    },
    section: {
        margin: 16,
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 8,
    },
    sectionDescription: {
        fontSize: 12,
        color: '#666',
        marginBottom: 16,
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    metricItem: {
        width: '48%',
        padding: 12,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        alignItems: 'center',
        flexDirection: 'column',
    },
    metricValue: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 12,
        color: '#666',
    },
    behaviorMetrics: {
        gap: 12,
    },
    behaviorMetric: {
        padding: 12,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    subsectionTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 12,
    },
    dialogButton: {
        padding: 8,
        marginRight: 8,
    },
    dialogButtonText: {
        color: '#2196F3',
        fontWeight: '500',
    },
    tooltipText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#333',
    },
    strategyColumn: {
        flex: 2,
    },
    mistakeColumn: {
        flex: 2,
    },
    tableText: {
        fontSize: 13,
        lineHeight: 16,
    },
}); 