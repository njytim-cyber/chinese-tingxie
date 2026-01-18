import { UIManager } from '../UIManager';
import { Achievement } from '../../data';

/**
 * Renders in-game UI elements like modals and feedback
 */
export class GameRenderer {
    private manager: UIManager;

    constructor(manager: UIManager) {
        this.manager = manager;
    }

    /**
     * Show level up animation
     */
    showLevelUp(level: number): void {
        const overlay = document.createElement('div');
        overlay.className = 'level-up-overlay';
        overlay.innerHTML = `
            <div class="level-up-content">
                <div class="level-up-text">升级了!</div>
                <div class="level-up-badge">${level}</div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Remove after animation
        setTimeout(() => {
            overlay.classList.add('fade-out');
            setTimeout(() => overlay.remove(), 500);
        }, 2000);
    }

    /**
     * Show session complete screen
     */
    showSessionComplete(
        wordsCompleted: number,
        score: number,
        sessionStartTime: number,
        onRestart: () => void,
        onShare: () => void
    ): void {
        const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        const timeStr = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;

        const content = document.createElement('div');
        content.className = 'session-complete';
        content.innerHTML = `
            <div class="complete-card">
                <h2>练习完成!</h2>
                <div class="complete-stats">
                    <div class="stat-item">
                        <div class="stat-value">${wordsCompleted}</div>
                        <div class="stat-label">词语</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${Math.max(0, Math.round(score))}%</div>
                        <div class="stat-label">得分</div>
                    </div>
                </div>
                <div class="complete-time">用时: ${timeStr}</div>
                <div class="complete-actions">
                    <button class="action-btn-large" id="restart-btn">再练一次</button>
                    <button class="action-btn-secondary" id="share-btn">分享成绩</button>
                    <button class="text-btn" id="home-btn">返回主页</button>
                </div>
            </div>
        `;

        this.manager.transitionView(() => {
            const app = document.querySelector('.game-stage');
            if (app) {
                app.innerHTML = '';
                app.appendChild(content);
            }

            // Bind events
            document.getElementById('restart-btn')?.addEventListener('click', onRestart);
            document.getElementById('share-btn')?.addEventListener('click', onShare);
            document.getElementById('home-btn')?.addEventListener('click', () => {
                // Return to previous view (lesson selection)
                window.location.reload(); // Simplest way to reset full state for now
            });
        });
    }

    /**
     * Show feedback overlay (toast)
     */
    showFeedback(text: string, color: string): void {
        const overlay = this.manager.domCache.feedbackOverlay;
        if (!overlay) return;

        overlay.textContent = text;
        overlay.style.backgroundColor = color;
        overlay.style.opacity = '1';
        overlay.style.transform = 'translate(-50%, 0)';

        setTimeout(() => {
            overlay.style.opacity = '0';
            overlay.style.transform = 'translate(-50%, -20px)';
        }, 1500);
    }

    /**
     * Show new achievements
     */
    showNewAchievements(achievements: Achievement[]): void {
        achievements.forEach((ach, index) => {
            setTimeout(() => {
                const toast = document.createElement('div');
                toast.className = 'achievement-toast';
                toast.innerHTML = `
                    <div class="ach-icon">${ach.icon}</div>
                    <div class="ach-text">
                        <div class="ach-title">解锁成就!</div>
                        <div class="ach-name">${ach.name}</div>
                    </div>
                `;
                document.body.appendChild(toast);

                // Animate in
                setTimeout(() => toast.classList.add('show'), 10);

                // Remove
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                }, 3000);
            }, index * 1000);
        });
    }

    /**
     * Show practice selection screen
     */
    /**
     * Show practice selection screen
     */
    showPracticeSelect(_onStartPractice: (selectedLessons: number[]) => void): void {
        // Placeholder
    }

    /**
     * Update completed text display (for long sentence chunking)
     */
    updateCompletedText(text: string): void {
        const el = document.getElementById('completed-text');
        if (el) {
            if (text) {
                el.textContent = text;
                el.style.color = 'var(--tang-jade)';
                el.style.opacity = '1';
            } else {
                el.textContent = '您输入的词组将显示在这里...';
                el.style.color = 'var(--tang-ink-light)';
                el.style.opacity = '0.6';
            }
        }
    }

    /**
     * Ensure Game View exists (recreate if nuked by LessonRenderer)
     */
    showGameView(): void {
        const app = document.querySelector('.game-stage');
        if (!app) return;

        // Check if writing card already exists
        if (document.getElementById('writing-card')) {
            // Already there, just ensure visibility
            const card = document.getElementById('writing-card');
            if (card) card.classList.remove('hidden');
            return;
        }

        console.log('Recreating Game View structure...');

        // Re-inject the Game View HTML
        // We use innerHTML += or appendChild to avoid wiping other valid things if any exist (though likely empty)
        // But app.innerHTML = '' was likely called before, so we are safe to append.

        const fragment = document.createDocumentFragment();

        // 1. Feedback Overlay
        const feedback = document.createElement('div');
        feedback.id = 'feedback-overlay';
        fragment.appendChild(feedback);

        // 2. Completed Text (outside card)
        const completedText = document.createElement('div');
        completedText.id = 'completed-text';
        completedText.className = 'dictation-completed-phrases';
        completedText.textContent = '您输入的词组将显示在这里...';
        completedText.style.color = 'var(--tang-ink-light)';
        completedText.style.opacity = '0.6';
        fragment.appendChild(completedText);

        // 3. Progress Bar (between completed text and card)
        const progressContainer = document.createElement('div');
        progressContainer.id = 'spelling-progress-bar';
        progressContainer.className = 'dictation-header-progress';
        progressContainer.innerHTML = '<div class="dictation-progress-fill" style="width: 0%"></div>';
        fragment.appendChild(progressContainer);

        // 4. Writing Card
        const card = document.createElement('div');
        card.className = 'writing-card';
        card.id = 'writing-card';
        card.innerHTML = `
            <div class="card-header">
                <div id="definition-display" class="definition-display"></div>
            </div>
            <div class="card-body">
                <div class="character-container" id="writing-area"></div>
                <!-- Pinyin moved below as requested -->
                <div id="pinyin-display" class="pinyin-display-large"></div>
            </div>
            <div class="card-toolbar">
                <button class="tool-btn" id="btn-audio" title="听读音" aria-label="播放词语读音">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 010 7.07"/><path d="M18.37 5.64a9 9 0 010 12.73"/></svg>
                </button>
                <button class="tool-btn" id="btn-grid" title="切换格线" aria-label="切换田字格/米字格">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M12 3v18"/></svg>
                </button>
                <button class="tool-btn" id="btn-hint" title="提示" aria-label="显示拼音提示">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2C8 2 5 5.5 5 9c0 2.5 2 5 3 6v2a2 2 0 002 2h4a2 2 0 002-2v-2c1-1 3-3.5 3-6 0-3.5-3-7-7-7z"/><path d="M9 21h6"/></svg>
                </button>
                <button class="tool-btn" id="btn-reveal" title="显示" aria-label="显示完整词语">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/></svg>
                </button>
                <button class="tool-btn" id="btn-wordlist" title="词语表" aria-label="查看本课词语">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <path d="M3 6h18M3 12h18M3 18h18"/>
                    </svg>
                </button>
            </div>
        `;
        fragment.appendChild(card);

        // Next Button Container (Outside card, like completed-text and progress bar)
        const nextBtnContainer = document.createElement('div');
        nextBtnContainer.className = 'next-chunk-container';
        const nextBtn = document.createElement('button');
        nextBtn.className = 'action-btn-large';
        nextBtn.id = 'next-btn';
        nextBtn.innerHTML = '继续 →';
        nextBtn.style.cssText = 'display:none; width: 100%;';
        nextBtnContainer.appendChild(nextBtn);
        fragment.appendChild(nextBtnContainer);

        app.appendChild(fragment);

        // IMPORTANT: Re-bind events since elements are new
        // The Game.init logic binds events to ID references. Since we recreated them with same IDs,
        // we might need to rely on delegation or re-bind.
        // Actually, main.ts binds events on `game.init`. If we insert new DOM elements, the old listeners are lost associated with old elements (which are gone).
        // However, main.ts listeners are on `document`? No, they are on specific IDs found at init time.
        // **CRITICAL**: The original event listeners in main.ts are likely dead.
        // We need to re-attach listeners.
        // Option 1: Reload page (not SPA).
        // Option 2: Re-bind events.

        // For now, let's trigger a re-bind from the Manager if possible, or assume Game.ts handles it.
        // Checking game.ts -> It uses `inputHandler`. 
        // Checking main.ts -> It adds listeners to buttons.

        // We need to signal UIManager to re-bind inputs or buttons.
        this.manager.restoreGameEventListeners();
    }
    showConfirm(title: string, message: string, onConfirm: () => void): void {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay show';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width: 400px; text-align: center;">
                <h2 class="modal-title" style="color: var(--tang-red); margin-bottom: 15px;">${title}</h2>
                <p class="modal-message" style="color: var(--tang-ink); margin-bottom: 25px; line-height: 1.6;">${message}</p>
                <div class="modal-actions" style="display: flex; gap: 15px; justify-content: center;">
                    <button class="action-btn-secondary" id="confirm-cancel">取消</button>
                    <button class="action-btn-primary" id="confirm-ok">确定</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('confirm-cancel')?.addEventListener('click', () => {
            overlay.remove();
        });

        document.getElementById('confirm-ok')?.addEventListener('click', () => {
            overlay.remove();
            try {
                onConfirm();
            } catch (e) {
                console.error('Error in confirm callback:', e);
            }
        });
    }
}
