import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity, View, AppState } from 'react-native';
import ThemedText from './ThemedText';
import ThemedView from './ThemedView';
import { useAuth } from '../contexts/AuthContext';
import TradeService from '../lib/trades';
import AnalyticsService from '../lib/analytics';
import TradeAnalysisAI from '../lib/ai/tradeAnalysis';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export default function CustomMetricsDashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [needsUpdate, setNeedsUpdate] = useState(false);
    const [currentMetrics, setCurrentMetrics] = useState<any>(null);

    // Subscribe to trade updates through TradeService
    useEffect(() => {
        if (!user) return;

        const unsubscribe = TradeService.subscribeToTradeUpdates(user.uid, async () => {
            console.log('🔄 Trade changes detected, checking metrics...');
            await checkMetricsAndUpdate();
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user]);

    // Add logging effect for metric changes
    useEffect(() => {
        if (needsUpdate && currentMetrics) {
            console.log('🔄 AI Analysis Update Available:', {
                metrics: {
                    profitFactor: currentMetrics.profitFactor.toFixed(2),
                    totalPnL: currentMetrics.totalPnL.toFixed(2),
                    totalTrades: currentMetrics.totalTrades,
                    winRate: `${currentMetrics.winRate.toFixed(2)}%`
                }
            });
        }
    }, [needsUpdate, currentMetrics]);

    const checkMetricsAndUpdate = async () => {
        if (!user) return;

        try {
            const newMetrics = await AnalyticsService.calculatePerformanceMetrics(user.uid);

            // If this is the first load, just set the metrics without comparison
            if (!currentMetrics) {
                console.log('📊 Setting initial metrics:', {
                    profitFactor: newMetrics.profitFactor.toFixed(2),
                    totalPnL: newMetrics.totalPnL.toFixed(2),
                    totalTrades: newMetrics.totalTrades,
                    winRate: `${newMetrics.winRate.toFixed(2)}%`
                });
                setCurrentMetrics(newMetrics);
                setNeedsUpdate(true);  // Set to true on first load
                return;
            }

            // Skip if we don't have valid metrics
            if (!newMetrics) {
                console.log('❌ No new metrics available');
                return;
            }

            // Helper function to check if numbers are different (handling floating point)
            const isDifferent = (a: number, b: number, precision: number = 2) => {
                if (typeof a !== 'number' || typeof b !== 'number') {
                    console.log('⚠️ Invalid metric comparison:', { a, b });
                    return false;
                }
                const factor = Math.pow(10, precision);
                const diff = Math.abs(Math.round(a * factor) - Math.round(b * factor));
                return diff > 0;
            };

            // Check each metric individually
            const changes = {
                totalTrades: currentMetrics.totalTrades !== newMetrics.totalTrades,
                totalPnL: isDifferent(newMetrics.totalPnL, currentMetrics.totalPnL, 2),
                winRate: isDifferent(newMetrics.winRate, currentMetrics.winRate, 2),
                profitFactor: isDifferent(newMetrics.profitFactor, currentMetrics.profitFactor, 2)
            };

            console.log('🔍 Comparing metrics:', {
                current: {
                    totalTrades: currentMetrics.totalTrades,
                    totalPnL: currentMetrics.totalPnL.toFixed(2),
                    winRate: currentMetrics.winRate.toFixed(2),
                    profitFactor: currentMetrics.profitFactor.toFixed(2)
                },
                new: {
                    totalTrades: newMetrics.totalTrades,
                    totalPnL: newMetrics.totalPnL.toFixed(2),
                    winRate: newMetrics.winRate.toFixed(2),
                    profitFactor: newMetrics.profitFactor.toFixed(2)
                },
                changes
            });

            const hasMetricsChanged = Object.values(changes).some(changed => changed);

            if (hasMetricsChanged) {
                const changedMetrics = Object.entries(changes)
                    .filter(([_, changed]) => changed)
                    .map(([metric]) => metric)
                    .join(', ');

                console.log(`📈 AI Analysis: Updates detected in ${changedMetrics}`);
                setCurrentMetrics(newMetrics);
                setNeedsUpdate(true);
            } else {
                console.log('ℹ️ No significant metric changes detected');
                setCurrentMetrics(newMetrics);
            }
        } catch (error) {
            console.error('❌ AI Analysis: Error checking metrics:', error);
        }
    };

    // Check for updates when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            let isActive = true;

            const checkForUpdates = async () => {
                if (!user || !isActive) return;
                await checkMetricsAndUpdate();
            };

            checkForUpdates();

            // Subscribe to app state changes
            const subscription = AppState.addEventListener('change', nextAppState => {
                if (nextAppState === 'active') {
                    checkForUpdates();
                }
            });

            return () => {
                isActive = false;
                subscription.remove();
            };
        }, [user])
    );

    // Initial load
    useEffect(() => {
        loadInitialAnalysis();
    }, [user]);

    const loadInitialAnalysis = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            const tradeAnalysisAI = TradeAnalysisAI.getInstance();
            const cachedAnalysis = await tradeAnalysisAI.getLatestCachedAnalysis(user.uid);

            // Get initial metrics
            const metrics = await AnalyticsService.calculatePerformanceMetrics(user.uid);
            console.log('📊 Initial metrics:', {
                profitFactor: metrics.profitFactor.toFixed(2),
                totalPnL: metrics.totalPnL.toFixed(2),
                totalTrades: metrics.totalTrades,
                winRate: `${metrics.winRate.toFixed(2)}%`
            });
            setCurrentMetrics(metrics);

            if (cachedAnalysis) {
                console.log('📋 Loading cached analysis');
                setAnalysis(cachedAnalysis.insights);
                setLastUpdated(cachedAnalysis.timestamp);
                setNeedsUpdate(false);
            } else {
                console.log('🆕 No cached analysis found');
                setNeedsUpdate(true);
            }
        } catch (error) {
            console.error('❌ Error loading initial analysis:', error);
            if (user) {
                setAnalysis('Failed to load analysis. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadAnalysis = async () => {
        if (!user) return;

        console.log('🚀 Starting AI Analysis');
        try {
            setLoading(true);
            let trades;
            let metrics;

            try {
                trades = await TradeService.getUserTrades(user.uid);
                metrics = await AnalyticsService.calculatePerformanceMetrics(user.uid);
                setCurrentMetrics(metrics);
            } catch (error) {
                console.error('❌ Error fetching trades or metrics');
                if (user) {
                    setAnalysis('Failed to load trading data. Please try again later.');
                }
                return;
            }

            const tradeAnalysisAI = TradeAnalysisAI.getInstance();

            const aiAnalysis = await tradeAnalysisAI.analyzeTrading(
                user.uid,
                metrics,
                trades,
                true
            );

            if (user) {
                setAnalysis(aiAnalysis.insights);
                setLastUpdated(aiAnalysis.timestamp);
                setNeedsUpdate(false);

                console.log('✅ AI Analysis Complete:', {
                    profitFactor: metrics.profitFactor.toFixed(2),
                    totalPnL: metrics.totalPnL.toFixed(2),
                    totalTrades: metrics.totalTrades,
                    winRate: `${metrics.winRate.toFixed(2)}%`
                });
            }
        } catch (error) {
            console.error('❌ AI Analysis Failed');
            if (user) {
                setAnalysis('Failed to generate analysis. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatLastUpdated = (date: Date | null) => {
        if (!date) return '';
        return new Date(date).toLocaleString();
    };

    // Don't render anything if user has logged out
    if (!user) {
        return null;
    }

    if (loading) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <ThemedText style={styles.loadingText}>
                    {analysis ? 'Updating analysis...' : 'Creating analysis...'}
                </ThemedText>
            </ThemedView>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <ThemedView style={styles.content}>
                {!analysis ? (
                    <View style={styles.startAnalysisContainer}>
                        <ThemedText style={styles.startAnalysisText}>
                            Get AI-powered insights about your trading performance
                        </ThemedText>
                        <TouchableOpacity
                            style={styles.startAnalysisButton}
                            onPress={loadAnalysis}
                        >
                            <Ionicons name="analytics" size={24} color="white" />
                            <ThemedText style={styles.startAnalysisButtonText}>
                                Analyze My Trades
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        <View style={styles.headerContainer}>
                            <ThemedText style={styles.header}>AI Trade Analysis</ThemedText>
                            <ThemedText style={styles.lastUpdated}>
                                Last updated: {formatLastUpdated(lastUpdated)}
                            </ThemedText>
                        </View>
                        {needsUpdate && (
                            <TouchableOpacity
                                style={styles.updateButton}
                                onPress={loadAnalysis}
                            >
                                <View style={styles.updateButtonContent}>
                                    <Ionicons name="refresh" size={20} color="white" />
                                    <ThemedText style={styles.updateButtonText}>
                                        Trades added/updated or Metrics changed. Refresh Trade Analysis?
                                    </ThemedText>
                                </View>
                            </TouchableOpacity>
                        )}
                        <ThemedText style={styles.analysisText}>{analysis}</ThemedText>
                    </View>
                )}
            </ThemedView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 16,
        margin: 16,
        borderRadius: 12,
        backgroundColor: 'white',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    startAnalysisContainer: {
        alignItems: 'center',
        padding: 20,
    },
    startAnalysisText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    startAnalysisButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2196F3',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    startAnalysisButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    headerContainer: {
        marginBottom: 16,
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    lastUpdated: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    analysisText: {
        fontSize: 15,
        lineHeight: 22,
        color: '#333',
    },
    updateButton: {
        backgroundColor: '#2196F3',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    updateButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    updateButtonText: {
        color: 'white',
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
}); 