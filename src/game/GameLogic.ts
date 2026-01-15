/**
 * Pure Game Logic Module
 * Handles scoring, XP calculation, and quality assessment
 */

import { getLevel } from '../data';

export class GameLogic {
    /**
     * Calculate quality score (0-5) for SM-2 algorithm
     */
    static calculateQuality(mistakeCount: number, hintUsed: boolean, isRevealed: boolean): number {
        if (isRevealed) {
            return 1; // Incorrect response; the correct one remembered
        } else if (hintUsed) {
            return 2; // Failed - used hint
        } else {
            if (mistakeCount === 0) {
                return 5; // Perfect
            } else if (mistakeCount <= 2) {
                return 4; // Good
            } else {
                return 3; // Pass
            }
        }
    }

    /**
     * Calculate XP earned for a word
     */
    static calculateXP(quality: number, sessionStreak: number): number {
        let xpEarned = 10;
        if (quality === 5) xpEarned += 10;
        if (sessionStreak >= 3) xpEarned += 5;
        if (sessionStreak >= 5) xpEarned += 5;
        return xpEarned;
    }

    /**
     * Check if player leveled up
     */
    static checkLevelUp(oldLevel: number): boolean {
        const newLevel = getLevel();
        return newLevel > oldLevel;
    }
}
