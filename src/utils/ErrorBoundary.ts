/**
 * Error Boundary Utility
 * Provides error handling wrappers and recovery mechanisms
 */

export interface ErrorHandler {
    onError: (error: Error, context?: string) => void;
    onRecover?: () => void;
}

export class ErrorBoundary {
    private errorHandlers: Map<string, ErrorHandler> = new Map();
    private errorCount: Map<string, number> = new Map();

    /**
     * Register an error handler for a specific context
     */
    registerHandler(context: string, handler: ErrorHandler): void {
        this.errorHandlers.set(context, handler);
    }

    /**
     * Wrap a function with error handling
     */
    wrap<T extends (...args: any[]) => any>(
        fn: T,
        context: string = 'unknown'
    ): T {
        return ((...args: any[]) => {
            try {
                const result = fn(...args);

                // Handle async functions
                if (result instanceof Promise) {
                    return result.catch((error) => this.handleError(error, context));
                }

                return result;
            } catch (error) {
                this.handleError(error as Error, context);
                return undefined;
            }
        }) as T;
    }

    /**
     * Wrap an async function with error handling
     */
    wrapAsync<T extends (...args: any[]) => Promise<any>>(
        fn: T,
        context: string = 'unknown'
    ): T {
        return (async (...args: any[]) => {
            try {
                return await fn(...args);
            } catch (error) {
                this.handleError(error as Error, context);
                return undefined;
            }
        }) as T;
    }

    /**
     * Handle an error
     */
    private handleError(error: Error, context: string): void {
        // Increment error count
        const count = (this.errorCount.get(context) || 0) + 1;
        this.errorCount.set(context, count);

        // Log error
        console.error(`[${context}] Error #${count}:`, error);

        // Call registered handler
        const handler = this.errorHandlers.get(context);
        if (handler) {
            handler.onError(error, context);
        }

        // Attempt recovery if too many errors
        if (count >= 3 && handler?.onRecover) {
            console.warn(`[${context}] Too many errors, attempting recovery...`);
            handler.onRecover();
            this.errorCount.set(context, 0); // Reset count after recovery
        }
    }

    /**
     * Try to execute a function, return default value on error
     */
    tryOr<T>(fn: () => T, defaultValue: T, context: string = 'unknown'): T {
        try {
            return fn();
        } catch (error) {
            this.handleError(error as Error, context);
            return defaultValue;
        }
    }

    /**
     * Try to execute an async function, return default value on error
     */
    async tryOrAsync<T>(
        fn: () => Promise<T>,
        defaultValue: T,
        context: string = 'unknown'
    ): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            this.handleError(error as Error, context);
            return defaultValue;
        }
    }

    /**
     * Reset error count for a context
     */
    resetErrorCount(context: string): void {
        this.errorCount.set(context, 0);
    }

    /**
     * Get error count for a context
     */
    getErrorCount(context: string): number {
        return this.errorCount.get(context) || 0;
    }

    /**
     * Clear all error counts
     */
    clearAll(): void {
        this.errorCount.clear();
    }
}

/**
 * Global error boundary instance
 */
export const globalErrorBoundary = new ErrorBoundary();

/**
 * Decorator for error handling (experimental)
 */
export function withErrorBoundary(context: string) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = function (...args: any[]) {
            return globalErrorBoundary.wrap(originalMethod, context).apply(this, args);
        };

        return descriptor;
    };
}

/**
 * Utility to safely execute DOM operations
 */
export function safeDOM<T>(
    operation: () => T,
    fallback: T,
    errorMessage: string = 'DOM operation failed'
): T {
    return globalErrorBoundary.tryOr(
        operation,
        fallback,
        errorMessage
    );
}
