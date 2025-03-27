import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../config/firebase';
import AuthService from '../lib/auth';
import RealTimeService from '../lib/realtime';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    resendVerificationEmail: () => Promise<void>;
    isEmailVerified: boolean;
}

const FAILED_ATTEMPTS_KEY = 'failedLoginAttempts';
const LOCKOUT_TIME_KEY = 'loginLockoutTime';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signIn: async () => { },
    signUp: async () => { },
    signOut: async () => { },
    resetPassword: async () => { },
    resendVerificationEmail: async () => { },
    isEmailVerified: false,
});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEmailVerified, setIsEmailVerified] = useState(false);

    useEffect(() => {
        // Listen for auth state changes
        const unsubscribe = auth.onAuthStateChanged((user) => {
            console.log('Auth state changed:', user ? 'User logged in' : 'No user');
            setUser(user);
            setIsEmailVerified(user?.emailVerified ?? false);
            setLoading(false);
        });

        // Cleanup subscription
        return unsubscribe;
    }, []);

    const checkLoginAttempts = async (email: string): Promise<boolean> => {
        const attemptsKey = `${FAILED_ATTEMPTS_KEY}:${email}`;
        const lockoutKey = `${LOCKOUT_TIME_KEY}:${email}`;

        const lockoutTime = await AsyncStorage.getItem(lockoutKey);
        if (lockoutTime) {
            const lockoutExpiry = parseInt(lockoutTime, 10);
            if (Date.now() < lockoutExpiry) {
                const remainingMinutes = Math.ceil((lockoutExpiry - Date.now()) / (60 * 1000));
                throw new Error(`Too many login attempts. Please try again in ${remainingMinutes} minutes.`);
            }
            // Lockout period expired, reset counters
            await AsyncStorage.multiRemove([attemptsKey, lockoutKey]);
            return true;
        }

        const attempts = await AsyncStorage.getItem(attemptsKey);
        return !attempts || parseInt(attempts, 10) < MAX_FAILED_ATTEMPTS;
    };

    const incrementFailedAttempts = async (email: string) => {
        const attemptsKey = `${FAILED_ATTEMPTS_KEY}:${email}`;
        const lockoutKey = `${LOCKOUT_TIME_KEY}:${email}`;

        const attempts = await AsyncStorage.getItem(attemptsKey);
        const newAttempts = (attempts ? parseInt(attempts, 10) : 0) + 1;
        await AsyncStorage.setItem(attemptsKey, newAttempts.toString());

        if (newAttempts >= MAX_FAILED_ATTEMPTS) {
            const lockoutExpiry = Date.now() + LOCKOUT_DURATION;
            await AsyncStorage.setItem(lockoutKey, lockoutExpiry.toString());
        }
    };

    const resetFailedAttempts = async (email: string) => {
        const attemptsKey = `${FAILED_ATTEMPTS_KEY}:${email}`;
        const lockoutKey = `${LOCKOUT_TIME_KEY}:${email}`;
        await AsyncStorage.multiRemove([attemptsKey, lockoutKey]);
    };

    const signIn = async (email: string, password: string) => {
        try {
            setLoading(true);
            await checkLoginAttempts(email);
            await AuthService.signIn(email, password);
            await resetFailedAttempts(email);
        } catch (error: any) {
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                await incrementFailedAttempts(email);
            }
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, password: string) => {
        try {
            setLoading(true);
            await AuthService.signUp(email, password);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            setLoading(true);

            // Unsubscribe from all Firestore listeners before logging out
            RealTimeService.unsubscribeAll();

            await AuthService.signOut();
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (email: string) => {
        try {
            setLoading(true);
            await AuthService.resetPassword(email);
        } finally {
            setLoading(false);
        }
    };

    const resendVerificationEmail = async () => {
        try {
            setLoading(true);
            if (user) {
                await AuthService.resendVerificationEmail(user);
            } else {
                throw new Error('No user signed in');
            }
        } finally {
            setLoading(false);
        }
    };

    const value = {
        user,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        resendVerificationEmail,
        isEmailVerified,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export default AuthProvider; 