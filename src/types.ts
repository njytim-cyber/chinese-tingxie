/**
 * Shared TypeScript Types and Interfaces
 * Centralized type definitions for the Chinese Tingxie application
 */

// Data Models
export interface Word {
    term: string;
    pinyin: string;
    level: number;
    lessonId: number;
}

export interface PracticeWord extends Word, Partial<WordState> { }

// Data Models
export interface Phrase {
    term: string;
    pinyin: string;
    definition?: string;
}

export interface Lesson {
    id: number;
    title: string;
    phrases: Phrase[];
}

export interface WordState {
    score: number;
    interval: number;
    nextReview: string;
    easeFactor: number;
    timesCorrect: number;
    timesMistaken: number;
}

export interface PlayerStats {
    totalXP: number;
    dailyStreak: number;
    lastPlayedDate: string | null;
    wordsLearned: number;
    perfectWords: number;
    totalSessions: number;
    achievements: string[];
    currentLessonId: number;
}

export interface Achievement {
    id: string;
    name: string;
    desc: string;
    icon: string;
    check: () => boolean;
    unlocked?: boolean;
}

export interface AttemptLog {
    timestamp: string;
    lessonId: number;
    lessonTitle: string;
    mode: 'spelling' | 'dictation';
    phrases: {
        term: string;
        correct: boolean;
        mistakeCount: number;
        hintUsed: boolean;
    }[];
    term?: string; // Legacy/Single word modes (optional)
    correct?: boolean;
    mistakeCount?: number;
    hintUsed?: boolean;
    totalScore: number;
    totalPhrases: number;
    duration: number;
}

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
    init(word: PracticeWord, container: HTMLElement): Promise<void>;
    destroy(): void;
    onCharComplete?: (index: number) => void;
    onMistake?: (index: number) => void;
    onComplete?: (result: InputResult) => void;
    showHint(): void;
    getMistakeCount(): number;
    wasHintUsed(): boolean;
    /**
     * Toggle the grid style (Tian -> Mi -> Blank)
     */
    toggleGrid?(): void;
}

/**
 * Game view types
 */
export type GameView = 'lesson-select' | 'practice-select' | 'progress' | 'game' | 'dictation-select' | 'dictation';

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
    sessionResults: {
        term: string;
        correct: boolean;
        mistakeCount: number;
        hintUsed: boolean;
    }[];
    isRevealed?: boolean;
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
    definitionDisplay: HTMLElement | null;
    charProgressFill: HTMLElement | null;
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
        definitionDisplay: document.getElementById('definition-display'),
        charProgressFill: document.getElementById('char-progress-fill'),
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

export interface IUIManager {
    domCache: DOMCache;
    updateHeaderTitle(title: string): void;
    toggleMainHeader(visible: boolean): void;
    toggleBackBtn(visible: boolean): void;
    toggleHeaderStats(visible: boolean): void;
    toggleActiveGameUI(visible: boolean): void;
    transitionView(renderFn: () => void): void;
    updateDashboardStats(): void;
}

// Dictation Types
export interface DictationPassage {
    id: string;
    title: string;
    text: string;
    blanks: number[];  // Character indices that are blanks
    isFullDictation?: boolean;
    hint?: string;
    chunks?: string[];
    chunkPinyins?: string[];
}

export interface DictationData {
    passages: DictationPassage[];
}

export interface CharBox {
    char: string;
    isBlank: boolean;
    userInput: string; // Unused for strokes, but kept for state
    isCorrect: boolean | null;
    index: number;
}

export interface DictationChunk {
    start: number;
    end: number;
    text: string;
    pinyin: string[];
    hintUsed: boolean;
    revealUsed: boolean;
    score: number;
}
