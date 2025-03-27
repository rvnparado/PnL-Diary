import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Linking,
} from 'react-native';
import ThemedText from './ThemedText';
import ThemedView from './ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import HybridAnalytics from '../lib/analytics/hybrid';

interface AIInsight {
    overview: {
        winRate: number;
        totalPnL: number;
        bestStrategy: string;
        worstStrategy: string;
        maxDrawdown: number;
    };
    mistakes: {
        description: string;
        impact: number;
        suggestion: string;
    }[];
    strengths: string[];
    recommendations: {
        focus: string[];
        videos: { title: string; url: string }[];
        guides: { title: string; url: string }[];
        tools: { name: string; description: string }[];
    };
    metrics: {
        sharpeRatio: number;
        riskRewardRatio: number;
    };
}

export default function AITradeAnalysis() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [insights, setInsights] = useState<AIInsight | null>(null);

    useEffect(() => {
        loadInsights();
    }, []);

    const loadInsights = async () => {
        try {
            setLoading(true);
            // TODO: Replace with actual AI analysis call
            // For now, using mock data
            const mockInsights: AIInsight = {
                overview: {
                    winRate: 35,
                    totalPnL: -720.5,
                    bestStrategy: "Technical Analysis",
                    worstStrategy: "Support Bounce",
                    maxDrawdown: 189.40,
                },
                mistakes: [
                    {
                        description: "Critical Loss Management Issue",
                        impact: -400.5,
                        suggestion: "Implement strict stop-loss strategy",
                    },
                    {
                        description: "Confirmation Bias",
                        impact: -210,
                        suggestion: "Wait for multiple confirmations before entry",
                    },
                    {
                        description: "Poor Risk Management",
                        impact: -180,
                        suggestion: "Reduce position sizing",
                    },
                ],
                strengths: [
                    "Diverse strategy experimentation",
                    "Technical analysis proficiency",
                    "Range trading potential",
                ],
                recommendations: {
                    focus: [
                        "Implement strict stop-loss strategy",
                        "Reduce position sizing",
                        "Develop clear entry/exit criteria",
                        "Focus on Technical strategy",
                    ],
                    videos: [
                        { title: "How to Set Proper Stop Losses", url: "#" },
                        { title: "Trading Psychology: Controlling Emotions", url: "#" },
                    ],
                    guides: [
                        { title: "Risk Management Fundamentals", url: "#" },
                        { title: "Creating a Trading Plan", url: "#" },
                    ],
                    tools: [
                        { name: "Position Size Calculator", description: "Calculate optimal position sizes" },
                        { name: "Trading Journal Template", description: "Track your trades effectively" },
                    ],
                },
                metrics: {
                    sharpeRatio: -2.31,
                    riskRewardRatio: 0.65,
                },
            };
            setInsights(mockInsights);
        } catch (error) {
            console.error('Error loading insights:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            await loadInsights();
        } finally {
            setRefreshing(false);
        }
    }, []);

    if (!insights) {
        return (
            <View style={styles.container}>
                <ThemedText>Loading insights...</ThemedText>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#2196F3']}
                    tintColor="#2196F3"
                />
            }
        >
            {/* Overview Section */}
            <ThemedView style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="search" size={24} color="#2196F3" />
                    <ThemedText style={styles.sectionTitle}>Trade Insights</ThemedText>
                </View>
                <ThemedText style={styles.overview}>
                    Your overall performance shows challenges with a {insights.overview.winRate}% win rate
                    and a P&L of {insights.overview.totalPnL}. {insights.overview.bestStrategy} appears to be
                    your strongest approach, while {insights.overview.worstStrategy} is underperforming.
                    Your max drawdown of {insights.overview.maxDrawdown}% indicates risk management needs attention.
                </ThemedText>
            </ThemedView>

            {/* Mistakes Section */}
            <ThemedView style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="warning" size={24} color="#FFA000" />
                    <ThemedText style={styles.sectionTitle}>Critical Issues</ThemedText>
                </View>
                {insights.mistakes.map((mistake, index) => (
                    <View key={index} style={styles.mistakeItem}>
                        <ThemedText style={styles.mistakeTitle}>⚠️ {mistake.description}</ThemedText>
                        <ThemedText style={styles.mistakeImpact}>
                            Impact: ${Math.abs(mistake.impact)}
                        </ThemedText>
                        <ThemedText style={styles.mistakeSuggestion}>
                            Fix: {mistake.suggestion}
                        </ThemedText>
                    </View>
                ))}
            </ThemedView>

            {/* Strengths Section */}
            <ThemedView style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    <ThemedText style={styles.sectionTitle}>What You Did Well</ThemedText>
                </View>
                {insights.strengths.map((strength, index) => (
                    <ThemedText key={index} style={styles.strengthItem}>
                        ✅ {strength}
                    </ThemedText>
                ))}
            </ThemedView>

            {/* Recommendations Section */}
            <ThemedView style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="book" size={24} color="#2196F3" />
                    <ThemedText style={styles.sectionTitle}>Next Steps</ThemedText>
                </View>

                <ThemedText style={styles.subsectionTitle}>Focus Areas:</ThemedText>
                {insights.recommendations.focus.map((item, index) => (
                    <ThemedText key={index} style={styles.focusItem}>
                        💡 {item}
                    </ThemedText>
                ))}

                <ThemedText style={styles.subsectionTitle}>Recommended Videos:</ThemedText>
                {insights.recommendations.videos.map((video, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.linkItem}
                        onPress={() => Linking.openURL(video.url)}
                    >
                        <Ionicons name="videocam" size={16} color="#2196F3" />
                        <ThemedText style={styles.linkText}>{video.title}</ThemedText>
                    </TouchableOpacity>
                ))}

                <ThemedText style={styles.subsectionTitle}>Helpful Guides:</ThemedText>
                {insights.recommendations.guides.map((guide, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.linkItem}
                        onPress={() => Linking.openURL(guide.url)}
                    >
                        <Ionicons name="document-text" size={16} color="#2196F3" />
                        <ThemedText style={styles.linkText}>{guide.title}</ThemedText>
                    </TouchableOpacity>
                ))}

                <ThemedText style={styles.subsectionTitle}>Useful Tools:</ThemedText>
                {insights.recommendations.tools.map((tool, index) => (
                    <View key={index} style={styles.toolItem}>
                        <ThemedText style={styles.toolName}>{tool.name}</ThemedText>
                        <ThemedText style={styles.toolDescription}>{tool.description}</ThemedText>
                    </View>
                ))}
            </ThemedView>

            {/* Metrics Section */}
            <ThemedView style={[styles.section, styles.metricsSection]}>
                <View style={styles.metricItem}>
                    <ThemedText style={styles.metricValue}>{insights.metrics.sharpeRatio}</ThemedText>
                    <ThemedText style={styles.metricLabel}>Sharpe Ratio</ThemedText>
                </View>
                <View style={styles.metricItem}>
                    <ThemedText style={styles.metricValue}>{insights.metrics.riskRewardRatio}</ThemedText>
                    <ThemedText style={styles.metricLabel}>Risk/Reward Ratio</ThemedText>
                </View>
            </ThemedView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        margin: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    overview: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
    },
    mistakeItem: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#FFF3E0',
        borderRadius: 8,
    },
    mistakeTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#F57C00',
        marginBottom: 4,
    },
    mistakeImpact: {
        fontSize: 14,
        color: '#D32F2F',
        marginBottom: 4,
    },
    mistakeSuggestion: {
        fontSize: 14,
        color: '#333',
    },
    strengthItem: {
        fontSize: 16,
        marginBottom: 8,
        color: '#333',
    },
    subsectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
        color: '#333',
    },
    focusItem: {
        fontSize: 15,
        marginBottom: 8,
        color: '#333',
    },
    linkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        marginBottom: 4,
    },
    linkText: {
        fontSize: 15,
        color: '#2196F3',
        marginLeft: 8,
    },
    toolItem: {
        marginBottom: 12,
    },
    toolName: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 2,
        color: '#333',
    },
    toolDescription: {
        fontSize: 14,
        color: '#666',
    },
    metricsSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    metricItem: {
        alignItems: 'center',
    },
    metricValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    metricLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
}); 