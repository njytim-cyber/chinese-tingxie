/**
 * HUD Controller
 * Manages Headers, Footers, and HUD elements
 */

import { DOMCache } from '../types';
import { getStats, getYuanbaoBalance } from '../data/manager';

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
     * Update dashboard stats (Streak, Yuanbao, Words Learned)
     */
    updateDashboardStats(): void {
        const stats = getStats();
        const yuanbao = getYuanbaoBalance();
        const headerStats = document.getElementById('header-stats');
        if (headerStats) {
            headerStats.innerHTML = `
                <span class="stat-pill">🔥 ${stats.dailyStreak}</span>
                <span class="stat-pill"><svg viewBox="0 0 24 24" width="22" height="22" style="vertical-align: middle; margin-right: 2px; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.2));"><defs><linearGradient id="y-body-3" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#B45309"/><stop offset="50%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#B45309"/></linearGradient><linearGradient id="y-top-3" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#FEF3C7"/><stop offset="100%" stop-color="#F59E0B"/></linearGradient></defs><path d="M7,11.5 A5,4 0 0,1 17,11.5" fill="url(#y-top-3)"/><path d="M2,11.5 Q12,14.5 22,11.5 Q21,19.5 12,19.5 Q3,19.5 2,11.5 Z" fill="url(#y-body-3)"/></svg> ${yuanbao}</span>
                <span class="stat-pill">📚 ${stats.wordsLearned}</span>
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
        // HUD still used for stats?
        if (this.domCache.hud) this.domCache.hud.style.display = 'flex';

        // Ensure standard header is visible for Back Button & Title
        this.toggleMainHeader(true);
        this.toggleBackBtn(true);
    }

    hideFooterProgress(): void {
        if (this.domCache.footerProgress) {
            this.domCache.footerProgress.style.display = 'none';
        }
    }

    /**
     * Show/Hide player avatar
     */
    toggleAvatar(visible: boolean): void {
        const avatar = document.getElementById('player-avatar');
        if (avatar) {
            avatar.style.display = visible ? 'block' : 'none';
        }
    }

    /**
     * Toggle between session stats and global stats in header
     */
    showSessionStats(visible: boolean): void {
        const sessionStats = document.getElementById('session-stats');
        const globalStats = document.getElementById('header-stats');

        if (sessionStats) {
            sessionStats.style.display = visible ? 'flex' : 'none';
        }
        if (globalStats) {
            globalStats.style.display = visible ? 'none' : 'flex';
        }
    }
}
