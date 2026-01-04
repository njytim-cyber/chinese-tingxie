/**
 * Shared TypeScript Types and Interfaces
 * Centralized type definitions for the Chinese Tingxie application
 */

import type { PracticeWord } from './data';

/**
 * Input handler result when user completes input
 */
export interface InputResult {
    /** The characters that were input */
    input: string;
    /** Whether completion was successful (all characters correct) */
    success: boolean;
    /** Number of mistakes made during input */
    mistakeCount: number;
    /** Whether hint was used */
    hintUsed: boolean;
}

/**
 * Input handler interface - abstraction for different input methods
 * Implementations: HanziWriterInput (stroke-by-stroke), HandwritingInput (freeform)
 */
export interface InputHandler {
    /** Initialize the input handler for a word */
    init(word: PracticeWord, container: HTMLElement): void;
    /** Clean up and destroy the input handler */
    destroy(): void;
    /** Show a hint for the current character */
    showHint(): void;
    /** Check if hint was used */
    wasHintUsed(): boolean;
    /** Get the number of mistakes made */
    getMistakeCount(): number;
    /** Callback when input is complete */
    onComplete: ((result: InputResult) => void) | null;
    /** Callback when a character is completed */
    onCharComplete: ((index: number) => void) | null;
    /** Callback when a mistake is made */
    onMistake: ((index: number) => void) | null;
}

/**
 * Game view types
 */
export type GameView = 'lesson-select' | 'practice-select' | 'progress' | 'game';

/**
 * Progress dot status
 */
export type ProgressDotStatus = 'active' | 'correct' | 'wrong';

/**
 * Game state interface
 */
export interface GameState {
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
    currentView: GameView;
}

/**
 * UI configuration options
 */
export interface UIConfig {
    /** Whether to show score display */
    showScore: boolean;
    /** Whether to show streak badge when streak >= 2 */
    showStreak: boolean;
    /** Animation duration in ms */
    animationDuration: number;
}

/**
 * Cached DOM element references for performance
 */
export interface DOMCache {
    writingArea: HTMLElement | null;
    feedbackOverlay: HTMLElement | null;
    pinyinDisplay: HTMLElement | null;
    nextBtn: HTMLElement | null;
    scoreEl: HTMLElement | null;
    streakCountEl: HTMLElement | null;
    streakBadge: HTMLElement | null;
    controlsArea: HTMLElement | null;
    hud: HTMLElement | null;
    hudControls: HTMLElement | null;
    footerProgress: HTMLElement | null;
    dailyStreak: HTMLElement | null;
    streakContainer: HTMLElement | null;
    xpFill: HTMLElement | null;
    xpText: HTMLElement | null;
    lessonLabel: HTMLElement | null;
    greetingEl: HTMLElement | null;
}

/**
 * Initialize DOM cache by querying all frequently-used elements
 */
export function initDOMCache(): DOMCache {
    return {
        writingArea: document.getElementById('writing-area'),
        feedbackOverlay: document.getElementById('feedback-overlay'),
        pinyinDisplay: document.getElementById('pinyin-display'),
        nextBtn: document.getElementById('next-btn'),
        scoreEl: document.getElementById('score'),
        streakCountEl: document.getElementById('streak-count'),
        streakBadge: document.getElementById('streak-badge'),
        controlsArea: document.querySelector('.controls-area') as HTMLElement | null,
        hud: document.querySelector('.hud') as HTMLElement | null,
        hudControls: document.querySelector('.hud-controls') as HTMLElement | null,
        footerProgress: document.getElementById('footer-progress'),
        dailyStreak: document.getElementById('daily-streak'),
        streakContainer: document.getElementById('streak-container'),
        xpFill: document.getElementById('xp-fill'),
        xpText: document.getElementById('xp-text'),
        lessonLabel: document.getElementById('current-lesson-label'),
        greetingEl: document.getElementById('player-greeting'),
    };
}
