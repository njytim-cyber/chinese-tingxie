/**
 * Enhanced State Types
 * Properly typed state to eliminate 'as any' casts
 */

import type { PracticeWord } from '../data';

/**
 * Extended game state with optional properties properly typed
 */
export interface ExtendedGameState {
    score: number;
    streak: number;
    sessionStreak: number;
    level: number;
    currentWordIndex: number;
    currentWord: PracticeWord | null;
    completedChars: number;
    practiceWords: PracticeWord[];
    mistakesMade: number;
    hintUsed: boolean;
    hintStrokeIndex: number[];
    sessionStartTime: number | null;
    wordsCompletedThisSession: number;
    selectedLessonsForPractice: number[];
    currentView: 'lesson-select' | 'game' | 'progress' | 'practice-select' | 'dictation' | 'dictation-select' | 'xizi';
    sessionResults: Array<{
        term: string;
        correct: boolean;
        mistakeCount: number;
        hintUsed: boolean;
    }>;

    // Optional properties (properly typed instead of 'as any')
    isRevealed?: boolean;
}

/**
 * Type guard to check if state has isRevealed property
 */
export function hasRevealedState(state: any): state is ExtendedGameState & { isRevealed: boolean } {
    return typeof state === 'object' && state !== null && 'isRevealed' in state;
}

/**
 * Safely get isRevealed state
 */
export function getIsRevealed(state: any): boolean {
    return hasRevealedState(state) ? state.isRevealed : false;
}

/**
 * Safely set isRevealed state
 */
export function setIsRevealed(state: any, value: boolean): void {
    if (typeof state === 'object' && state !== null) {
        (state as ExtendedGameState).isRevealed = value;
    }
}
