import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, orderBy, getDoc, Timestamp, runTransaction } from 'firebase/firestore';
import { db } from '../config/firebase';
import ValidationService from './validation';
import ErrorService from './errors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkInfo } from '@react-native-community/netinfo';

export type TradeStatus = 'OPEN' | 'CLOSED' | 'CANCELLED' | 'PENDING';
export type TradeType = 'BUY' | 'SELL';
export type TradeResult = 'WIN' | 'LOSS' | 'BREAKEVEN' | 'UNKNOWN';

export interface Trade {
    id: string;
    userId: string;
    pair: string;
    type: TradeType;
    status: TradeStatus;
    entryPrice: number;
    exitPrice: number;
    quantity: number;
    strategy: string[];
    indicators: string[];
    notes: string;
    mistakes: string[];
    reason: string;
    createdAt: Date;
    updatedAt: Date;
    closedAt?: Date;
    result: TradeResult;
    profitLoss: number;
    profitLossPercentage: number;
    tags: string[];
}

export type NewTrade = Omit<Trade, 'id' | 'userId' | 'updatedAt' | 'status' | 'result' | 'profitLoss' | 'profitLossPercentage'>;

class TradeService {
    private static readonly COLLECTION = 'trades';
    private static CACHE_KEY = 'trades_cache';
    private static PENDING_OPERATIONS_KEY = 'pending_trade_operations';

    private static calculateTradeResult(trade: Trade): TradeResult {
        if (!trade.exitPrice || trade.status !== 'CLOSED') return 'UNKNOWN';

        const isLong = trade.type === 'BUY';
        const profitLoss = isLong
            ? (trade.exitPrice - trade.entryPrice) * trade.quantity
            : (trade.entryPrice - trade.exitPrice) * trade.quantity;

        if (profitLoss > 0) return 'WIN';
        if (profitLoss < 0) return 'LOSS';
        return 'BREAKEVEN';
    }

    private static calculateProfitLoss(trade: Trade): { profitLoss: number; profitLossPercentage: number } {
        const isLong = trade.type === 'BUY';
        const profitLoss = isLong
            ? (trade.exitPrice - trade.entryPrice) * trade.quantity
            : (trade.entryPrice - trade.exitPrice) * trade.quantity;

        const investment = trade.entryPrice * trade.quantity;
        const profitLossPercentage = (profitLoss / investment) * 100;

        return { profitLoss, profitLossPercentage };
    }

    private static validateAndFormatTrade(trade: Partial<Trade>): Trade {
        // Validate trade data
        const validation = ValidationService.validateTrade(trade);
        if (!validation.isValid) {
            throw ValidationService.createValidationError(validation.errors);
        }

        // Format dates and calculate derived fields
        const now = new Date();
        const formattedTrade = {
            ...trade,
            status: trade.status || 'OPEN',
            createdAt: trade.createdAt || now,
            updatedAt: now,
        } as Trade;

        // Calculate P&L and result if trade is closed
        if (formattedTrade.status === 'CLOSED' && formattedTrade.exitPrice > 0) {
            const { profitLoss, profitLossPercentage } = this.calculateProfitLoss(formattedTrade);
            formattedTrade.profitLoss = profitLoss;
            formattedTrade.profitLossPercentage = profitLossPercentage;
            formattedTrade.result = this.calculateTradeResult(formattedTrade);
            formattedTrade.closedAt = formattedTrade.closedAt || now;
        }

        return formattedTrade;
    }

    private static formatTradeForFirestore(trade: Trade) {
        return {
            ...trade,
            createdAt: Timestamp.fromDate(trade.createdAt),
            updatedAt: Timestamp.fromDate(trade.updatedAt),
            closedAt: trade.closedAt ? Timestamp.fromDate(trade.closedAt) : null,
        };
    }

    private static formatTradeFromFirestore(data: any, id: string): Trade {
        return {
            ...data,
            id,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            closedAt: data.closedAt?.toDate(),
        };
    }

