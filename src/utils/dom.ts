/**
 * DOM Utilities - Helpers for common DOM manipulation patterns
 *
 * This module provides utilities to reduce duplication in DOM element
 * creation, manipulation, and querying throughout the app.
 */

/**
 * Configuration for creating DOM elements
 */
export interface ElementConfig {
    /** Tag name (default: 'div') */
    tag?: string;
    /** CSS classes (string or array) */
    className?: string | string[];
    /** ID attribute */
    id?: string;
    /** Inner HTML content */
    innerHTML?: string;
    /** Text content (safer than innerHTML for user data) */
    textContent?: string;
    /** Inline styles */
    style?: Partial<CSSStyleDeclaration>;
    /** HTML attributes */
    attributes?: Record<string, string>;
    /** Data attributes */
    dataset?: Record<string, string>;
    /** Event listeners */
    events?: Record<string, EventListener>;
    /** Child elements to append */
    children?: (HTMLElement | null | undefined)[];
    /** Parent element to append to */
    parent?: HTMLElement;
}

/**
 * Creates a DOM element with configuration
 * Replaces repetitive createElement + className + innerHTML patterns
 *
 * @param config - Element configuration
 * @returns Created HTMLElement
 *
 * @example
 * const button = createElement({
 *   tag: 'button',
 *   className: 'action-btn-primary',
 *   textContent: 'Start',
 *   events: { click: handleClick }
 * });
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
    config: ElementConfig & { tag?: K }
): HTMLElementTagNameMap[K] {
    const {
        tag = 'div',
        className,
        id,
        innerHTML,
        textContent,
        style,
        attributes,
        dataset,
        events,
        children,
        parent
    } = config;

    const element = document.createElement(tag as string) as HTMLElementTagNameMap[K];

    // Set class names
    if (className) {
        if (Array.isArray(className)) {
            element.className = className.join(' ');
        } else {
            element.className = className;
        }
    }

    // Set ID
    if (id) {
        element.id = id;
    }

    // Set content (textContent is safer, takes precedence)
    if (textContent !== undefined) {
        element.textContent = textContent;
    } else if (innerHTML !== undefined) {
        element.innerHTML = innerHTML;
    }

    // Apply styles
    if (style) {
        Object.assign(element.style, style);
    }

    // Set attributes
    if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    }

    // Set data attributes
    if (dataset) {
        Object.entries(dataset).forEach(([key, value]) => {
            element.dataset[key] = value;
        });
    }

    // Attach event listeners
    if (events) {
        Object.entries(events).forEach(([eventName, handler]) => {
            element.addEventListener(eventName, handler);
        });
    }

    // Append children
    if (children) {
        children.forEach(child => {
            if (child) {
                element.appendChild(child);
            }
        });
    }

    // Append to parent
    if (parent) {
        parent.appendChild(element);
    }

    return element;
}

/**
 * Safely queries a single element with type safety
 * Returns null if element not found instead of throwing
 *
 * @param selector - CSS selector
 * @param parent - Parent element (default: document)
 * @returns Element or null
 */
export function query<T extends Element = HTMLElement>(
    selector: string,
    parent: ParentNode = document
): T | null {
    try {
        return parent.querySelector<T>(selector);
    } catch (error) {
        console.warn(`Failed to query selector: ${selector}`, error);
        return null;
    }
}

/**
 * Safely queries multiple elements with type safety
 * Returns empty array if query fails
 *
 * @param selector - CSS selector
 * @param parent - Parent element (default: document)
 * @returns Array of elements
 */
export function queryAll<T extends Element = HTMLElement>(
    selector: string,
    parent: ParentNode = document
): T[] {
    try {
        return Array.from(parent.querySelectorAll<T>(selector));
    } catch (error) {
        console.warn(`Failed to query selector all: ${selector}`, error);
        return [];
    }
}

/**
 * Gets element by ID with type safety
 * @param id - Element ID
 * @returns Element or null
 */
export function byId<T extends HTMLElement = HTMLElement>(id: string): T | null {
    return document.getElementById(id) as T | null;
}

/**
 * Removes all children from an element
 * @param element - Parent element to clear
 */
