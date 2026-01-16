/**
 * Word Data and Logic Module
 * Now separated: Data in data/lessons.ts, Logic here.
 */

import { LESSONS } from './data/lessons';
import {
    Lesson, Phrase, WordState, PlayerStats, Achievement, AttemptLog,
    Word, PracticeWord, CharacterState
} from './types';
import { getLocalStorageItem, setLocalStorageItem, removeLocalStorageItem } from './utils/errors';

// Re-export types for convenience
export type { Achievement, AttemptLog, Lesson, Phrase, WordState, PlayerStats, Word, PracticeWord, CharacterState };

// Constants
const STORAGE_KEY = 'tingxie_word_data';
const STATS_KEY = 'tingxie_stats';
const ATTEMPT_LOG_KEY = 'tingxie_attempt_log';

// Get all words as flat array for backward compatibility
export function getAllWords(): Word[] {
    const words: Word[] = [];
    LESSONS.forEach(lesson => {
        lesson.phrases.forEach((phrase, index) => {
            words.push({
                term: phrase.term,
                pinyin: phrase.pinyin,
                level: Math.ceil((index + 1) / 3), // 5 levels per lesson
                lessonId: lesson.id
            });
        });
    });
    return words;
}

// Word learning state - stored separately
let wordState: Record<string, WordState> = {};

// Player statistics
let playerStats: PlayerStats = {
    totalXP: 0,
    dailyStreak: 0,
    lastPlayedDate: null,
    wordsLearned: 0,
    perfectWords: 0,
    totalSessions: 0,
    achievements: [],
    currentLessonId: 1,
    charsMastery: {}
};

/**
 * Get today's date as string (YYYY-MM-DD)
 */
function getToday(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Initialize word state for all words
 */
function initWordState(): void {
    LESSONS.forEach(lesson => {
        lesson.phrases.forEach(phrase => {
            if (!wordState[phrase.term]) {
                wordState[phrase.term] = {
                    score: 0,
                    interval: 0,
                    nextReview: getToday(),
                    easeFactor: 2.5,
                    timesCorrect: 0,
                    timesMistaken: 0
                };
            }
        });
    });
}

/**
 * Load saved data from localStorage
 */
export function loadData(): void {
    // Load word state with safe error handling
    const savedWords = getLocalStorageItem<Record<string, WordState>>(STORAGE_KEY, {});
    if (savedWords && typeof savedWords === 'object') {
        wordState = savedWords;
    }

    // Load player stats with safe error handling
    const savedStats = getLocalStorageItem<Partial<PlayerStats>>(STATS_KEY, {});
    if (savedStats && typeof savedStats === 'object') {
        playerStats = { ...playerStats, ...savedStats };
    }

    initWordState();
    updateDailyStreak();
}

/**
 * Save data to localStorage (with debouncing for performance)
 */
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const SAVE_DEBOUNCE_MS = 500;

function saveDataImmediate(): void {
    // Use safe localStorage utilities with centralized error handling
    setLocalStorageItem(STORAGE_KEY, wordState);
    setLocalStorageItem(STATS_KEY, playerStats);
}

export function saveData(): void {
    // Debounce saves to avoid rapid localStorage writes
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
        saveDataImmediate();
        saveTimeout = null;
    }, SAVE_DEBOUNCE_MS);
}

// Force immediate save (use on page unload)
export function saveDataSync(): void {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
    }
    saveDataImmediate();
}

/**
 * Update daily streak
 */
function updateDailyStreak(): void {
    const today = getToday();
    const lastPlayed = playerStats.lastPlayedDate;

    if (!lastPlayed) {
        playerStats.dailyStreak = 0;
    } else if (lastPlayed === today) {
        // Already played today
    } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastPlayed !== yesterdayStr) {
            playerStats.dailyStreak = 0;
        }
    }
}

/**
 * Record that player practiced today
 */
export function recordPractice(): void {
    const today = getToday();
    if (playerStats.lastPlayedDate !== today) {
        playerStats.dailyStreak++;
        playerStats.lastPlayedDate = today;
        playerStats.totalSessions++;
        saveData();
        checkAchievements();
    }
}

/**
 * Get word's current state
 */
