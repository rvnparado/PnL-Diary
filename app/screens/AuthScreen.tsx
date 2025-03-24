import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import ErrorService from '../lib/errors';
import { Ionicons } from '@expo/vector-icons';

type AuthMode = 'login' | 'register' | 'resetPassword' | 'verifyEmail';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const PasswordRequirements = ({ password }: { password: string }) => {
    const requirements = [
        { label: 'At least 8 characters', met: password.length >= MIN_PASSWORD_LENGTH },
        { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
        { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
        { label: 'Contains number', met: /\d/.test(password) },
        { label: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];

    return (
        <View style={styles.requirementsContainer}>
            {requirements.map((req, index) => (
                <View key={index} style={styles.requirementRow}>
                    <Ionicons
                        name={req.met ? 'checkmark-circle' : 'close-circle'}
                        size={16}
                        color={req.met ? '#4CAF50' : '#ccc'}
                    />
                    <Text style={[styles.requirementText, req.met && styles.requirementMet]}>
                        {req.label}
                    </Text>
                </View>
            ))}
        </View>
    );
};

export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [mode, setMode] = useState<AuthMode>('login');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({
        email: '',
        password: '',
        confirmPassword: '',
    });
    const router = useRouter();
    const { signIn, signUp, resetPassword } = useAuth();

    const validateEmail = (email: string): boolean => {
        return EMAIL_REGEX.test(email);
    };

    const validatePassword = (password: string): boolean => {
        return password.length >= MIN_PASSWORD_LENGTH &&
            /[A-Z]/.test(password) &&
            /[a-z]/.test(password) &&
            /\d/.test(password) &&
            /[!@#$%^&*(),.?":{}|<>]/.test(password);
    };

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setErrors({
            email: '',
            password: '',
            confirmPassword: '',
        });
    };

    const validateForm = (): boolean => {
        const newErrors = {
            email: '',
            password: '',
            confirmPassword: '',
        };
        let isValid = true;

        if (!email.trim()) {
            newErrors.email = 'Email is required';
            isValid = false;
        } else if (!validateEmail(email)) {
            newErrors.email = 'Please enter a valid email address';
            isValid = false;
        }

        if (mode !== 'resetPassword') {
            if (!password) {
                newErrors.password = 'Password is required';
                isValid = false;
            } else if (!validatePassword(password)) {
                newErrors.password = 'Password does not meet requirements';
                isValid = false;
            }

            if (mode === 'register' && password !== confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
                isValid = false;
            }
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleAuth = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setErrors({ email: '', password: '', confirmPassword: '' });

        try {
            switch (mode) {
                case 'login':
                    await signIn(email.trim(), password);
                    break;
                case 'register':
                    await signUp(email.trim(), password);
                    Alert.alert(
                        'Verification Email Sent',
                        'Please check your email to verify your account before signing in.',
                        [{ text: 'OK', onPress: () => setMode('login') }]
                    );
                    return;
                case 'resetPassword':
                    await resetPassword(email.trim());
                    Alert.alert(
                        'Password Reset Email Sent',
                        'Check your email for instructions.',
                        [{ text: 'OK', onPress: () => setMode('login') }]
                    );
                    return;
            }
        } catch (error: any) {
            console.log('Auth error:', error.code, error.message);

            if (error.code === 'auth/email-not-verified') {
                Alert.alert(
                    'Email Not Verified',
                    'Please verify your email address to continue. Would you like us to send a new verification email?',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Send Email',
                            style: 'default',
                            onPress: async () => {
                                try {
                                    if (error.user) {
                                        await error.user.sendEmailVerification();
                                        Alert.alert(
                                            'Verification Email Sent',
                                            'Please check your email to verify your account.'
                                        );
                                    }
                                } catch (sendError) {
                                    Alert.alert(
                                        'Error',
                                        'Failed to send verification email. Please try again later.'
                                    );
                                }
                            }
                        }
                    ]
                );
                return;
            }

            switch (error.code) {
                case 'auth/invalid-email':
                    Alert.alert(
                        'Oops! Invalid Email Format',
                        "The email address format doesn't look quite right. Please use a valid format like: example@gmail.com",
                        [{ text: 'Got it', style: 'default' }]
                    );
                    break;
                case 'auth/email-already-in-use':
                    Alert.alert(
                        'Welcome Back!',
                        'Looks like you already have an account with us. Would you like to sign in instead?',
                        [
                            { text: 'Not Now', style: 'cancel' },
                            {
                                text: 'Yes, Sign In',
                                style: 'default',
                                onPress: () => switchMode('login')
                            }
                        ]
                    );
                    break;
                case 'auth/user-not-found':
                    Alert.alert(
                        'Account Not Found',
                        "We couldn't find an account with this email. Would you like to create a new account?",
                        [
                            { text: 'Not Now', style: 'cancel' },
                            {
                                text: 'Create Account',
                                style: 'default',
                                onPress: () => switchMode('register')
                            }
                        ]
                    );
                    break;
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    Alert.alert(
                        'Incorrect Password',
                        "The password you entered doesn't match our records. Would you like to reset it?",
                        [
                            { text: 'Try Again', style: 'cancel' },
                            {
                                text: 'Reset Password',
                                style: 'default',
                                onPress: () => switchMode('resetPassword')
                            }
                        ]
                    );
                    setPassword('');
                    break;
                case 'auth/weak-password':
                    Alert.alert(
                        'Weak Password',
                        "For better security, please use a password that is:\n\n• At least 6 characters long\n• Contains a mix of letters and numbers\n• Includes special characters (!@#$%)",
                        [{ text: "OK, I'll Fix It", style: 'default' }]
                    );
                    break;
                case 'auth/network-request-failed':
                    Alert.alert(
                        'Connection Error',
                        "We're having trouble connecting to our servers. Please:\n\n• Check your internet connection\n• Make sure you're online\n• Try again in a few moments",
                        [{ text: 'Try Again', style: 'default' }]
                    );
                    break;
                case 'auth/too-many-requests':
                    Alert.alert(
                        'Too Many Attempts',
                        "For security reasons, we've temporarily locked sign-in for this account. You can:\n\n• Try again later\n• Reset your password\n• Contact support if you need help",
                        [
                            { text: 'OK', style: 'cancel' },
                            {
                                text: 'Reset Password',
                                style: 'default',
                                onPress: () => switchMode('resetPassword')
                            }
                        ]
                    );
                    break;
                case 'auth/operation-not-allowed':
                    Alert.alert(
                        'Service Unavailable',
                        'This sign-in method is temporarily unavailable. Please try again later or contact our support team for assistance.',
                        [{ text: 'OK', style: 'default' }]
                    );
                    break;
                case 'auth/requires-recent-login':
                    Alert.alert(
                        'Re-authentication Required',
                        'For security reasons, please sign in again before making this change.',
                        [{ text: 'OK', onPress: () => setMode('login') }]
                    );
                    break;
                case 'auth/expired-action-code':
                    Alert.alert(
                        'Link Expired',
                        'This verification link has expired. Would you like to request a new one?',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Send New Link',
                                style: 'default',
                                onPress: () => handleAuth()
                            }
                        ]
                    );
                    break;
                default:
                    Alert.alert(
                        'Error',
                        error.message || 'An unexpected error occurred'
                    );
            }
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (newMode: AuthMode) => {
        setMode(newMode);
        resetForm();
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>PnL Diary</Text>
                        <Text style={styles.subtitle}>
                            {mode === 'login' && 'Trading Journal & Analytics Platform'}
                            {mode === 'register' && 'Start Your Trading Journey'}
                            {mode === 'resetPassword' && 'Recover Your Account'}
                            {mode === 'verifyEmail' && 'Verify Your Email'}
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[
                                    styles.input,
                                    errors.email ? styles.inputError : null
                                ]}
                                placeholder="Email"
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    if (errors.email) {
                                        setErrors({ ...errors, email: '' });
                                    }
                                }}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoComplete="email"
                            />
                            {errors.email !== '' && (
                                <Text style={styles.errorText}>{errors.email}</Text>
                            )}
                        </View>

                        {mode !== 'resetPassword' && (
                            <View style={styles.inputContainer}>
                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            styles.passwordInput,
                                            errors.password ? styles.inputError : null
                                        ]}
                                        placeholder="Password"
                                        value={password}
                                        onChangeText={(text) => {
                                            setPassword(text);
                                            if (errors.password) {
                                                setErrors({ ...errors, password: '' });
                                            }
                                        }}
                                        secureTextEntry={!showPassword}
                                        autoComplete="password"
                                    />
                                    <TouchableOpacity
                                        style={styles.passwordVisibilityButton}
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        <Ionicons
                                            name={showPassword ? 'eye-off' : 'eye'}
                                            size={24}
                                            color="#666"
                                        />
                                    </TouchableOpacity>
                                </View>
                                {errors.password !== '' && (
                                    <Text style={styles.errorText}>{errors.password}</Text>
                                )}
                                {mode === 'register' && <PasswordRequirements password={password} />}
                            </View>
                        )}

                        {mode === 'register' && (
                            <View style={styles.inputContainer}>
                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            styles.passwordInput,
                                            errors.confirmPassword ? styles.inputError : null
                                        ]}
                                        placeholder="Confirm Password"
                                        value={confirmPassword}
                                        onChangeText={(text) => {
                                            setConfirmPassword(text);
                                            if (errors.confirmPassword) {
                                                setErrors({ ...errors, confirmPassword: '' });
                                            }
                                        }}
                                        secureTextEntry={!showPassword}
                                        autoComplete="password"
                                    />
                                </View>
                                {errors.confirmPassword !== '' && (
                                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                                )}
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleAuth}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    {mode === 'login' && 'Sign In'}
                                    {mode === 'register' && 'Sign Up'}
                                    {mode === 'resetPassword' && 'Reset Password'}
                                    {mode === 'verifyEmail' && 'Resend Verification'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.links}>
                            {mode !== 'login' && (
                                <TouchableOpacity onPress={() => switchMode('login')}>
                                    <Text style={styles.link}>Sign In</Text>
                                </TouchableOpacity>
                            )}
                            {mode !== 'register' && (
                                <TouchableOpacity onPress={() => switchMode('register')}>
                                    <Text style={styles.link}>Create Account</Text>
                                </TouchableOpacity>
                            )}
                            {mode !== 'resetPassword' && (
                                <TouchableOpacity onPress={() => switchMode('resetPassword')}>
                                    <Text style={styles.link}>Forgot Password?</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#2196F3',
    },
    subtitle: {
        fontSize: 18,
        color: '#2196F3',
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 20,
        width: '100%',
    },
    input: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 10,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'transparent',
        width: '100%',
    },
    inputError: {
        borderColor: '#ff0000',
        borderWidth: 1,
        backgroundColor: '#fff',
    },
    errorText: {
        color: '#ff0000',
        fontSize: 14,
        marginTop: 5,
        marginLeft: 5,
        fontWeight: '500',
    },
    button: {
        backgroundColor: '#2196F3',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        width: '100%',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    links: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
        width: '100%',
    },
    link: {
        color: '#2196F3',
        fontSize: 16,
    },
    requirementsContainer: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
    },
    requirementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 2,
    },
    requirementText: {
        marginLeft: 8,
        fontSize: 12,
        color: '#666',
    },
    requirementMet: {
        color: '#4CAF50',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    passwordInput: {
        flex: 1,
        borderWidth: 0,
    },
    passwordVisibilityButton: {
        padding: 10,
    },
}); 