/**
 * Player Statistics Module
 * Manages player stats, XP, levels, and daily streaks
 */

import { PlayerStats } from '../types';
import { getToday } from './srs';

/**
 * Get player level from XP
 */
export function getLevel(totalXP: number): number {
    return Math.floor(Math.sqrt(totalXP / 100)) + 1;
}

/**
 * Get XP needed for next level
 */
export function getXPForNextLevel(totalXP: number): number {
    const level = getLevel(totalXP);
    return level * level * 100;
}

/**
 * Get XP progress to next level (0-1)
 */
export function getLevelProgress(totalXP: number): number {
    const currentLevel = getLevel(totalXP);
    const currentLevelXP = (currentLevel - 1) * (currentLevel - 1) * 100;
    const nextLevelXP = currentLevel * currentLevel * 100;
    return (totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP);
}

/**
 * Add XP to player stats
 * @param playerStats - Mutable player stats object
 * @param amount - Amount of XP to add
 * @returns New total XP
 */
export function addXP(playerStats: PlayerStats, amount: number): number {
    playerStats.totalXP += amount;
    return playerStats.totalXP;
}

/**
 * Update daily streak based on last played date
 * @param playerStats - Mutable player stats object
 */
export function updateDailyStreak(playerStats: PlayerStats): void {
    const today = getToday();
    const lastPlayed = playerStats.lastPlayedDate;

    if (!lastPlayed) {
        playerStats.dailyStreak = 0;
    } else if (lastPlayed === today) {
        // Already played today, streak unchanged
    } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastPlayed !== yesterdayStr) {
            // Streak broken
            playerStats.dailyStreak = 0;
        }
    }
}

/**
 * Record that player practiced today
 * @param playerStats - Mutable player stats object
 * @returns True if this is a new session today
 */
export function recordPractice(playerStats: PlayerStats): boolean {
    const today = getToday();
    if (playerStats.lastPlayedDate !== today) {
        playerStats.dailyStreak++;
        playerStats.lastPlayedDate = today;
        playerStats.totalSessions++;
        return true;
    }
    return false;
}

/**
 * Get default player stats
 */
export function getDefaultPlayerStats(): PlayerStats {
    return {
        totalXP: 0,
        dailyStreak: 0,
        lastPlayedDate: null,
        wordsLearned: 0,
        perfectWords: 0,
        totalSessions: 0,
        achievements: [],
        currentLessonId: 1,
        charsMastery: {},
        // Shop system defaults
        yuanbao: 0,
        lastLoginDate: null,
        purchasedItems: [],
        activeEffects: {}
    };
}
