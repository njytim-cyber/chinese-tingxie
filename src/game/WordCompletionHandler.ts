/**
 * Word Completion Handler
 * Extracted from game.ts to improve modularity and testability
 */

import { GameLogic } from './GameLogic';
import { updateWordSRS, addXP, getLevel, checkAchievements } from '../data';
import { addYuanbao } from '../data/manager';
import { SoundFX } from '../audio';
import { spawnParticles } from '../particles';
import { getRandomPraise } from '../ui/UIManager';
import { getIsRevealed, setIsRevealed } from '../types/state';
import type { UIManager } from '../ui/UIManager';
import type { GameState, PracticeWord, InputHandler } from '../types';

export interface WordCompletionResult {
    quality: number;
    xpEarned: number;
    yuanbaoEarned: number;
    isSuccess: boolean;
    mistakeCount: number;
    hintUsed: boolean;
}

export class WordCompletionHandler {
    /**
     * Calculate word completion quality and stats
     */
    static calculateCompletion(
        word: PracticeWord,
        inputHandler: InputHandler,
        state: GameState,
        result?: { mistakeCount: number; hintUsed: boolean }
    ): WordCompletionResult {
        // Get hint/mistake state from input handler or result
        const hintUsed = result?.hintUsed || inputHandler.wasHintUsed() || state.hintUsed;
        const mistakeCount = result?.mistakeCount ?? inputHandler.getMistakeCount();

        // Calculate quality using GameLogic
        const isRevealed = getIsRevealed(state);
        const quality = GameLogic.calculateQuality(mistakeCount, hintUsed, isRevealed);

        // Calculate XP using GameLogic
        const xpEarned = GameLogic.calculateXP(quality, state.sessionStreak);

        // Calculate yuanbao using GameLogic
        const yuanbaoEarned = GameLogic.calculateYuanbao(quality);

        const isSuccess = quality >= 3;

        return {
            quality,
            xpEarned,
            yuanbaoEarned,
            isSuccess,
            mistakeCount,
            hintUsed
        };
    }

    /**
     * Update game state after word completion
     */
    static updateState(
        word: PracticeWord,
        completion: WordCompletionResult,
        state: GameState
    ): void {
        state.sessionStreak++;
        state.wordsCompletedThisSession++;

        // Update SRS
        updateWordSRS(word.term, completion.quality);

        // Add XP
        state.score += completion.xpEarned;
        addXP(completion.xpEarned);

        // Add yuanbao
        if (completion.yuanbaoEarned > 0) {
            addYuanbao(completion.yuanbaoEarned, `词语完成 (质量: ${completion.quality})`);
        }

        // Track result
        state.sessionResults.push({
            term: word.term,
            correct: completion.isSuccess,
            mistakeCount: completion.mistakeCount,
            hintUsed: completion.hintUsed,
        });

        // Reset revealed flag if it exists
        if (getIsRevealed(state)) {
            setIsRevealed(state, false);
        }
    }

    /**
     * Update UI after word completion
     */
    static updateUI(
        word: PracticeWord,
        completion: WordCompletionResult,
        state: GameState,
        ui: UIManager,
        playerName: string,
        wordIndex: number
    ): void {
        // Update Progress Dot
        ui.updateProgressDot(wordIndex, completion.isSuccess ? 'correct' : 'wrong');

        // Update HUD and stats
        ui.updateHud(state.score, state.sessionStreak);
        ui.updateStatsDisplay();
        ui.displayGreeting(playerName);

        // Show feedback with XP and yuanbao
        const praise = getRandomPraise(completion.quality, state.sessionStreak);
        let feedbackText = `${praise} +${completion.xpEarned} 经验`;
        if (completion.yuanbaoEarned > 0) {
            feedbackText += ` · +${completion.yuanbaoEarned} 元宝`;
        }
        ui.showFeedback(feedbackText, "#4ade80");

        // Show pinyin and next button
        ui.showPinyin(word.pinyin);
        ui.showNextButton();
    }

    /**
     * Handle level up check
     */
    static checkAndShowLevelUp(oldLevel: number, ui: UIManager): void {
        if (GameLogic.checkLevelUp(oldLevel)) {
            ui.showLevelUp(getLevel());
        }
    }

    /**
     * Show achievements if any
     */
    static showAchievements(ui: UIManager): void {
        const newAchievements = checkAchievements();
        if (newAchievements.length > 0) {
            setTimeout(() => ui.showNewAchievements(newAchievements), 1500);
        }
    }

    /**
     * Spawn celebration particles
     */
    static celebrateSuccess(quality: number, sessionStreak: number): void {
        const particleCount = quality === 5 ? 5 : (sessionStreak >= 3 ? 3 : 1);
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                spawnParticles(
                    window.innerWidth / 2 + (Math.random() - 0.5) * 200,
                    window.innerHeight / 2 + (Math.random() - 0.5) * 100
                );
            }, i * 150);
        }
    }

    /**
     * Complete word handling orchestration
     */
    static handleWordSuccess(
        word: PracticeWord,
        inputHandler: InputHandler,
        state: GameState,
        ui: UIManager,
        playerName: string,
        wordIndex: number,
        result?: { mistakeCount: number; hintUsed: boolean }
    ): void {
        // Play success sound
        SoundFX.success();

        // Calculate completion stats
        const completion = this.calculateCompletion(word, inputHandler, state, result);

        // Store old level for level-up check
        const oldLevel = getLevel();

        // Update state
        this.updateState(word, completion, state);

        // Update UI
        this.updateUI(word, completion, state, ui, playerName, wordIndex);

        // Check for level up
        this.checkAndShowLevelUp(oldLevel, ui);

        // Check achievements
        this.showAchievements(ui);

        // Celebrate with particles
        this.celebrateSuccess(completion.quality, state.sessionStreak);
    }
}
