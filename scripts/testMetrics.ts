import * as fs from 'fs';

interface Trade {
    id: string;
    userId: string;
    pair: string;
    type: 'BUY' | 'SELL';
    status: 'OPEN' | 'CLOSED';
    entryPrice: number;
    exitPrice: number | null;
    quantity: number;
    profitLoss?: number;
}

// Create a write stream for logging
const logStream = fs.createWriteStream('trade_categorization.log', { flags: 'w' });

function log(message: string) {
    logStream.write(message + '\n');
    console.log(message);
}

// Sample trades for testing
const sampleTrades: Trade[] = [
    {
        id: '1',
        userId: 'testuser',
        pair: 'BTCUSDT',
        type: 'BUY',
        status: 'OPEN',
        entryPrice: 40000,
        exitPrice: null,
        quantity: 1
    },
    {
        id: '2',
        userId: 'testuser',
        pair: 'ETHUSDT',
        type: 'SELL',
        status: 'CLOSED',
        entryPrice: 2500,
        exitPrice: 2400,
        quantity: 2,
        profitLoss: 200
    },
    {
        id: '3',
        userId: 'testuser',
        pair: 'BTCUSDT',
        type: 'BUY',
        status: 'CLOSED',
        entryPrice: 35000,
        exitPrice: 38000,
        quantity: 0.5,
        profitLoss: 1500
    },
    {
        id: '4',
        userId: 'testuser',
        pair: 'ETHUSDT',
        type: 'BUY',
        status: 'CLOSED',
        exitPrice: 0,
        entryPrice: 2000,
        quantity: 1
    },
    {
        id: '5',
        userId: 'testuser',
        pair: 'BTCUSDT',
        type: 'SELL',
        status: 'CLOSED',
        entryPrice: 42000,
        exitPrice: 40000,
        quantity: 0.25,
        profitLoss: 500
    }
];

function calculatePnL(trade: Trade): number {
    try {
        // Return 0 if the trade is not closed
        if (trade.status !== 'CLOSED' || !trade.exitPrice) {
            log(`[PNL CALC] Trade ${trade.id} not calculated: status=${trade.status}, exitPrice=${trade.exitPrice}`);
            return 0;
        }

        // Use stored profitLoss if available, valid, and not zero
        if (typeof trade.profitLoss === 'number' && !isNaN(trade.profitLoss) && trade.profitLoss !== 0) {
            log(`[PNL CALC] Trade ${trade.id}: Using stored PnL = ${trade.profitLoss}`);
            return Number(trade.profitLoss.toFixed(2));
        }

        // Calculate PnL based on trade type
        const entryPrice = Number(trade.entryPrice);
        const exitPrice = Number(trade.exitPrice);
        const quantity = Number(trade.quantity);
        let pnl = 0;

        if (trade.type === 'BUY') {
            pnl = (exitPrice - entryPrice) * quantity;
            log(`[PNL CALC] Trade ${trade.id} (BUY) - Entry: ${entryPrice}, Exit: ${exitPrice}, Qty: ${quantity}, PnL: ${pnl}`);
        } else if (trade.type === 'SELL') {
            pnl = (entryPrice - exitPrice) * quantity;
            log(`[PNL CALC] Trade ${trade.id} (SELL) - Entry: ${entryPrice}, Exit: ${exitPrice}, Qty: ${quantity}, PnL: ${pnl}`);
        }

        return Number(pnl.toFixed(2));
    } catch (error) {
        log(`[ERROR] Error calculating PnL for trade ${trade.id}: ${error}`);
        return 0;
    }
}

function categorizeTrades(allTrades: Trade[]) {
    // Log total trades
    log(`[TOTAL TRADES] Found ${allTrades.length} trades to analyze`);

    // First log all raw trade data
    allTrades.forEach(trade => {
        log(`[RAW TRADE DATA] Trade ${trade.id}: ${JSON.stringify({
            status: trade.status,
            type: trade.type,
            entryPrice: trade.entryPrice,
            exitPrice: trade.exitPrice,
            quantity: trade.quantity
        }, null, 2)}`);
    });

    // Categorize trades
    const tradeCategorization = allTrades.reduce((acc, trade) => {
        // A trade is OPEN if:
        // 1. Status is 'OPEN'
        // 2. Has no exit price
        if (trade.status === 'OPEN' && !trade.exitPrice) {
            acc.openTrades.push(trade);
            log(`[OPEN TRADE] Trade ${trade.id} - Status: ${trade.status}, Exit Price: ${trade.exitPrice}`);
            return acc;
        }

        // A trade is CLOSED if:
        // 1. Status is 'CLOSED'
        // 2. Has both entry and exit prices
        if (trade.status === 'CLOSED' && trade.exitPrice && trade.exitPrice > 0) {
            // Calculate PnL
            const pnl = calculatePnL(trade);

            // Categorize as winning or losing based on PnL
            if (pnl > 0) {
                acc.winningTrades.push(trade);
                log(`[WINNING TRADE] Trade ${trade.id} - PnL: ${pnl}, Type: ${trade.type}`);
            } else if (pnl < 0) {
                acc.losingTrades.push(trade);
                log(`[LOSING TRADE] Trade ${trade.id} - PnL: ${pnl}, Type: ${trade.type}`);
            } else {
                acc.breakEvenTrades.push(trade);
                log(`[BREAK-EVEN TRADE] Trade ${trade.id} - PnL: ${pnl}, Type: ${trade.type}`);
            }
            return acc;
        }

        // If trade doesn't fit above categories, it's invalid
        acc.invalidTrades.push(trade);
        log(`[INVALID TRADE] Trade ${trade.id} - Status: ${trade.status}, Entry: ${trade.entryPrice}, Exit: ${trade.exitPrice}`);
        return acc;
    }, {
        openTrades: [] as Trade[],
        winningTrades: [] as Trade[],
        losingTrades: [] as Trade[],
        breakEvenTrades: [] as Trade[],
        invalidTrades: [] as Trade[]
    });

    // Print summary
    log('[TRADE SUMMARY] Categorization Results: ' + JSON.stringify({
        total: allTrades.length,
        open: tradeCategorization.openTrades.length,
        winning: tradeCategorization.winningTrades.length,
        losing: tradeCategorization.losingTrades.length,
        breakEven: tradeCategorization.breakEvenTrades.length,
        invalid: tradeCategorization.invalidTrades.length
    }, null, 2));

    return tradeCategorization;
}

// Run the categorization
log('Starting trade categorization...\n');
const results = categorizeTrades(sampleTrades);
log('\nCategorization complete.');

// Close the log stream
logStream.end(); 