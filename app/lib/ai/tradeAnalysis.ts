import { PerformanceMetrics } from '../analytics';
import { Trade } from '../trades';
import Anthropic from '@anthropic-ai/sdk';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const ANTHROPIC_API_KEY = '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';

const anthropic = new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
});

const db = getFirestore();

const SYSTEM_PROMPT = `You are an AI-powered trading insights assistant for PnLDiary.  
Your role is to **analyze a user's trading history and provide structured feedback** to help them improve.  
You are **not a chatbot**—your response should be a **single, well-organized output** with no follow-up questions.  

## Response Guidelines:  
- **Analyze** the user's trading behavior and identify patterns, mistakes, and strengths.  
- **Detect common pitfalls** (e.g., overtrading, weak risk management) and suggest improvements.  
- **Use a friendly and supportive tone** to keep traders engaged and motivated.  
- **Keep responses structured and simple**—no unnecessary complexity.  
- **Include a "Next Steps" section** with free, high-quality learning materials based on user skill level.  
- **No links to paid books, courses, or subscriptions.**  

---

## 📌 **Response Format Example:**  

**🔍 Trade Insights:**  
Hey [User's Name], I just analyzed your recent trades, and here's what I found! 🚀  

- **Your trend-following trades were strong** (Win rate: 68%). Keep refining this! 📈  
- **Your countertrend trades had losses (-3.8% PnL).** You might want to rethink this strategy.  
- **Your trade exits seem rushed**—You're closing too early (avg. hold: 2.5 min, optimal 6+ min).  

---

**🚨 Mistakes & Fixes:**  
⚠️ **Overtrading Alert!** You took 20+ trades in a session. Consider limiting to 5-7 high-quality trades.  
⚠️ **Risk Management Issue:** Some trades had inconsistent position sizing. Try a **fixed risk per trade approach (e.g., 1% of capital).**  

✅ **What You Did Well:**  
- You executed **clean breakout trades**—this is a strong point!  
- You avoided revenge trading—Nice discipline! 🎯  

---

**📚 Next Steps → Keep Improving!**  
💡 **For Traders Looking to Improve (Win Rate Below 50%)**  
📺 **Video:** [Trading Psychology: How to Avoid Emotional Mistakes](https://www.youtube.com/watch?v=Gpf-KKysT3c)  
📖 **Guide:** [Risk Management 101: How to Protect Your Capital](https://www.investopedia.com/articles/trading/08/risk-management.asp)  
📊 **Tool:** [Free Paper Trading Simulator](https://www.tradingview.com/chart/) (Practice without risk)  

🔥 **For Consistent Traders Seeking Refinement (Win Rate Above 50%)**  
📺 **Video:** [Advanced Trading Strategies: Refining Entries & Exits](https://www.youtube.com/watch?v=r5QspAP8tCw)  
📖 **Guide:** [Institutional Order Flow & Liquidity Zones](https://www.investopedia.com/terms/o/order-flow-trading.asp)  
📊 **Tool:** [Live Market Heatmap for Better Trade Selection](https://www.tradingview.com/heatmap/)  

Trading is a journey, not a race—focus on consistency! Keep refining your strategies, and you'll improve over time. 🚀📈`;

export interface AIAnalysisResponse {
    insights: string;
    timestamp: Date;
    userId: string;
    metrics: PerformanceMetrics;
}

interface FirestoreAnalysis {
    insights: string;
    timestamp: number;
    userId: string;
    metrics: PerformanceMetrics;
}

class TradeAnalysisAI {
    private static instance: TradeAnalysisAI;
    private analysisCache: Map<string, { response: AIAnalysisResponse; timestamp: number }> = new Map();

    private constructor() { }

    static getInstance(): TradeAnalysisAI {
        if (!TradeAnalysisAI.instance) {
            TradeAnalysisAI.instance = new TradeAnalysisAI();
        }
        return TradeAnalysisAI.instance;
    }