    private static async cacheData(trades: Trade[]) {
        try {
            await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(trades));
        } catch (error) {
            console.error('Error caching trades:', error);
        }
    }

    private static async getCachedData(): Promise<Trade[]> {
        try {
            const cached = await AsyncStorage.getItem(this.CACHE_KEY);
            return cached ? JSON.parse(cached) : [];
        } catch (error) {
            console.error('Error getting cached trades:', error);
            return [];
        }
    }

    private static async addPendingOperation(operation: { type: string; data: any }) {
        try {
            const pending = await AsyncStorage.getItem(this.PENDING_OPERATIONS_KEY);
            const operations = pending ? JSON.parse(pending) : [];
            operations.push(operation);
            await AsyncStorage.setItem(this.PENDING_OPERATIONS_KEY, JSON.stringify(operations));
        } catch (error) {
            console.error('Error adding pending operation:', error);
        }
    }

    private static async processPendingOperations() {
        try {
            const pending = await AsyncStorage.getItem(this.PENDING_OPERATIONS_KEY);
            if (!pending) return;

            const operations = JSON.parse(pending);
            for (const operation of operations) {
                switch (operation.type) {
                    case 'create':
                        await this.createTrade(operation.data, false);
                        break;
                    case 'update':
                        await this.updateTrade(operation.data.id, operation.data.trade, false);
                        break;
                    case 'delete':
                        await this.deleteTrade(operation.data, false);
                        break;
                }
            }

            await AsyncStorage.removeItem(this.PENDING_OPERATIONS_KEY);
        } catch (error) {
            console.error('Error processing pending operations:', error);
        }
    }

    static async createTrade(trade: Partial<Trade>, shouldCache: boolean = true): Promise<Trade> {
        try {
            // Validate and format trade data
            const validatedTrade = this.validateAndFormatTrade(trade);
            const formattedTrade = this.formatTradeForFirestore(validatedTrade);

            // Create trade document
            const docRef = await addDoc(collection(db, this.COLLECTION), formattedTrade);

            // Return the created trade with ID
            const createdTrade = {
                ...validatedTrade,
                id: docRef.id,
            };

            if (shouldCache) {
                const cached = await this.getCachedData();
                cached.push(createdTrade);
                await this.cacheData(cached);
            }

            return createdTrade;
        } catch (error: any) {
            if (error instanceof Error && error.message.includes('network')) {
                await this.addPendingOperation({ type: 'create', data: trade });
                throw new Error('Trade will be created when back online');
            }
            console.error('Error creating trade:', error);
            throw ErrorService.getErrorMessage(error);
        }
    }

    static async updateTrade(id: string, updates: Partial<Trade>, shouldCache: boolean = true): Promise<Trade> {
        try {
            const tradeRef = doc(db, this.COLLECTION, id);

            // Get current trade data
            const tradeSnap = await getDoc(tradeRef);
            if (!tradeSnap.exists()) {
                throw ErrorService.createAppError('trade/not-found', 'Trade not found');
            }

            const currentTrade = this.formatTradeFromFirestore(tradeSnap.data(), id);

            // Validate state transition
            if (currentTrade.status === 'CLOSED' && updates.status !== 'CLOSED') {
                throw ErrorService.createAppError('trade/invalid-state-transition', 'Cannot modify a closed trade');
            }

            // Validate and format updated trade data
            const updatedTrade = this.validateAndFormatTrade({
                ...currentTrade,
                ...updates,
                updatedAt: new Date(),
            });

            // Update trade document
            await updateDoc(tradeRef, this.formatTradeForFirestore(updatedTrade));

            if (shouldCache) {
                const cached = await this.getCachedData();
                const index = cached.findIndex(t => t.id === id);
                if (index !== -1) {
                    cached[index] = { ...cached[index], ...updatedTrade };
                    await this.cacheData(cached);
                }
            }

            return updatedTrade;
        } catch (error: any) {
            if (error instanceof Error && error.message.includes('network')) {
                await this.addPendingOperation({ type: 'update', data: { id, trade: updates } });
                throw new Error('Trade will be updated when back online');
            }
            console.error('Error updating trade:', error);
            throw ErrorService.getErrorMessage(error);
        }
    }

    static async deleteTrade(id: string, shouldCache: boolean = true): Promise<void> {
        try {
            const tradeRef = doc(db, this.COLLECTION, id);

            // Check if trade exists
            const tradeSnap = await getDoc(tradeRef);
            if (!tradeSnap.exists()) {
                throw ErrorService.createAppError('trade/not-found', 'Trade not found');
            }

            // Delete trade document
            await deleteDoc(tradeRef);

            if (shouldCache) {
                const cached = await this.getCachedData();
                const filtered = cached.filter(t => t.id !== id);
                await this.cacheData(filtered);
            }
        } catch (error: any) {
            if (error instanceof Error && error.message.includes('network')) {
                await this.addPendingOperation({ type: 'delete', data: id });
                throw new Error('Trade will be deleted when back online');
            }
            console.error('Error deleting trade:', error);
            throw ErrorService.getErrorMessage(error);
        }
    }

    static async getTrade(id: string): Promise<Trade> {
        try {
            const tradeRef = doc(db, this.COLLECTION, id);
            const tradeSnap = await getDoc(tradeRef);

            if (!tradeSnap.exists()) {
                throw ErrorService.createAppError('trade/not-found', 'Trade not found');
            }

            return this.formatTradeFromFirestore(tradeSnap.data(), id);
        } catch (error: any) {
            console.error('Error getting trade:', error);
            throw ErrorService.getErrorMessage(error);
        }
    }

    static async getUserTrades(userId: string): Promise<Trade[]> {
        try {
            const tradesQuery = query(
                collection(db, this.COLLECTION),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(tradesQuery);
            const trades = querySnapshot.docs.map(doc =>
                this.formatTradeFromFirestore(doc.data(), doc.id)
            );

            await this.cacheData(trades);
            return trades;
        } catch (error: any) {
            if (error instanceof Error && error.message.includes('network')) {
                return this.getCachedData();
            }
            console.error('Error getting user trades:', error);
            throw ErrorService.getErrorMessage(error);
        }
    }

    static async getOpenTrades(userId: string): Promise<Trade[]> {
        try {
            const tradesQuery = query(
                collection(db, this.COLLECTION),
                where('userId', '==', userId),
                where('exitPrice', '==', 0),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(tradesQuery);
            return querySnapshot.docs.map(doc =>
                this.formatTradeFromFirestore(doc.data(), doc.id)
            );
        } catch (error: any) {
            console.error('Error getting open trades:', error);
            throw ErrorService.getErrorMessage(error);
        }
    }

    static async getClosedTrades(userId: string): Promise<Trade[]> {
        try {
            const tradesQuery = query(
                collection(db, this.COLLECTION),
                where('userId', '==', userId),
                where('exitPrice', '>', 0),
                orderBy('exitPrice'),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(tradesQuery);
            return querySnapshot.docs.map(doc =>
                this.formatTradeFromFirestore(doc.data(), doc.id)
            );
        } catch (error: any) {
            console.error('Error getting closed trades:', error);
            throw ErrorService.getErrorMessage(error);
        }
    }

    static async closeTrade(id: string, exitPrice: number): Promise<Trade> {
        try {
            // Validate exit price
            if (typeof exitPrice !== 'number' || exitPrice <= 0) {
                throw ValidationService.createValidationError(['Exit price must be a positive number']);
            }

            const tradeRef = doc(db, this.COLLECTION, id);

            // Use transaction to ensure data consistency
            const updatedTrade = await runTransaction(db, async (transaction) => {
                const tradeSnap = await transaction.get(tradeRef);

                if (!tradeSnap.exists()) {
                    throw ErrorService.createAppError('trade/not-found', 'Trade not found');
                }

                const currentTrade = this.formatTradeFromFirestore(tradeSnap.data(), id);

                if (currentTrade.status === 'CLOSED') {
                    throw ErrorService.createAppError('trade/already-closed', 'Trade is already closed');
                }

                const now = new Date();
                const updatedTrade = this.validateAndFormatTrade({
                    ...currentTrade,
                    exitPrice,
                    status: 'CLOSED',
                    closedAt: now,
                    updatedAt: now,
                });

                transaction.update(tradeRef, this.formatTradeForFirestore(updatedTrade));
                return updatedTrade;
            });

            return updatedTrade;
        } catch (error: any) {
            console.error('Error closing trade:', error);
            throw ErrorService.getErrorMessage(error);
        }
    }

    static async cancelTrade(id: string, reason: string): Promise<Trade> {
        try {
            const tradeRef = doc(db, this.COLLECTION, id);

            // Use transaction to ensure data consistency
            const updatedTrade = await runTransaction(db, async (transaction) => {
                const tradeSnap = await transaction.get(tradeRef);

                if (!tradeSnap.exists()) {
                    throw ErrorService.createAppError('trade/not-found', 'Trade not found');
                }

                const currentTrade = this.formatTradeFromFirestore(tradeSnap.data(), id);

                if (currentTrade.status === 'CLOSED') {
                    throw ErrorService.createAppError('trade/invalid-state-transition', 'Cannot cancel a closed trade');
                }

                const now = new Date();
                const updatedTrade = this.validateAndFormatTrade({
                    ...currentTrade,
                    status: 'CANCELLED',
                    notes: `${currentTrade.notes}\n\nCancellation reason: ${reason}`,
                    updatedAt: now,
                });

                transaction.update(tradeRef, this.formatTradeForFirestore(updatedTrade));
                return updatedTrade;
            });

            return updatedTrade;
        } catch (error: any) {
            console.error('Error cancelling trade:', error);
            throw ErrorService.getErrorMessage(error);
        }
    }

    static async getTradesByStatus(userId: string, status: TradeStatus): Promise<Trade[]> {
        try {
            const tradesQuery = query(
                collection(db, this.COLLECTION),
                where('userId', '==', userId),
                where('status', '==', status),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(tradesQuery);
            return querySnapshot.docs.map(doc =>
                this.formatTradeFromFirestore(doc.data(), doc.id)
            );
        } catch (error: any) {
            console.error('Error getting trades by status:', error);
            throw ErrorService.getErrorMessage(error);
        }
    }
}

export default TradeService; 