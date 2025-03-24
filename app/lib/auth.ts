import { auth } from '../config/firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    sendEmailVerification,
    User,
} from 'firebase/auth';

export interface AuthError {
    code: string;
    message: string;
}

interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
}

class AuthService {
    private static readonly PASSWORD_MIN_LENGTH = 8;
    private static readonly PASSWORD_REQUIREMENTS = {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecial: true
    };

    private static validatePassword(password: string): PasswordValidationResult {
        const errors: string[] = [];

        if (password.length < this.PASSWORD_REQUIREMENTS.minLength) {
            errors.push(`Password must be at least ${this.PASSWORD_REQUIREMENTS.minLength} characters long`);
        }

        if (this.PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }

        if (this.PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }

        if (this.PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        if (this.PASSWORD_REQUIREMENTS.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static async signUp(email: string, password: string): Promise<User> {
        try {
            // Validate password strength
            const passwordValidation = this.validatePassword(password);
            if (!passwordValidation.isValid) {
                throw {
                    code: 'auth/weak-password',
                    message: passwordValidation.errors.join('\n'),
                };
            }

            console.log('Attempting to create user with email:', email);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Send email verification
            await sendEmailVerification(userCredential.user);

            console.log('User created successfully:', userCredential.user.uid);
            console.log('Verification email sent to:', email);

            return userCredential.user;
        } catch (error: any) {
            console.error('Error signing up:', error);
            let errorMessage = 'An error occurred during sign up';

            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = error.message;
            }

            throw {
                message: errorMessage,
                code: error.code,
                email,
                fullError: error
            };
        }
    }

    static async signIn(email: string, password: string): Promise<User> {
        try {
            console.log('Attempting to sign in user with email:', email);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Check if email is verified
            if (!userCredential.user.emailVerified) {
                // Send another verification email if needed
                await sendEmailVerification(userCredential.user);
                throw {
                    code: 'auth/email-not-verified',
                    message: 'Please verify your email address. A new verification email has been sent.',
                };
            }

            console.log('User signed in successfully:', userCredential.user.uid);
            return userCredential.user;
        } catch (error: any) {
            console.error('Error signing in:', error);
            let errorMessage = 'An error occurred during sign in';

            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Invalid password';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (error.code === 'auth/email-not-verified') {
                errorMessage = error.message;
            }

            throw {
                message: errorMessage,
                code: error.code,
                email,
                fullError: error
            };
        }
    }

    static async signOut(): Promise<void> {
        try {
            console.log('Attempting to sign out user');
            await firebaseSignOut(auth);
            console.log('User signed out successfully');
        } catch (error: any) {
            console.error('Error signing out:', error);
            throw error;
        }
    }

    static async resetPassword(email: string): Promise<void> {
        try {
            console.log('Attempting to send password reset email to:', email);
            await sendPasswordResetEmail(auth, email);
            console.log('Password reset email sent successfully');
        } catch (error: any) {
            console.error('Error resetting password:', error);
            let errorMessage = 'An error occurred while resetting password';
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            }
            throw {
                message: errorMessage,
                code: error.code,
                email,
                fullError: error
            };
        }
    }

    static getCurrentUser(): User | null {
        return auth.currentUser;
    }

    static async resendVerificationEmail(user: User): Promise<void> {
        try {
            await sendEmailVerification(user);
            console.log('Verification email resent to:', user.email);
        } catch (error: any) {
            console.error('Error sending verification email:', error);
            throw error;
        }
    }
}

export default AuthService; 