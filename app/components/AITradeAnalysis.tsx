import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import ThemedText from './ThemedText';
import ThemedView from './ThemedView';
import TooltipIcon from './TooltipIcon';

export default function AITradeAnalysis() {
    return (
        <ScrollView style={styles.container}>
            <ThemedView style={styles.section}>
                <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionTitle}>AI Trade Analysis</ThemedText>
                    <TooltipIcon text="Get AI-powered insights and recommendations for your trades" />
                </View>
                <ThemedText style={styles.sectionDescription}>
                    Coming soon: AI-powered analysis of your trading patterns and personalized recommendations.
                </ThemedText>
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
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
}); 