export function getWordState(term: string): WordState {
    return wordState[term] || { score: 0, interval: 0, nextReview: getToday(), easeFactor: 2.5, timesCorrect: 0, timesMistaken: 0 };
}

/**
 * Get word's mastery score
 */
export function getWordScore(term: string): number {
    return getWordState(term).score;
}

/**
 * Update word using SM-2 algorithm
 */
export function updateWordSRS(term: string, quality: number): void {
    const state = wordState[term];
    if (!state) return;

    state.easeFactor = Math.max(1.3, state.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    if (quality < 3) {
        state.interval = 0;
        state.score = Math.max(0, state.score - 1);
        state.timesMistaken++;
    } else {
        if (state.interval === 0) {
            state.interval = 1;
        } else if (state.interval === 1) {
            state.interval = 6;
        } else {
            state.interval = Math.round(state.interval * state.easeFactor);
        }

        if (quality >= 4) {
            state.score = Math.min(5, state.score + 1);
        }
        state.timesCorrect++;

        if (state.score >= 4 && state.timesCorrect >= 3) {
            if (!playerStats.achievements.includes(`learned_${term}`)) {
                playerStats.wordsLearned++;
            }
        }

        if (quality === 5 && state.score === 5) {
            if (!playerStats.achievements.includes(`perfect_${term}`)) {
                playerStats.perfectWords++;
            }
        }
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + state.interval);
    state.nextReview = nextDate.toISOString().split('T')[0];

    saveData();
}

/**
 * Get character state
 */
export function getCharacterState(char: string): CharacterState {
    if (!playerStats.charsMastery) {
        playerStats.charsMastery = {};
    }

    if (!playerStats.charsMastery[char]) {
        playerStats.charsMastery[char] = {
            char,
            level: 0,
            nextReview: getToday(),
            lastPracticed: '',
            stagesCompleted: 0
        };
    }

    return playerStats.charsMastery[char];
}

/**
 * Update character mastery
 */
export function updateCharacterProgress(char: string, success: boolean): void {
    const state = getCharacterState(char);
    const today = getToday();

    state.lastPracticed = today;

    if (success) {
        // Simple progression for now: each successful session adds a "level" point towards mastery 
        // Logic can be refined to be more SRS-like later
        state.level = Math.min(5, state.level + 1);

        // Schedule next review based on level (1, 2, 3, 5, 10 days)
        const intervals = [1, 2, 3, 5, 10, 20];
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + (intervals[state.level] || 1));
        state.nextReview = nextDate.toISOString().split('T')[0];
    } else {
        // Validation failure drops level
        state.level = Math.max(0, state.level - 1);
        state.nextReview = today; // Review immediately
    }

    saveData();
}

/**
 * Get unique characters for a specific lesson
 */
export function getCharactersForLesson(lessonId: number): string[] {
    const lesson = LESSONS.find(l => l.id === lessonId);
    if (!lesson) return [];

    const uniqueChars = new Set<string>();
    lesson.phrases.forEach(phrase => {
        // Filter out non-Chinese characters if needed, or assume data quality
        for (const char of phrase.term) {
            if (/[\u4e00-\u9fa5]/.test(char)) {
                uniqueChars.add(char);
            }
        }
    });

    return Array.from(uniqueChars);
}

/**
 * Get character context (pinyin and example phrase)
 */
export function getCharacterContext(char: string, lessonId: number): { pinyin: string; examplePhrase: string; definition?: string } | null {
    const lesson = LESSONS.find(l => l.id === lessonId);
    if (!lesson) return null;

    // Find first phrase containing this character
    const phraseWithChar = lesson.phrases.find(p => p.term.includes(char));
    if (!phraseWithChar) return null;

    // Extract pinyin for this character
    // If the phrase is "看电视" with pinyin "kàn diàn shì", and char is "看",
    // we find its position and extract the corresponding pinyin syllable
    const charIndex = phraseWithChar.term.indexOf(char);
    const pinyinParts = phraseWithChar.pinyin.split(' ');
    const charPinyin = pinyinParts[charIndex] || phraseWithChar.pinyin;

    return {
        pinyin: charPinyin,
        examplePhrase: phraseWithChar.term,
        definition: phraseWithChar.definition
    };
}

