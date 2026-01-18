/**
 * Utility Modules Index
 *
 * Central export point for all utility modules.
 * Import utilities from this file for cleaner imports:
 *
 * @example
 * import { createElement, safeExecute, splitTextByPunctuation } from './utils';
 */

// DOM utilities
export * from './dom';

// Error handling utilities
export * from './errors';

// SVG utilities
export * from './svg';

// Text processing utilities
export * from './text';

// Haptic feedback utilities
export * from './haptics';

// HanziWriter helper utilities
export * from './hanziWriterHelpers';

// DOM Builder
export { DOMBuilder } from './DOMBuilder';
export type { ButtonConfig, ContainerConfig } from './DOMBuilder';

// Event Manager
export { EventManager, globalEventManager, createEventManager } from './EventManager';
export type { ListenerTracker } from './EventManager';

// Timer Manager
export { TimerManager, globalTimerManager, createTimerManager, safeTimeout, safeInterval } from './TimerManager';
export type { TimerId } from './TimerManager';

// Error Boundary
export { ErrorBoundary, globalErrorBoundary, withErrorBoundary, safeDOM } from './ErrorBoundary';
export type { ErrorHandler } from './ErrorBoundary';
