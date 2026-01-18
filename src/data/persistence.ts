/**
 * Data Persistence Module
 * Handles localStorage operations for word states, player stats, and attempt logs
 */

import { WordState, PlayerStats, AttemptLog } from '../types';
import { getLocalStorageItem, setLocalStorageItem, removeLocalStorageItem } from '../utils/errors';

// Storage keys
export const STORAGE_KEY = 'tingxie_word_data';
export const STATS_KEY = 'tingxie_stats';
export const ATTEMPT_LOG_KEY = 'tingxie_attempt_log';

// Save debouncing
const SAVE_DEBOUNCE_MS = 500;
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Save data immediately without debouncing
 */
function saveDataImmediate(
    wordState: Record<string, WordState>,
    playerStats: PlayerStats
): void {
    setLocalStorageItem(STORAGE_KEY, wordState);
    setLocalStorageItem(STATS_KEY, playerStats);
}

/**
 * Save data with debouncing for performance
 */
export function saveData(
    wordState: Record<string, WordState>,
    playerStats: PlayerStats
): void {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
        saveDataImmediate(wordState, playerStats);
        saveTimeout = null;
    }, SAVE_DEBOUNCE_MS);
}

/**
 * Force immediate save (use on page unload)
 */
export function saveDataSync(
    wordState: Record<string, WordState>,
    playerStats: PlayerStats
): void {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
    }
    saveDataImmediate(wordState, playerStats);
}

/**
 * Load word state from localStorage
 */
export function loadWordState(): Record<string, WordState> {
    const savedWords = getLocalStorageItem<Record<string, WordState>>(STORAGE_KEY, {});
    return (savedWords && typeof savedWords === 'object') ? savedWords : {};
}

/**
 * Load player stats from localStorage
 */
export function loadPlayerStats(): Partial<PlayerStats> {
    const savedStats = getLocalStorageItem<Partial<PlayerStats>>(STATS_KEY, {});
    return (savedStats && typeof savedStats === 'object') ? savedStats : {};
}

/**
 * Log a practice attempt to localStorage
 */
export function logAttempt(attempt: AttemptLog): void {
    const logs = getAttemptLogs();
    logs.push(attempt);
    // Keep only last 100 attempts to avoid storage overflow
    if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
    }
    setLocalStorageItem(ATTEMPT_LOG_KEY, logs);
}

/**
 * Get all attempt logs from localStorage
 */
export function getAttemptLogs(): AttemptLog[] {
    return getLocalStorageItem<AttemptLog[]>(ATTEMPT_LOG_KEY, []);
}

/**
 * Clear all attempt logs
 */
export function clearAttemptLogs(): void {
    removeLocalStorageItem(ATTEMPT_LOG_KEY);
}
