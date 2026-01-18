/**
 * UI Rendering Module
 * Facade that orchestrates UI rendering via specialized controllers
 */

import { DOMCache, initDOMCache, ProgressDotStatus, IUIManager, Achievement } from '../types';
import { LessonRenderer } from './renderers/LessonRenderer';
import { StatsRenderer } from './renderers/StatsRenderer';
import { DictationRenderer } from './renderers/DictationRenderer';
import { GameRenderer } from './renderers/GameRenderer';
import { ShopRenderer } from './renderers/ShopRenderer';
import { HUDController } from './HUDController';
import { AvatarSelector } from './components/AvatarSelector';

/**
 * UI Manager class - Main Coordinator
 */
export class UIManager implements IUIManager {
    public domCache: DOMCache;

    // Sub-components
    private lessonRenderer: LessonRenderer;
    private statsRenderer: StatsRenderer;
    public dictationRenderer: DictationRenderer; // Public for DictationManager access
    public gameRenderer: GameRenderer; // Public for Game access
    private shopRenderer: ShopRenderer;
    private hudController: HUDController;

    // Transition state to prevent race conditions
    private isTransitioning: boolean = false;
    private pendingTransition: (() => void) | null = null;

    constructor(domCache?: DOMCache) {
        this.domCache = domCache || initDOMCache();

        // Initialize sub-components
        this.hudController = new HUDController(this.domCache);
        this.lessonRenderer = new LessonRenderer(this);
        this.statsRenderer = new StatsRenderer(this);
        this.dictationRenderer = new DictationRenderer(this);
        this.gameRenderer = new GameRenderer(this);
        this.shopRenderer = new ShopRenderer(this);

        this.setupEventListeners();
    }

    /**
     * Update DOM cache (call after major view changes)
     */
    updateCache(): void {
        this.domCache = initDOMCache();
        // Re-initialize HUD controller with new cache
        this.hudController = new HUDController(this.domCache);
    }

    /**
     * Smooth view transition with fade animation
     * Prevents race conditions by queuing transitions
     */
    transitionView(renderFn: () => void): void {
        const app = document.querySelector('.game-stage') as HTMLElement;
        if (!app) {
            try {
                renderFn();
            } catch (e) {
                console.error('Error rendering view (no app container):', e);
            }
            return;
        }

        // If a transition is in progress, queue this one
        if (this.isTransitioning) {
            this.pendingTransition = renderFn;
            return;
        }

        // Mark as transitioning
        this.isTransitioning = true;

        // Start fade out
        app.style.transition = 'opacity 200ms ease';
        app.style.opacity = '0';

        setTimeout(() => {
            try {
                renderFn();
                this.updateCache();
            } catch (e) {
                console.error('Error rendering view during transition:', e);
            }

            // Fade in - using requestAnimationFrame for smoother animation
            requestAnimationFrame(() => {
                app.style.opacity = '1';

                // Clean up and mark complete after transition ends
                const cleanup = () => {
                    app.style.transition = '';
                    this.isTransitioning = false;

                    // Process pending transition if any
                    if (this.pendingTransition) {
                        const pending = this.pendingTransition;
                        this.pendingTransition = null;
                        this.transitionView(pending);
                    }
                };

                // Wait for transition to complete
                setTimeout(cleanup, 250);
            });
        }, 200);
    }

    // --- HUD Controller Delegation ---

    updateHeaderTitle(title: string): void {
        this.hudController.updateHeaderTitle(title);
    }

    toggleMainHeader(visible: boolean): void {
        this.hudController.toggleMainHeader(visible);
    }

    toggleBackBtn(visible: boolean): void {
        this.hudController.toggleBackBtn(visible);
    }

    toggleHeaderStats(visible: boolean): void {
        this.hudController.toggleHeaderStats(visible);
    }

    updateDashboardStats(): void {
        this.hudController.updateDashboardStats();
    }

    toggleAvatar(visible: boolean): void {
        this.hudController.toggleAvatar(visible);
    }

    showSessionStats(visible: boolean): void {
        this.hudController.showSessionStats(visible);
    }

    toggleActiveGameUI(visible: boolean): void {
        if (visible) {
            this.gameRenderer.showGameView();
            this.updateCache(); // Refresh cache with new elements
            this.restoreGameEventListeners(); // Re-attach button listeners
        }
        this.hudController.toggleActiveGameUI(visible);
    }

    showControls(): void {
        this.gameRenderer.showGameView();
        this.updateCache();
        this.restoreGameEventListeners(); // Re-attach button listeners
        this.hudController.showControls();
    }

    setHudTransparent(transparent: boolean): void {
        this.hudController.setHudTransparent(transparent);
    }

    updateHud(score: number, streak: number): void {
        this.hudController.updateHud(score, streak);
    }

    hideFooterProgress(): void {
        this.hudController.hideFooterProgress();
    }

    // --- Avatar Delegation ---

    setRandomAvatar(): void {
        AvatarSelector.setRandomAvatar(document.getElementById('player-avatar'));
    }

