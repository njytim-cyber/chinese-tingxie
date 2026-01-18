/**
 * Progress Tracking Module
 * Manages lesson progress, character mastery, and word selection
 */

import { Lesson, Phrase, Word, PracticeWord, WordState, CharacterState, PlayerStats } from '../types';
import { getToday, isWordDue } from './srs';

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
 * Get all words as flat array
 */
export function getAllWords(lessons: Lesson[]): Word[] {
    const words: Word[] = [];
    lessons.forEach(lesson => {
        lesson.phrases.forEach((phrase, index) => {
            words.push({
                term: phrase.term,
                pinyin: phrase.pinyin,
                level: Math.ceil((index + 1) / 3), // 5 levels per lesson
                lessonId: lesson.id
            });
        });
    });
    return words;
}

/**
 * Get phrases for a specific lesson
 */
export function getPhrasesForLesson(lessons: Lesson[], lessonId: number): Phrase[] {
    const lesson = lessons.find(l => l.id === lessonId);
    return lesson ? lesson.phrases : [];
}

/**
 * Get unique characters for a specific lesson
 */
export function getCharactersForLesson(lessons: Lesson[], lessonId: number): string[] {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return [];

    const uniqueChars = new Set<string>();
    lesson.phrases.forEach(phrase => {
        for (const char of phrase.term) {
            if (/[\u4e00-\u9fa5]/.test(char)) {
                uniqueChars.add(char);
            }
        }
    });

    return Array.from(uniqueChars);
}

/**
 * Get character context (pinyin and example phrase)
 */
export function getCharacterContext(
    lessons: Lesson[],
    char: string,
    lessonId: number
): { pinyin: string; examplePhrase: string; definition?: string } | null {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return null;

    const phraseWithChar = lesson.phrases.find(p => p.term.includes(char));
    if (!phraseWithChar) return null;

    const charIndex = phraseWithChar.term.indexOf(char);
    const pinyinParts = phraseWithChar.pinyin.split(' ');
    const charPinyin = pinyinParts[charIndex] || phraseWithChar.pinyin;

    return {
        pinyin: charPinyin,
        examplePhrase: phraseWithChar.term,
        definition: phraseWithChar.definition
    };
}

/**
 * Get character state
 */
export function getCharacterState(
    playerStats: PlayerStats,
    char: string
): CharacterState {
    if (!playerStats.charsMastery) {
        playerStats.charsMastery = {};
    }

    if (!playerStats.charsMastery[char]) {
        playerStats.charsMastery[char] = {
            char,
            level: 0,
            nextReview: getToday(),
            lastPracticed: '',
            stagesCompleted: 0
        };
    }

    return playerStats.charsMastery[char];
}

/**
 * Update character mastery
 */
export function updateCharacterProgress(
    playerStats: PlayerStats,
    char: string,
    success: boolean
): void {
    const state = getCharacterState(playerStats, char);
    const today = getToday();

    state.lastPracticed = today;

    if (success) {
        state.level = Math.min(5, state.level + 1);

        // Schedule next review based on level
        const intervals = [1, 2, 3, 5, 10, 20];
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + (intervals[state.level] || 1));
        state.nextReview = nextDate.toISOString().split('T')[0];
    } else {
        state.level = Math.max(0, state.level - 1);
        state.nextReview = today; // Review immediately
    }
}

/**
 * Get lesson progress (0-1)
 */
export function getLessonProgress(
    lessons: Lesson[],
    lessonId: number,
    getWordScore: (term: string) => number
): number {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return 0;

    let totalScore = 0;
    lesson.phrases.forEach(phrase => {
        totalScore += getWordScore(phrase.term);
    });

    return totalScore / (lesson.phrases.length * 5); // Max score is 5 per phrase
}

/**
 * Get current lesson
 */
export function getCurrentLesson(lessons: Lesson[], currentLessonId: number): Lesson {
    return lessons.find(l => l.id === currentLessonId) || lessons[0];
}

/**
 * Get words for practice from a lesson
 */
export function getWordsForPractice(
    lesson: Lesson,
    getWordStateFn: (term: string) => WordState
): PracticeWord[] {
    const today = getToday();
    const dueWords: PracticeWord[] = [];
    const newWords: PracticeWord[] = [];

    lesson.phrases.forEach((phrase, index) => {
        const state = getWordStateFn(phrase.term);
        const practiceWord: PracticeWord = {
            term: phrase.term,
            pinyin: phrase.pinyin,
            level: Math.ceil((index + 1) / 3),
            lessonId: lesson.id,
            ...state
        };

        if (state.nextReview <= today) {
            if (state.timesCorrect === 0) {
                newWords.push(practiceWord);
            } else {
                dueWords.push(practiceWord);
            }
        }
    });

    shuffle(dueWords);
    shuffle(newWords);

    const result = [...dueWords, ...newWords];

    // If nothing due, return weakest words
    if (result.length === 0) {
        const allWords: PracticeWord[] = lesson.phrases.map((phrase, index) => ({
            term: phrase.term,
            pinyin: phrase.pinyin,
            level: Math.ceil((index + 1) / 3),
            lessonId: lesson.id,
            ...getWordStateFn(phrase.term)
        }));
        allWords.sort((a, b) => (a.score || 0) - (b.score || 0));
        return allWords.slice(0, 6);
    }

    return result;
}

/**
 * Get unmastered words from selected lessons (score < 5)
 */
export function getUnmasteredWords(
    lessons: Lesson[],
    lessonIds: number[],
    getWordStateFn: (term: string) => WordState
): PracticeWord[] {
    const result: PracticeWord[] = [];

    lessonIds.forEach(lessonId => {
        const lesson = lessons.find(l => l.id === lessonId);
        if (!lesson) return;

        lesson.phrases.forEach((phrase, index) => {
            const state = getWordStateFn(phrase.term);
            // Only include words not yet mastered (score < 5)
            if (state.score < 5) {
                result.push({
                    term: phrase.term,
                    pinyin: phrase.pinyin,
                    level: Math.ceil((index + 1) / 3),
                    lessonId: lesson.id,
                    ...state
                });
            }
        });
    });

    // Sort by score (weakest first)
    result.sort((a, b) => (a.score || 0) - (b.score || 0));

    return result;
}
