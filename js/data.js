/**
 * Word Data with Spaced Repetition (SM-2 inspired)
 * Each word tracks: score (0-5), interval, nextReview, easeFactor
 */

const STORAGE_KEY = 'tingxie_word_data';
const STATS_KEY = 'tingxie_stats';

export const WORDS = [
    { term: "车厢", pinyin: "chē xiāng", level: 1 },
    { term: "乘客", pinyin: "chéng kè", level: 1 },
    { term: "劝告", pinyin: "quàn gào", level: 2 },
    { term: "拼命", pinyin: "pīn mìng", level: 2 },
    { term: "秩序", pinyin: "zhì xù", level: 3 },
    { term: "甚至", pinyin: "shèn zhì", level: 3 },
    { term: "基础", pinyin: "jī chǔ", level: 4 },
    { term: "奔跑", pinyin: "bēn pǎo", level: 4 },
    { term: "摔倒", pinyin: "shuāi dǎo", level: 5 },
    { term: "原谅", pinyin: "yuán liàng", level: 5 },
    { term: "既然", pinyin: "jì rán", level: 6 },
    { term: "任何", pinyin: "rèn hé", level: 6 }
];

// Word learning state - stored separately
let wordState = {};

// Player statistics
let playerStats = {
    totalXP: 0,
    dailyStreak: 0,
    lastPlayedDate: null,
    wordsLearned: 0,
    perfectWords: 0,
    totalSessions: 0,
    achievements: []
};

/**
 * Get today's date as string (YYYY-MM-DD)
 */
function getToday() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Initialize word state for all words
 */
function initWordState() {
    WORDS.forEach(word => {
        if (!wordState[word.term]) {
            wordState[word.term] = {
                score: 0,           // Mastery 0-5
                interval: 0,        // Days until next review
                nextReview: getToday(), // When to review
                easeFactor: 2.5,    // SM-2 ease factor
                timesCorrect: 0,
                timesMistaken: 0
            };
        }
    });
}

/**
 * Load saved data from localStorage
 */
export function loadData() {
    try {
        const savedWords = localStorage.getItem(STORAGE_KEY);
        if (savedWords) {
            wordState = JSON.parse(savedWords);
        }

        const savedStats = localStorage.getItem(STATS_KEY);
        if (savedStats) {
            playerStats = { ...playerStats, ...JSON.parse(savedStats) };
        }

        initWordState();
        updateDailyStreak();
    } catch (e) {
        console.warn('Could not load data:', e);
        initWordState();
    }
}

/**
 * Save data to localStorage
 */
export function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wordState));
        localStorage.setItem(STATS_KEY, JSON.stringify(playerStats));
    } catch (e) {
        console.warn('Could not save data:', e);
    }
}

/**
 * Update daily streak
 */
function updateDailyStreak() {
    const today = getToday();
    const lastPlayed = playerStats.lastPlayedDate;

    if (!lastPlayed) {
        // First time playing
        playerStats.dailyStreak = 0;
    } else if (lastPlayed === today) {
        // Already played today, streak intact
    } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastPlayed === yesterdayStr) {
            // Played yesterday, streak continues (will increment when completing a word)
        } else {
            // Missed a day, reset streak
            playerStats.dailyStreak = 0;
        }
    }
}

/**
 * Record that player practiced today
 */
