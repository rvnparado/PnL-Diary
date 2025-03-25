import AsyncStorage from '@react-native-async-storage/async-storage';
import { PerformanceMetrics } from '../analytics';
import { Trade } from '../trades';

interface LocalMetricsStore {
    metrics: PerformanceMetrics;
    lastSyncTime: number;
    isDirty: boolean;
}

class LocalAnalyticsService {
    private static instance: LocalAnalyticsService;
    private static readonly METRICS_KEY_PREFIX = '@analytics_metrics_';
    private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

    static getInstance(): LocalAnalyticsService {
        if (!LocalAnalyticsService.instance) {
            LocalAnalyticsService.instance = new LocalAnalyticsService();
        }
        return LocalAnalyticsService.instance;
    }

    private getMetricsKey(userId: string): string {
        return `${LocalAnalyticsService.METRICS_KEY_PREFIX}${userId}`;
    }

    private ensureDates(metrics: PerformanceMetrics): PerformanceMetrics {
        return {
            ...metrics,
            startDate: metrics.startDate instanceof Date ? metrics.startDate : new Date(metrics.startDate),
            endDate: metrics.endDate instanceof Date ? metrics.endDate : new Date(metrics.endDate),
            createdAt: metrics.createdAt instanceof Date ? metrics.createdAt : new Date(metrics.createdAt)
        };
    }

    async getMetrics(userId: string): Promise<PerformanceMetrics | null> {
        try {
            const key = this.getMetricsKey(userId);
            const storedData = await AsyncStorage.getItem(key);

            if (!storedData) {
                return null;
            }

            const { metrics, timestamp } = JSON.parse(storedData);

            // Check if cache is still valid
            if (Date.now() - timestamp > LocalAnalyticsService.CACHE_DURATION) {
                await AsyncStorage.removeItem(key);
                return null;
            }

            // Ensure dates are properly converted
            return this.ensureDates(metrics);
        } catch (error) {
            console.error('Error retrieving metrics from local storage:', error);
            return null;
        }
    }

    async updateMetrics(userId: string, metrics: PerformanceMetrics): Promise<void> {
        try {
            const key = this.getMetricsKey(userId);
            const data = {
                metrics: this.ensureDates(metrics),
                timestamp: Date.now()
            };
            await AsyncStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Error storing metrics in local storage:', error);
        }
    }

    async clearMetrics(userId: string): Promise<void> {
        try {
            const key = this.getMetricsKey(userId);
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error('Error clearing metrics from local storage:', error);
        }
    }

    async needsSync(userId: string): Promise<boolean> {
        try {
            const stored = await AsyncStorage.getItem(`${LocalAnalyticsService.METRICS_KEY_PREFIX}${userId}`);
            if (!stored) return true;

            const { timestamp } = JSON.parse(stored);
            return Date.now() - timestamp > LocalAnalyticsService.CACHE_DURATION;
        } catch (error) {
            console.error('Error checking sync status:', error);
            return true;
        }
    }

    async clearDirtyFlag(userId: string): Promise<void> {
        try {
            const stored = await AsyncStorage.getItem(`${LocalAnalyticsService.METRICS_KEY_PREFIX}${userId}`);
            if (!stored) return;

            const { metrics } = JSON.parse(stored);
            const data = {
                metrics: this.ensureDates(metrics),
                timestamp: Date.now()
            };
            await AsyncStorage.setItem(this.getMetricsKey(userId), JSON.stringify(data));
        } catch (error) {
            console.error('Error clearing dirty flag:', error);
        }
    }
}

export default LocalAnalyticsService.getInstance(); 