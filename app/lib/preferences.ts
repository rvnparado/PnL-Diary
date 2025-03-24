import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface UserPreferences {
    userId: string;
    defaultPair?: string;
    defaultQuantity?: number;
    commonStrategies: string[];
    commonIndicators: string[];
    commonMistakes: string[];
    darkMode: boolean;
    notifications: {
        tradeReminders: boolean;
        performanceUpdates: boolean;
        marketAlerts: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}

const PREFERENCES_COLLECTION = 'userPreferences';

export async function initializeUserPreferences(userId: string): Promise<void> {
    try {
        const defaultPreferences: UserPreferences = {
            userId,
            commonStrategies: [],
            commonIndicators: [],
            commonMistakes: [],
            darkMode: false,
            notifications: {
                tradeReminders: true,
                performanceUpdates: true,
                marketAlerts: true,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await setDoc(doc(db, PREFERENCES_COLLECTION, userId), defaultPreferences);
    } catch (error) {
        console.error('Error initializing user preferences:', error);
        throw error;
    }
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
        const preferencesRef = doc(db, PREFERENCES_COLLECTION, userId);
        const preferencesDoc = await getDoc(preferencesRef);

        if (!preferencesDoc.exists()) {
            return null;
        }

        return preferencesDoc.data() as UserPreferences;
    } catch (error) {
        console.error('Error fetching user preferences:', error);
        throw error;
    }
}

export async function updateUserPreferences(
    userId: string,
    updates: Partial<Omit<UserPreferences, 'userId' | 'createdAt'>>
): Promise<void> {
    try {
        const preferencesRef = doc(db, PREFERENCES_COLLECTION, userId);
        await updateDoc(preferencesRef, {
            ...updates,
            updatedAt: new Date(),
        });
    } catch (error) {
        console.error('Error updating user preferences:', error);
        throw error;
    }
}

export async function addCommonItem(
    userId: string,
    type: 'strategies' | 'indicators' | 'mistakes',
    item: string
): Promise<void> {
    try {
        const preferencesRef = doc(db, PREFERENCES_COLLECTION, userId);
        const preferences = await getDoc(preferencesRef);

        if (!preferences.exists()) {
            throw new Error('User preferences not found');
        }

        const data = preferences.data() as UserPreferences;
        const key = `common${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof UserPreferences;
        const currentItems = data[key] as string[];

        if (!currentItems.includes(item)) {
            await updateDoc(preferencesRef, {
                [key]: [...currentItems, item],
                updatedAt: new Date(),
            });
        }
    } catch (error) {
        console.error(`Error adding common ${type}:`, error);
        throw error;
    }
}

export async function removeCommonItem(
    userId: string,
    type: 'strategies' | 'indicators' | 'mistakes',
    item: string
): Promise<void> {
    try {
        const preferencesRef = doc(db, PREFERENCES_COLLECTION, userId);
        const preferences = await getDoc(preferencesRef);

        if (!preferences.exists()) {
            throw new Error('User preferences not found');
        }

        const data = preferences.data() as UserPreferences;
        const key = `common${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof UserPreferences;
        const currentItems = data[key] as string[];

        await updateDoc(preferencesRef, {
            [key]: currentItems.filter(i => i !== item),
            updatedAt: new Date(),
        });
    } catch (error) {
        console.error(`Error removing common ${type}:`, error);
        throw error;
    }
}

const PreferencesService = {
    initializeUserPreferences,
    getUserPreferences,
    updateUserPreferences,
    addCommonItem,
    removeCommonItem,
};

export default PreferencesService; 