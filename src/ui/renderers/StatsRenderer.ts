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
        this.manager.updateHeaderTitle('心织笔耕');
        this.manager.toggleMainHeader(true);
        this.manager.toggleBackBtn(false);
        this.manager.toggleHeaderStats(false);

        const content = document.createElement('div');
        content.className = 'progress-view';

        const title = document.createElement('h2');
        title.className = 'screen-title';
        title.innerText = '学习进度';
        content.appendChild(title);

        // 1. Hero Section (Level & Main Stats)
        const level = getLevel();
        const levelProgress = Math.min(100, getLevelProgress());
        const stats = getStats();

        const heroCard = document.createElement('div');
        heroCard.className = 'progress-hero-card';
        heroCard.innerHTML = `
            <div class="hero-header">
                <div class="hero-level-badge">Lv.${level}</div>
                <div class="hero-xp-text">${Math.floor(stats.totalXP)} XP / 下一级</div>
            </div>
            <div class="hero-xp-bar-container">
                <div class="hero-xp-bar">
                    <div class="hero-xp-fill" style="width: ${levelProgress}%"></div>
                </div>
            </div>
            <div class="hero-stats-grid">
                <div class="hero-stat-item">
                    <span class="hero-stat-val">🔥 ${stats.dailyStreak}</span>
                    <span class="hero-stat-label">连胜</span>
                </div>
                <div class="hero-stat-item">
                    <span class="hero-stat-val">⭐ ${stats.wordsLearned}</span>
                    <span class="hero-stat-label">已学</span>
                </div>
                <div class="hero-stat-item">
                    <span class="hero-stat-val">🏆 ${Math.floor(stats.totalXP / 100)}</span>
                    <span class="hero-stat-label">成就</span>
                </div>
            </div>
        `;
        content.appendChild(heroCard);

        // 2. Daily Summary Grid
        const summarySection = document.createElement('div');
        summarySection.className = 'section-header';
        summarySection.innerHTML = `<h3>今日概览</h3>`;
        content.appendChild(summarySection);

        const dailyDeck = document.createElement('div');
        dailyDeck.id = 'daily-summary-deck';
        dailyDeck.className = 'stats-grid-2'; // 2-column grid
        // Content rendered by helper
        content.appendChild(dailyDeck);

        // 3. Recent Activity List
        const activitySection = document.createElement('div');
        activitySection.className = 'section-header';
        activitySection.innerHTML = `<h3>最近活动</h3>`;
        content.appendChild(activitySection);

        const activityList = document.createElement('div');
        activityList.className = 'activity-list';
        activityList.innerHTML = this.renderActivityLogs();
        content.appendChild(activityList);

        this.manager.transitionView(() => {
            const app = document.querySelector('.game-stage');
            if (app) {
                // Remove existing list if any
                const existingList = app.querySelector('.lesson-select, .dictation-lesson-select, .progress-view');
                if (existingList) existingList.remove();

                this.manager.toggleActiveGameUI(false);
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

        return `
            <div class="stat-card card-effort">
                <div class="stat-icon">⏱️</div>
                <div class="stat-info">
                    <div class="stat-value">${minutes}<span class="unit">分</span></div>
                    <div class="stat-label">今日时长</div>
                </div>
            </div>
            <div class="stat-card card-count">
                <div class="stat-icon">📚</div>
                <div class="stat-info">
                    <div class="stat-value">${todayLogs.length}<span class="unit">次</span></div>
                    <div class="stat-label">完成练习</div>
                </div>
            </div>
            <div class="stat-card card-accuracy">
                <div class="stat-icon">🎯</div>
                <div class="stat-info">
                    <div class="stat-value">${accuracy}<span class="unit">%</span></div>
                    <div class="stat-label">准确率</div>
                </div>
            </div>
            <div class="stat-card card-words">
                <div class="stat-icon">✍️</div>
                <div class="stat-info">
                    <div class="stat-value">${totalWords}<span class="unit">字</span></div>
                    <div class="stat-label">复习字数</div>
                </div>
            </div>
        `;
    }

    /**
     * Update the daily summary view in place
     */
    updateDailySummaryView(): void {
        const deck = document.getElementById('daily-summary-deck');
        if (deck) {
            deck.innerHTML = this.renderDailySummaryHTML();
        }
    }

    /**
     * Setup handlers for daily summary card (swipe and click)
     */
    setupDailySummaryHandlers(): void {
        const deck = document.getElementById('daily-summary-deck');
        if (!deck) return;

        deck.onclick = () => {
            this.currentDailyStatsIndex = (this.currentDailyStatsIndex + 1) % 2;
            this.updateDailySummaryView();
        };
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
                        ${log.mode === 'dictation' ? '📝' : '✍️'}
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
}
