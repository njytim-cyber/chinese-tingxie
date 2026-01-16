/**
 * Error Handling Utilities - Centralized error handling patterns
 *
 * This module provides consistent error handling patterns used throughout
 * the app, reducing duplication of try-catch blocks and logging.
 */

/**
 * Error severity levels
 */
export enum ErrorSeverity {
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
    CRITICAL = 'critical'
}

/**
 * Configuration for error handling
 */
export interface ErrorConfig {
    /** Message to log when error occurs */
    message: string;
    /** Severity level (default: WARN) */
    severity?: ErrorSeverity;
    /** Whether to rethrow the error after logging (default: false) */
    rethrow?: boolean;
    /** Optional callback to execute on error */
    onError?: (error: unknown) => void;
}

/**
 * Safely executes a function with automatic error handling
 * @param fn - Function to execute
 * @param config - Error handling configuration
 * @returns Result of the function, or undefined if error occurs
 */
export function safeExecute<T>(
    fn: () => T,
    config: ErrorConfig
): T | undefined {
    try {
        return fn();
    } catch (error) {
        handleError(error, config);
        return undefined;
    }
}

/**
 * Async version of safeExecute
 * @param fn - Async function to execute
 * @param config - Error handling configuration
 * @returns Result of the function, or undefined if error occurs
 */
export async function safeExecuteAsync<T>(
    fn: () => Promise<T>,
    config: ErrorConfig
): Promise<T | undefined> {
    try {
        return await fn();
    } catch (error) {
        handleError(error, config);
        return undefined;
    }
}

/**
 * Wraps a function with error handling
 * @param fn - Function to wrap
 * @param config - Error handling configuration
 * @returns Wrapped function that won't throw errors
 */
export function wrapWithErrorHandling<TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => TReturn,
    config: ErrorConfig
): (...args: TArgs) => TReturn | undefined {
    return (...args: TArgs) => {
        return safeExecute(() => fn(...args), config);
    };
}

/**
 * Wraps an async function with error handling
 * @param fn - Async function to wrap
 * @param config - Error handling configuration
 * @returns Wrapped async function that won't throw errors
 */
export function wrapAsyncWithErrorHandling<TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    config: ErrorConfig
): (...args: TArgs) => Promise<TReturn | undefined> {
    return async (...args: TArgs) => {
        return await safeExecuteAsync(() => fn(...args), config);
    };
}

/**
 * Handles localStorage operations with automatic error handling
 * @param operation - Function that performs localStorage operation
 * @param fallback - Fallback value to return if operation fails
 * @returns Result of operation or fallback value
 */
export function safeLocalStorage<T>(
    operation: () => T,
    fallback: T
): T {
    return safeExecute(operation, {
        message: 'localStorage operation failed',
        severity: ErrorSeverity.WARN
    }) ?? fallback;
}

/**
 * Safely gets an item from localStorage
 * @param key - localStorage key
 * @param defaultValue - Default value if key doesn't exist or error occurs
 * @returns Parsed value or default
 */
export function getLocalStorageItem<T>(key: string, defaultValue: T): T {
    return safeLocalStorage(() => {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    }, defaultValue);
}

/**
 * Safely sets an item in localStorage
 * @param key - localStorage key
 * @param value - Value to store
 * @returns True if successful, false otherwise
 */
export function setLocalStorageItem(key: string, value: unknown): boolean {
    const result = safeExecute(() => {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    }, {
        message: `Failed to save to localStorage: ${key}`,
        severity: ErrorSeverity.WARN
    });
    return result ?? false;
}

/**
 * Safely removes an item from localStorage
 * @param key - localStorage key
 * @returns True if successful, false otherwise
 */
export function removeLocalStorageItem(key: string): boolean {
    const result = safeExecute(() => {
        localStorage.removeItem(key);
        return true;
    }, {
        message: `Failed to remove from localStorage: ${key}`,
        severity: ErrorSeverity.WARN
    });
    return result ?? false;
}

/**
 * Internal error handler - logs error based on severity
 * @param error - The error that occurred
 * @param config - Error handling configuration
 */
function handleError(error: unknown, config: ErrorConfig): void {
    const { message, severity = ErrorSeverity.WARN, rethrow = false, onError } = config;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const fullMessage = `${message}: ${errorMessage}`;

    // Log based on severity
    switch (severity) {
        case ErrorSeverity.INFO:
            console.info(fullMessage);
            break;
        case ErrorSeverity.WARN:
            console.warn(fullMessage);
            break;
        case ErrorSeverity.ERROR:
            console.error(fullMessage, error);
            break;
        case ErrorSeverity.CRITICAL:
            console.error('CRITICAL:', fullMessage, error);
            break;
    }

    // Execute callback if provided
    if (onError) {
        try {
            onError(error);
        } catch (callbackError) {
            console.error('Error in error callback:', callbackError);
        }
    }

    // Rethrow if requested
    if (rethrow) {
        throw error;
    }
}

/**
 * Creates a safe DOM query selector that won't throw
 * @param selector - CSS selector
 * @param parent - Parent element (default: document)
 * @returns Element or null
 */
export function safeQuerySelector<T extends Element = Element>(
    selector: string,
    parent: ParentNode = document
): T | null {
    return safeExecute(() => parent.querySelector<T>(selector), {
        message: `Failed to query selector: ${selector}`,
        severity: ErrorSeverity.WARN
    }) ?? null;
}

/**
 * Creates a safe DOM query selector all that won't throw
 * @param selector - CSS selector
 * @param parent - Parent element (default: document)
 * @returns NodeList or empty NodeList
 */
export function safeQuerySelectorAll<T extends Element = Element>(
    selector: string,
    parent: ParentNode = document
): NodeListOf<T> {
    const emptyNodeList = [] as unknown as NodeListOf<T>;
    return safeExecute(() => parent.querySelectorAll<T>(selector), {
        message: `Failed to query selector all: ${selector}`,
        severity: ErrorSeverity.WARN
    }) ?? emptyNodeList;
}
