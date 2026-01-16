/**
 * Dictation Controller
 * Handles the wiring between Game, UI, and DictationManager
 */

import { UIManager } from '../ui/UIManager';
import { logAttempt, type AttemptLog } from '../data';
import type { DictationPassage } from '../types';

export class DictationController {
    private ui: UIManager;
    private dictationManager: import('../dictation').DictationManager | null = null;
    private onSelectCtx: () => void;

    constructor(ui: UIManager, onSelectCtx: () => void) {
        this.ui = ui;
        this.onSelectCtx = onSelectCtx;
    }

    getManager() {
        return this.dictationManager;
    }

    /**
     * Start dictation session
     */
    async start(passage: DictationPassage, sessionStartTime: number): Promise<void> {
        // Find the main game stage
        const container = document.querySelector('.game-stage') as HTMLElement;
        if (!container) {
            console.error('DictationController: .game-stage not found!');
            return;
        }

        // Clear any existing content (Spelling Mode UI, etc.)
        container.innerHTML = '';
        container.style.opacity = '1'; // Ensure visible

        // Ensure HUD is in correct state (minimal game HUD)
        this.ui.toggleActiveGameUI(true);
        this.ui.showControls();
        this.ui.toggleAvatar(false); // Remove avatar from dictation input page
        this.ui.setHudTransparent(false);
        this.ui.toggleBackBtn(true);
        this.ui.updateHeaderTitle(''); // No title in dictation game

        // Hide standard HUD controls if they exist (Dictation manages its own)
        const hudControls = document.querySelector('.hud-controls');
        if (hudControls) (hudControls as HTMLElement).style.display = 'none';

        // Cleanup previous manager if exists
        if (this.dictationManager) {
            this.dictationManager.destroy();
            this.dictationManager = null;
        }

        // Dynamically import and create dictation manager
        try {
            const { DictationManager } = await import('../dictation');
            const dictation = new DictationManager(this.ui);
            this.dictationManager = dictation;

            dictation.onComplete = (score, total) => {
                this.handleComplete(dictation, passage, score, total, sessionStartTime);
            };

            dictation.init(passage, container);
        } catch (error) {
            console.error('Failed to load DictationManager:', error);
            // Log full stack trace
            if (error instanceof Error) {
                console.error(error.stack);
            }
            this.ui.showFeedback('加载练习模块失败，请检查控制台', '#ef4444');
            // Restore UI state or go back
            this.ui.toggleActiveGameUI(false);
            const hudControls = document.querySelector('.hud-controls');
            if (hudControls) (hudControls as HTMLElement).style.display = '';

            // FIXME: Commenting out redirection to debug the error
            // this.onSelectCtx();
        }
    }

    private handleComplete(
        dictation: import('../dictation').DictationManager,
        passage: DictationPassage,
        score: number,
        total: number,
        startTime: number
    ) {
        const chunks = dictation.chunks || [];
        const phrases = chunks.map(c => ({
            term: c.text,
            correct: c.score > 0,
            mistakeCount: c.revealUsed ? 2 : (c.hintUsed ? 1 : 0),
            hintUsed: c.hintUsed || c.revealUsed
        }));

        const attempt: AttemptLog = {
            timestamp: new Date().toISOString(),
            lessonId: parseInt(passage.id) || 0,
            lessonTitle: passage.title,
            mode: 'dictation',
            phrases: phrases,
            totalScore: score,
            totalPhrases: chunks.length,
            duration: Math.round((Date.now() - startTime) / 1000)
        };
        logAttempt(attempt);

        this.ui.showDictationResult(score, total, () => {
            this.onSelectCtx();
        });
    }
}
