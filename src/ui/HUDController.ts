/**
 * HUD Controller
 * Manages Headers, Footers, and HUD elements
 */

import { DOMCache } from '../types';
import { getStats } from '../data';

export class HUDController {
    private domCache: DOMCache;

    constructor(domCache: DOMCache) {
        this.domCache = domCache;
    }

    /**
     * Update the main app header title
     */
    updateHeaderTitle(title: string): void {
        const titleEl = document.getElementById('app-title');
        if (titleEl) titleEl.innerText = title;
    }

    /**
     * Toggle main header visibility
     */
    toggleMainHeader(visible: boolean): void {
        const header = document.getElementById('main-header');
        if (header) header.style.display = visible ? 'grid' : 'none';
    }

    /**
     * Toggle header back button visibility
     */
    toggleBackBtn(visible: boolean): void {
        const btn = document.getElementById('header-back-btn');
        if (btn) {
            btn.style.display = visible ? 'flex' : 'none';
            btn.style.opacity = visible ? '1' : '0';
            btn.style.pointerEvents = visible ? 'auto' : 'none';
        }
    }

    /**
     * Toggle header stats pill
     */
    toggleHeaderStats(visible: boolean): void {
        const stats = document.getElementById('header-stats');
        if (stats) stats.style.display = visible ? 'flex' : 'none';
    }

    /**
     * Update dashboard stats (Streak & Stars)
     */
    updateDashboardStats(): void {
        const stats = getStats();
        const headerStats = document.getElementById('header-stats');
        if (headerStats) {
            headerStats.innerHTML = `
                <span class="stat-pill">🔥 ${stats.dailyStreak}</span>
                <span class="stat-pill">⭐ ${stats.wordsLearned}</span>
            `;
        }
    }

    /**
     * Show/Hide active game elements
     */
    toggleActiveGameUI(visible: boolean): void {
        const writingCard = document.getElementById('writing-card');
        const bottomAction = document.querySelector('.bottom-action-area');
        const hud = document.querySelector('.hud');
        const toolbar = document.querySelector('.card-toolbar');

        if (writingCard) writingCard.classList.toggle('hidden', !visible);
        if (bottomAction) bottomAction.classList.toggle('hidden', !visible);
        if (hud) hud.classList.toggle('hidden', !visible);
        if (toolbar) toolbar.classList.toggle('hidden', !visible);

        const feedback = document.getElementById('feedback-overlay');
        if (feedback) feedback.classList.toggle('hidden', !visible);

        if (visible) {
            document.querySelector('.lesson-select')?.remove();
            document.querySelector('.dictation-lesson-select')?.remove();
            document.querySelector('.progress-view')?.remove();
        }
    }

    /**
     * Update HUD score and streak
     */
    updateHud(score: number, streak: number): void {
        if (this.domCache.scoreEl) this.domCache.scoreEl.textContent = score.toString();

        if (this.domCache.streakContainer) {
            if (streak > 0) {
                this.domCache.streakContainer.style.display = 'flex';
                if (this.domCache.streakCountEl) this.domCache.streakCountEl.textContent = streak.toString();

                if (streak >= 5 && this.domCache.streakBadge) {
                    this.domCache.streakBadge.style.display = 'block';
                }
            } else {
                this.domCache.streakContainer.style.display = 'none';
            }
        }
    }

    setHudTransparent(transparent: boolean): void {
        if (this.domCache.hud) {
            this.domCache.hud.classList.toggle('transparent', transparent);
        }
    }

    showControls(): void {
        if (this.domCache.controlsArea) this.domCache.controlsArea.style.display = 'flex';
        if (this.domCache.hud) this.domCache.hud.style.display = 'flex';
        this.toggleMainHeader(false); // Game mode usually hides main header
    }

    hideFooterProgress(): void {
        if (this.domCache.footerProgress) {
            this.domCache.footerProgress.style.display = 'none';
        }
    }
}
