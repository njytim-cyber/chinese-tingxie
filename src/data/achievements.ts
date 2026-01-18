/**
 * Achievements Module
 * Manages achievement definitions and unlock tracking
 */

import { Achievement, PlayerStats, Lesson } from '../types';
import { getLevel } from './stats';

/**
 * Calculate lesson progress (0-1)
 * @param lesson - The lesson to calculate progress for
 * @param getWordScoreFn - Function to get word score by term
 */
function getLessonProgressInternal(
    lesson: Lesson,
    getWordScoreFn: (term: string) => number
): number {
    let totalScore = 0;
    lesson.phrases.forEach(phrase => {
        totalScore += getWordScoreFn(phrase.term);
    });
    return totalScore / (lesson.phrases.length * 5); // Max score is 5 per phrase
}

/**
 * Create achievement definitions
 * @param playerStats - Player stats for checking conditions
 * @param lessons - All lessons for progress tracking
 * @param getWordScore - Function to get word score
 */
export function createAchievements(
    playerStats: PlayerStats,
    lessons: Lesson[],
    getWordScore: (term: string) => number
): Achievement[] {
    return [
        {
            id: 'first_word',
            name: '第一步',
            desc: '完成第一个词语',
            icon: '🎯',
            check: () => playerStats.totalSessions >= 1
        },
        {
            id: 'streak_3',
            name: '连续三天',
            desc: '连续练习三天',
            icon: '🔥',
            check: () => playerStats.dailyStreak >= 3
        },
        {
            id: 'streak_7',
            name: '一周勇士',
            desc: '连续练习七天',
            icon: '⚔️',
            check: () => playerStats.dailyStreak >= 7
        },
        {
            id: 'streak_30',
            name: '月度大师',
            desc: '连续练习三十天',
            icon: '👑',
            check: () => playerStats.dailyStreak >= 30
        },
        {
            id: 'level_5',
            name: '初学者',
            desc: '达到等级 5',
            icon: `<svg viewBox="0 0 24 24" width="32" height="32" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));"><defs><linearGradient id="y-body-5" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#B45309"/><stop offset="50%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#B45309"/></linearGradient><linearGradient id="y-top-5" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#FEF3C7"/><stop offset="100%" stop-color="#F59E0B"/></linearGradient></defs><path d="M7,11.5 A5,4 0 0,1 17,11.5" fill="url(#y-top-5)"/><path d="M2,11.5 Q12,14.5 22,11.5 Q21,19.5 12,19.5 Q3,19.5 2,11.5 Z" fill="url(#y-body-5)"/></svg>`,
            check: () => getLevel(playerStats.totalXP) >= 5
        },
        {
            id: 'level_10',
            name: '学习者',
            desc: '达到等级 10',
            icon: `<svg viewBox="0 0 24 24" width="32" height="32" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));"><defs><linearGradient id="y-body-6" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#B45309"/><stop offset="50%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#B45309"/></linearGradient><linearGradient id="y-top-6" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#FEF3C7"/><stop offset="100%" stop-color="#F59E0B"/></linearGradient></defs><path d="M7,11.5 A5,4 0 0,1 17,11.5" fill="url(#y-top-6)"/><path d="M2,11.5 Q12,14.5 22,11.5 Q21,19.5 12,19.5 Q3,19.5 2,11.5 Z" fill="url(#y-body-6)"/></svg>`,
            check: () => getLevel(playerStats.totalXP) >= 10
        },
        {
            id: 'learned_10',
            name: '词汇新手',
            desc: '学会 10 个词语',
            icon: '📚',
            check: () => playerStats.wordsLearned >= 10
        },
        {
            id: 'learned_50',
            name: '词汇达人',
            desc: '学会 50 个词语',
            icon: '📖',
            check: () => playerStats.wordsLearned >= 50
        },
        {
            id: 'learned_all',
            name: '词汇大师',
            desc: '学会所有 135 个词语',
            icon: '🏆',
            check: () => playerStats.wordsLearned >= 135
        },
        {
            id: 'perfect_10',
            name: '完美主义',
            desc: '完美完成 10 个词语',
            icon: '💎',
            check: () => playerStats.perfectWords >= 10
        },
        {
            id: 'xp_1000',
            name: '千分达人',
            desc: '获得 1000 经验',
            icon: '🎮',
            check: () => playerStats.totalXP >= 1000
        },
        {
            id: 'lesson_complete',
            name: '完成一课',
            desc: '完成一课的所有词语',
            icon: '📝',
            check: () => {
                return lessons.some(lesson =>
                    getLessonProgressInternal(lesson, getWordScore) >= 0.8
                );
            }
        },
    ];
}

/**
 * Check and unlock achievements
 * @param playerStats - Mutable player stats object
 * @param achievements - Achievement definitions
 * @returns Newly unlocked achievements
 */
export function checkAchievements(
    playerStats: PlayerStats,
    achievements: Achievement[]
): Achievement[] {
    const newAchievements: Achievement[] = [];

    achievements.forEach(ach => {
        if (!playerStats.achievements.includes(ach.id) && ach.check()) {
            playerStats.achievements.push(ach.id);
            newAchievements.push(ach);
        }
    });

    return newAchievements;
}

/**
 * Get all achievements with unlock status
 */
export function getAchievementsWithStatus(
    playerStats: PlayerStats,
    achievements: Achievement[]
): (Achievement & { unlocked: boolean })[] {
    return achievements.map(ach => ({
        ...ach,
        unlocked: playerStats.achievements.includes(ach.id)
    }));
}
