import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import ThemedText from './ThemedText';
import ThemedView from './ThemedView';

export default function CustomMetricsDashboard() {
    return (
        <ScrollView style={styles.container}>
            <ThemedView style={styles.content}>
                <ThemedText style={styles.header}>🔍 Trade Insights:</ThemedText>
                <ThemedText style={styles.paragraph}>
                    Hey trader, I just analyzed your recent trades, and here's what I found! 🚀{"\n\n"}
                    Your overall performance is showing challenges with a 35% win rate and a negative P&L of -720.5.{"\n"}
                    Technical analysis appears to be your strongest approach (P&L: +220, Win rate: 50%).{"\n"}
                    Support Bounce strategy is underperforming significantly (P&L: -250, Win rate: 25%).{"\n"}
                    Your risk management needs immediate attention – your max drawdown of 189.40% indicates you're risking too much capital.
                </ThemedText>

                <ThemedText style={styles.header}>{"\n"}🚨 Mistakes & Fixes:</ThemedText>
                <ThemedText style={styles.paragraph}>
                    ⚠️ Critical Loss Management Issue: One trade resulted in a -400.5 loss because you didn't cut losses early. This single trade represents over 55% of your total losses.{"\n\n"}
                    ⚠️ Confirmation Bias: 5 trades were entered without proper confirmation, costing you -210.{"\n\n"}
                    ⚠️ Poor Risk Management: Your Risk/Reward ratio of 0.65 shows you're taking larger risks for smaller potential rewards.{"\n\n"}
                    ⚠️ Emotional Trading: This cost you -180 across just 2 trades – indicating significant psychological impact on your decision-making.
                </ThemedText>

                <ThemedText style={styles.header}>{"\n"}✅ What You Did Well:</ThemedText>
                <ThemedText style={styles.paragraph}>
                    • You're experimenting with diverse trading strategies (9 different approaches){"\n"}
                    • Your Range and Technical trading showed potential with 50% win rates
                </ThemedText>

                <ThemedText style={styles.header}>{"\n"}📚 Next Steps → Keep Improving!</ThemedText>
                <ThemedText style={styles.subheader}>💡 Immediate Focus Areas:</ThemedText>
                <ThemedText style={styles.paragraph}>
                    • Implement a strict stop-loss strategy to prevent catastrophic losses like your -400.5 trade{"\n"}
                    • Reduce position sizing to bring your max drawdown below 20% of capital{"\n"}
                    • Develop a trading plan with clear entry/exit criteria before entering trades{"\n"}
                    • Focus on your Technical strategy which showed positive results
                </ThemedText>

                <ThemedText style={styles.subheader}>{"\n"}📺 Videos:</ThemedText>
                <ThemedText style={styles.paragraph}>
                    • How to Set Proper Stop Losses Every Time{"\n"}
                    • Trading Psychology: Controlling Emotions in Trading
                </ThemedText>

                <ThemedText style={styles.subheader}>{"\n"}📖 Guides:</ThemedText>
                <ThemedText style={styles.paragraph}>
                    • Risk Management Fundamentals{"\n"}
                    • How to Create a Trading Plan
                </ThemedText>

                <ThemedText style={styles.subheader}>{"\n"}📊 Tools:</ThemedText>
                <ThemedText style={styles.paragraph}>
                    • Position Size Calculator{"\n"}
                    • Trading Journal Template
                </ThemedText>

                <ThemedText style={styles.paragraph}>{"\n"}Your negative Sharpe ratio (-2.31) indicates high risk for the returns. Focus on consistency and risk management first, and results will follow. Remember that even professional traders typically only win 40-60% of trades – it's managing the risk that makes the difference! 🚀📈</ThemedText>
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
    },
    header: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    subheader: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    paragraph: {
        fontSize: 15,
        lineHeight: 22,
        color: '#333',
    },
}); 