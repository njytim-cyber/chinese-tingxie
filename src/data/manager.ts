/**
 * Data Manager Module
 * Central coordinator for all data operations
 */

import { LESSONS } from './lessons';
import {
    Lesson, Phrase, Word, PracticeWord, WordState, PlayerStats,
    Achievement, AttemptLog, CharacterState
} from '../types';
import {
    loadWordState, loadPlayerStats, saveData as persistSaveData,
    saveDataSync as persistSaveDataSync, logAttempt as persistLogAttempt,
    getAttemptLogs as persistGetAttemptLogs, clearAttemptLogs as persistClearAttemptLogs
} from './persistence';
import { updateWordSRS as srsUpdateWord, getToday } from './srs';
import {
    getLevel as statsGetLevel, getXPForNextLevel as statsGetXPForNextLevel,
    getLevelProgress as statsGetLevelProgress, addXP as statsAddXP,
    recordPractice as statsRecordPractice, updateDailyStreak,
    getDefaultPlayerStats
} from './stats';
import {
    createAchievements, checkAchievements as achCheckAchievements,
    getAchievementsWithStatus
} from './achievements';
import {
    getAllWords as progressGetAllWords, getPhrasesForLesson as progressGetPhrasesForLesson,
    getCharactersForLesson as progressGetCharactersForLesson,
    getCharacterContext as progressGetCharacterContext,
    getCharacterState as progressGetCharacterState,
    updateCharacterProgress as progressUpdateCharacterProgress,
    getLessonProgress as progressGetLessonProgress, getCurrentLesson as progressGetCurrentLesson,
    getWordsForPractice as progressGetWordsForPractice,
    getUnmasteredWords as progressGetUnmasteredWords
} from './progress';

// State management
let wordState: Record<string, WordState> = {};
let playerStats: PlayerStats = getDefaultPlayerStats();
let achievements: Achievement[] = [];

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
    wordState = loadWordState();
    const savedStats = loadPlayerStats();
    playerStats = { ...getDefaultPlayerStats(), ...savedStats };

    initWordState();
    updateDailyStreak(playerStats);

    // Initialize achievements with current state
    achievements = createAchievements(playerStats, LESSONS, getWordScore);
}

/**
 * Save data to localStorage (with debouncing)
 */
export function saveData(): void {
    persistSaveData(wordState, playerStats);
}

/**
 * Force immediate save (use on page unload)
 */
export function saveDataSync(): void {
    persistSaveDataSync(wordState, playerStats);
}

/**
 * Get word's current state
 */
export function getWordState(term: string): WordState {
    return wordState[term] || {
        score: 0,
        interval: 0,
        nextReview: getToday(),
        easeFactor: 2.5,
        timesCorrect: 0,
        timesMistaken: 0
    };
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

    srsUpdateWord(state, playerStats, term, quality);
    saveData();
}

/**
 * Get character state
 */
export function getCharacterState(char: string): CharacterState {
    return progressGetCharacterState(playerStats, char);
}

/**
 * Update character mastery
 */
export function updateCharacterProgress(char: string, success: boolean): void {
    progressUpdateCharacterProgress(playerStats, char, success);
    saveData();
}

/**
 * Get unique characters for a specific lesson
 */
export function getCharactersForLesson(lessonId: number): string[] {
    return progressGetCharactersForLesson(LESSONS, lessonId);
}

/**
 * Get phrases for a specific lesson
 */
export function getPhrasesForLesson(lessonId: number): Phrase[] {
    return progressGetPhrasesForLesson(LESSONS, lessonId);
}

/**
 * Get character context (pinyin and example phrase)
 */
export function getCharacterContext(
    char: string,
    lessonId: number
): { pinyin: string; examplePhrase: string; definition?: string } | null {
    return progressGetCharacterContext(LESSONS, char, lessonId);
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
    return progressGetCurrentLesson(LESSONS, playerStats.currentLessonId);
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
    return progressGetLessonProgress(LESSONS, lessonId, getWordScore);
}

/**
 * Get words for practice from current lesson
 */
export function getWordsForPractice(): PracticeWord[] {
    const lesson = getCurrentLesson();
    return progressGetWordsForPractice(lesson, getWordState);
}

/**
 * Get unmastered words from selected lessons (score < 5)
 */
export function getUnmasteredWords(lessonIds: number[]): PracticeWord[] {
    return progressGetUnmasteredWords(LESSONS, lessonIds, getWordState);
}

/**
 * Get all words as flat array
 */
export function getAllWords(): Word[] {
    return progressGetAllWords(LESSONS);
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
    const newXP = statsAddXP(playerStats, amount);
    saveData();
    checkAchievements();
    return newXP;
}

/**
 * Get player level from XP
 */
export function getLevel(): number {
    return statsGetLevel(playerStats.totalXP);
}

/**
 * Get XP needed for next level
 */
export function getXPForNextLevel(): number {
    return statsGetXPForNextLevel(playerStats.totalXP);
}

/**
 * Get XP progress to next level (0-1)
 */
export function getLevelProgress(): number {
    return statsGetLevelProgress(playerStats.totalXP);
}

/**
 * Record that player practiced today
 */
export function recordPractice(): void {
    const isNewSession = statsRecordPractice(playerStats);
    if (isNewSession) {
        saveData();
        checkAchievements();
    }
}

/**
 * Check and unlock achievements
 */
export function checkAchievements(): Achievement[] {
    // Recreate achievements with current state (for dynamic checks)
    achievements = createAchievements(playerStats, LESSONS, getWordScore);
    const newAchievements = achCheckAchievements(playerStats, achievements);

    if (newAchievements.length > 0) {
        saveData();
    }

    return newAchievements;
}

/**
 * Get all achievements with unlock status
 */
export function getAchievements(): (Achievement & { unlocked: boolean })[] {
    // Ensure achievements are up to date
    achievements = createAchievements(playerStats, LESSONS, getWordScore);
    return getAchievementsWithStatus(playerStats, achievements);
}

/**
 * Log a practice attempt to localStorage
 */
export function logAttempt(attempt: AttemptLog): void {
    persistLogAttempt(attempt);
}

/**
 * Get all attempt logs from localStorage
 */
export function getAttemptLogs(): AttemptLog[] {
    return persistGetAttemptLogs();
}

/**
 * Clear all attempt logs
 */
export function clearAttemptLogs(): void {
    persistClearAttemptLogs();
}

/**
 * Legacy compatibility
 */
export function loadScores(): void {
    loadData();
}

export function updateWordScore(term: string, delta: number): void {
    const quality = delta > 0 ? (delta >= 2 ? 5 : 4) : 2;
    updateWordSRS(term, quality);
}

// Re-export types for convenience
export type {
    Achievement, AttemptLog, Lesson, Phrase, WordState,
    PlayerStats, Word, PracticeWord, CharacterState
};