    private haveMetricsChanged(oldMetrics: PerformanceMetrics | undefined, newMetrics: PerformanceMetrics | undefined): boolean {
        // If either metrics is undefined, consider it as not changed
        if (!oldMetrics || !newMetrics) {
            console.log('⚠️ One of the metrics is undefined, skipping comparison');
            return false;
        }

        // Check required fields
        if (
            typeof oldMetrics.totalTrades === 'undefined' ||
            typeof oldMetrics.winRate === 'undefined' ||
            typeof oldMetrics.totalPnL === 'undefined' ||
            typeof oldMetrics.averagePnL === 'undefined' ||
            typeof oldMetrics.profitFactor === 'undefined' ||
            typeof oldMetrics.maxDrawdown === 'undefined' ||
            typeof newMetrics.totalTrades === 'undefined' ||
            typeof newMetrics.winRate === 'undefined' ||
            typeof newMetrics.totalPnL === 'undefined' ||
            typeof newMetrics.averagePnL === 'undefined' ||
            typeof newMetrics.profitFactor === 'undefined' ||
            typeof newMetrics.maxDrawdown === 'undefined'
        ) {
            console.log('⚠️ Missing required fields, skipping comparison');
            return false;
        }

        try {
            // Compare numeric values with tolerance for floating point differences
            const hasNumericChanges = (
                oldMetrics.totalTrades !== newMetrics.totalTrades ||
                Math.abs(oldMetrics.winRate - newMetrics.winRate) > 0.0001 ||
                Math.abs(oldMetrics.totalPnL - newMetrics.totalPnL) > 0.0001 ||
                Math.abs(oldMetrics.averagePnL - newMetrics.averagePnL) > 0.0001 ||
                Math.abs(oldMetrics.profitFactor - newMetrics.profitFactor) > 0.0001 ||
                Math.abs(oldMetrics.maxDrawdown - newMetrics.maxDrawdown) > 0.0001
            );

            // Compare arrays only if they exist
            const hasStrategyChanges =
                (oldMetrics.mostProfitableStrategies && newMetrics.mostProfitableStrategies) ?
                    JSON.stringify(oldMetrics.mostProfitableStrategies) !== JSON.stringify(newMetrics.mostProfitableStrategies) :
                    false;

            const hasMistakeChanges =
                (oldMetrics.commonMistakes && newMetrics.commonMistakes) ?
                    JSON.stringify(oldMetrics.commonMistakes) !== JSON.stringify(newMetrics.commonMistakes) :
                    false;

            const hasChanged = hasNumericChanges || hasStrategyChanges || hasMistakeChanges;

            if (hasChanged) {
                console.log('📊 Detected genuine metrics changes');
                // Log the specific changes for debugging
                if (hasNumericChanges) console.log('📈 Numeric metrics have changed');
                if (hasStrategyChanges) console.log('🎯 Strategy metrics have changed');
                if (hasMistakeChanges) console.log('⚠️ Mistake metrics have changed');
            } else {
                console.log('✨ No significant metrics changes detected');
            }

            return hasChanged;
        } catch (error) {
            console.error('❌ Error comparing metrics:', error);
            // If there's an error comparing, consider it as not changed
            return false;
        }
    }

    private async loadFromFirestore(userId: string): Promise<AIAnalysisResponse | null> {
        try {
            const docRef = doc(db, 'aiAnalysis', userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data() as FirestoreAnalysis;
                console.log('📥 Loaded analysis from Firestore for user:', userId);
                return {
                    insights: data.insights,
                    timestamp: new Date(data.timestamp),
                    userId: data.userId,
                    metrics: data.metrics
                };
            }
            return null;
        } catch (error) {
            console.error('❌ Error loading from Firestore:', error);
            return null;
        }
    }

    private async saveToFirestore(analysis: AIAnalysisResponse): Promise<void> {
        try {
            const docRef = doc(db, 'aiAnalysis', analysis.userId);
            await setDoc(docRef, {
                insights: analysis.insights,
                timestamp: Date.now(),
                userId: analysis.userId,
                metrics: analysis.metrics
            });
            console.log('💾 Saved analysis to Firestore for user:', analysis.userId);
        } catch (error) {
            console.error('❌ Error saving to Firestore:', error);
        }
    }