/**
 * Get all lessons
 */
export function getLessons(): Lesson[] {
    return LESSONS;
}

/**
 * Get current lesson
 */
export function getCurrentLesson(): Lesson {
    return LESSONS.find(l => l.id === playerStats.currentLessonId) || LESSONS[0];
}

/**
 * Set current lesson
 */
export function setCurrentLesson(lessonId: number): void {
    playerStats.currentLessonId = lessonId;
    saveData();
}

/**
 * Get lesson progress (0-1)
 */
export function getLessonProgress(lessonId: number): number {
    const lesson = LESSONS.find(l => l.id === lessonId);
    if (!lesson) return 0;

    let totalScore = 0;
    lesson.phrases.forEach(phrase => {
        totalScore += getWordScore(phrase.term);
    });

    return totalScore / (lesson.phrases.length * 5); // Max score is 5 per phrase
}

/**
 * Get words for practice from current lesson
 */
export function getWordsForPractice(): PracticeWord[] {
    const lesson = getCurrentLesson();
    const today = getToday();
    const dueWords: PracticeWord[] = [];
    const newWords: PracticeWord[] = [];

    lesson.phrases.forEach((phrase, index) => {
        const state = getWordState(phrase.term);
        const practiceWord: PracticeWord = {
            term: phrase.term,
            pinyin: phrase.pinyin,
            level: Math.ceil((index + 1) / 3),
            lessonId: lesson.id,
            ...state
        };

        if (state.nextReview <= today) {
            if (state.timesCorrect === 0) {
                newWords.push(practiceWord);
            } else {
                dueWords.push(practiceWord);
            }
        }
    });

    shuffle(dueWords);
    shuffle(newWords);

    // Allow selecting all available new words (count is limited in selectLesson)
    // const maxNewWords = 5; 
    const result = [...dueWords, ...newWords];

    // If nothing due, return weakest words
    if (result.length === 0) {
        const allWords: PracticeWord[] = lesson.phrases.map((phrase, index) => ({
            term: phrase.term,
            pinyin: phrase.pinyin,
            level: Math.ceil((index + 1) / 3),
            lessonId: lesson.id,
            ...getWordState(phrase.term)
        }));
        allWords.sort((a, b) => (a.score || 0) - (b.score || 0));
        return allWords.slice(0, 6);
    }

    return result;
}

/**
 * Get unmastered words from selected lessons (score < 5)
 */
export function getUnmasteredWords(lessonIds: number[]): PracticeWord[] {
    const result: PracticeWord[] = [];

    lessonIds.forEach(lessonId => {
        const lesson = LESSONS.find(l => l.id === lessonId);
        if (!lesson) return;

        lesson.phrases.forEach((phrase, index) => {
            const state = getWordState(phrase.term);
            // Only include words not yet mastered (score < 5)
            if (state.score < 5) {
                result.push({
                    term: phrase.term,
                    pinyin: phrase.pinyin,
                    level: Math.ceil((index + 1) / 3),
                    lessonId: lesson.id,
                    ...state
                });
            }
        });
    });

    // Sort by score (weakest first) then shuffle within same score
    result.sort((a, b) => (a.score || 0) - (b.score || 0));

    return result;
}

/**
 * Shuffle array in place
 */
function shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

/**
 * Get player stats
 */
export function getStats(): PlayerStats {
    return { ...playerStats };
}

/**
 * Add XP and check for level up
 */
export function addXP(amount: number): number {
    playerStats.totalXP += amount;
    saveData();
    checkAchievements();
    return playerStats.totalXP;
}

/**
 * Get player level from XP
 */
export function getLevel(): number {
    return Math.floor(Math.sqrt(playerStats.totalXP / 100)) + 1;
}

/**
 * Get XP needed for next level
 */
export function getXPForNextLevel(): number {
    const level = getLevel();
    return level * level * 100;
}

/**
 * Get XP progress to next level (0-1)
 */
export function getLevelProgress(): number {
    const currentLevel = getLevel();
    const currentLevelXP = (currentLevel - 1) * (currentLevel - 1) * 100;
    const nextLevelXP = currentLevel * currentLevel * 100;
    return (playerStats.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP);
}

