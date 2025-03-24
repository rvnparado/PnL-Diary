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

// Test user credentials
const TEST_EMAIL = 'testing@testing.com';
const TEST_PASSWORD = 'testing';

// Helper function to create Firestore timestamp
const createTimestamp = (dateString: string) => {
    return Timestamp.fromDate(new Date(dateString));
};

// Sample trades data
const sampleTrades = [
    {
        pair: 'BTC/USDT',
        type: 'BUY',
        entryPrice: 65000,
        exitPrice: 67000,
        quantity: 0.5,
        strategy: ['Breakout', 'Trend Following'],
        indicators: ['RSI', 'MACD', 'Moving Average'],
        notes: 'Strong momentum breakout above previous resistance. RSI showed bullish divergence and MACD confirmed the trend.',
        mistakes: ['Took partial profits too early'],
        createdAt: createTimestamp('2023-12-20'),
        updatedAt: createTimestamp('2023-12-20')
    },
    {
        pair: 'ETH/USDT',
        type: 'SELL',
        entryPrice: 3500,
        exitPrice: 3300,
        quantity: 2,
        strategy: ['Mean Reversion'],
        indicators: ['Bollinger Bands', 'RSI'],
        notes: 'Price reached upper Bollinger Band with RSI overbought. Clear reversal pattern on the 4H timeframe.',
        mistakes: ['Position size was too small given the setup quality'],
        createdAt: createTimestamp('2023-12-21'),
        updatedAt: createTimestamp('2023-12-21')
    },
    {
        pair: 'SOL/USDT',
        type: 'BUY',
        entryPrice: 120,
        exitPrice: 125,
        quantity: 10,
        strategy: ['Support Bounce', 'Momentum'],
        indicators: ['Support/Resistance', 'Volume', 'RSI'],
        notes: 'Multiple timeframe confluence at major support level. High volume confirmation on the 1H chart.',
        mistakes: [],
        createdAt: createTimestamp('2023-12-22'),
        updatedAt: createTimestamp('2023-12-22')
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
        console.log('Signing in with test account...');
        // Sign in with test account
        const userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
        const userId = userCredential.user.uid;
        console.log('Successfully signed in with test account');

        // Clear existing trades
        await clearExistingTrades(userId);

        // Add new sample trades
        console.log('Adding new sample trades...');
        const tradesRef = collection(db, 'trades');
        for (const trade of sampleTrades) {
            const tradeWithUserId = {
                ...trade,
                userId
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