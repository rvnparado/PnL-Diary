import { collection, query, where, getDocs, addDoc, orderBy, limit, QueryConstraint } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Trade as BaseTradeType } from './trades';
import TradeService from './trades';
import { calculatePnL } from './pnl';

export type Trade = BaseTradeType & {
    emotionalState: string;
    capital: number;
};

export interface PerformanceMetrics {
    userId: string;
    period: 'all-time' | 'daily' | 'weekly' | 'monthly' | 'yearly';
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
    profitFactor: number;
    sharpeRatio: number;
    maxDrawdown: number;
    averageWinSize: number;
    averageLossSize: number;
    riskRewardRatio: number;
    commonMistakes: { description: string; count: number; impact: number }[];
    mostProfitableStrategies: { strategy: string; pnl: number; winRate: number }[];
    mostUsedIndicators: { indicator: string; count: number; successRate: number }[];
    behavioralPatterns: {
        timeOfDay: { [key: string]: { trades: number; winRate: number } };
        emotionalState: { [key: string]: { trades: number; winRate: number } };
        overallConfidence: number;
        riskManagement: number;
    };
    createdAt: Date;
    isDefaultData: boolean;
}

export interface BehavioralAnalysis {
    emotionalBias: {
        overconfidence: number;
        fearAndGreed: number;
        consistency: number;
    };
    tradingHabits: {
        timeManagement: number;
        riskManagement: number;
        discipline: number;
    };
    overallScore: number;
}

const ANALYTICS_COLLECTION = 'analytics';

const DEFAULT_METRICS: PerformanceMetrics = {
    userId: '',
    period: 'all-time',
    startDate: new Date(0), // Unix epoch for all-time
    endDate: new Date(),
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    totalPnL: 0,
    averagePnL: 0,
    largestWin: 0,
    largestLoss: 0,
    profitFactor: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    averageWinSize: 0,
    averageLossSize: 0,
    riskRewardRatio: 0,
    commonMistakes: [
        { description: 'No data yet', count: 0, impact: 0 }
    ],
    mostProfitableStrategies: [
        { strategy: 'No strategies yet', pnl: 0, winRate: 0 }
    ],
    mostUsedIndicators: [
        { indicator: 'No indicators yet', count: 0, successRate: 0 }
    ],
    behavioralPatterns: {
        timeOfDay: {
            'No data': { trades: 0, winRate: 0 }
        },
        emotionalState: {
            'No data': { trades: 0, winRate: 0 }
        },
        overallConfidence: 0,
        riskManagement: 0
    },
    createdAt: new Date(),
    isDefaultData: true
};

function calculatePercentage(trade: Trade): number {
    if (!trade.exitPrice || trade.status !== 'CLOSED') return 0;
    const pnl = calculatePnL(trade);
    const investment = trade.entryPrice * trade.quantity;
    return Number((pnl / investment * 100).toFixed(2));
}

function calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.02): number {
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(
        returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length
    );
    return stdDev === 0 ? 0 : (meanReturn - riskFreeRate) / stdDev;
}

