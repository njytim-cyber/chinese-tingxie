/**
 * Session Manager
 * Handles session state, tracking, and completion
 */

import { logAttempt, getCurrentLesson, getStats, getLevel, type AttemptLog } from '../data';
import { addYuanbao } from '../data/manager';
import { GameLogic } from './GameLogic';
import type { GameState } from '../types';
import type { UIManager } from '../ui/UIManager';

export interface SessionStats {
    wordsCompleted: number;
    correctCount: number;
    totalPhrases: number;
    duration: number;
    percentage: number;
}

export class SessionManager {
    /**
     * Calculate session statistics
     */
    static calculateStats(state: GameState): SessionStats {
        const duration = state.sessionStartTime
            ? Math.round((Date.now() - state.sessionStartTime) / 1000)
            : 0;
        const correctCount = state.sessionResults.filter(r => r.correct).length;
        const totalPhrases = state.sessionResults.length;
        const percentage = totalPhrases > 0
            ? Math.round((correctCount / totalPhrases) * 100)
            : 0;

        return {
            wordsCompleted: state.wordsCompletedThisSession,
            correctCount,
            totalPhrases,
            duration,
            percentage
        };
    }

    /**
     * Log session attempt to data store
     */
    static logSessionAttempt(state: GameState, mode: 'spelling' | 'dictation' = 'spelling'): void {
        const lesson = getCurrentLesson();
        const stats = this.calculateStats(state);

        const attempt: AttemptLog = {
            timestamp: new Date().toISOString(),
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            mode,
            phrases: state.sessionResults,
            totalScore: stats.correctCount,
            totalPhrases: stats.totalPhrases,
            duration: stats.duration,
        };
        logAttempt(attempt);
    }

    /**
     * Generate share text for social sharing
     */
    static generateShareText(state: GameState): string {
        const stats = getStats();
        return `✨ 星空听写\n我刚刚练习了 ${state.wordsCompletedThisSession} 个词语！\n得分: ${state.score} | 连胜: ${stats.dailyStreak}🔥\n等级: Lv.${getLevel()}\n\n快来挑战吧！`;
    }

    /**
     * Handle share action (Web Share API or clipboard fallback)
     */
    static async shareResults(state: GameState): Promise<void> {
        const text = this.generateShareText(state);

        // Web Share API
        if (navigator.share) {
            try {
                await navigator.share({
                    title: '星空听写 - 中文学习',
                    text: text,
                    url: window.location.href
                });
            } catch (error) {
                console.error('Share failed:', error);
            }
        } else {
            // Clipboard fallback
            try {
                await navigator.clipboard.writeText(text);
                alert('成绩已复制到剪贴板！');
            } catch (error) {
                console.error('Clipboard write failed:', error);
                alert('分享功能暂不可用');
            }
        }
    }

    /**
     * Show session complete screen with stats
     */
    static showSessionComplete(
        state: GameState,
        ui: UIManager,
        onRestart: () => void
    ): void {
        // Log the attempt
        this.logSessionAttempt(state);

        // Calculate stats for display
        const stats = this.calculateStats(state);

        // Award session completion bonus
        const sessionBonus = GameLogic.calculateSessionBonus(stats.wordsCompleted);
        addYuanbao(sessionBonus, '完成练习');

        // Show completion UI
        ui.showSessionComplete(
            stats.wordsCompleted,
            stats.percentage,
            state.sessionStartTime || Date.now(),
            onRestart,
            () => this.shareResults(state)
        );
    }

    /**
     * Reset session state
     */
    static resetSession(state: GameState): void {
        state.currentWordIndex = 0;
        state.sessionStartTime = Date.now();
        state.wordsCompletedThisSession = 0;
        state.sessionStreak = 0;
        state.sessionResults = [];
        state.score = 0;
        state.streak = 0;
    }

    /**
     * Check if session is complete
     */
    static isSessionComplete(state: GameState): boolean {
        return state.currentWordIndex >= state.practiceWords.length;
    }
}
