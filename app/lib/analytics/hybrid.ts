import { PerformanceMetrics } from '../analytics';
import { Trade } from '../trades';
import AnalyticsService from '../analytics';
import LocalAnalyticsService from './localAnalytics';
import AnalyticsWorker from './worker';
import { getCachedMetrics } from '../analytics';
import { getMetrics } from '../analytics';

class HybridAnalytics {
    private static instance: HybridAnalytics;
    private metricsCache: Map<string, { metrics: PerformanceMetrics; timestamp: number }> = new Map();
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    private constructor() { }

    static getInstance(): HybridAnalytics {
        if (!HybridAnalytics.instance) {
            HybridAnalytics.instance = new HybridAnalytics();
        }
        return HybridAnalytics.instance;
    }

    private convertDates(metrics: PerformanceMetrics): PerformanceMetrics {
        return {
            ...metrics,
            startDate: metrics.startDate instanceof Date ? metrics.startDate : new Date(metrics.startDate),
            endDate: metrics.endDate instanceof Date ? metrics.endDate : new Date(metrics.endDate),
            createdAt: metrics.createdAt instanceof Date ? metrics.createdAt : new Date(metrics.createdAt)
        };
    }

    async getMetrics(
        userId: string,
        forceRecalculate: boolean = false,
        startDate: Date | null = null,
        endDate: Date | null = null
    ): Promise<PerformanceMetrics> {
        const cacheKey = this.getCacheKey(userId, startDate, endDate);
        const cachedData = this.metricsCache.get(cacheKey);

        if (!forceRecalculate && cachedData && Date.now() - cachedData.timestamp < this.CACHE_DURATION) {
            return cachedData.metrics;
        }

        const metrics = await AnalyticsService.calculatePerformanceMetrics(
            userId,
            startDate,
            endDate
        );

        this.metricsCache.set(cacheKey, {
            metrics,
            timestamp: Date.now()
        });

        return metrics;
    }

    private getCacheKey(userId: string, startDate: Date | null, endDate: Date | null): string {
        if (!startDate || !endDate) return userId;
        return `${userId}_${startDate.toISOString()}_${endDate.toISOString()}`;
    }

    clearCache(userId: string): void {
        for (const key of this.metricsCache.keys()) {
            if (key.startsWith(userId)) {
                this.metricsCache.delete(key);
            }
        }
    }

    async onTradeUpdate(userId: string): Promise<void> {
        // Force metrics recalculation on trade update
        await this.getMetrics(userId, true);
    }
}

export default HybridAnalytics.getInstance(); 