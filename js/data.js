/**
 * Word Data with Mastery Scores
 * Score: 0 = not practiced, 5 = mastered
 */

const STORAGE_KEY = 'tingxie_word_scores';

export const WORDS = [
    { term: "车厢", pinyin: "chē xiāng", level: 1, score: 0 },
    { term: "乘客", pinyin: "chéng kè", level: 1, score: 0 },
    { term: "劝告", pinyin: "quàn gào", level: 2, score: 0 },
    { term: "拼命", pinyin: "pīn mìng", level: 2, score: 0 },
    { term: "秩序", pinyin: "zhì xù", level: 3, score: 0 },
    { term: "甚至", pinyin: "shèn zhì", level: 3, score: 0 },
    { term: "基础", pinyin: "jī chǔ", level: 4, score: 0 },
    { term: "奔跑", pinyin: "bēn pǎo", level: 4, score: 0 },
    { term: "摔倒", pinyin: "shuāi dǎo", level: 5, score: 0 },
    { term: "原谅", pinyin: "yuán liàng", level: 5, score: 0 },
    { term: "既然", pinyin: "jì rán", level: 6, score: 0 },
    { term: "任何", pinyin: "rèn hé", level: 6, score: 0 }
];

/**
 * Load saved scores from localStorage
 */
export function loadScores() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const scores = JSON.parse(saved);
            WORDS.forEach(word => {
                if (scores[word.term] !== undefined) {
                    word.score = scores[word.term];
                }
            });
        }
    } catch (e) {
        console.warn('Could not load scores:', e);
    }
}

/**
 * Save current scores to localStorage
 */
export function saveScores() {
    try {
        const scores = {};
        WORDS.forEach(word => {
            scores[word.term] = word.score;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
    } catch (e) {
        console.warn('Could not save scores:', e);
    }
}

/**
 * Update a word's mastery score
 * @param {string} term - The Chinese word
 * @param {number} delta - Change in score (+1 for success, -1 for mistakes)
 */
export function updateWordScore(term, delta) {
    const word = WORDS.find(w => w.term === term);
    if (word) {
        word.score = Math.max(0, Math.min(5, word.score + delta));
        saveScores();
    }
}

/**
 * Get word's current score
 * @param {string} term - The Chinese word
 * @returns {number} Score 0-5
 */
export function getWordScore(term) {
    const word = WORDS.find(w => w.term === term);
    return word ? word.score : 0;
}

/**
 * Get words prioritized for practice (lower scores first)
 * @returns {Array} Shuffled words with low-score words appearing more often
 */
export function getWordsForPractice() {
    // Create weighted list - words with lower scores appear more
    const weighted = [];
    WORDS.forEach(word => {
        // Weight: score 0 = 6 copies, score 5 = 1 copy
        const copies = 6 - word.score;
        for (let i = 0; i < copies; i++) {
            weighted.push(word);
        }
    });
    
    // Shuffle weighted list
    for (let i = weighted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [weighted[i], weighted[j]] = [weighted[j], weighted[i]];
    }
    
    // Remove duplicates while maintaining priority order
    const seen = new Set();
    const result = [];
    for (const word of weighted) {
        if (!seen.has(word.term)) {
            seen.add(word.term);
            result.push(word);
        }
    }
    
    return result;
}
