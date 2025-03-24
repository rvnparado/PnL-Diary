import { collection, doc, onSnapshot, query, where, Unsubscribe } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Trade } from './trades';
import TradeService from './trades';

type TradeUpdateCallback = (trade: Trade) => void;
type TradesUpdateCallback = (trades: Trade[]) => void;
type ErrorCallback = (error: Error) => void;

class RealTimeService {
    private static subscriptions: Map<string, Unsubscribe> = new Map();

    static subscribeSingleTrade(
        tradeId: string,
        onUpdate: TradeUpdateCallback,
        onError?: ErrorCallback
    ): Unsubscribe {
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
    }

    static subscribeUserTrades(
        userId: string,
        onUpdate: TradesUpdateCallback,
        onError?: ErrorCallback
    ): Unsubscribe {
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
    }

    static subscribeOpenTrades(
        userId: string,
        onUpdate: TradesUpdateCallback,
        onError?: ErrorCallback
    ): Unsubscribe {
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
    }

    static unsubscribe(subscriptionId: string): void {
        const unsubscribe = this.subscriptions.get(subscriptionId);
        if (unsubscribe) {
            unsubscribe();
            this.subscriptions.delete(subscriptionId);
        }
    }

    static unsubscribeAll(): void {
        this.subscriptions.forEach(unsubscribe => unsubscribe());
        this.subscriptions.clear();
    }
}

export default RealTimeService; 