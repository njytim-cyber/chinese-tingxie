/**
 * UI Rendering Module
 * Facade that orchestrates UI rendering via specialized controllers
 */

import { DOMCache, initDOMCache, ProgressDotStatus, IUIManager, Achievement } from '../types';
import { LessonRenderer } from './renderers/LessonRenderer';
import { StatsRenderer } from './renderers/StatsRenderer';
import { DictationRenderer } from './renderers/DictationRenderer';
import { GameRenderer } from './renderers/GameRenderer';
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
    private gameRenderer: GameRenderer;
    private hudController: HUDController;

    constructor(domCache?: DOMCache) {
        this.domCache = domCache || initDOMCache();

        // Initialize sub-components
        this.hudController = new HUDController(this.domCache);
        this.lessonRenderer = new LessonRenderer(this);
        this.statsRenderer = new StatsRenderer(this);
        this.dictationRenderer = new DictationRenderer(this);
        this.gameRenderer = new GameRenderer(this);

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

        app.style.opacity = '0';

        setTimeout(() => {
            try {
                renderFn();
                this.updateCache();
            } catch (e) {
                console.error('Error rendering view during transition:', e);
            }

            // Always restore opacity even if render failed
            setTimeout(() => {
                app.style.opacity = '1';
                void app.offsetWidth;
            }, 50);
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

    toggleActiveGameUI(visible: boolean): void {
        if (visible) {
            this.gameRenderer.showGameView();
            this.updateCache(); // Refresh cache with new elements
        }
        this.hudController.toggleActiveGameUI(visible);
    }

    showControls(): void {
        this.gameRenderer.showGameView();
        this.updateCache();
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
        document.getElementById('btn-skip')?.addEventListener('click', () => game.skipLevel());
        document.getElementById('btn-grid')?.addEventListener('click', () => game.toggleGrid());
        document.getElementById('next-btn')?.addEventListener('click', () => game.nextLevel());
        // Header back button is persistent, no need to rebind usually, but good to check
        // document.getElementById('header-back-btn')?.addEventListener('click', () => game.handleBackNavigation());
    }

    // --- Renderer Delegation ---

    showLessonSelect(onSelect: (id: number, limit: number) => void, _onProgressClick?: () => void, _onPracticeClick?: () => void): void {
        this.lessonRenderer.show(onSelect, _onProgressClick, _onPracticeClick);
    }

    showProgress(): void {
        this.statsRenderer.show();
    }

    showDictationSelect(onStart: (passage: any) => void): void {
        this.dictationRenderer.showSelect(onStart);
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

    // --- Game Renderer (Shared) Methods that might need moving to GameRenderer later ---
    // For now, keep simple interactive UI methods here if they don't fit perfectly elsewhere,
    // or delegate if appropriate.

    renderProgressDots(count: number): void {
        const footer = this.domCache.footerProgress;
        if (!footer) return;

        footer.innerHTML = '';
        if (count > 0) {
            footer.style.display = 'flex';
            for (let i = 0; i < count; i++) {
                const dot = document.createElement('div');
                dot.className = 'progress-dot';
                dot.id = `dot-${i}`;
                footer.appendChild(dot);
            }
        } else {
            footer.style.display = 'none';
        }
    }

    updateProgressDot(index: number, status: ProgressDotStatus): void {
        const dot = document.getElementById(`dot-${index}`);
        if (dot) {
            dot.className = `progress-dot ${status}`;
            if (status === 'active') {
                dot.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
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
