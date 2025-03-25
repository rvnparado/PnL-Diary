import { Trade } from './trades';

export function calculatePnL(trade: Trade): number {
    try {
        // Return 0 if the trade is not closed
        if (trade.status !== 'CLOSED' || !trade.exitPrice) {
            return 0;
        }

        // Use stored profitLoss if available, valid, and not zero
        if (typeof trade.profitLoss === 'number' && !isNaN(trade.profitLoss) && trade.profitLoss !== 0) {
            return Number(trade.profitLoss.toFixed(2));
        }

        // Validate required fields
        const entryPrice = Number(trade.entryPrice);
        const exitPrice = Number(trade.exitPrice);
        const quantity = Number(trade.quantity);

        if (isNaN(entryPrice) || isNaN(exitPrice) || isNaN(quantity)) {
            return 0;
        }

        if (entryPrice <= 0 || exitPrice <= 0 || quantity <= 0) {
            return 0;
        }

        // Calculate PnL based on trade type
        let pnl = 0;
        if (trade.type === 'BUY') {
            pnl = (exitPrice - entryPrice) * quantity;
        } else if (trade.type === 'SELL') {
            pnl = (entryPrice - exitPrice) * quantity;
        }

        return Number(pnl.toFixed(2));
    } catch (error) {
        console.error('Error calculating PnL:', error);
        return 0;
    }
}

class PnLService {
    calculatePnL = calculatePnL;
}

export default new PnLService(); 