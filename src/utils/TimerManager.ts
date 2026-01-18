/**
 * Timer Manager
 * Manages setTimeout/setInterval to prevent memory leaks
 * Automatically cleans up timers when component is destroyed
 */

export type TimerId = number;

export class TimerManager {
    private timeouts: Set<TimerId> = new Set();
    private intervals: Set<TimerId> = new Set();

    /**
     * Create a managed setTimeout
     */
    setTimeout(callback: () => void, delay: number): TimerId {
        const id = window.setTimeout(() => {
            this.timeouts.delete(id);
            callback();
        }, delay);

        this.timeouts.add(id);
        return id;
    }

    /**
     * Create a managed setInterval
     */
    setInterval(callback: () => void, delay: number): TimerId {
        const id = window.setInterval(callback, delay);
        this.intervals.add(id);
        return id;
    }

    /**
     * Clear a specific timeout
     */
    clearTimeout(id: TimerId): void {
        if (this.timeouts.has(id)) {
            window.clearTimeout(id);
            this.timeouts.delete(id);
        }
    }

    /**
     * Clear a specific interval
     */
    clearInterval(id: TimerId): void {
        if (this.intervals.has(id)) {
            window.clearInterval(id);
            this.intervals.delete(id);
        }
    }

    /**
     * Clear all managed timers
     */
    clearAll(): void {
        // Clear all timeouts
        this.timeouts.forEach(id => window.clearTimeout(id));
        this.timeouts.clear();

        // Clear all intervals
        this.intervals.forEach(id => window.clearInterval(id));
        this.intervals.clear();
    }

    /**
     * Get count of active timers
     */
    getActiveCount(): { timeouts: number; intervals: number } {
        return {
            timeouts: this.timeouts.size,
            intervals: this.intervals.size,
        };
    }

    /**
     * Destroy (alias for clearAll)
     */
    destroy(): void {
        this.clearAll();
    }
}

/**
 * Global timer manager for app-wide use
 */
export const globalTimerManager = new TimerManager();

/**
 * Create a scoped timer manager for components
 */
export function createTimerManager(): TimerManager {
    return new TimerManager();
}

/**
 * Utility function to safely execute with timeout
 */
export function safeTimeout(
    callback: () => void,
    delay: number,
    manager: TimerManager = globalTimerManager
): TimerId {
    return manager.setTimeout(callback, delay);
}

/**
 * Utility function to safely execute with interval
 */
export function safeInterval(
    callback: () => void,
    delay: number,
    manager: TimerManager = globalTimerManager
): TimerId {
    return manager.setInterval(callback, delay);
}