function calculateMaxDrawdown(pnlHistory: number[]): number {
    let maxDrawdown = 0;
    let peak = pnlHistory[0];

    for (const pnl of pnlHistory) {
        if (pnl > peak) {
            peak = pnl;
        }
        const drawdown = (peak - pnl) / peak;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return maxDrawdown;
}

function analyzeBehavioralPatterns(trades: Trade[]): BehavioralAnalysis {
    try {
        if (!trades || trades.length === 0) {
            return {
                emotionalBias: {
                    overconfidence: 0,
                    fearAndGreed: 0,
                    consistency: 0
                },
                tradingHabits: {
                    timeManagement: 0,
                    riskManagement: 0,
                    discipline: 0
                },
                overallScore: 0
            };
        }

        // Calculate emotional bias metrics
        const overconfidence = calculateFearAndGreedIndex(trades);
        const fearAndGreed = calculateFearAndGreedIndex(trades);
        const consistency = calculateConsistencyScore(trades);

        // Calculate trading habits metrics
        const timeManagement = calculateTimeManagementScore(trades);
        const riskManagement = calculateRiskManagementScore(trades);
        const discipline = calculateDisciplineScore(trades);

        // Calculate overall score (average of consistency and discipline)
        const overallScore = (consistency + discipline) / 2;

        return {
            emotionalBias: {
                overconfidence,
                fearAndGreed,
                consistency
            },
            tradingHabits: {
                timeManagement,
                riskManagement,
                discipline
            },
            overallScore
        };
    } catch (error) {
        // console.error('Error in analyzeBehavioralPatterns:', error);
        return {
            emotionalBias: {
                overconfidence: 0,
                fearAndGreed: 0,
                consistency: 0
            },
            tradingHabits: {
                timeManagement: 0,
                riskManagement: 0,
                discipline: 0
            },
            overallScore: 0
        };
    }
}

function calculateFearAndGreedIndex(trades: Trade[]): number {
    try {
        if (!trades || trades.length === 0) return 0;

        // Count early exits on winning trades
        const earlyExitCount = trades.filter(trade =>
            trade.profitLoss > 0 &&
            trade.mistakes &&
            trade.mistakes.some(m => m.toLowerCase().includes('early'))
        ).length;

        // Calculate percentage of trades with early exits
        const fearIndex = earlyExitCount / trades.length;

        // Return a score between 0-1 (inverted - higher is better)
        return Math.max(0, Math.min(1, 1 - fearIndex));
    } catch (error) {
        // console.error('Error in calculateFearAndGreedIndex:', error);
        return 0;
    }
}

function calculateConsistencyScore(trades: Trade[]): number {
    try {
        if (!trades || trades.length < 5) return 0;

        // Group trades by strategy
        const strategyGroups = new Map<string, number>();
        trades.forEach(trade => {
            if (Array.isArray(trade.strategy)) {
                trade.strategy.forEach(strategy => {
                    if (strategy && strategy.trim()) {
                        strategyGroups.set(strategy, (strategyGroups.get(strategy) || 0) + 1);
                    }
                });
            }
        });

        // Calculate consistency score based on strategy focus
        const totalTrades = trades.length;
        const mostUsedStrategy = Math.max(...Array.from(strategyGroups.values()), 0);
        const consistencyScore = mostUsedStrategy / totalTrades;

        return Math.min(1, consistencyScore);
    } catch (error) {
        // console.error('Error in calculateConsistencyScore:', error);
        return 0;
    }
}

function calculateTimeManagementScore(trades: Trade[]): number {
    try {
        if (!trades || trades.length === 0) return 0;

        // Group trades by day to see how many trades per day
        const tradesPerDay = new Map<string, number>();
        trades.forEach(trade => {
            if (!(trade.createdAt instanceof Date)) return;

            const date = trade.createdAt.toDateString();
            tradesPerDay.set(date, (tradesPerDay.get(date) || 0) + 1);
        });

        if (tradesPerDay.size === 0) return 0;

        const avgTradesPerDay = Array.from(tradesPerDay.values()).reduce((sum, count) => sum + count, 0) / tradesPerDay.size;

        // Score decreases if averaging more than 5 trades per day (potentially overtrading)
        return Math.min(5 / Math.max(avgTradesPerDay, 1), 1);
    } catch (error) {
        // console.error('Error in calculateTimeManagementScore:', error);
        return 0;
    }
}

function calculateRiskManagementScore(trades: Trade[]): number {
    try {
        if (!trades || trades.length === 0) return 0;

        let validTrades = 0;
        const score = trades.reduce((sum, trade) => {
            if (typeof trade.profitLoss !== 'number' || typeof trade.capital !== 'number' || trade.capital === 0) {
                return sum;
            }

            validTrades++;
            const riskPercent = (Math.abs(trade.profitLoss) / trade.capital) * 100;

            // Good risk management if risking 2% or less per trade
            return sum + (riskPercent <= 2 ? 1 : 0);
        }, 0);

        return validTrades === 0 ? 0 : score / validTrades;
    } catch (error) {
        // console.error('Error in calculateRiskManagementScore:', error);
        return 0;
    }
}

function calculateDisciplineScore(trades: Trade[]): number {
    try {
        if (!trades || trades.length === 0) return 0;

        return trades.reduce((sum, trade) => {
            let tradeScore = 0;

            // Following strategy (has strategy defined)
            if (Array.isArray(trade.strategy) && trade.strategy.length > 0) {
                tradeScore += 0.4;
            }

            // Having notes (documenting the trade)
            if (trade.notes && trade.notes.trim() !== '') {
                tradeScore += 0.3;
            }

            // Using indicators (trading with analysis)
            if (Array.isArray(trade.indicators) && trade.indicators.length > 0) {
                tradeScore += 0.3;
            }

            return sum + tradeScore;
        }, 0) / trades.length;
    } catch (error) {
        // console.error('Error in calculateDisciplineScore:', error);
        return 0;
    }
}

async function getCachedMetrics(userId: string): Promise<PerformanceMetrics> {
    try {
        const metricsQuery = query(
            collection(db, ANALYTICS_COLLECTION),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(1)
        );

        const querySnapshot = await getDocs(metricsQuery);
        if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            // Convert date fields from Firestore Timestamps to JavaScript Dates
            return {
                ...data,
                startDate: data.startDate?.toDate() || new Date(),
                endDate: data.endDate?.toDate() || new Date(),
                createdAt: data.createdAt?.toDate() || new Date()
            } as PerformanceMetrics;
        }

        // If no metrics found, create default metrics with the user's ID
        const defaultMetrics = {
            ...DEFAULT_METRICS,
            userId,
            createdAt: new Date()
        };

        // Store default metrics
        await addDoc(collection(db, ANALYTICS_COLLECTION), defaultMetrics);
        return defaultMetrics;
    } catch (error) {
        // console.error('Error getting cached metrics:', error);
        return { ...DEFAULT_METRICS, userId };
    }
}