export function clearChildren(element: HTMLElement): void {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Sets up an event listener that automatically removes itself
 * @param element - Target element
 * @param eventName - Event name
 * @param handler - Event handler
 */
export function onceEvent<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    eventName: K,
    handler: (event: HTMLElementEventMap[K]) => void
): void {
    const wrappedHandler = (event: HTMLElementEventMap[K]) => {
        handler(event);
        element.removeEventListener(eventName, wrappedHandler as EventListener);
    };
    element.addEventListener(eventName, wrappedHandler as EventListener);
}

/**
 * Waits for an element to appear in the DOM
 * Useful for elements that are added dynamically
 *
 * @param selector - CSS selector
 * @param timeout - Max time to wait in ms (default: 5000)
 * @returns Promise that resolves with element or null
 */
export function waitForElement<T extends Element = HTMLElement>(
    selector: string,
    timeout: number = 5000
): Promise<T | null> {
    return new Promise((resolve) => {
        const element = query<T>(selector);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver(() => {
            const el = query<T>(selector);
            if (el) {
                observer.disconnect();
                resolve(el);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Timeout fallback
        setTimeout(() => {
            observer.disconnect();
            resolve(null);
        }, timeout);
    });
}

/**
 * Toggles a class on an element
 * @param element - Target element
 * @param className - Class to toggle
 * @param force - Force add (true) or remove (false)
 */
export function toggleClass(
    element: HTMLElement,
    className: string,
    force?: boolean
): void {
    element.classList.toggle(className, force);
}

/**
 * Shows an element by setting display style
 * @param element - Element to show
 * @param displayValue - Display value (default: 'block')
 */
export function show(element: HTMLElement, displayValue: string = 'block'): void {
    element.style.display = displayValue;
}

/**
 * Hides an element by setting display: none
 * @param element - Element to hide
 */
export function hide(element: HTMLElement): void {
    element.style.display = 'none';
}

/**
 * Sets opacity of element with optional transition
 * @param element - Target element
 * @param opacity - Opacity value 0-1
 * @param transitionMs - Transition duration in ms
 */
export function setOpacity(
    element: HTMLElement,
    opacity: number,
    transitionMs?: number
): void {
    if (transitionMs !== undefined) {
        element.style.transition = `opacity ${transitionMs}ms ease`;
    }
    element.style.opacity = String(opacity);
}

/**
 * Fades in an element
 * @param element - Element to fade in
 * @param duration - Duration in ms (default: 200)
 * @returns Promise that resolves when animation completes
 */
export function fadeIn(element: HTMLElement, duration: number = 200): Promise<void> {
    return new Promise((resolve) => {
        element.style.opacity = '0';
        element.style.display = 'block';
        element.style.transition = `opacity ${duration}ms ease`;

        // Force reflow
        void element.offsetHeight;

        element.style.opacity = '1';

        setTimeout(() => {
            element.style.transition = '';
            resolve();
        }, duration);
    });
}

/**
 * Fades out an element
 * @param element - Element to fade out
 * @param duration - Duration in ms (default: 200)
 * @param hideAfter - Set display:none after fade (default: true)
 * @returns Promise that resolves when animation completes
 */
export function fadeOut(
    element: HTMLElement,
    duration: number = 200,
    hideAfter: boolean = true
): Promise<void> {
    return new Promise((resolve) => {
        element.style.transition = `opacity ${duration}ms ease`;
        element.style.opacity = '0';

        setTimeout(() => {
            if (hideAfter) {
                element.style.display = 'none';
            }
            element.style.transition = '';
            resolve();
        }, duration);
    });
}

/**
 * Delegates event handling to a parent element
 * Useful for handling events on dynamically added children
 *
 * @param parent - Parent element
 * @param eventName - Event name
 * @param selector - CSS selector for target children
 * @param handler - Event handler
 */
export function delegate<K extends keyof HTMLElementEventMap>(
    parent: HTMLElement,
    eventName: K,
    selector: string,
    handler: (event: HTMLElementEventMap[K], target: HTMLElement) => void
): void {
    const listener = (event: Event) => {
        const target = (event.target as HTMLElement).closest(selector);
        if (target && parent.contains(target as Node)) {
            handler(event as HTMLElementEventMap[K], target as HTMLElement);
        }
    };
    parent.addEventListener(eventName, listener);
}

/**
 * Debounces a function call
 * @param fn - Function to debounce
 * @param delay - Delay in ms
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => void>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}
