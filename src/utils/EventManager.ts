/**
 * Event Manager Utility
 * Helps track and cleanup event listeners to prevent memory leaks
 */

export interface ListenerTracker {
    element: HTMLElement | Window | Document;
    event: string;
    handler: EventListenerOrEventListenerObject;
    options?: AddEventListenerOptions | boolean;
}

export class EventManager {
    private listeners: ListenerTracker[] = [];

    /**
     * Add an event listener and track it for cleanup
     */
    addEventListener<K extends keyof HTMLElementEventMap>(
        element: HTMLElement,
        event: K,
        handler: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
        options?: AddEventListenerOptions | boolean
    ): void;
    addEventListener(
        element: HTMLElement | Window | Document,
        event: string,
        handler: EventListenerOrEventListenerObject,
        options?: AddEventListenerOptions | boolean
    ): void {
        element.addEventListener(event, handler, options);
        this.listeners.push({ element, event, handler, options });
    }

    /**
     * Remove a specific event listener
     */
    removeEventListener(
        element: HTMLElement | Window | Document,
        event: string,
        handler: EventListenerOrEventListenerObject
    ): void {
        element.removeEventListener(event, handler);
        this.listeners = this.listeners.filter(
            l => !(l.element === element && l.event === event && l.handler === handler)
        );
    }

    /**
     * Remove all tracked event listeners
     */
    removeAllListeners(): void {
        for (const listener of this.listeners) {
            listener.element.removeEventListener(listener.event, listener.handler);
        }
        this.listeners = [];
    }

    /**
     * Get count of tracked listeners
     */
    getListenerCount(): number {
        return this.listeners.length;
    }

    /**
     * Clear all listeners (alias for removeAllListeners)
     */
    destroy(): void {
        this.removeAllListeners();
    }
}

/**
 * Global event manager instance for app-wide cleanup
 */
export const globalEventManager = new EventManager();

/**
 * Helper to create a scoped event manager for components
 */
export function createEventManager(): EventManager {
    return new EventManager();
}
