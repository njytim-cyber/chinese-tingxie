/**
 * Word Data and Logic Module
 *
 * This file now acts as a facade to the modular data architecture.
 * All implementation has been split into focused modules:
 * - data/persistence.ts: localStorage operations
 * - data/srs.ts: SM-2 spaced repetition algorithm
 * - data/stats.ts: Player statistics and XP management
 * - data/achievements.ts: Achievement system
 * - data/progress.ts: Lesson and character progress tracking
 * - data/manager.ts: Central coordinator
 */

// Re-export everything from manager for backward compatibility
export {
    // Types
    type Achievement,
    type AttemptLog,
    type Lesson,
    type Phrase,
    type WordState,
    type PlayerStats,
    type Word,
    type PracticeWord,
    type CharacterState,
    // Data operations
    loadData,
    saveData,
    saveDataSync,
    // Word operations
    getWordState,
    getWordScore,
    updateWordSRS,
    getAllWords,
    getWordsForPractice,
    getUnmasteredWords,
    // Character operations
    getCharacterState,
    updateCharacterProgress,
    getCharactersForLesson,
    getCharacterContext,
    // Lesson operations
    getLessons,
    getCurrentLesson,
    setCurrentLesson,
    getLessonProgress,
    getPhrasesForLesson,
    // Player stats
    getStats,
    addXP,
    getLevel,
    getXPForNextLevel,
    getLevelProgress,
    recordPractice,
    // Achievements
    checkAchievements,
    getAchievements,
    // Attempt logging
    logAttempt,
    getAttemptLogs,
    clearAttemptLogs,
    // Legacy compatibility
    loadScores,
    updateWordScore
} from './data/manager';
