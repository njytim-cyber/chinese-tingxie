/**
 * Spaced Repetition System (SRS) Module
 * Implements SM-2 algorithm for word learning scheduling
 */

import { WordState, PlayerStats } from '../types';

/**
 * Get today's date as string (YYYY-MM-DD)
 */
export function getToday(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Update word using SM-2 algorithm
 * @param wordState - Mutable word state object to update
 * @param playerStats - Mutable player stats object to update
 * @param term - Word term for tracking
 * @param quality - Quality rating (0-5)
 */
export function updateWordSRS(
    wordState: WordState,
    playerStats: PlayerStats,
    term: string,
    quality: number
): void {
    // Update ease factor using SM-2 formula
    wordState.easeFactor = Math.max(
        1.3,
        wordState.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    if (quality < 3) {
        // Failed: reset interval and decrease score
        wordState.interval = 0;
        wordState.score = Math.max(0, wordState.score - 1);
        wordState.timesMistaken++;
    } else {
        // Passed: increase interval
        if (wordState.interval === 0) {
            wordState.interval = 1;
        } else if (wordState.interval === 1) {
            wordState.interval = 6;
        } else {
            wordState.interval = Math.round(wordState.interval * wordState.easeFactor);
        }

        // Increase score for high quality
        if (quality >= 4) {
            wordState.score = Math.min(5, wordState.score + 1);
        }
        wordState.timesCorrect++;

        // Track word mastery
        if (wordState.score >= 4 && wordState.timesCorrect >= 3) {
            if (!playerStats.achievements.includes(`learned_${term}`)) {
                playerStats.wordsLearned++;
            }
        }

        // Track perfect words
        if (quality === 5 && wordState.score === 5) {
            if (!playerStats.achievements.includes(`perfect_${term}`)) {
                playerStats.perfectWords++;
            }
        }
    }

    // Schedule next review
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + wordState.interval);
    wordState.nextReview = nextDate.toISOString().split('T')[0];
}

/**
 * Check if a word is due for review
 */
export function isWordDue(wordState: WordState): boolean {
    return wordState.nextReview <= getToday();
}

/**
 * Check if a word is mastered
 */
export function isWordMastered(wordState: WordState): boolean {
    return wordState.score >= 5;
}

/**
 * Calculate word priority for practice (lower = higher priority)
 */
export function calculateWordPriority(wordState: WordState): number {
    // New words: highest priority (0)
    if (wordState.timesCorrect === 0) {
        return 0;
    }
    // Due words: priority based on score (lower score = higher priority)
    if (isWordDue(wordState)) {
        return wordState.score + 1;
    }
    // Not due: lowest priority
    return 100;
}
