import { collection, doc, onSnapshot, query, where, Unsubscribe } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Trade } from './trades';
import TradeService from './trades';
import { auth } from '../config/firebase';

type TradeUpdateCallback = (trade: Trade) => void;
type TradesUpdateCallback = (trades: Trade[]) => void;
type ErrorCallback = (error: Error) => void;

class RealTimeService {
    private static subscriptions: Map<string, Unsubscribe> = new Map();

    private static isUserAuthenticated(): boolean {
        return !!auth.currentUser;
    }

    static subscribeSingleTrade(
        tradeId: string,
        onUpdate: TradeUpdateCallback,
        onError?: ErrorCallback
    ): Unsubscribe {
        // Check if user is authenticated before subscribing
        if (!this.isUserAuthenticated()) {
            const error = new Error('User not authenticated');
            if (onError) onError(error);
            return () => { }; // Return a no-op unsubscribe function
        }

        try {
            const tradeRef = doc(db, 'trades', tradeId);

            const unsubscribe = onSnapshot(
                tradeRef,
                (snapshot) => {
                    if (snapshot.exists()) {
                        const trade = TradeService['formatTradeFromFirestore'](snapshot.data(), snapshot.id);
                        onUpdate(trade);
                    }
                },
                (error) => {
                    console.error('Error in trade subscription:', error);
                    if (onError) onError(error);
                }
            );

            this.subscriptions.set(`trade_${tradeId}`, unsubscribe);
            return unsubscribe;
        } catch (error) {
            console.error('Error setting up trade subscription:', error);
            if (onError) onError(error instanceof Error ? error : new Error(String(error)));
            return () => { }; // Return a no-op unsubscribe function
        }
    }

    static subscribeUserTrades(
        userId: string,
        onUpdate: TradesUpdateCallback,
        onError?: ErrorCallback
    ): Unsubscribe {
        // Check if user is authenticated before subscribing
        if (!this.isUserAuthenticated()) {
            const error = new Error('User not authenticated');
            if (onError) onError(error);
            return () => { }; // Return a no-op unsubscribe function
        }

        try {
            const tradesQuery = query(
                collection(db, 'trades'),
                where('userId', '==', userId)
            );

            const unsubscribe = onSnapshot(
                tradesQuery,
                (snapshot) => {
                    const trades = snapshot.docs.map(doc =>
                        TradeService['formatTradeFromFirestore'](doc.data(), doc.id)
                    );
                    onUpdate(trades);
                },
                (error) => {
                    console.error('Error in trades subscription:', error);
                    if (onError) onError(error);
                }
            );

            this.subscriptions.set(`trades_${userId}`, unsubscribe);
            return unsubscribe;
        } catch (error) {
            console.error('Error setting up user trades subscription:', error);
            if (onError) onError(error instanceof Error ? error : new Error(String(error)));
            return () => { }; // Return a no-op unsubscribe function
        }
    }

    static subscribeOpenTrades(
        userId: string,
        onUpdate: TradesUpdateCallback,
        onError?: ErrorCallback
    ): Unsubscribe {
        // Check if user is authenticated before subscribing
        if (!this.isUserAuthenticated()) {
            const error = new Error('User not authenticated');
            if (onError) onError(error);
            return () => { }; // Return a no-op unsubscribe function
        }

        try {
            const tradesQuery = query(
                collection(db, 'trades'),
                where('userId', '==', userId),
                where('exitPrice', '==', 0)
            );

            const unsubscribe = onSnapshot(
                tradesQuery,
                (snapshot) => {
                    const trades = snapshot.docs.map(doc =>
                        TradeService['formatTradeFromFirestore'](doc.data(), doc.id)
                    );
                    onUpdate(trades);
                },
                (error) => {
                    console.error('Error in open trades subscription:', error);
                    if (onError) onError(error);
                }
            );

            this.subscriptions.set(`open_trades_${userId}`, unsubscribe);
            return unsubscribe;
        } catch (error) {
            console.error('Error setting up open trades subscription:', error);
            if (onError) onError(error instanceof Error ? error : new Error(String(error)));
            return () => { }; // Return a no-op unsubscribe function
        }
    }

    static unsubscribe(subscriptionId: string): void {
        const unsubscribe = this.subscriptions.get(subscriptionId);
        if (unsubscribe) {
            try {
                unsubscribe();
            } catch (error) {
                console.error(`Error unsubscribing from ${subscriptionId}:`, error);
            }
            this.subscriptions.delete(subscriptionId);
        }
    }

    static unsubscribeAll(): void {
        this.subscriptions.forEach((unsubscribe, key) => {
            try {
                unsubscribe();
                console.log(`Unsubscribed from ${key}`);
            } catch (error) {
                console.error(`Error unsubscribing from ${key}:`, error);
            }
        });
        this.subscriptions.clear();
    }
}

export default RealTimeService; 