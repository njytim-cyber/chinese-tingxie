/**
 * Data Manager Module
 * Central coordinator for all data operations
 */

import { LESSONS } from './lessons';
import {
    Lesson, Phrase, Word, PracticeWord, WordState, PlayerStats,
    Achievement, AttemptLog, CharacterState, ShopItem
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
import {
    getItemById, ownsItem as shopOwnsItem, getItemCount as shopGetItemCount
} from './shopItems';

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

    // Shop system initialization
    cleanupExpiredPowerUps();

    // Grant retroactive bonus for existing players (one-time)
    const retroBonus = grantRetroactiveBonus();
    if (retroBonus > 0) {
        console.log(`[Shop] Granted retroactive bonus: ${retroBonus} 元宝`);
    }

    // Check daily login reward
    const dailyReward = checkDailyLoginReward();
    if (dailyReward > 0) {
        // Will show toast notification in UI layer
        console.log(`[Shop] Daily login reward: ${dailyReward} 元宝`);
    }
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

// ===== SHOP SYSTEM =====

/**
 * Calculate and grant retroactive yuanbao bonus for existing players
 * Called once when shop system is first loaded
 */
export function grantRetroactiveBonus(): number {
    // Check if bonus already granted
    if (playerStats.shopInitialized) {
        return 0;
    }

    let bonus = 0;

    // 10 yuanbao per level
    const level = statsGetLevel(playerStats.totalXP);
    bonus += level * 10;

    // 50 yuanbao per achievement
    bonus += playerStats.achievements.length * 50;

    // 20 yuanbao per 7-day streak milestone
    const streakMilestones = Math.floor(playerStats.dailyStreak / 7);
    bonus += streakMilestones * 20;

    // Grant the bonus
    playerStats.yuanbao += bonus;

    // Mark bonus as granted (prevent double-granting)
    playerStats.shopInitialized = true;

    saveData();
    return bonus;
}

/**
 * Check and grant daily login reward (5 yuanbao)
 * Returns yuanbao amount if granted, 0 if already claimed today
 */
export function checkDailyLoginReward(): number {
    const today = getToday();

    if (playerStats.lastLoginDate === today) {
        return 0; // Already claimed today
    }

    playerStats.lastLoginDate = today;
    playerStats.yuanbao += 5;
    saveData();

    return 5;
}

/**
 * Add yuanbao to player balance
 */
export function addYuanbao(amount: number, reason?: string): void {
    playerStats.yuanbao += amount;
    saveData();

    // Optional: Log the transaction for debugging
    if (reason) {
        console.log(`[Shop] +${amount} 元宝: ${reason}`);
    }
}

/**
 * Purchase an item from the shop
 * Returns true if purchase successful, false if insufficient funds or already owned
 */
export function purchaseItem(itemId: string): { success: boolean; message: string } {
    // Cleanup expired power-ups before purchase
    cleanupExpiredPowerUps();

    const item = getItemById(itemId);

    if (!item) {
        return { success: false, message: '商品不存在' };
    }

    // Check if already owned (for non-stackable items)
    if (!item.stackable && shopOwnsItem(playerStats.purchasedItems, itemId)) {
        return { success: false, message: '已拥有此商品' };
    }

    // Check sufficient funds
    if (playerStats.yuanbao < item.price) {
        return { success: false, message: '元宝不足' };
    }

    // Deduct cost and add to inventory
    playerStats.yuanbao -= item.price;
    playerStats.purchasedItems.push(itemId);

    saveData();

    return { success: true, message: `成功购买：${item.name}` };
}

/**
 * Check if player owns an item
 */
export function ownsItem(itemId: string): boolean {
    return shopOwnsItem(playerStats.purchasedItems, itemId);
}

/**
 * Get count of stackable items (for consumables)
 */
export function getItemCount(itemId: string): number {
    return shopGetItemCount(playerStats.purchasedItems, itemId);
}

/**
 * Use a consumable item (decrement count)
 * Returns true if item was consumed, false if not owned
 */
export function useConsumableItem(itemId: string): boolean {
    // Cleanup expired power-ups before use
    cleanupExpiredPowerUps();

    const item = getItemById(itemId);

    if (!item || !item.stackable) {
        return false;
    }

    const index = playerStats.purchasedItems.indexOf(itemId);
    if (index === -1) {
        return false;
    }

    // Remove one instance
    playerStats.purchasedItems.splice(index, 1);
    saveData();

    return true;
}

/**
 * Activate a power-up effect
 * @param effectId - Effect identifier (e.g., 'xp-boost')
 * @param expiryTimestamp - When the effect should expire (0 for session-based)
 */
export function activatePowerUp(effectId: string, expiryTimestamp: number = 0): void {
    playerStats.activeEffects[effectId] = expiryTimestamp;
    saveData();
}

/**
 * Check if a power-up is currently active
 */
export function isPowerUpActive(effectId: string): boolean {
    const expiry = playerStats.activeEffects[effectId];

    if (!expiry) {
        return false;
    }

    // Session-based effects (expiry = 0) remain active until cleared
    if (expiry === 0) {
        return true;
    }

    // Time-based effects check timestamp
    return Date.now() < expiry;
}

/**
 * Deactivate a power-up effect
 */
export function deactivatePowerUp(effectId: string): void {
    delete playerStats.activeEffects[effectId];
    saveData();
}

/**
 * Clean up expired power-up effects
 */
export function cleanupExpiredPowerUps(): void {
    const now = Date.now();
    let changed = false;

    for (const [effectId, expiry] of Object.entries(playerStats.activeEffects)) {
        if (expiry > 0 && now >= expiry) {
            delete playerStats.activeEffects[effectId];
            changed = true;
        }
    }

    if (changed) {
        saveData();
    }
}

/**
 * Get yuanbao balance
 * Cleans up expired power-ups before returning balance
 */
export function getYuanbaoBalance(): number {
    cleanupExpiredPowerUps();
    return playerStats.yuanbao;
}

// ===== END SHOP SYSTEM =====

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
