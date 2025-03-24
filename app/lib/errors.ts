export interface AppError {
    code: string;
    message: string;
    technical?: string;
}

// Firebase Auth error codes mapping
const authErrorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'This email is already registered. Please try logging in instead.',
    'auth/invalid-email': 'Please enter a valid email address (e.g., user@example.com).',
    'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please contact support.',
    'auth/weak-password': 'Please choose a stronger password. It should be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email. Please check your email or sign up.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please check your credentials and try again.',
    'auth/too-many-requests': 'Too many unsuccessful attempts. Please try again in 15 minutes or reset your password.',
    'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
    'auth/email-not-verified': 'Please verify your email address. Check your inbox for the verification link.',
    'auth/requires-recent-login': 'For security reasons, please sign in again before making this change.',
    'auth/invalid-verification-code': 'Invalid verification code. Please try again with a new code.',
    'auth/invalid-verification-id': 'Invalid verification session. Please request a new verification email.',
    'auth/expired-action-code': 'This verification link has expired. Please request a new one.',
    'auth/missing-verification-code': 'Please enter the verification code sent to your email.',
    'auth/quota-exceeded': 'Service temporarily unavailable. Please try again later.',
};

// Firestore error codes mapping
const firestoreErrorMessages: Record<string, string> = {
    'permission-denied': 'You do not have permission to perform this action.',
    'not-found': 'The requested resource was not found.',
    'already-exists': 'This resource already exists.',
    'failed-precondition': 'Operation failed due to the current state of the system.',
    'resource-exhausted': 'Quota exceeded or rate limit reached. Please try again later.',
    'cancelled': 'Operation was cancelled.',
    'data-loss': 'Unrecoverable data loss or corruption.',
    'unknown': 'An unknown error occurred.',
    'invalid-argument': 'Invalid input provided.',
    'deadline-exceeded': 'Operation timed out.',
    'unauthenticated': 'Authentication required. Please sign in.',
};

// Application-specific error codes
const appErrorMessages: Record<string, string> = {
    // Trade-related errors
    'trade/invalid-quantity': 'Please enter a valid quantity.',
    'trade/invalid-price': 'Please enter a valid price.',
    'trade/invalid-pair': 'Please select a valid trading pair.',
    'trade/invalid-type': 'Please select a valid trade type.',
    'trade/not-found': 'The requested trade could not be found.',
    'trade/already-closed': 'This trade has already been closed.',
    'trade/invalid-status': 'Invalid trade status provided.',
    'trade/invalid-date-range': 'Invalid date range for trade.',
    'trade/duplicate-entry': 'A trade with these details already exists.',
    'trade/missing-required-fields': 'Please fill in all required fields.',

    // Validation errors
    'validation/invalid-data': 'The provided data is invalid.',
    'validation/type-mismatch': 'Data type mismatch in provided values.',
    'validation/out-of-range': 'One or more values are out of acceptable range.',
    'validation/format-error': 'Data format is incorrect.',
    'validation/constraint-violation': 'Data violates business rules or constraints.',

    // Data consistency errors
    'data/integrity-violation': 'Data integrity check failed.',
    'data/constraint-violation': 'Operation would violate data constraints.',
    'data/stale-data': 'Data is outdated. Please refresh and try again.',
    'data/concurrent-modification': 'Another user has modified this data. Please refresh and try again.',
    'data/invalid-state-transition': 'Invalid state transition attempted.',

    // Preferences errors
    'preferences/not-initialized': 'User preferences not initialized.',
    'preferences/invalid-settings': 'Invalid preference settings provided.',
    'preferences/sync-failed': 'Failed to sync preferences.',

    // Analytics errors
    'analytics/invalid-date-range': 'Please select a valid date range.',
    'analytics/no-data': 'No data available for the selected period.',
    'analytics/calculation-error': 'Error calculating analytics.',
    'analytics/invalid-parameters': 'Invalid parameters for analytics calculation.',

    // Rate limiting errors
    'rate-limit/exceeded': 'Too many requests. Please try again later.',
    'rate-limit/cooldown': 'Action temporarily blocked. Please wait before trying again.',

    // Transaction errors
    'transaction/failed': 'Transaction failed. Please try again.',
    'transaction/timeout': 'Transaction timed out. Please try again.',
    'transaction/conflict': 'Transaction conflict detected. Please try again.',
};

export function getErrorMessage(error: any): AppError {
    // Handle Firebase Auth errors
    if (error.code && error.code.startsWith('auth/')) {
        return {
            code: error.code,
            message: authErrorMessages[error.code] || 'Authentication error occurred.',
            technical: error.message,
        };
    }

    // Handle Firestore errors
    if (error.code && firestoreErrorMessages[error.code]) {
        return {
            code: error.code,
            message: firestoreErrorMessages[error.code],
            technical: error.message,
        };
    }

    // Handle application-specific errors
    if (error.code && appErrorMessages[error.code]) {
        return {
            code: error.code,
            message: appErrorMessages[error.code],
            technical: error.message,
        };
    }

    // Handle validation errors
    if (error.code && error.code.startsWith('validation/')) {
        return {
            code: error.code,
            message: error.message || appErrorMessages[error.code] || 'Validation error occurred.',
            technical: error.technical || error.message,
        };
    }

    // Handle data consistency errors
    if (error.code && error.code.startsWith('data/')) {
        return {
            code: error.code,
            message: error.message || appErrorMessages[error.code] || 'Data consistency error occurred.',
            technical: error.technical || error.message,
        };
    }

    // Handle unknown errors
    return {
        code: 'unknown',
        message: 'An unexpected error occurred. Please try again.',
        technical: error.message || error.toString(),
    };
}

// Helper function to create application errors
export function createAppError(code: string, message?: string): AppError {
    return {
        code,
        message: message || appErrorMessages[code] || 'An error occurred.',
    };
}

const ErrorService = {
    getErrorMessage,
    createAppError,
};

export default ErrorService; 