    restoreGameEventListeners(): void {
        // Re-attach button listeners that were lost during DOM reconstruction
        // This relies on the global Game object being available
        const game = (window as any).Game;
        if (!game) return;

        console.log('Restoring game event listeners...');

        document.getElementById('btn-audio')?.addEventListener('click', () => game.playCurrentAudio());
        document.getElementById('btn-hint')?.addEventListener('click', () => game.useHint());
        document.getElementById('btn-reveal')?.addEventListener('click', () => game.revealPhrase());
        document.getElementById('btn-grid')?.addEventListener('click', () => game.toggleGrid());
        document.getElementById('btn-wordlist')?.addEventListener('click', () => game.showWordList());
        document.getElementById('next-btn')?.addEventListener('click', () => game.nextLevel());
        // Header back button is persistent, no need to rebind usually, but good to check
        // document.getElementById('header-back-btn')?.addEventListener('click', () => game.handleBackNavigation());
    }

    // --- Renderer Delegation ---

    showLessonSelect(onSelect: (id: number, limit: number, mode?: 'tingxie' | 'xizi') => void, _onProgressClick?: () => void, _onPracticeClick?: () => void): void {
        this.lessonRenderer.show(onSelect, _onProgressClick, _onPracticeClick);
    }

    showProgress(): void {
        this.statsRenderer.show();
    }

    showDictationSelect(onStart: (passage: any) => void): void {
        this.dictationRenderer.showSelect(onStart);
    }

    showShop(): void {
        this.shopRenderer.show();
    }

    hideAllTabs(): void {
        this.lessonRenderer.hideTabs();
        this.dictationRenderer.hideTabs();
    }

    showAllTabs(): void {
        this.lessonRenderer.showTabs();
        this.dictationRenderer.showTabs();
    }

    showDictationResult(score: number, total: number, onContinue: () => void): void {
        this.dictationRenderer.showResult(score, total, onContinue);
    }

    showLevelUp(level: number): void {
        this.gameRenderer.showLevelUp(level);
    }

    showSessionComplete(wordsCompleted: number, score: number, startTime: number, onRestart: () => void, onShare: () => void): void {
        this.gameRenderer.showSessionComplete(wordsCompleted, score, startTime, onRestart, onShare);
    }

    showFeedback(text: string, color: string): void {
        this.gameRenderer.showFeedback(text, color);
    }

    showNewAchievements(achievements: Achievement[]): void {
        this.gameRenderer.showNewAchievements(achievements);
    }

    showPracticeSelect(onStart: (lessons: number[]) => void): void {
        this.gameRenderer.showPracticeSelect(onStart);
    }

    showConfirm(title: string, message: string, onConfirm: () => void): void {
        this.gameRenderer.showConfirm(title, message, onConfirm);
    }

    showResumeDialog(
        sessionInfo: { title: string; progress: string; age: string },
        onResume: () => void,
        onStartNew: () => void
    ): void {
        this.gameRenderer.showResumeDialog(sessionInfo, onResume, onStartNew);
    }

    // --- Game Renderer (Shared) Methods that might need moving to GameRenderer later ---
    // For now, keep simple interactive UI methods here if they don't fit perfectly elsewhere,
    // or delegate if appropriate.

    renderProgressDots(_count: number): void {
        // Progress dots removed from footer - no longer displayed
    }

    updateProgressDot(_index: number, _status: ProgressDotStatus): void {
        // Progress dots removed from footer - no longer displayed
    }

    /**
     * Render header progress bar for spelling mode
     */
    renderSpellingProgress(currentIndex: number, total: number): void {
        let progressContainer = document.getElementById('spelling-header-progress');

        if (!progressContainer) {
            progressContainer = document.createElement('div');
            progressContainer.id = 'spelling-header-progress';
            progressContainer.className = 'dictation-header-progress'; // Reuse same styling

            // Insert after header
            const header = document.querySelector('.dashboard-header');
            if (header && header.parentElement) {
                header.parentElement.insertBefore(progressContainer, header.nextSibling);
            }
        }

        // Calculate progress percentage
        const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

        // Update progress bar with count indicator
        progressContainer.innerHTML = `
            <div class="progress-bar-wrapper">
                <div class="dictation-progress-fill" style="width: ${progress}%"></div>
                <div class="progress-count">${currentIndex + 1} / ${total}</div>
            </div>
        `;
    }

    /**
     * Remove spelling header progress bar
     */
    removeSpellingProgress(): void {
        const progressBar = document.getElementById('spelling-header-progress');
        if (progressBar) progressBar.remove();
    }