// Achievement definitions
const ACHIEVEMENTS: Achievement[] = [
    { id: 'first_word', name: '第一步', desc: '完成第一个词语', icon: '🎯', check: () => playerStats.totalSessions >= 1 },
    { id: 'streak_3', name: '连续三天', desc: '连续练习三天', icon: '🔥', check: () => playerStats.dailyStreak >= 3 },
    { id: 'streak_7', name: '一周勇士', desc: '连续练习七天', icon: '⚔️', check: () => playerStats.dailyStreak >= 7 },
    { id: 'streak_30', name: '月度大师', desc: '连续练习三十天', icon: '👑', check: () => playerStats.dailyStreak >= 30 },
    { id: 'level_5', name: '初学者', desc: '达到等级 5', icon: `<svg viewBox="0 0 24 24" width="32" height="32" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));"><defs><linearGradient id="y-body-5" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#B45309"/><stop offset="50%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#B45309"/></linearGradient><linearGradient id="y-top-5" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#FEF3C7"/><stop offset="100%" stop-color="#F59E0B"/></linearGradient></defs><path d="M7,11.5 A5,4 0 0,1 17,11.5" fill="url(#y-top-5)"/><path d="M2,11.5 Q12,14.5 22,11.5 Q21,19.5 12,19.5 Q3,19.5 2,11.5 Z" fill="url(#y-body-5)"/></svg>`, check: () => getLevel() >= 5 },
    { id: 'level_10', name: '学习者', desc: '达到等级 10', icon: `<svg viewBox="0 0 24 24" width="32" height="32" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));"><defs><linearGradient id="y-body-6" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#B45309"/><stop offset="50%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#B45309"/></linearGradient><linearGradient id="y-top-6" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#FEF3C7"/><stop offset="100%" stop-color="#F59E0B"/></linearGradient></defs><path d="M7,11.5 A5,4 0 0,1 17,11.5" fill="url(#y-top-6)"/><path d="M2,11.5 Q12,14.5 22,11.5 Q21,19.5 12,19.5 Q3,19.5 2,11.5 Z" fill="url(#y-body-6)"/></svg>`, check: () => getLevel() >= 10 },
    { id: 'learned_10', name: '词汇新手', desc: '学会 10 个词语', icon: '📚', check: () => playerStats.wordsLearned >= 10 },
    { id: 'learned_50', name: '词汇达人', desc: '学会 50 个词语', icon: '📖', check: () => playerStats.wordsLearned >= 50 },
    { id: 'learned_all', name: '词汇大师', desc: '学会所有 135 个词语', icon: '🏆', check: () => playerStats.wordsLearned >= 135 },
    { id: 'perfect_10', name: '完美主义', desc: '完美完成 10 个词语', icon: '💎', check: () => playerStats.perfectWords >= 10 },
    { id: 'xp_1000', name: '千分达人', desc: '获得 1000 经验', icon: '🎮', check: () => playerStats.totalXP >= 1000 },
    {
        id: 'lesson_complete', name: '完成一课', desc: '完成一课的所有词语', icon: '📝', check: () => {
            return LESSONS.some(lesson => getLessonProgress(lesson.id) >= 0.8);
        }
    },
];

/**
 * Check and unlock achievements
 */
export function checkAchievements(): Achievement[] {
    const newAchievements: Achievement[] = [];

    ACHIEVEMENTS.forEach(ach => {
        if (!playerStats.achievements.includes(ach.id) && ach.check()) {
            playerStats.achievements.push(ach.id);
            newAchievements.push(ach);
        }
    });

    if (newAchievements.length > 0) {
        saveData();
    }

    return newAchievements;
}

/**
 * Get all achievements with unlock status
 */
export function getAchievements(): (Achievement & { unlocked: boolean })[] {
    return ACHIEVEMENTS.map(ach => ({
        ...ach,
        unlocked: playerStats.achievements.includes(ach.id)
    }));
}

/**
 * Legacy compatibility
 */
export function loadScores(): void { loadData(); }
export function updateWordScore(term: string, delta: number): void {
    const quality = delta > 0 ? (delta >= 2 ? 5 : 4) : 2;
    updateWordSRS(term, quality);
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
