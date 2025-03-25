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

// Available strategies
const STRATEGIES = [
    'Breakout',
    'Momentum',
    'Mean Reversion',
    'Support Bounce',
    'Trend Following',
    'News Trading',
    'Range Trading',
    'Technical',
    'Value',
    'Sector Strength'
];

// Common mistakes for losing trades
const MISTAKES = [
    'Didn\'t wait for confirmation',
    'Ignored overall market sentiment',
    'Poor position sizing',
    'Chased the move',
    'Ignored technical levels',
    'Emotional trading',
    'No clear exit strategy',
    'Averaged down on losing trade',
    'Failed to cut losses',
    'Traded against the trend'
];

// Helper function to get random items from array
function getRandomItems(array: string[], count: number): string[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Sample trades data with updated specifications
const sampleTrades = [
    // Open Trades (2)
    {
        pair: 'BTC/USDT',
        type: 'BUY',
        entryPrice: 42000,
        exitPrice: null,
        quantity: 0.5,
        status: 'OPEN',
        strategy: getRandomItems(STRATEGIES, 2),
        indicators: ['RSI', 'MACD', 'Volume'],
        notes: 'Strong breakout above resistance with high volume confirmation',
        mistakes: [],
        reason: 'Price broke key resistance with increasing volume',
        tags: ['Crypto', 'Technical'],
        emotionalState: 'confident',
        confidence: 8,
        createdAt: createTimestamp('2024-02-25T10:30:00'),
        closedAt: null
    },
    {
        pair: 'ETH/USDT',
        type: 'SELL',
        entryPrice: 2500,
        exitPrice: null,
        quantity: 2,
        status: 'OPEN',
        strategy: getRandomItems(STRATEGIES, 2),
        indicators: ['RSI', 'Bollinger Bands'],
        notes: 'Short position at major resistance level',
        mistakes: [],
        reason: 'Overbought conditions on multiple timeframes',
        tags: ['Crypto', 'Technical'],
        emotionalState: 'focused',
        confidence: 7,
        createdAt: createTimestamp('2024-02-26T09:15:00'),
        closedAt: null
    },

    // Winning Trades (12)
    {
        pair: 'NVDA/USD',
        type: 'BUY',
        entryPrice: 480,
        exitPrice: 495,
        quantity: 5,
        status: 'CLOSED',
        strategy: getRandomItems(STRATEGIES, 2),
        indicators: ['Moving Average', 'Volume'],
        notes: 'Strong sector momentum with individual stock breakout',
        mistakes: [],
        reason: 'Leading stock in strong sector',
        tags: ['Stocks', 'Technology'],
        emotionalState: 'confident',
        confidence: 9,
        createdAt: createTimestamp('2024-02-20T10:00:00'),
        closedAt: createTimestamp('2024-02-20T14:30:00')
    },
    {
        pair: 'TSLA/USD',
        type: 'SELL',
        entryPrice: 220,
        exitPrice: 205,
        quantity: 10,
        status: 'CLOSED',
        strategy: getRandomItems(STRATEGIES, 2),
        indicators: ['RSI', 'Volume'],
        notes: 'Clean breakdown with volume confirmation',
        mistakes: [],
        reason: 'Technical breakdown with increasing volume',
        tags: ['Stocks', 'Technical'],
        emotionalState: 'focused',
        confidence: 8,
        createdAt: createTimestamp('2024-02-19T11:30:00'),
        closedAt: createTimestamp('2024-02-19T15:45:00')
    },
    {
        pair: 'SOL/USDT',
        type: 'BUY',
        entryPrice: 95,
        exitPrice: 102,
        quantity: 20,
        status: 'CLOSED',
        strategy: getRandomItems(STRATEGIES, 2),
        indicators: ['Moving Average', 'RSI'],
        notes: 'Strong bounce from support level',
        mistakes: [],
        reason: 'Multiple timeframe support level',
        tags: ['Crypto', 'Technical'],
        emotionalState: 'calm',
        confidence: 8,
        createdAt: createTimestamp('2024-02-18T13:20:00'),
        closedAt: createTimestamp('2024-02-18T16:45:00')
    },
    {
        pair: 'META/USD',
        type: 'BUY',
        entryPrice: 380,
        exitPrice: 395,
        quantity: 8,
        status: 'CLOSED',
        strategy: getRandomItems(STRATEGIES, 2),
        indicators: ['Volume', 'Price Action'],
        notes: 'Strong earnings momentum continuation',
        mistakes: [],
        reason: 'Post-earnings momentum with sector strength',
        tags: ['Stocks', 'Earnings'],
        emotionalState: 'focused',
        confidence: 9,
        createdAt: createTimestamp('2024-02-17T10:15:00'),
        closedAt: createTimestamp('2024-02-17T14:30:00')
    },
    {
        pair: 'EUR/USD',
        type: 'SELL',
        entryPrice: 1.0950,
        exitPrice: 1.0920,
        quantity: 100000,
        status: 'CLOSED',
        strategy: getRandomItems(STRATEGIES, 2),
        indicators: ['Moving Average', 'RSI'],
        notes: 'Clean trend break with momentum',
        mistakes: [],
        reason: 'Break of key support level',
        tags: ['Forex', 'Technical'],
        emotionalState: 'calm',
        confidence: 8,
        createdAt: createTimestamp('2024-02-16T08:30:00'),
        closedAt: createTimestamp('2024-02-16T11:45:00')
    },
    {
        pair: 'BNB/USDT',
        type: 'BUY',
        entryPrice: 305,
        exitPrice: 312,
        quantity: 10,
        status: 'CLOSED',
        strategy: getRandomItems(STRATEGIES, 2),
        indicators: ['RSI', 'Support/Resistance'],
        notes: 'Strong bounce from major support',
        mistakes: [],
        reason: 'Major support level with oversold conditions',
        tags: ['Crypto', 'Technical'],
        emotionalState: 'confident',
        confidence: 8,
        createdAt: createTimestamp('2024-02-15T12:15:00'),
        closedAt: createTimestamp('2024-02-15T15:30:00')
    },
    {
        pair: 'MSFT/USD',
        type: 'BUY',
        entryPrice: 405,
        exitPrice: 415,
        quantity: 6,
        status: 'CLOSED',
        strategy: getRandomItems(STRATEGIES, 2),
        indicators: ['Moving Average', 'Volume'],
        notes: 'Strong trend continuation',
        mistakes: [],
        reason: 'Break of consolidation in uptrend',
        tags: ['Stocks', 'Technical'],
        emotionalState: 'focused',
        confidence: 9,
        createdAt: createTimestamp('2024-02-14T10:30:00'),
        closedAt: createTimestamp('2024-02-14T14:45:00')
    },
    {
        pair: 'XRP/USDT',
        type: 'BUY',
        entryPrice: 0.55,
        exitPrice: 0.58,
        quantity: 2000,
        status: 'CLOSED',
        strategy: getRandomItems(STRATEGIES, 2),
        indicators: ['Volume', 'Price Action'],
        notes: 'Quick momentum play on news',
        mistakes: [],
        reason: 'Positive regulatory news',
        tags: ['Crypto', 'News'],
        emotionalState: 'excited',
        confidence: 8,
        createdAt: createTimestamp('2024-02-13T15:20:00'),
        closedAt: createTimestamp('2024-02-13T16:45:00')
    },
    {
        pair: 'LINK/USDT',
        type: 'BUY',
        entryPrice: 18.5,
        exitPrice: 19.2,
        quantity: 100,
        status: 'CLOSED',
        strategy: getRandomItems(STRATEGIES, 2),
        indicators: ['RSI', 'Volume'],
        notes: 'Strong breakout with volume',
        mistakes: [],
        reason: 'Break of resistance with volume',
        tags: ['Crypto', 'Technical'],
        emotionalState: 'confident',
        confidence: 9,
        createdAt: createTimestamp('2024-02-12T13:20:00'),
        closedAt: createTimestamp('2024-02-12T15:45:00')
    },
    {
        pair: 'USD/CAD',
        type: 'SELL',
        entryPrice: 1.3450,
        exitPrice: 1.3420,
        quantity: 75000,
        status: 'CLOSED',
        strategy: getRandomItems(STRATEGIES, 2),
        indicators: ['Moving Average', 'RSI'],
        notes: 'Clean break of trend line',
        mistakes: [],
        reason: 'Break of major trend line',
        tags: ['Forex', 'Technical'],
        emotionalState: 'calm',
        confidence: 8,
        createdAt: createTimestamp('2024-02-11T08:45:00'),
        closedAt: createTimestamp('2024-02-11T10:30:00')
    },
    {
        pair: 'AVAX/USDT',
        type: 'SELL',
        entryPrice: 35.5,
        exitPrice: 33.8,
        quantity: 50,
        status: 'CLOSED',
        strategy: getRandomItems(STRATEGIES, 2),
        indicators: ['Moving Average', 'RSI'],
        notes: 'Break of support with volume',
        mistakes: [],
        reason: 'Break of key support level',
        tags: ['Crypto', 'Technical'],
        emotionalState: 'confident',
        confidence: 8,
        createdAt: createTimestamp('2024-02-10T14:20:00'),
        closedAt: createTimestamp('2024-02-10T16:45:00')
    },

    // Losing Trades (6)
    {
        pair: 'AAPL/USD',
        type: 'BUY',
        entryPrice: 185,
        exitPrice: 182,
        quantity: 10,
        status: 'CLOSED',
        strategy: getRandomItems(STRATEGIES, 2),
        indicators: ['Volume', 'Price Action'],
        notes: 'Failed earnings play',
        mistakes: getRandomItems(MISTAKES, 2),
        reason: 'Positive earnings expectation',
        tags: ['Stocks', 'Earnings'],
        emotionalState: 'anxious',
        confidence: 6,
        createdAt: createTimestamp('2024-02-09T14:30:00'),
        closedAt: createTimestamp('2024-02-09T15:45:00')
    },
    {
        pair: 'DOT/USDT',
        type: 'BUY',
        entryPrice: 6.8,
        exitPrice: 6.5,
        quantity: 300,
        status: 'CLOSED',
        strategy: getRandomItems(STRATEGIES, 2),
        indicators: ['RSI', 'Moving Average'],
        notes: 'Failed bottom reversal',
        mistakes: getRandomItems(MISTAKES, 3),
        reason: 'Oversold conditions',
        tags: ['Crypto', 'Technical'],
        emotionalState: 'frustrated',
        confidence: 6,
        createdAt: createTimestamp('2024-02-08T11:15:00'),
        closedAt: createTimestamp('2024-02-08T13:30:00')
    },
    {
        pair: 'GBP/JPY',
        type: 'BUY',
        entryPrice: 182.50,
        exitPrice: 181.80,
        quantity: 50000,
        status: 'CLOSED',
        strategy: getRandomItems(STRATEGIES, 2),
        indicators: ['RSI', 'Support/Resistance'],
        notes: 'Failed range support',
        mistakes: getRandomItems(MISTAKES, 2),
        reason: 'Price at range support',
        tags: ['Forex', 'Range'],
        emotionalState: 'uncertain',
        confidence: 7,
        createdAt: createTimestamp('2024-02-07T09:45:00'),
        closedAt: createTimestamp('2024-02-07T11:30:00')
    },
    {
        pair: 'AMD/USD',
        type: 'BUY',
        entryPrice: 170,
        exitPrice: 168,
        quantity: 12,
        status: 'CLOSED',
        strategy: getRandomItems(STRATEGIES, 2),
        indicators: ['Volume', 'Moving Average'],
        notes: 'Failed momentum play',
        mistakes: getRandomItems(MISTAKES, 2),
        reason: 'Strong sector momentum',
        tags: ['Stocks', 'Technology'],
        emotionalState: 'greedy',
        confidence: 7,
        createdAt: createTimestamp('2024-02-06T10:45:00'),
        closedAt: createTimestamp('2024-02-06T12:30:00')
    },
    {
        pair: 'EUR/GBP',
        type: 'SELL',
        entryPrice: 0.8550,
        exitPrice: 0.8530,
        quantity: 85000,
        status: 'CLOSED',
        strategy: getRandomItems(STRATEGIES, 2),
        indicators: ['Moving Average', 'Price Action'],
        notes: 'Failed news trade',
        mistakes: getRandomItems(MISTAKES, 2),
        reason: 'Bearish economic data',
        tags: ['Forex', 'News'],
        emotionalState: 'uncertain',
        confidence: 7,
        createdAt: createTimestamp('2024-02-05T08:30:00'),
        closedAt: createTimestamp('2024-02-05T09:15:00')
    },
    {
        pair: 'ATOM/USDT',
        type: 'SELL',
        entryPrice: 9.8,
        exitPrice: 10.1,
        quantity: 200,
        status: 'CLOSED',
        strategy: getRandomItems(STRATEGIES, 2),
        indicators: ['Moving Average', 'RSI'],
        notes: 'Failed breakdown trade',
        mistakes: getRandomItems(MISTAKES, 3),
        reason: 'Break of range support',
        tags: ['Crypto', 'Technical'],
        emotionalState: 'frustrated',
        confidence: 6,
        createdAt: createTimestamp('2024-02-04T11:45:00'),
        closedAt: createTimestamp('2024-02-04T14:30:00')
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

async function addSampleTradesV2() {
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

        // Print summary
        const openTrades = sampleTrades.filter(t => t.status === 'OPEN').length;
        const closedTrades = sampleTrades.filter(t => t.status === 'CLOSED').length;
        const winningTrades = sampleTrades.filter(t => t.status === 'CLOSED' && t.exitPrice && t.exitPrice > t.entryPrice).length;
        const losingTrades = sampleTrades.filter(t => t.status === 'CLOSED' && t.exitPrice && t.exitPrice < t.entryPrice).length;

        console.log('\nTrade Summary:');
        console.log(`Open Trades: ${openTrades}`);
        console.log(`Closed Trades: ${closedTrades}`);
        console.log(`Winning Trades: ${winningTrades}`);
        console.log(`Losing Trades: ${losingTrades}`);
    } catch (error) {
        console.error('Error in addSampleTradesV2:', error);
    }
}

// Run the script
console.log('Starting sample trades script v2...');
addSampleTradesV2(); 