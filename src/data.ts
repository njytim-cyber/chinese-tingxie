/**
 * Word Data with Spaced Repetition (SM-2 inspired)
 * Each word tracks: score (0-5), interval, nextReview, easeFactor
 */

// Type definitions
export interface Word {
    term: string;
    pinyin: string;
    level: number;
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
}

export interface Achievement {
    id: string;
    name: string;
    desc: string;
    icon: string;
    check: () => boolean;
    unlocked?: boolean;
}

const STORAGE_KEY = 'tingxie_word_data';
const STATS_KEY = 'tingxie_stats';

export const WORDS: Word[] = [
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
let wordState: Record<string, WordState> = {};

// Player statistics
let playerStats: PlayerStats = {
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
function getToday(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Initialize word state for all words
 */
function initWordState(): void {
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
export function loadData(): void {
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
export function saveData(): void {
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
function updateDailyStreak(): void {
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
 * @param term - The word
 * @param quality - Quality of response (0-5)
 *   0-2: Complete failure, needs immediate review
 *   3: Correct with difficulty
 *   4: Correct with hesitation
 *   5: Perfect recall
 */
export function updateWordSRS(term: string, quality: number): void {
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

// Extended word type for practice (combines Word and WordState)
export interface PracticeWord extends Word, Partial<WordState> { }

/**
 * Get words due for review today (spaced repetition)
 */
export function getWordsDueForReview(): PracticeWord[] {
    const today = getToday();
    const dueWords: PracticeWord[] = [];
    const newWords: PracticeWord[] = [];

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
export function getWordsForPractice(): PracticeWord[] {
    const dueWords = getWordsDueForReview();

    if (dueWords.length > 0) {
        return dueWords;
    }

    // No words due - return weakest words for extra practice
    const allWords: PracticeWord[] = WORDS.map(word => ({ ...word, ...getWordState(word.term) }));
    allWords.sort((a, b) => (a.score || 0) - (b.score || 0));
    return allWords.slice(0, 6);
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
    // Level formula: level = floor(sqrt(xp / 100)) + 1
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
    { id: 'level_5', name: '初学者', desc: '达到等级 5', icon: '⭐', check: () => getLevel() >= 5 },
    { id: 'level_10', name: '学习者', desc: '达到等级 10', icon: '🌟', check: () => getLevel() >= 10 },
    { id: 'learned_5', name: '词汇新手', desc: '学会 5 个词语', icon: '📚', check: () => playerStats.wordsLearned >= 5 },
    { id: 'learned_all', name: '词汇大师', desc: '学会所有词语', icon: '🏆', check: () => playerStats.wordsLearned >= WORDS.length },
    { id: 'perfect_5', name: '完美主义', desc: '完美完成 5 个词语', icon: '💎', check: () => playerStats.perfectWords >= 5 },
    { id: 'xp_1000', name: '千分达人', desc: '获得 1000 经验', icon: '🎮', check: () => playerStats.totalXP >= 1000 },
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
