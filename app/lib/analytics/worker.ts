import { Trade } from '../trades';
import { PerformanceMetrics } from '../analytics';
import LocalAnalyticsService from './localAnalytics';
import { calculatePerformanceMetrics } from '../analytics';

class AnalyticsWorker {
    private static instance: AnalyticsWorker;
    private workQueue: Array<() => Promise<void>> = [];
    private isProcessing = false;

    static getInstance(): AnalyticsWorker {
        if (!AnalyticsWorker.instance) {
            AnalyticsWorker.instance = new AnalyticsWorker();
        }
        return AnalyticsWorker.instance;
    }

    private ensureDates(metrics: PerformanceMetrics): PerformanceMetrics {
        return {
            ...metrics,
            startDate: metrics.startDate instanceof Date ? metrics.startDate : new Date(metrics.startDate),
            endDate: metrics.endDate instanceof Date ? metrics.endDate : new Date(metrics.endDate),
            createdAt: metrics.createdAt instanceof Date ? metrics.createdAt : new Date(metrics.createdAt)
        };
    }

    async queueMetricsCalculation(userId: string): Promise<void> {
        this.workQueue.push(async () => {
            try {
                const endDate = new Date();
                const startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1);

                const metrics = await calculatePerformanceMetrics(
                    userId,
                    'monthly',
                    startDate,
                    endDate
                );

                // Ensure dates are properly converted before storing
                const metricsWithDates = this.ensureDates(metrics);
                await LocalAnalyticsService.updateMetrics(userId, metricsWithDates);
            } catch (error) {
                console.error('Error in worker calculation:', error);
            }
        });

        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    private async processQueue(): Promise<void> {
        if (this.workQueue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const work = this.workQueue.shift();
        if (work) {
            try {
                await work();
            } catch (error) {
                console.error('Analytics worker error:', error);
            }
        }

        await this.processQueue();
    }
}

export default AnalyticsWorker.getInstance(); 