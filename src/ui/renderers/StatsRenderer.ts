import { UIManager } from '../UIManager';
import { getStats, getAttemptLogs, getLevel, getLevelProgress } from '../../data';

/**
 * Renders the stats, progress, and daily summary screens
 */
export class StatsRenderer {
    private manager: UIManager;
    private currentDailyStatsIndex = 0;

    constructor(manager: UIManager) {
        this.manager = manager;
    }

    /**
     * Show progress view with Tabs (Progress & Achievements)
     */
    show(): void {
        this.manager.updateHeaderTitle('学习进度');
        this.manager.toggleMainHeader(true);
        this.manager.toggleBackBtn(false);
        this.manager.toggleHeaderStats(false);

        const content = document.createElement('div');
        content.className = 'progress-view';

        // Title removed as it's now in the header


        // 1. Consolidated Hero Card
        const level = getLevel();
        const levelProgress = Math.min(100, getLevelProgress());
        const stats = getStats();

        const heroCard = document.createElement('div');
        heroCard.className = 'progress-hero-card';
        heroCard.innerHTML = `
            <div class="hero-header">
                <div class="hero-level-stamp">Lv.${level}</div>
                <div class="hero-overall-meta">
                    已学 ${stats.wordsLearned} 字 · 成就 ${Math.floor(stats.totalXP / 100)}
                </div>
            </div>
            
            <div class="hero-main">
                <div class="hero-streak">
                    <span class="hero-streak-num">${stats.dailyStreak}</span>
                    <span class="hero-streak-text">天连胜 <span class="stat-emoji">🔥</span></span>
                </div>
                <div class="hero-xp-info">
                    ${Math.floor(stats.totalXP)} XP
                </div>
            </div>

            <div class="hero-xp-bar-container">
                <div class="hero-xp-bar">
                    <div class="hero-xp-fill" style="width: ${levelProgress}%"></div>
                </div>
            </div>

            <div class="hero-divider"></div>

            <div id="daily-summary-footer" class="hero-daily-footer">
                <!-- Populated by updateDailySummaryView -->
            </div>
        `;
        content.appendChild(heroCard);

        // 3. Recent Activity List
        const activitySection = document.createElement('div');
        activitySection.className = 'section-header';
        activitySection.innerHTML = `<h3>最近活动</h3>`;
        content.appendChild(activitySection);

        const activityList = document.createElement('div');
        activityList.className = 'activity-list';
        activityList.innerHTML = this.renderActivityLogs();
        content.appendChild(activityList);

        // 4. Character Mastery Section (New)
        const charSection = document.createElement('div');
        charSection.className = 'section-header';
        charSection.innerHTML = `<h3>汉字精通</h3>`;
        content.appendChild(charSection);

        const charGrid = document.createElement('div');
        charGrid.className = 'char-mastery-grid';
        charGrid.innerHTML = this.renderCharacterMastery();
        content.appendChild(charGrid);



        this.manager.transitionView(() => {
            const app = document.querySelector('.game-stage');
            if (app) {
                // Clear all game UI and content to prevent overlap
                this.manager.toggleActiveGameUI(false);

                // Completely clear game stage to ensure no leftover content from dictation mode
                app.innerHTML = '';

                // Clear footer progress bar from dictation mode
                const footerProgress = document.getElementById('footer-progress');
                if (footerProgress) {
                    footerProgress.innerHTML = '';
                    footerProgress.style.display = 'none';
                }

                app.appendChild(content);
            }

            // Render initial daily summary
            this.updateDailySummaryView();
            // Swipe handlers not needed for grid
            // this.setupDailySummaryHandlers(); 

            // Update footer
            document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
            document.getElementById('review-btn')?.classList.add('active');
        });
    }

    /**
     * Render daily summary card HTML
     */
    renderDailySummaryHTML(): string {
        const logs = getAttemptLogs();
        const todayStr = new Date().toISOString().split('T')[0];

        // Filter logs for today
        const todayLogs = logs.filter(log => log.timestamp.startsWith(todayStr));

        const timeSpent = todayLogs.reduce((acc, log) => acc + (log.duration || 0), 0);
        const minutes = Math.floor(timeSpent / 60);

        let totalWords = 0;
        let correctWords = 0;
        todayLogs.forEach(log => {
            totalWords += log.totalPhrases;
            correctWords += log.phrases.filter(p => p.correct).length;
        });
        const accuracy = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;

        if (todayLogs.length === 0) {
            return `开始第一课以查看今日统计！`;
        }
        return `今日: ${minutes}分 · ${accuracy}% 准确率 · ${totalWords}字`;
    }

    /**
     * Update the daily summary view in place
     */
    updateDailySummaryView(): void {
        const footer = document.getElementById('daily-summary-footer');
        if (footer) {
            footer.innerHTML = this.renderDailySummaryHTML();
        }
    }



    /**
     * Render activity logs
     */
    renderActivityLogs(): string {
        const logs = getAttemptLogs();
        if (logs.length === 0) {
            return `<div class="empty-state">还没有练习记录，快去开始吧！</div>`;
        }

        // Show last 5 logs
        return logs.slice(0, 5).map(log => {
            const date = new Date(log.timestamp);
            const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="activity-item">
                    <div class="activity-icon ${log.mode === 'dictation' ? 'icon-dictation' : 'icon-spelling'}">
                        <span class="stat-emoji">${log.mode === 'dictation' ? '📝' : '✍️'}</span>
                    </div>
                    <div class="activity-info">
                        <div class="activity-title">${log.lessonTitle}</div>
                        <div class="activity-time">${timeStr} · ${log.mode === 'dictation' ? '默写' : '听写'}</div>
                    </div>
                    <div class="activity-score ${log.totalScore >= 80 ? 'good' : ''}">
                        ${Math.round(log.totalScore)}%
                    </div>
                </div>
            `;
        }).join('');
    }

    private renderCharacterMastery(): string {
        const stats = getStats();
        const mastery = stats.charsMastery || {};
        const chars = Object.values(mastery).sort((a, b) => b.level - a.level || a.char.localeCompare(b.char));

        if (chars.length === 0) {
            return '';
        }

        // Convert level to visual dots (max 5 levels)
        const levelToDots = (level: number): string => {
            const maxDots = 5;
            const filled = Math.min(level, maxDots);
            return Array(maxDots).fill(0).map((_, i) => i < filled ? '●' : '○').join('');
        };

        return chars.map(c => `
            <div class="char-mastery-item level-${c.level}">
                <div class="char-mastery-seal">${c.char}</div>
                <div class="char-mastery-level">${levelToDots(c.level)}</div>
            </div>
        `).join('');
    }
}