    private formatTradeData(metrics: PerformanceMetrics | undefined, trades: Trade[]): string {
        try {
            const tradeData = {
                performance: metrics ? {
                    totalTrades: metrics.totalTrades,
                    winRate: metrics.winRate,
                    totalPnL: metrics.totalPnL,
                    averagePnL: metrics.averagePnL,
                    profitFactor: metrics.profitFactor,
                    sharpeRatio: metrics.sharpeRatio,
                    maxDrawdown: metrics.maxDrawdown,
                    riskRewardRatio: metrics.riskRewardRatio,
                } : null,
                strategies: metrics?.mostProfitableStrategies || [],
                mistakes: metrics?.commonMistakes || [],
                indicators: metrics?.mostUsedIndicators || [],
                behavioralPatterns: metrics?.behavioralPatterns || [],
                recentTrades: trades.slice(-10).map(trade => ({
                    pair: trade.pair,
                    type: trade.type,
                    entryPrice: trade.entryPrice,
                    exitPrice: trade.exitPrice,
                    quantity: trade.quantity,
                    pnl: trade.profitLoss,
                    strategy: trade.strategy,
                    mistakes: trade.mistakes,
                })),
            };

            return JSON.stringify(tradeData, null, 2);
        } catch (error) {
            console.error('❌ Error formatting trade data:', error);
            return JSON.stringify({ error: 'Failed to format trade data' });
        }
    }

    async analyzeTrading(
        userId: string,
        metrics: PerformanceMetrics,
        trades: Trade[],
        forceRefresh: boolean = false
    ): Promise<AIAnalysisResponse> {
        try {
            console.log('📊 Generating new AI analysis for user:', userId);
            const tradeData = this.formatTradeData(metrics, trades);

            const message = await anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 4000,
                temperature: 0.7,
                system: SYSTEM_PROMPT,
                messages: [{
                    role: 'user',
                    content: `I want you to analyze the trading analytics of User ID: ${userId}.\n\nHere's the trading data:\n${tradeData}`,
                }],
            });

            console.log('✅ Successfully received AI analysis response');

            const analysis: AIAnalysisResponse = {
                insights: message.content[0].type === 'text' ? message.content[0].text : 'No analysis available',
                timestamp: new Date(),
                userId,
                metrics
            };

            // Save to both memory cache and Firestore
            this.analysisCache.set(userId, {
                response: analysis,
                timestamp: Date.now(),
            });
            await this.saveToFirestore(analysis);

            return analysis;
        } catch (error) {
            console.error('❌ Error analyzing trades:', error);
            throw new Error('Failed to analyze trades');
        }
    }

    async shouldUpdateAnalysis(userId: string, currentMetrics: PerformanceMetrics | undefined): Promise<boolean> {
        try {
            const cachedAnalysis = await this.getLatestCachedAnalysis(userId);

            // If no analysis exists, we should create one
            if (!cachedAnalysis) {
                console.log('📝 No existing analysis found - should create new analysis');
                return true;
            }

            // If we have analysis but no current metrics, don't update
            if (!currentMetrics) {
                console.log('⚠️ Current metrics are undefined - keeping existing analysis');
                return false;
            }

            // Compare metrics
            const metricsChanged = this.haveMetricsChanged(cachedAnalysis.metrics, currentMetrics);
            if (metricsChanged) {
                console.log('📊 Confirmed metrics changes - should update analysis');
                return true;
            }

            console.log('✨ No updates needed - using existing analysis');
            return false;
        } catch (error) {
            console.error('❌ Error checking if analysis should update:', error);
            // If there's an error, don't suggest an update
            return false;
        }
    }

    async getLatestCachedAnalysis(userId: string): Promise<AIAnalysisResponse | null> {
        // First check memory cache
        const memoryCache = this.analysisCache.get(userId);
        if (memoryCache) {
            console.log('📋 Using memory-cached analysis for user:', userId);
            return memoryCache.response;
        }

        // If not in memory, try Firestore
        const firestoreAnalysis = await this.loadFromFirestore(userId);
        if (firestoreAnalysis) {
            // Update memory cache
            this.analysisCache.set(userId, {
                response: firestoreAnalysis,
                timestamp: firestoreAnalysis.timestamp.getTime(),
            });
            return firestoreAnalysis;
        }

        return null;
    }

    async hasCachedAnalysis(userId: string): Promise<boolean> {
        const analysis = await this.getLatestCachedAnalysis(userId);
        return analysis !== null;
    }
}

export default TradeAnalysisAI; 