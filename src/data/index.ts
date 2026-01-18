/**
 * Data Module Barrel Export
 * Re-exports the manager which provides the complete public API
 */

// Export all public functions from manager
export {
    // Core data operations
    loadData,
    saveData,
    saveDataSync,
    getWordState,
    getWordScore,
    updateWordSRS,
    getCharacterState,
    updateCharacterProgress,
    getCharactersForLesson,
    getPhrasesForLesson,
    getCharacterContext,
    getLessons,
    getCurrentLesson,
    setCurrentLesson,
    getLessonProgress,
    getWordsForPractice,
    getUnmasteredWords,
    getAllWords,
    getStats,
    addXP,
    getLevel,
    getXPForNextLevel,
    getLevelProgress,
    recordPractice,
    checkAchievements,
    getAchievements,
    logAttempt,
    getAttemptLogs,
    clearAttemptLogs,
    // Shop system
    addYuanbao,
    getYuanbaoBalance,
    purchaseItem,
    ownsItem,
    getItemCount,
    useConsumableItem,
    activatePowerUp,
    deactivatePowerUp,
    isPowerUpActive,
    grantRetroactiveBonus,
    checkDailyLoginReward,
    cleanupExpiredPowerUps,
    // Legacy
    loadScores,
    updateWordScore
} from './manager';

export * from './sessionPersistence';