export async function calculatePerformanceMetrics(
    userId: string,
    period: 'all-time' | 'daily' | 'weekly' | 'monthly' | 'yearly' = 'all-time',
    startDate: Date | null = null,
    endDate: Date | null = null
): Promise<PerformanceMetrics> {
    try {
        // Get trades collection reference
        const tradesRef = collection(db, 'trades');

        // Query for user's trades
        const q = query(tradesRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);

        // Get all trades first
        const allTrades = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const trade = {
                id: doc.id,
                userId: data.userId,
                pair: data.pair || '',
                type: data.type || 'BUY',
                status: data.status || 'OPEN',
                entryPrice: Number(data.entryPrice || 0),
                exitPrice: data.exitPrice ? Number(data.exitPrice) : null,
                quantity: Number(data.quantity || 0),
                strategy: Array.isArray(data.strategy) ? data.strategy : [],
                indicators: Array.isArray(data.indicators) ? data.indicators : [],
                notes: data.notes || '',
                mistakes: Array.isArray(data.mistakes) ? data.mistakes : [],
                reason: data.reason || '',
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
                closedAt: data.closedAt?.toDate(),
                result: data.result || 'UNKNOWN',
                profitLoss: Number(data.profitLoss || 0),
                profitLossPercentage: Number(data.profitLossPercentage || 0),
                tags: Array.isArray(data.tags) ? data.tags : [],
                emotionalState: data.emotionalState || 'neutral',
                capital: Number(data.capital || 10000)
            } as Trade;

            return trade;
        });

        // Categorize trades
        const tradeCategorization = allTrades.reduce((acc, trade) => {
            if (trade.status === 'OPEN' && !trade.exitPrice) {
                acc.openTrades.push(trade);
                return acc;
            }

            if (trade.status === 'CLOSED' && trade.exitPrice && trade.exitPrice > 0) {
                const pnl = calculatePnL(trade);

                if (pnl > 0) {
                    acc.winningTrades.push(trade);
                } else if (pnl < 0) {
                    acc.losingTrades.push(trade);
                } else {
                    acc.breakEvenTrades.push(trade);
                }
                return acc;
            }

            acc.invalidTrades.push(trade);
            return acc;
        }, {
            openTrades: [] as Trade[],
            winningTrades: [] as Trade[],
            losingTrades: [] as Trade[],
            breakEvenTrades: [] as Trade[],
            invalidTrades: [] as Trade[]
        });

        // All closed trades (winning + losing + breakEven)
        const closedTrades = [
            ...tradeCategorization.winningTrades,
            ...tradeCategorization.losingTrades,
            ...tradeCategorization.breakEvenTrades
        ];

        // If we have no closed trades, return default metrics
        if (closedTrades.length === 0) {
            return {
                ...DEFAULT_METRICS,
                userId,
                period,
                startDate: startDate || new Date(0),
                endDate: endDate || new Date(),
                totalTrades: allTrades.length,
                createdAt: new Date(),
                isDefaultData: true
            };
        }

        // Calculate metrics using the categorized trades
        const winningTrades = tradeCategorization.winningTrades.length;
        const losingTrades = tradeCategorization.losingTrades.length;
        const totalTrades = allTrades.length;

        // Win rate based on closed trades only
        const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;

        // Total PnL is sum of all closed trade PnLs
        const pnlArray = closedTrades.map(trade => calculatePnL(trade));

        // Total PnL is sum of all closed trade PnLs
        const totalPnL = Number(pnlArray.reduce((sum, pnl) => sum + pnl, 0).toFixed(2));

        // Average PnL per closed trade
        const averagePnL = closedTrades.length > 0 ? Number((totalPnL / closedTrades.length).toFixed(2)) : 0;

        // Largest win/loss from closed trades
        const largestWin = Number(Math.max(0, ...pnlArray).toFixed(2));
        const largestLoss = Number(Math.min(0, ...pnlArray).toFixed(2));

        // Calculate profit factor (absolute ratio of winning to losing trades)
        const grossProfit = pnlArray.filter(pnl => pnl > 0).reduce((sum, pnl) => sum + pnl, 0);
        const grossLoss = Math.abs(pnlArray.filter(pnl => pnl < 0).reduce((sum, pnl) => sum + pnl, 0));
        const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? Number(grossProfit.toFixed(2)) : 0) : Number((grossProfit / grossLoss).toFixed(2));

        // Calculate advanced metrics
        const returns = pnlArray.map(pnl => pnl / (closedTrades[0]?.capital || 10000));
        const sharpeRatio = calculateSharpeRatio(returns);
        const maxDrawdown = calculateMaxDrawdown(pnlArray);
        const averageWinSize = winningTrades > 0 ? grossProfit / winningTrades : 0;
        const averageLossSize = losingTrades > 0 ? grossLoss / losingTrades : 0;
        const riskRewardRatio = averageLossSize === 0 ? (averageWinSize > 0 ? 100 : 0) : averageWinSize / averageLossSize;

        // Analyze mistakes and their impact
        const mistakesAnalysis = new Map<string, { count: number; totalPnL: number }>();
        closedTrades.forEach(trade => {
            const pnl = calculatePnL(trade);
            if (Array.isArray(trade.mistakes)) {
                trade.mistakes.forEach(mistake => {
                    if (mistake && mistake.trim() !== '') {
                        const current = mistakesAnalysis.get(mistake) || { count: 0, totalPnL: 0 };
                        mistakesAnalysis.set(mistake, {
                            count: current.count + 1,
                            totalPnL: current.totalPnL + pnl,
                        });
                    }
                });
            }
        });

        const commonMistakes = Array.from(mistakesAnalysis.entries())
            .map(([mistake, { count, totalPnL }]) => ({
                description: mistake,
                count,
                impact: totalPnL / count,
            }))
            .sort((a, b) => b.count - a.count);

        // Analyze strategies
        const strategyAnalysis = new Map<string, { trades: number; wins: number; pnl: number }>();
        closedTrades.forEach(trade => {
            const pnl = calculatePnL(trade);
            if (Array.isArray(trade.strategy)) {
                trade.strategy.forEach(strategy => {
                    if (strategy && strategy.trim() !== '') {
                        const current = strategyAnalysis.get(strategy) || { trades: 0, wins: 0, pnl: 0 };
                        strategyAnalysis.set(strategy, {
                            trades: current.trades + 1,
                            wins: current.wins + (pnl > 0 ? 1 : 0),
                            pnl: current.pnl + pnl,
                        });
                    }
                });
            }
        });

        const mostProfitableStrategies = Array.from(strategyAnalysis.entries())
            .map(([strategy, { trades, wins, pnl }]) => ({
                strategy,
                pnl,
                winRate: (wins / trades) * 100,
            }))
            .sort((a, b) => b.pnl - a.pnl);

        // Analyze indicators
        const indicatorAnalysis = new Map<string, { count: number; successCount: number }>();
        closedTrades.forEach(trade => {
            const isWin = calculatePnL(trade) > 0;
            if (Array.isArray(trade.indicators)) {
                trade.indicators.forEach(indicator => {
                    if (indicator && indicator.trim() !== '') {
                        const current = indicatorAnalysis.get(indicator) || { count: 0, successCount: 0 };
                        indicatorAnalysis.set(indicator, {
                            count: current.count + 1,
                            successCount: current.successCount + (isWin ? 1 : 0),
                        });
                    }
                });
            }
        });

        const mostUsedIndicators = Array.from(indicatorAnalysis.entries())
            .map(([indicator, { count, successCount }]) => ({
                indicator,
                count,
                successRate: (successCount / count) * 100,
            }))
            .sort((a, b) => b.count - a.count);

        // Analyze behavioral patterns
        const behavioralAnalysis = analyzeBehavioralPatterns(closedTrades);
        const timeOfDayAnalysis = new Map<string, { trades: number; wins: number }>();
        closedTrades.forEach(trade => {
            const hour = new Date(trade.createdAt).getHours();
            const timeSlot = `${hour}:00`;
            const isWin = calculatePnL(trade) > 0;
            const current = timeOfDayAnalysis.get(timeSlot) || { trades: 0, wins: 0 };
            timeOfDayAnalysis.set(timeSlot, {
                trades: current.trades + 1,
                wins: current.wins + (isWin ? 1 : 0),
            });
        });

        const emotionalStateAnalysis = new Map<string, { trades: number; wins: number }>();
        closedTrades.forEach(trade => {
            const state = trade.emotionalState || 'neutral';
            const isWin = calculatePnL(trade) > 0;
            const current = emotionalStateAnalysis.get(state) || { trades: 0, wins: 0 };
            emotionalStateAnalysis.set(state, {
                trades: current.trades + 1,
                wins: current.wins + (isWin ? 1 : 0),
            });
        });

        const behavioralPatterns = {
            timeOfDay: Object.fromEntries(
                Array.from(timeOfDayAnalysis.entries()).map(([time, { trades, wins }]) => [
                    time,
                    { trades, winRate: trades > 0 ? (wins / trades) * 100 : 0 },
                ])
            ),
            emotionalState: Object.fromEntries(
                Array.from(emotionalStateAnalysis.entries()).map(([state, { trades, wins }]) => [
                    state,
                    { trades, winRate: trades > 0 ? (wins / trades) * 100 : 0 },
                ])
            ),
            overallConfidence: behavioralAnalysis.emotionalBias.overconfidence,
            riskManagement: behavioralAnalysis.tradingHabits.riskManagement,
        };

        const metrics: PerformanceMetrics = {
            userId,
            period,
            startDate: startDate || new Date(0),
            endDate: endDate || new Date(),
            totalTrades,
            winningTrades,
            losingTrades,
            winRate,
            totalPnL,
            averagePnL,
            largestWin,
            largestLoss,
            profitFactor,
            sharpeRatio,
            maxDrawdown,
            averageWinSize,
            averageLossSize,
            riskRewardRatio,
            commonMistakes: commonMistakes.length > 0 ? commonMistakes : [{ description: 'No common mistakes', count: 0, impact: 0 }],
            mostProfitableStrategies: mostProfitableStrategies.length > 0 ? mostProfitableStrategies : [{ strategy: 'No strategies yet', pnl: 0, winRate: 0 }],
            mostUsedIndicators: mostUsedIndicators.length > 0 ? mostUsedIndicators : [{ indicator: 'No indicators yet', count: 0, successRate: 0 }],
            behavioralPatterns,
            createdAt: new Date(),
            isDefaultData: false
        };

        // Store the new metrics
        try {
            await addDoc(collection(db, ANALYTICS_COLLECTION), metrics);
        } catch (storeError) {
            // Handle error silently
        }

        return metrics;
    } catch (error) {
        // Use default dates if null is provided
        const effectiveStartDate = startDate || new Date(0);  // Start from Unix epoch
        const effectiveEndDate = endDate || new Date();      // End at current time

        // Return cached or default metrics on error
        return {
            ...DEFAULT_METRICS,
            userId,
            startDate: effectiveStartDate,
            endDate: effectiveEndDate,
            createdAt: new Date(),
            isDefaultData: true
        };
    }
}

export async function getPerformanceHistory(
    userId: string,
    period: 'all-time' | 'daily' | 'weekly' | 'monthly' | 'yearly',
    limitCount: number = 10
): Promise<PerformanceMetrics[]> {
    try {
        const constraints: QueryConstraint[] = [
            where('userId', '==', userId),
            where('period', '==', period),
            orderBy('startDate', 'desc'),
            limit(limitCount)
        ];

        const metricsQuery = query(
            collection(db, ANALYTICS_COLLECTION),
            ...constraints
        );

        const querySnapshot = await getDocs(metricsQuery);
        return querySnapshot.docs.map(doc => doc.data() as PerformanceMetrics);
    } catch (error) {
        // console.error('Error fetching performance history:', error);
        throw error;
    }
}

const AnalyticsService = {
    calculatePerformanceMetrics,
    getPerformanceHistory,
    analyzeBehavioralPatterns,
    getCachedMetrics,
};

export default AnalyticsService; 