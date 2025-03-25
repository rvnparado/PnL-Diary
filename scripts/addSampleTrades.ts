import { initializeApp } from 'firebase/app';
import { collection, addDoc, getFirestore, getDocs, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBTYEt1ZwC84RaeorU6gMgK5SRr6RJ-2J0",
    authDomain: "pnl-diary.firebaseapp.com",
    projectId: "pnl-diary",
    storageBucket: "pnl-diary.firebasestorage.app",
    messagingSenderId: "242104324100",
    appId: "1:242104324100:web:0c75480cf194c5b2e9e551",
    measurementId: "G-J7RXPZSMCR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

// User credentials
const USER_EMAIL = 'rvnparado@gmail.com';
const USER_PASSWORD = 'Test!ng1';

// Helper function to create Firestore timestamp
const createTimestamp = (dateString: string) => {
    return Timestamp.fromDate(new Date(dateString));
};

// Sample trades data with diverse scenarios
const sampleTrades = [
    {
        pair: 'BTC/USDT',
        type: 'BUY',
        entryPrice: 42000,
        exitPrice: 43500,
        quantity: 0.5,
        status: 'CLOSED',
        strategy: ['Breakout', 'Momentum'],
        indicators: ['RSI', 'MACD', 'Volume'],
        notes: 'Strong breakout above resistance with high volume confirmation',
        mistakes: ['Took profits too early'],
        reason: 'Price broke key resistance with increasing volume',
        tags: ['Crypto', 'Technical', 'Breakout'],
        emotionalState: 'confident',
        confidence: 8,
        createdAt: createTimestamp('2025-02-25T10:30:00'),
        closedAt: createTimestamp('2025-02-25T14:45:00')
    },
    {
        pair: 'ETH/USDT',
        type: 'SELL',
        entryPrice: 2500,
        exitPrice: 2350,
        quantity: 2,
        status: 'CLOSED',
        strategy: ['Mean Reversion', 'Overbought'],
        indicators: ['RSI', 'Bollinger Bands', 'Stochastic'],
        notes: 'RSI showing overbought conditions with price at upper BB',
        mistakes: ['Didn\'t wait for confirmation'],
        reason: 'Overbought conditions on multiple timeframes',
        tags: ['Crypto', 'Mean Reversion'],
        emotionalState: 'cautious',
        confidence: 7,
        createdAt: createTimestamp('2025-02-26T09:15:00'),
        closedAt: createTimestamp('2025-02-26T11:30:00')
    },
    {
        pair: 'SOL/USDT',
        type: 'BUY',
        entryPrice: 95,
        exitPrice: null,  // Open trade
        quantity: 20,
        status: 'OPEN',
        strategy: ['Support Bounce', 'Trend Following'],
        indicators: ['Moving Average', 'Support/Resistance', 'RSI'],
        notes: 'Strong bounce from support level with trend confirmation',
        mistakes: [],
        reason: 'Multiple timeframe support level with oversold RSI',
        tags: ['Crypto', 'Support/Resistance'],
        emotionalState: 'focused',
        confidence: 9,
        createdAt: createTimestamp('2025-02-27T13:20:00'),
        closedAt: null  // Open trade
    },
    {
        pair: 'AAPL/USD',
        type: 'BUY',
        entryPrice: 185,
        exitPrice: 182,
        quantity: 10,
        status: 'CLOSED',
        strategy: ['News Trading', 'Momentum'],
        indicators: ['Volume', 'Price Action'],
        notes: 'Earnings report play, but market reaction was negative',
        mistakes: ['Didn\'t wait for market reaction', 'Ignored overall market sentiment'],
        reason: 'Positive earnings expectation',
        tags: ['Stocks', 'Fundamentals', 'Earnings'],
        emotionalState: 'anxious',
        confidence: 6,
        createdAt: createTimestamp('2025-02-28T14:30:00'),
        closedAt: createTimestamp('2025-02-28T15:45:00')
    },
    {
        pair: 'EUR/USD',
        type: 'SELL',
        entryPrice: 1.0950,
        exitPrice: null,  // Open trade
        quantity: 100000,
        status: 'OPEN',
        strategy: ['Technical', 'Trend Following'],
        indicators: ['Moving Average', 'RSI', 'MACD'],
        notes: 'Clean trend break with momentum confirmation',
        mistakes: [],
        reason: 'Break of key support level with momentum',
        tags: ['Forex', 'Technical'],
        emotionalState: 'calm',
        confidence: 8,
        createdAt: createTimestamp('2025-03-01T08:30:00'),
        closedAt: null  // Open trade
    },
    {
        pair: 'NVDA/USD',
        type: 'BUY',
        entryPrice: 480,
        exitPrice: 495,
        quantity: 5,
        status: 'CLOSED',
        strategy: ['Momentum', 'Sector Strength'],
        indicators: ['Relative Strength', 'Volume', 'Trend Lines'],
        notes: 'Strong sector momentum with individual stock breakout',
        mistakes: [],
        reason: 'Leading stock in strong sector',
        tags: ['Stocks', 'Technology', 'Momentum'],
        emotionalState: 'confident',
        confidence: 9,
        createdAt: createTimestamp('2025-03-02T10:00:00'),
        closedAt: createTimestamp('2025-03-02T14:30:00')
    },
    {
        pair: 'GBP/JPY',
        type: 'BUY',
        entryPrice: 182.50,
        exitPrice: 181.80,
        quantity: 50000,
        status: 'CLOSED',
        strategy: ['Range Trading', 'Support/Resistance'],
        indicators: ['Bollinger Bands', 'RSI', 'Support/Resistance'],
        notes: 'Failed range support bounce',
        mistakes: ['Didn\'t honor stop loss', 'Averaged down'],
        reason: 'Price at range support with oversold RSI',
        tags: ['Forex', 'Range Trading'],
        emotionalState: 'frustrated',
        confidence: 7,
        createdAt: createTimestamp('2025-03-03T09:45:00'),
        closedAt: createTimestamp('2025-03-03T11:30:00')
    },
    {
        pair: 'XRP/USDT',
        type: 'BUY',
        entryPrice: 0.55,
        exitPrice: 0.58,
        quantity: 2000,
        status: 'CLOSED',
        strategy: ['News Trading', 'Momentum'],
        indicators: ['Volume', 'Price Action'],
        notes: 'Quick momentum play on positive news',
        mistakes: ['Late entry'],
        reason: 'Positive regulatory news with volume spike',
        tags: ['Crypto', 'News', 'Momentum'],
        emotionalState: 'excited',
        confidence: 8,
        createdAt: createTimestamp('2025-03-04T15:20:00'),
        closedAt: createTimestamp('2025-03-04T16:45:00')
    },
    {
        pair: 'TSLA/USD',
        type: 'SELL',
        entryPrice: 220,
        exitPrice: 205,
        quantity: 10,
        status: 'CLOSED',
        strategy: ['Technical', 'Trend Following'],
        indicators: ['Moving Average', 'Volume', 'RSI'],
        notes: 'Break of major support level with increasing volume',
        mistakes: [],
        reason: 'Technical breakdown with volume confirmation',
        tags: ['Stocks', 'Technical', 'Trend'],
        emotionalState: 'focused',
        confidence: 9,
        createdAt: createTimestamp('2025-03-05T10:30:00'),
        closedAt: createTimestamp('2025-03-05T15:45:00')
    },
    {
        pair: 'DOT/USDT',
        type: 'BUY',
        entryPrice: 6.8,
        exitPrice: 6.5,
        quantity: 300,
        status: 'CLOSED',
        strategy: ['Bottom Fishing', 'Value'],
        indicators: ['RSI', 'Moving Average', 'Volume'],
        notes: 'Attempted bottom picking but no confirmation',
        mistakes: ['No confirmation of reversal', 'Ignored trend'],
        reason: 'Oversold conditions on daily timeframe',
        tags: ['Crypto', 'Reversal'],
        emotionalState: 'hopeful',
        confidence: 6,
        createdAt: createTimestamp('2025-03-06T11:15:00'),
        closedAt: createTimestamp('2025-03-06T13:30:00')
    },
    {
        pair: 'USD/CAD',
        type: 'SELL',
        entryPrice: 1.3450,
        exitPrice: 1.3420,
        quantity: 75000,
        status: 'CLOSED',
        strategy: ['Technical', 'Breakout'],
        indicators: ['Moving Average', 'RSI', 'Trend Lines'],
        notes: 'Clean break of trend line with follow-through',
        mistakes: ['Took profits too early'],
        reason: 'Break of major trend line with momentum',
        tags: ['Forex', 'Technical', 'Breakout'],
        emotionalState: 'calm',
        confidence: 8,
        createdAt: createTimestamp('2024-01-25T08:45:00'),
        closedAt: createTimestamp('2024-01-25T10:30:00')
    },
    {
        pair: 'LINK/USDT',
        type: 'BUY',
        entryPrice: 18.5,
        exitPrice: 19.2,
        quantity: 100,
        status: 'CLOSED',
        strategy: ['Momentum', 'Breakout'],
        indicators: ['RSI', 'Volume', 'MACD'],
        notes: 'Strong breakout with volume confirmation',
        mistakes: [],
        reason: 'Break of resistance with increasing volume',
        tags: ['Crypto', 'Technical', 'Momentum'],
        emotionalState: 'confident',
        confidence: 9,
        createdAt: createTimestamp('2024-01-26T13:20:00'),
        closedAt: createTimestamp('2024-01-26T15:45:00')
    },
    {
        pair: 'META/USD',
        type: 'BUY',
        entryPrice: 380,
        exitPrice: 395,
        quantity: 8,
        status: 'CLOSED',
        strategy: ['Momentum', 'Earnings'],
        indicators: ['Volume', 'Price Action', 'Moving Average'],
        notes: 'Strong earnings momentum continuation',
        mistakes: ['Could have sized larger'],
        reason: 'Post-earnings momentum with sector strength',
        tags: ['Stocks', 'Earnings', 'Momentum'],
        emotionalState: 'focused',
        confidence: 9,
        createdAt: createTimestamp('2024-01-27T10:15:00'),
        closedAt: createTimestamp('2024-01-27T14:30:00')
    },
    {
        pair: 'AUD/JPY',
        type: 'BUY',
        entryPrice: 97.80,
        exitPrice: 97.50,
        quantity: 60000,
        status: 'CLOSED',
        strategy: ['Range Trading', 'Support/Resistance'],
        indicators: ['RSI', 'Bollinger Bands', 'Support/Resistance'],
        notes: 'Failed range support play',
        mistakes: ['Ignored broader market context', 'Poor timing'],
        reason: 'Price at range support with oversold RSI',
        tags: ['Forex', 'Range', 'Technical'],
        emotionalState: 'uncertain',
        confidence: 6,
        createdAt: createTimestamp('2024-01-28T09:30:00'),
        closedAt: createTimestamp('2024-01-28T11:15:00')
    },
    {
        pair: 'AVAX/USDT',
        type: 'SELL',
        entryPrice: 35.5,
        exitPrice: 33.8,
        quantity: 50,
        status: 'CLOSED',
        strategy: ['Technical', 'Trend Following'],
        indicators: ['Moving Average', 'RSI', 'Volume'],
        notes: 'Break of support with volume confirmation',
        mistakes: [],
        reason: 'Break of key support level',
        tags: ['Crypto', 'Technical', 'Trend'],
        emotionalState: 'confident',
        confidence: 8,
        createdAt: createTimestamp('2024-01-29T14:20:00'),
        closedAt: createTimestamp('2024-01-29T16:45:00')
    },
    {
        pair: 'AMD/USD',
        type: 'BUY',
        entryPrice: 170,
        exitPrice: 168,
        quantity: 12,
        status: 'CLOSED',
        strategy: ['Momentum', 'Sector Strength'],
        indicators: ['Relative Strength', 'Volume', 'Moving Average'],
        notes: 'Failed momentum continuation',
        mistakes: ['Chased the move', 'Ignored overbought conditions'],
        reason: 'Strong sector momentum',
        tags: ['Stocks', 'Technology', 'Momentum'],
        emotionalState: 'greedy',
        confidence: 7,
        createdAt: createTimestamp('2024-01-30T10:45:00'),
        closedAt: createTimestamp('2024-01-30T12:30:00')
    },
    {
        pair: 'EUR/GBP',
        type: 'SELL',
        entryPrice: 0.8550,
        exitPrice: 0.8530,
        quantity: 85000,
        status: 'CLOSED',
        strategy: ['News Trading', 'Technical'],
        indicators: ['Moving Average', 'Price Action'],
        notes: 'Quick play on economic data release',
        mistakes: ['Entered before full reaction'],
        reason: 'Bearish economic data with technical setup',
        tags: ['Forex', 'News', 'Technical'],
        emotionalState: 'alert',
        confidence: 7,
        createdAt: createTimestamp('2024-01-31T08:30:00'),
        closedAt: createTimestamp('2024-01-31T09:15:00')
    },
    {
        pair: 'BNB/USDT',
        type: 'BUY',
        entryPrice: 305,
        exitPrice: 312,
        quantity: 10,
        status: 'CLOSED',
        strategy: ['Support Bounce', 'Value'],
        indicators: ['RSI', 'Support/Resistance', 'Volume'],
        notes: 'Strong bounce from major support level',
        mistakes: ['Could have held longer'],
        reason: 'Major support level with oversold conditions',
        tags: ['Crypto', 'Technical', 'Support'],
        emotionalState: 'calm',
        confidence: 8,
        createdAt: createTimestamp('2024-02-01T12:15:00'),
        closedAt: createTimestamp('2024-02-01T15:30:00')
    },
    {
        pair: 'MSFT/USD',
        type: 'BUY',
        entryPrice: 405,
        exitPrice: 415,
        quantity: 6,
        status: 'CLOSED',
        strategy: ['Trend Following', 'Momentum'],
        indicators: ['Moving Average', 'Volume', 'RSI'],
        notes: 'Strong trend continuation after consolidation',
        mistakes: [],
        reason: 'Break of consolidation in strong uptrend',
        tags: ['Stocks', 'Technical', 'Trend'],
        emotionalState: 'focused',
        confidence: 9,
        createdAt: createTimestamp('2024-02-02T10:30:00'),
        closedAt: createTimestamp('2024-02-02T14:45:00')
    },
    {
        pair: 'ATOM/USDT',
        type: 'SELL',
        entryPrice: 9.8,
        exitPrice: 9.4,
        quantity: 200,
        status: 'CLOSED',
        strategy: ['Technical', 'Breakdown'],
        indicators: ['Moving Average', 'Volume', 'RSI'],
        notes: 'Clean breakdown from range support',
        mistakes: ['Late entry'],
        reason: 'Break of range support with volume',
        tags: ['Crypto', 'Technical', 'Breakdown'],
        emotionalState: 'patient',
        confidence: 8,
        createdAt: createTimestamp('2024-02-03T11:45:00'),
        closedAt: createTimestamp('2024-02-03T14:30:00')
    }
];

async function clearExistingTrades(userId: string) {
    try {
        console.log('Clearing existing trades...');
        const tradesRef = collection(db, 'trades');
        const q = query(tradesRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);

        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        console.log(`Deleted ${querySnapshot.size} existing trades`);
    } catch (error) {
        console.error('Error clearing existing trades:', error);
        throw error;
    }
}

async function addSampleTrades() {
    try {
        console.log('Signing in with user account...');
        const userCredential = await signInWithEmailAndPassword(auth, USER_EMAIL, USER_PASSWORD);
        const userId = userCredential.user.uid;
        console.log('Successfully signed in');

        // Clear existing trades
        await clearExistingTrades(userId);

        // Add new sample trades
        console.log('Adding new sample trades...');
        const tradesRef = collection(db, 'trades');
        for (const trade of sampleTrades) {
            const tradeWithUserId = {
                ...trade,
                userId,
                updatedAt: trade.createdAt
            };
            const docRef = await addDoc(tradesRef, tradeWithUserId);
            console.log('Added trade with ID:', docRef.id);
        }

        console.log('Successfully added all sample trades');
    } catch (error) {
        console.error('Error in addSampleTrades:', error);
    }
}

// Run the script
console.log('Starting sample trades script...');
addSampleTrades(); 