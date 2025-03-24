import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Alert,
} from 'react-native';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebase';
import TradeService from '../lib/trades';

interface PerformanceMetrics {
    totalTrades: number;
    winRate: number;
    totalProfit: number;
    averageProfit: number;
    bestTrade: number;
    worstTrade: number;
    profitFactor: number;
}

const mockMetrics: PerformanceMetrics = {
    totalTrades: 150,
    winRate: 65,
    totalProfit: 12500,
    averageProfit: 83.33,
    bestTrade: 1200,
    worstTrade: -500,
    profitFactor: 2.1,
};

export default function AnalyticsScreen() {
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const userId = auth.currentUser?.uid;
            if (!userId) {
                console.error('No user logged in');
                return;
            }

            // TODO: Replace with actual analytics service call
            // const data = await AnalyticsService.getMetrics(userId);
            setMetrics(mockMetrics);
        } catch (error) {
            console.error('Error loading analytics:', error);
            Alert.alert('Error', 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            await loadAnalytics();
        } finally {
            setRefreshing(false);
        }
    }, []);

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
                    <ThemedText style={styles.title}>Analytics</ThemedText>
                </ThemedView>

                <View style={styles.content}>
                    <ThemedView style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>Performance Overview</ThemedText>
                        <View style={styles.metricsGrid}>
                            <View style={styles.metricItem}>
                                <ThemedText style={styles.metricValue}>{mockMetrics.totalTrades}</ThemedText>
                                <ThemedText style={styles.metricLabel}>Total Trades</ThemedText>
                            </View>
                            <View style={styles.metricItem}>
                                <ThemedText style={styles.metricValue}>{mockMetrics.winRate}%</ThemedText>
                                <ThemedText style={styles.metricLabel}>Win Rate</ThemedText>
                            </View>
                            <View style={styles.metricItem}>
                                <ThemedText style={styles.metricValue}>${mockMetrics.totalProfit}</ThemedText>
                                <ThemedText style={styles.metricLabel}>Total Profit</ThemedText>
                            </View>
                            <View style={styles.metricItem}>
                                <ThemedText style={styles.metricValue}>${mockMetrics.averageProfit}</ThemedText>
                                <ThemedText style={styles.metricLabel}>Avg. Profit</ThemedText>
                            </View>
                        </View>
                    </ThemedView>

                    <ThemedView style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>Best & Worst Trades</ThemedText>
                        <View style={styles.tradeMetrics}>
                            <View style={styles.tradeMetricItem}>
                                <ThemedText style={[styles.tradeMetricValue, { color: '#4CAF50' }]}>
                                    +${mockMetrics.bestTrade}
                                </ThemedText>
                                <ThemedText style={styles.tradeMetricLabel}>Best Trade</ThemedText>
                            </View>
                            <View style={styles.tradeMetricItem}>
                                <ThemedText style={[styles.tradeMetricValue, { color: '#F44336' }]}>
                                    -${Math.abs(mockMetrics.worstTrade)}
                                </ThemedText>
                                <ThemedText style={styles.tradeMetricLabel}>Worst Trade</ThemedText>
                            </View>
                        </View>
                    </ThemedView>

                    <ThemedView style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>Additional Metrics</ThemedText>
                        <View style={styles.additionalMetrics}>
                            <View style={styles.metricRow}>
                                <ThemedText style={styles.metricLabel}>Profit Factor</ThemedText>
                                <ThemedText style={styles.metricValue}>{mockMetrics.profitFactor}</ThemedText>
                            </View>
                        </View>
                    </ThemedView>
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    content: {
        padding: 16,
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    metricItem: {
        width: '48%',
        padding: 12,
        marginBottom: 16,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        alignItems: 'center',
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
    tradeMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    tradeMetricItem: {
        width: '48%',
        padding: 12,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        alignItems: 'center',
    },
    tradeMetricValue: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    tradeMetricLabel: {
        fontSize: 12,
        color: '#666',
    },
    additionalMetrics: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
    },
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
}); 