    /**
     * Show word list modal for current lesson
     */
    showWordListModal(words: Array<{ term: string; pinyin: string }>, currentIndex: number): void {
        console.log('showWordListModal called with:', words.length, 'words, currentIndex:', currentIndex);
        console.log('Sample words:', words.slice(0, 3));

        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.id = 'wordlist-modal';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.cssText = 'max-width: 500px; max-height: 80vh; overflow-y: auto; width: 90%; position: relative;';

        // Back button
        const backBtn = document.createElement('button');
        backBtn.className = 'modal-back-btn';
        backBtn.innerHTML = '←';
        backBtn.setAttribute('aria-label', '关闭');
        modalContent.appendChild(backBtn);

        // Title
        const title = document.createElement('h2');
        title.className = 'modal-title';
        title.textContent = `本课词语 (${currentIndex + 1}/${words.length})`;
        modalContent.appendChild(title);

        // Word list container
        const wordListContainer = document.createElement('div');
        wordListContainer.className = 'wordlist-container';

        words.forEach((word, idx) => {
            const item = document.createElement('div');
            item.className = `wordlist-item ${idx === currentIndex ? 'current' : idx < currentIndex ? 'completed' : ''}`;

            const number = document.createElement('span');
            number.className = 'wordlist-number';
            number.textContent = `${idx + 1}`;

            const term = document.createElement('span');
            term.className = 'wordlist-term';
            term.textContent = word.term || '???';

            const pinyin = document.createElement('span');
            pinyin.className = 'wordlist-pinyin';
            pinyin.textContent = word.pinyin || '';

            item.appendChild(number);
            item.appendChild(term);
            item.appendChild(pinyin);
            wordListContainer.appendChild(item);
        });

        modalContent.appendChild(wordListContainer);

        // Actions
        const actions = document.createElement('div');
        actions.className = 'modal-actions';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'action-btn-large';
        closeBtn.id = 'close-wordlist-btn';
        closeBtn.textContent = '关闭';

        actions.appendChild(closeBtn);
        modalContent.appendChild(actions);

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        console.log('Modal appended, checking DOM:', document.getElementById('wordlist-modal'));

        // Close button event handlers
        const closeModal = () => modal.remove();

        backBtn.addEventListener('click', closeModal);
        closeBtn?.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Scroll current word into view
        setTimeout(() => {
            const currentItem = modal.querySelector('.wordlist-item.current');
            if (currentItem) {
                currentItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }

    // --- Interaction Area ---

    getWritingArea(): HTMLElement | null {
        return this.domCache.writingArea;
    }

    clearWritingArea(): void {
        if (this.domCache.writingArea) {
            this.domCache.writingArea.innerHTML = '';
        }
    }

    showPinyin(pinyin: string): void {
        if (this.domCache.pinyinDisplay) {
            this.domCache.pinyinDisplay.textContent = pinyin;
            this.domCache.pinyinDisplay.style.opacity = '1';
        }
    }

    hidePinyin(): void {
        if (this.domCache.pinyinDisplay) {
            this.domCache.pinyinDisplay.style.opacity = '0';
        }
    }

    showNextButton(): void {
        if (this.domCache.nextBtn) {
            this.domCache.nextBtn.style.display = 'flex';
            this.domCache.nextBtn.classList.add('pulse');
        }
    }

    hideNextButton(): void {
        if (this.domCache.nextBtn) {
            this.domCache.nextBtn.style.display = 'none';
            this.domCache.nextBtn.classList.remove('pulse');
        }
    }

    resetFeedback(): void {
        if (this.domCache.feedbackOverlay) {
            this.domCache.feedbackOverlay.style.opacity = '0';
        }
    }

    showAchievements(): void {
        this.showFeedback('成就功能开发中...', '#3b82f6');
    }

    updateStatsDisplay(): void {
        this.updateDashboardStats();
    }

    displayGreeting(name: string): void {
        if (this.domCache.greetingEl) {
            this.domCache.greetingEl.textContent = `你好, ${name || '同学'}!`;
        }
    }

    showMenu(onResume: () => void, onRestart: () => void): void {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay show';
        overlay.innerHTML = `
            <div class="modal-content menu-card">
                <h2>游戏菜单</h2>
                <div class="menu-actions">
                    <button class="action-btn-primary" id="menu-resume">继续练习</button>
                    <button class="action-btn-secondary" id="menu-restart">重新开始</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('menu-resume')?.addEventListener('click', () => {
            overlay.remove();
            onResume();
        });

        document.getElementById('menu-restart')?.addEventListener('click', () => {
            overlay.remove();
            onRestart();
        });
    }

    /**
     * Cleanup UI renderers and event listeners
     */
    cleanupRenderers(): void {
        this.lessonRenderer.destroy();
        this.dictationRenderer.destroy();
    }

    private setupEventListeners(): void {
        const avatarEl = document.getElementById('player-avatar');
        if (avatarEl) {
            avatarEl.onclick = () => {
                AvatarSelector.show((posX, posY) => {
                    if (avatarEl) {
                        avatarEl.style.backgroundPosition = `${posX}% ${posY}%`;
                    }
                });
            };
        }
    }
}

/**
 * Get random praise message
 */
export function getRandomPraise(quality?: number, streak?: number): string {
    if (streak && streak >= 5) return '势不可挡! 🔥';
    if (quality === 5) return '完美! ✨';

    const praises = ['太棒了!', '非常好!', '真厉害!', '完美!', '继续加油!'];
    return praises[Math.floor(Math.random() * praises.length)];
}
