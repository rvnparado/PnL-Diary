import { Trade, TradeStatus, TradeType, TradeResult } from './trades';
import { UserPreferences } from './preferences';
import ErrorService from './errors';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

class ValidationService {
    private static readonly VALID_TRADE_STATUSES: TradeStatus[] = ['OPEN', 'CLOSED', 'CANCELLED', 'PENDING'];
    private static readonly VALID_TRADE_TYPES: TradeType[] = ['BUY', 'SELL'];
    private static readonly VALID_TRADE_RESULTS: TradeResult[] = ['WIN', 'LOSS', 'BREAKEVEN', 'UNKNOWN'];
    private static readonly DEFAULT_TAGS: string[] = ['crypto', 'forex', 'stocks'];

    static validateTrade(trade: Partial<Trade>): ValidationResult {
        const errors: string[] = [];

        // Required fields
        if (!trade.pair) errors.push('Trade pair is required');
        if (!trade.type) errors.push('Trade type is required');
        if (!trade.entryPrice) errors.push('Entry price is required');
        if (!trade.quantity) errors.push('Quantity is required');
        if (!trade.strategy || !Array.isArray(trade.strategy) || trade.strategy.length === 0) {
            errors.push('At least one strategy must be selected');
        }
        if (!trade.reason) errors.push('Trade reason is required');

        // Type validations
        if (trade.type && !this.VALID_TRADE_TYPES.includes(trade.type)) {
            errors.push(`Invalid trade type. Must be one of: ${this.VALID_TRADE_TYPES.join(', ')}`);
        }

        if (trade.status && !this.VALID_TRADE_STATUSES.includes(trade.status)) {
            errors.push(`Invalid trade status. Must be one of: ${this.VALID_TRADE_STATUSES.join(', ')}`);
        }

        if (trade.result && !this.VALID_TRADE_RESULTS.includes(trade.result)) {
            errors.push(`Invalid trade result. Must be one of: ${this.VALID_TRADE_RESULTS.join(', ')}`);
        }

        // Numeric validations
        if (typeof trade.entryPrice !== 'undefined') {
            if (typeof trade.entryPrice !== 'number' || trade.entryPrice <= 0) {
                errors.push('Entry price must be a positive number');
            }
        }

        if (typeof trade.quantity !== 'undefined') {
            if (typeof trade.quantity !== 'number' || trade.quantity <= 0) {
                errors.push('Quantity must be a positive number');
            }
        }

        // Optional array validations
        if (trade.indicators && !Array.isArray(trade.indicators)) {
            errors.push('Indicators must be an array if provided');
        }

        if (trade.mistakes && !Array.isArray(trade.mistakes)) {
            errors.push('Mistakes must be an array if provided');
        }

        if (trade.tags && !Array.isArray(trade.tags)) {
            errors.push('Tags must be an array if provided');
        }

        // State transition validations
        if (trade.status === 'CLOSED') {
            if (!trade.exitPrice) {
                errors.push('Exit price is required for closed trades');
            } else if (typeof trade.exitPrice !== 'number' || trade.exitPrice <= 0) {
                errors.push('Exit price must be a positive number for closed trades');
            }
        }

        // Date validations
        if (trade.createdAt && !(trade.createdAt instanceof Date)) {
            errors.push('Created date must be a valid Date object');
        }

        if (trade.updatedAt && !(trade.updatedAt instanceof Date)) {
            errors.push('Updated date must be a valid Date object');
        }

        if (trade.closedAt && !(trade.closedAt instanceof Date)) {
            errors.push('Closed date must be a valid Date object');
        }

        // Logical validations
        if (trade.status === 'CLOSED' && !trade.closedAt) {
            errors.push('Closed date is required for closed trades');
        }

        if (trade.closedAt && trade.status !== 'CLOSED') {
            errors.push('Closed date should only be set for closed trades');
        }

        if (trade.result && trade.result !== 'UNKNOWN' && trade.status !== 'CLOSED') {
            errors.push('Trade result can only be set for closed trades');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validatePartialTrade(trade: Partial<Trade>): ValidationResult {
        const errors: string[] = [];

        // Type validations
        if (trade.type && !this.VALID_TRADE_TYPES.includes(trade.type)) {
            errors.push(`Invalid trade type. Must be one of: ${this.VALID_TRADE_TYPES.join(', ')}`);
        }

        if (trade.status && !this.VALID_TRADE_STATUSES.includes(trade.status)) {
            errors.push(`Invalid trade status. Must be one of: ${this.VALID_TRADE_STATUSES.join(', ')}`);
        }

        if (trade.result && !this.VALID_TRADE_RESULTS.includes(trade.result)) {
            errors.push(`Invalid trade result. Must be one of: ${this.VALID_TRADE_RESULTS.join(', ')}`);
        }

        // Numeric validations
        if (typeof trade.entryPrice !== 'undefined') {
            if (typeof trade.entryPrice !== 'number' || trade.entryPrice <= 0) {
                errors.push('Entry price must be a positive number');
            }
        }

        if (typeof trade.exitPrice !== 'undefined') {
            if (typeof trade.exitPrice !== 'number' || trade.exitPrice <= 0) {
                errors.push('Exit price must be a positive number');
            }
        }

        if (typeof trade.quantity !== 'undefined') {
            if (typeof trade.quantity !== 'number' || trade.quantity <= 0) {
                errors.push('Quantity must be a positive number');
            }
        }

        // Array validations
        if (trade.strategy && (!Array.isArray(trade.strategy) || trade.strategy.length === 0)) {
            errors.push('At least one strategy must be selected');
        }

        if (trade.indicators && !Array.isArray(trade.indicators)) {
            errors.push('Indicators must be an array');
        }

        if (trade.mistakes && !Array.isArray(trade.mistakes)) {
            errors.push('Mistakes must be an array');
        }

        // State transition validations
        if (trade.status === 'CLOSED' && !trade.exitPrice) {
            errors.push('Exit price is required when closing a trade');
        }

        // Date validations
        if (trade.createdAt && !(trade.createdAt instanceof Date)) {
            errors.push('Created date must be a valid Date object');
        }

        if (trade.updatedAt && !(trade.updatedAt instanceof Date)) {
            errors.push('Updated date must be a valid Date object');
        }

        if (trade.closedAt && !(trade.closedAt instanceof Date)) {
            errors.push('Closed date must be a valid Date object');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateUserPreferences(prefs: Partial<UserPreferences>): ValidationResult {
        const errors: string[] = [];

        // Required fields check
        if (!prefs.userId) {
            errors.push('User ID is required');
        }

        // Type validations
        if (prefs.defaultPair !== undefined && typeof prefs.defaultPair !== 'string') {
            errors.push('Default pair must be a string');
        }

        if (prefs.defaultQuantity !== undefined) {
            if (typeof prefs.defaultQuantity !== 'number') {
                errors.push('Default quantity must be a number');
            } else if (prefs.defaultQuantity <= 0) {
                errors.push('Default quantity must be greater than 0');
            }
        }

        if (prefs.commonStrategies) {
            if (!Array.isArray(prefs.commonStrategies) || !prefs.commonStrategies.every(s => typeof s === 'string')) {
                errors.push('Common strategies must be an array of strings');
            }
        }

        if (prefs.commonIndicators) {
            if (!Array.isArray(prefs.commonIndicators) || !prefs.commonIndicators.every(i => typeof i === 'string')) {
                errors.push('Common indicators must be an array of strings');
            }
        }

        if (prefs.commonMistakes) {
            if (!Array.isArray(prefs.commonMistakes) || !prefs.commonMistakes.every(m => typeof m === 'string')) {
                errors.push('Common mistakes must be an array of strings');
            }
        }

        if (prefs.darkMode !== undefined && typeof prefs.darkMode !== 'boolean') {
            errors.push('Dark mode must be a boolean');
        }

        if (prefs.notifications) {
            const { tradeReminders, performanceUpdates, marketAlerts } = prefs.notifications;

            if (tradeReminders !== undefined && typeof tradeReminders !== 'boolean') {
                errors.push('Trade reminders setting must be a boolean');
            }

            if (performanceUpdates !== undefined && typeof performanceUpdates !== 'boolean') {
                errors.push('Performance updates setting must be a boolean');
            }

            if (marketAlerts !== undefined && typeof marketAlerts !== 'boolean') {
                errors.push('Market alerts setting must be a boolean');
            }
        }

        // Date validations
        if (prefs.createdAt && !(prefs.createdAt instanceof Date)) {
            errors.push('Created date must be a valid date');
        }

        if (prefs.updatedAt && !(prefs.updatedAt instanceof Date)) {
            errors.push('Updated date must be a valid date');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateAnalyticsQuery(startDate: Date, endDate: Date): ValidationResult {
        const errors: string[] = [];

        if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
            errors.push('Start date must be a valid date');
        }

        if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
            errors.push('End date must be a valid date');
        }

        if (startDate && endDate && startDate > endDate) {
            errors.push('Start date must be before end date');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static createValidationError(errors: string[]): Error {
        const error = new Error('Validation failed: ' + errors.join(', '));
        error.name = 'ValidationError';
        return error;
    }
}

export default ValidationService; 