export function recordPractice() {
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
export function getWordState(term) {
    return wordState[term] || { score: 0, interval: 0, nextReview: getToday(), easeFactor: 2.5 };
}

/**
 * Get word's mastery score
 */
export function getWordScore(term) {
    return getWordState(term).score;
}

/**
 * Update word using SM-2 algorithm
 * @param {string} term - The word
 * @param {number} quality - Quality of response (0-5)
 *   0-2: Complete failure, needs immediate review
 *   3: Correct with difficulty
 *   4: Correct with hesitation
 *   5: Perfect recall
 */
export function updateWordSRS(term, quality) {
    const state = wordState[term];
    if (!state) return;

    // Update ease factor (SM-2)
    state.easeFactor = Math.max(1.3, state.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    if (quality < 3) {
        // Failed - reset interval
        state.interval = 0;
        state.score = Math.max(0, state.score - 1);
        state.timesMistaken++;
    } else {
        // Passed
        if (state.interval === 0) {
            state.interval = 1;
        } else if (state.interval === 1) {
            state.interval = 6;
        } else {
            state.interval = Math.round(state.interval * state.easeFactor);
        }

        // Increase mastery score
        if (quality >= 4) {
            state.score = Math.min(5, state.score + 1);
        }
        state.timesCorrect++;

        // Check if word is now "learned"
        if (state.score >= 4 && state.timesCorrect >= 3) {
            if (!playerStats.achievements.includes(`learned_${term}`)) {
                playerStats.wordsLearned++;
            }
        }

        // Check for perfect
        if (quality === 5 && state.score === 5) {
            if (!playerStats.achievements.includes(`perfect_${term}`)) {
                playerStats.perfectWords++;
            }
        }
    }

    // Set next review date
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + state.interval);
    state.nextReview = nextDate.toISOString().split('T')[0];

    saveData();
}

/**
 * Get words due for review today (spaced repetition)
 */
export function getWordsDueForReview() {
    const today = getToday();
    const dueWords = [];
    const newWords = [];

    WORDS.forEach(word => {
        const state = getWordState(word.term);
        if (state.nextReview <= today) {
            if (state.timesCorrect === 0) {
                newWords.push({ ...word, ...state });
            } else {
                dueWords.push({ ...word, ...state });
            }
        }
    });

    // Shuffle and combine: due words first, then new words
    shuffle(dueWords);
    shuffle(newWords);

    // Limit new words per session
    const maxNewWords = 5;
    return [...dueWords, ...newWords.slice(0, maxNewWords)];
}

/**
 * Get all words for practice (if no SRS words due)
 */
export function getWordsForPractice() {
    const dueWords = getWordsDueForReview();

    if (dueWords.length > 0) {
        return dueWords;
    }

    // No words due - return weakest words for extra practice
    const allWords = WORDS.map(word => ({ ...word, ...getWordState(word.term) }));
    allWords.sort((a, b) => a.score - b.score);
    return allWords.slice(0, 6);
}

/**
 * Shuffle array in place
 */
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

/**
 * Get player stats
 */
export function getStats() {
    return { ...playerStats };
}

/**
 * Add XP and check for level up
 */
export function addXP(amount) {
    playerStats.totalXP += amount;
    saveData();
    checkAchievements();
    return playerStats.totalXP;
}

/**
 * Get player level from XP
 */
export function getLevel() {
    // Level formula: level = floor(sqrt(xp / 100)) + 1
    return Math.floor(Math.sqrt(playerStats.totalXP / 100)) + 1;
}

/**
 * Get XP needed for next level
 */
export function getXPForNextLevel() {
    const level = getLevel();
    return level * level * 100;
}

/**
 * Get XP progress to next level (0-1)
 */
export function getLevelProgress() {
    const currentLevel = getLevel();
    const currentLevelXP = (currentLevel - 1) * (currentLevel - 1) * 100;
    const nextLevelXP = currentLevel * currentLevel * 100;
    return (playerStats.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP);
}

// Achievement definitions
const ACHIEVEMENTS = [
    { id: 'first_word', name: '第一步 (First Step)', desc: 'Complete your first word', icon: '🎯', check: () => playerStats.totalSessions >= 1 },
    { id: 'streak_3', name: '连续三天 (3 Day Streak)', desc: 'Practice 3 days in a row', icon: '🔥', check: () => playerStats.dailyStreak >= 3 },
    { id: 'streak_7', name: '一周勇士 (Week Warrior)', desc: 'Practice 7 days in a row', icon: '⚔️', check: () => playerStats.dailyStreak >= 7 },
    { id: 'streak_30', name: '月度大师 (Monthly Master)', desc: 'Practice 30 days in a row', icon: '👑', check: () => playerStats.dailyStreak >= 30 },
    { id: 'level_5', name: '初学者 (Beginner)', desc: 'Reach level 5', icon: '⭐', check: () => getLevel() >= 5 },
    { id: 'level_10', name: '学习者 (Learner)', desc: 'Reach level 10', icon: '🌟', check: () => getLevel() >= 10 },
    { id: 'learned_5', name: '词汇新手 (Vocab Novice)', desc: 'Learn 5 words', icon: '📚', check: () => playerStats.wordsLearned >= 5 },
    { id: 'learned_all', name: '词汇大师 (Vocab Master)', desc: 'Learn all words', icon: '🏆', check: () => playerStats.wordsLearned >= WORDS.length },
    { id: 'perfect_5', name: '完美主义 (Perfectionist)', desc: 'Perfect 5 words', icon: '💎', check: () => playerStats.perfectWords >= 5 },
    { id: 'xp_1000', name: '千分达人 (1K XP)', desc: 'Earn 1000 XP', icon: '🎮', check: () => playerStats.totalXP >= 1000 },
];

/**
 * Check and unlock achievements
 */
export function checkAchievements() {
    const newAchievements = [];

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
export function getAchievements() {
    return ACHIEVEMENTS.map(ach => ({
        ...ach,
        unlocked: playerStats.achievements.includes(ach.id)
    }));
}

/**
 * Legacy compatibility
 */
export function loadScores() { loadData(); }
export function updateWordScore(term, delta) {
    const quality = delta > 0 ? (delta >= 2 ? 5 : 4) : 2;
    updateWordSRS(term, quality);
}
