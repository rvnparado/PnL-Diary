import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ThemedText from '@/app/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import TradeService, { Trade } from '../lib/trades';
import { LineChart } from 'react-native-chart-kit';
import { auth } from '../config/firebase';

interface PerformanceMetrics {
    totalTrades: number;
    winRate: number;
    avgProfit: number;
    bestStrategy: string;
    bestStrategyWinRate: number;
    mostCommonMistake: string;
}

export default function AnalyticsScreen() {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTimeframe, setSelectedTimeframe] = useState<'1W' | '1M' | '3M' | '6M' | '1Y'>('1M');
    const [selectedMetric, setSelectedMetric] = useState<'pnl' | 'winRate'>('pnl');

    useEffect(() => {
        loadTrades();
    }, []);

    const loadTrades = async () => {
        try {
            setLoading(true);
            const userId = auth.currentUser?.uid;
            if (!userId) {
                return;
            }

            const userTrades = await TradeService.getUserTrades(userId);
            setTrades(userTrades);
        } catch (error) {
            console.error('Error loading trades:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculatePnL = (trade: Trade) => {
        const { type, entryPrice, exitPrice, quantity } = trade;
        if (type === 'BUY') {
            return (exitPrice - entryPrice) * quantity;
        } else {
            return (entryPrice - exitPrice) * quantity;
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    const getTimeframeData = () => {
        const now = new Date();
        let startDate = new Date();

        switch (selectedTimeframe) {
            case '1W':
                startDate.setDate(now.getDate() - 7);
                break;
            case '1M':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case '3M':
                startDate.setMonth(now.getMonth() - 3);
                break;
            case '6M':
                startDate.setMonth(now.getMonth() - 6);
                break;
            case '1Y':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }

        return trades.filter(trade => new Date(trade.createdAt) >= startDate);
    };

    const getChartData = () => {
        const timeframeTrades = getTimeframeData();
        if (timeframeTrades.length === 0) {
            return {
                labels: [],
                datasets: [{ data: [] }],
            };
        }

        const sortedTrades = [...timeframeTrades].sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        if (selectedMetric === 'pnl') {
            let cumulativePnL = 0;
            const data = sortedTrades.map(trade => {
                cumulativePnL += calculatePnL(trade);
                return cumulativePnL;
            });

            const labels = sortedTrades.map(trade =>
                new Date(trade.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                })
            );

            return {
                labels,
                datasets: [{ data }],
            };
        } else {
            const windowSize = 10;
            const winRates = [];
            const labels = [];

            for (let i = windowSize - 1; i < sortedTrades.length; i++) {
                const window = sortedTrades.slice(i - windowSize + 1, i + 1);
                const wins = window.filter(trade => calculatePnL(trade) > 0).length;
                winRates.push((wins / windowSize) * 100);
                labels.push(
                    new Date(sortedTrades[i].createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                    })
                );
            }

            return {
                labels,
                datasets: [{ data: winRates }],
            };
        }
    };

    const getStatistics = () => {
        const timeframeTrades = getTimeframeData();
        if (timeframeTrades.length === 0) {
            return {
                totalTrades: 0,
                winRate: 0,
                totalPnL: 0,
                averagePnL: 0,
                bestTrade: 0,
                worstTrade: 0,
            };
        }

        const pnls = timeframeTrades.map(calculatePnL);
        const wins = pnls.filter(pnl => pnl > 0).length;

        return {
            totalTrades: timeframeTrades.length,
            winRate: (wins / timeframeTrades.length) * 100,
            totalPnL: pnls.reduce((sum, pnl) => sum + pnl, 0),
            averagePnL: pnls.reduce((sum, pnl) => sum + pnl, 0) / timeframeTrades.length,
            bestTrade: Math.max(...pnls),
            worstTrade: Math.min(...pnls),
        };
    };

    const stats = getStatistics();
    const chartData = getChartData();

    return (
        <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
            <View style={styles.header}>
                <ThemedText style={styles.title}>Analytics</ThemedText>
            </View>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}>
                <View style={styles.timeframeSelector}>
                    {(['1W', '1M', '3M', '6M', '1Y'] as const).map((timeframe) => (
                        <TouchableOpacity
                            key={timeframe}
                            style={[
                                styles.timeframeButton,
                                selectedTimeframe === timeframe && styles.timeframeButtonActive,
                            ]}
                            onPress={() => setSelectedTimeframe(timeframe)}>
                            <ThemedText
                                style={[
                                    styles.timeframeButtonText,
                                    selectedTimeframe === timeframe && styles.timeframeButtonTextActive,
                                ]}>
                                {timeframe}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.metricSelector}>
                    <TouchableOpacity
                        style={[
                            styles.metricButton,
                            selectedMetric === 'pnl' && styles.metricButtonActive,
                        ]}
                        onPress={() => setSelectedMetric('pnl')}>
                        <ThemedText
                            style={[
                                styles.metricButtonText,
                                selectedMetric === 'pnl' && styles.metricButtonTextActive,
                            ]}>
                            P&L
                        </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.metricButton,
                            selectedMetric === 'winRate' && styles.metricButtonActive,
                        ]}
                        onPress={() => setSelectedMetric('winRate')}>
                        <ThemedText
                            style={[
                                styles.metricButtonText,
                                selectedMetric === 'winRate' && styles.metricButtonTextActive,
                            ]}>
                            Win Rate
                        </ThemedText>
                    </TouchableOpacity>
                </View>

                {chartData.labels.length > 0 ? (
                    <View style={styles.chartContainer}>
                        <LineChart
                            data={chartData}
                            width={Dimensions.get('window').width - 32}
                            height={220}
                            chartConfig={{
                                backgroundColor: '#ffffff',
                                backgroundGradientFrom: '#ffffff',
                                backgroundGradientTo: '#ffffff',
                                decimalPlaces: selectedMetric === 'pnl' ? 2 : 0,
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
                            }}
                            bezier
                            style={{
                                marginVertical: 8,
                                borderRadius: 16,
                            }}
                        />
                    </View>
                ) : (
                    <View style={styles.noDataContainer}>
                        <Ionicons name="analytics-outline" size={48} color="#666" />
                        <ThemedText style={styles.noDataText}>
                            No data available for the selected timeframe
                        </ThemedText>
                    </View>
                )}

                <View style={styles.statsContainer}>
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <ThemedText style={styles.statLabel}>Total Trades</ThemedText>
                            <ThemedText style={styles.statValue}>{stats.totalTrades}</ThemedText>
                        </View>
                        <View style={styles.statCard}>
                            <ThemedText style={styles.statLabel}>Win Rate</ThemedText>
                            <ThemedText style={styles.statValue}>
                                {stats.winRate.toFixed(1)}%
                            </ThemedText>
                        </View>
                    </View>
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <ThemedText style={styles.statLabel}>Total P&L</ThemedText>
                            <ThemedText
                                style={[
                                    styles.statValue,
                                    { color: stats.totalPnL >= 0 ? '#4caf50' : '#f44336' },
                                ]}>
                                {formatCurrency(stats.totalPnL)}
                            </ThemedText>
                        </View>
                        <View style={styles.statCard}>
                            <ThemedText style={styles.statLabel}>Average P&L</ThemedText>
                            <ThemedText
                                style={[
                                    styles.statValue,
                                    { color: stats.averagePnL >= 0 ? '#4caf50' : '#f44336' },
                                ]}>
                                {formatCurrency(stats.averagePnL)}
                            </ThemedText>
                        </View>
                    </View>
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <ThemedText style={styles.statLabel}>Best Trade</ThemedText>
                            <ThemedText style={[styles.statValue, { color: '#4caf50' }]}>
                                {formatCurrency(stats.bestTrade)}
                            </ThemedText>
                        </View>
                        <View style={styles.statCard}>
                            <ThemedText style={styles.statLabel}>Worst Trade</ThemedText>
                            <ThemedText style={[styles.statValue, { color: '#f44336' }]}>
                                {formatCurrency(stats.worstTrade)}
                            </ThemedText>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    scrollViewContent: {
        paddingBottom: 80, // Add padding for tab bar
    },
    timeframeSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    timeframeButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
    },
    timeframeButtonActive: {
        backgroundColor: '#2196F3',
    },
    timeframeButtonText: {
        fontSize: 14,
        color: '#666',
    },
    timeframeButtonTextActive: {
        color: 'white',
        fontWeight: '500',
    },
    metricSelector: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    metricButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
    },
    metricButtonActive: {
        backgroundColor: '#2196F3',
    },
    metricButtonText: {
        fontSize: 14,
        color: '#666',
    },
    metricButtonTextActive: {
        color: 'white',
        fontWeight: '500',
    },
    chartContainer: {
        marginBottom: 24,
        alignItems: 'center',
    },
    noDataContainer: {
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 16,
        marginBottom: 24,
    },
    noDataText: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
    },
    statsContainer: {
        gap: 16,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
        borderRadius: 8,
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
}); 