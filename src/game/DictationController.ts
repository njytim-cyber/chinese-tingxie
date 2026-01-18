/**
 * Dictation Controller
 * Handles the wiring between Game, UI, and DictationManager
 */

import { UIManager } from '../ui/UIManager';
import { logAttempt, type AttemptLog } from '../data';
import type { DictationPassage } from '../types';
import { DictationRenderer } from '../ui/renderers/DictationRenderer';

/**
 * Convert Chinese numerals to Arabic numbers
 */
function chineseToNumber(chinese: string): number {
    const map: Record<string, number> = {
        '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
        '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
    };

    // Handle cases like 十一, 十二, etc.
    if (chinese.startsWith('十')) {
        if (chinese.length === 1) return 10;
        return 10 + (map[chinese[1]] || 0);
    }

    return map[chinese] || parseInt(chinese, 10) || 0;
}

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
        // Hide tabs when entering practice mode
        this.ui.dictationRenderer.hideTabs();

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

        // Format title as "默写 1.1" for Set B passages
        let displayTitle = DictationRenderer.shortenTitle(passage.title);
        if (passage.setId === 'B') {
            // Extract lesson number and passage index from title
            // Title format: "第一课 - 高兴/笑 (2)" or "第一课 - 高兴/笑"
            const match = passage.title.match(/第([一二三四五六七八九十]+|\d+)课.*?(?:\((\d+)\))?$/);
            if (match) {
                const lessonNum = chineseToNumber(match[1]);
                const passageIndex = match[2] || '1';
                displayTitle = `默写 ${lessonNum}.${passageIndex}`;
            }
        }

        this.ui.updateHeaderTitle(displayTitle); // Show passage title in header

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

            // Set session start time for progress saving
            dictation.setSessionStartTime(sessionStartTime);

            dictation.init(passage, container);
        } catch (error) {
            console.error('Failed to load DictationManager:', error);
            // Log full stack trace
            if (error instanceof Error) {
                console.error(error.stack);
            }
            this.ui.showFeedback('加载练习模块失败，请刷新页面重试', '#ef4444');

            // Restore UI state
            this.ui.toggleActiveGameUI(false);
            const hudControls = document.querySelector('.hud-controls');
            if (hudControls) (hudControls as HTMLElement).style.display = '';

            // Redirect back to lesson selection after showing error message
            // Give user time to read the error (2 seconds)
            setTimeout(() => {
                this.onSelectCtx();
            }, 2000);
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
