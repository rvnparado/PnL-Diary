import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Trade } from './trades';

export interface PerformanceMetrics {
    userId: string;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate: Date;
    endDate: Date;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalPnL: number;
    averagePnL: number;
    largestWin: number;
    largestLoss: number;
    commonMistakes: { mistake: string; count: number }[];
    mostProfitableStrategies: { strategy: string; pnl: number }[];
    mostUsedIndicators: { indicator: string; count: number }[];
    createdAt: Date;
}

const ANALYTICS_COLLECTION = 'analytics';

export async function calculatePerformanceMetrics(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    startDate: Date,
    endDate: Date
): Promise<PerformanceMetrics> {
    try {
        // Get all closed trades within the date range
        const tradesQuery = query(
            collection(db, 'trades'),
            where('userId', '==', userId),
            where('status', '==', 'CLOSED'),
            where('closedAt', '>=', startDate),
            where('closedAt', '<=', endDate),
            orderBy('closedAt', 'asc')
        );

        const querySnapshot = await getDocs(tradesQuery);
        const trades = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Trade);

        // Calculate basic metrics
        const totalTrades = trades.length;
        const winningTrades = trades.filter(t => calculatePnL(t) > 0).length;
        const losingTrades = trades.filter(t => calculatePnL(t) < 0).length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

        // Calculate PnL metrics
        const pnlArray = trades.map(calculatePnL);
        const totalPnL = pnlArray.reduce((sum, pnl) => sum + pnl, 0);
        const averagePnL = totalTrades > 0 ? totalPnL / totalTrades : 0;
        const largestWin = Math.max(0, ...pnlArray);
        const largestLoss = Math.min(0, ...pnlArray);

        // Analyze mistakes
        const mistakesMap = new Map<string, number>();
        trades.forEach(trade => {
            trade.mistakes.forEach(mistake => {
                mistakesMap.set(mistake, (mistakesMap.get(mistake) || 0) + 1);
            });
        });
        const commonMistakes = Array.from(mistakesMap.entries())
            .map(([mistake, count]) => ({ mistake, count }))
            .sort((a, b) => b.count - a.count);

        // Analyze strategies
        const strategyPnL = new Map<string, number>();
        trades.forEach(trade => {
            const pnl = calculatePnL(trade);
            trade.strategy.forEach(strategy => {
                strategyPnL.set(strategy, (strategyPnL.get(strategy) || 0) + pnl);
            });
        });
        const mostProfitableStrategies = Array.from(strategyPnL.entries())
            .map(([strategy, pnl]) => ({ strategy, pnl }))
            .sort((a, b) => b.pnl - a.pnl);

        // Analyze indicators
        const indicatorsMap = new Map<string, number>();
        trades.forEach(trade => {
            trade.indicators.forEach(indicator => {
                indicatorsMap.set(indicator, (indicatorsMap.get(indicator) || 0) + 1);
            });
        });
        const mostUsedIndicators = Array.from(indicatorsMap.entries())
            .map(([indicator, count]) => ({ indicator, count }))
            .sort((a, b) => b.count - a.count);

        const metrics: PerformanceMetrics = {
            userId,
            period,
            startDate,
            endDate,
            totalTrades,
            winningTrades,
            losingTrades,
            winRate,
            totalPnL,
            averagePnL,
            largestWin,
            largestLoss,
            commonMistakes,
            mostProfitableStrategies,
            mostUsedIndicators,
            createdAt: new Date(),
        };

        // Store the metrics
        await addDoc(collection(db, ANALYTICS_COLLECTION), metrics);

        return metrics;
    } catch (error) {
        console.error('Error calculating performance metrics:', error);
        throw error;
    }
}

function calculatePnL(trade: Trade): number {
    const multiplier = trade.type === 'LONG' ? 1 : -1;
    return (trade.exitPrice - trade.entryPrice) * trade.quantity * multiplier;
}

export async function getPerformanceHistory(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    limit: number = 10
): Promise<PerformanceMetrics[]> {
    try {
        const metricsQuery = query(
            collection(db, ANALYTICS_COLLECTION),
            where('userId', '==', userId),
            where('period', '==', period),
            orderBy('startDate', 'desc'),
            limit
        );

        const querySnapshot = await getDocs(metricsQuery);
        return querySnapshot.docs.map(doc => doc.data() as PerformanceMetrics);
    } catch (error) {
        console.error('Error fetching performance history:', error);
        throw error;
    }
}

const AnalyticsService = {
    calculatePerformanceMetrics,
    getPerformanceHistory,
};

export default AnalyticsService; 