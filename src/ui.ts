/**
 * UI Rendering Module
 * Handles all UI rendering and display logic for the game
 */

import { SoundFX } from './audio';
import { spawnParticles } from './particles';
import {
    getLessons, getCurrentLesson, getLessonProgress, getWordState,
    getStats, getLevel, getLevelProgress, getAchievements,
    type Achievement
} from './data';
import type { DOMCache, ProgressDotStatus } from './types';

/**
 * UI Manager class - handles all UI rendering
 */
export class UIManager {
    private domCache: DOMCache;

    constructor(domCache: DOMCache) {
        this.domCache = domCache;
    }

    /**
     * Update DOM cache (call after major view changes)
     */
    updateCache(cache: DOMCache): void {
        this.domCache = cache;
    }

    /**
     * Show lesson selection screen
     */
    showLessonSelect(
        onLessonSelect: (lessonId: number, wordLimit: number) => void,
        onProgressClick?: () => void,
        onPracticeClick?: () => void,
        currentMode?: 'stroke' | 'handwriting',
        onModeChange?: (mode: 'stroke' | 'handwriting') => void
    ): void {
        const container = this.domCache.writingArea;
        if (!container) return;

        const lessons = getLessons();
        const currentLesson = getCurrentLesson();
        const mode = currentMode || 'stroke';

        container.innerHTML = `
            <div class="lesson-select">
                <h2 class="lesson-select-title">选择课程</h2>

                <!-- Input Mode Toggle Removed (Default to Handwriting) -->
                
                <div class="session-length-toggle">
                    <span class="toggle-label">每次练习:</span>
                    <button class="toggle-btn ${selectedLimit === 5 ? 'active' : ''}" data-limit="5">5词</button>
                    <button class="toggle-btn ${selectedLimit === 10 ? 'active' : ''}" data-limit="10">10词</button>
                    <button class="toggle-btn ${selectedLimit === 20 ? 'active' : ''}" data-limit="20">全部</button>
                </div>

                <div class="lesson-grid">
                    ${lessons.map(lesson => {
            const progress = getLessonProgress(lesson.id);
            const progressPercent = Math.round(progress * 100);
            const isActive = lesson.id === currentLesson.id;
            return `
                            <div class="lesson-card ${isActive ? 'active' : ''}" data-lesson-id="${lesson.id}">
                                <div class="lesson-progress-ring">
                                    <svg viewBox="0 0 36 36">
                                        <path class="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                                        <path class="ring-fill" stroke-dasharray="${progressPercent}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                                    </svg>
                                    <span class="lesson-number">${lesson.id}</span>
                                </div>
                                <div class="lesson-info">
                                    <div class="lesson-title">${lesson.title}</div>
                                    <div class="lesson-meta">${lesson.phrases.length} 词语 · ${progressPercent}%</div>
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>
                <div class="lesson-select-actions" style="display: none;">
                </div>
            </div>
        `;

        let selectedLimit = 5;

        // Mode toggle buttons (Removed)
        // if (onModeChange) { ... }

        // Toggle Buttons Logic
        container.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedLimit = parseInt((btn as HTMLElement).dataset.limit || '0'); // Changed data-count to data-limit
            });
        });

        // Lesson Card Click
        container.querySelectorAll('.lesson-card').forEach(card => {
            card.addEventListener('click', () => {
                const lessonId = parseInt((card as HTMLElement).dataset.lessonId || '1');
                onLessonSelect(lessonId, selectedLimit);
            });
        });

        // Optional button handlers
        const progressBtn = document.getElementById('view-progress-btn');
        if (progressBtn && onProgressClick) {
            progressBtn.addEventListener('click', onProgressClick);
        }

        const practiceBtn = document.getElementById('practice-mode-btn');
        if (practiceBtn && onPracticeClick) {
            practiceBtn.addEventListener('click', onPracticeClick);
        }

        this.hideControls();
        this.setHudTransparent(true);
        document.body.classList.remove('noscroll'); // Enable scrolling
    }

    /**
     * Show progress view with Tabs (Progress & Achievements)
     */
    showProgress(): void {
        const container = this.domCache.writingArea;
        if (!container) return;

        const lessons = getLessons();
        const achievements = getAchievements();

        // Mastery colors for progress list
        const masteryLabels = ['未学', '入门', '熟悉', '掌握', '精通', '完美'];
        const masteryColors = ['#64748b', '#ef4444', '#f97316', '#eab308', '#22c55e', '#38bdf8'];

        this.setHudTransparent(true);
        if (this.domCache.hudControls) this.domCache.hudControls.style.display = 'none';

        // --- Render the main structure ---
        container.innerHTML = `
            <div class="progress-view">
                <div class="progress-header">
                    <button class="menu-btn nav-back-btn" onclick="location.reload()">❮ 返回</button>
                    <h2 class="progress-title">档案</h2>
                </div>

                <div class="progress-tabs">
                    <button class="tab-btn active" data-tab="progress">📊 学习进度</button>
                    <button class="tab-btn" data-tab="achievements">🏆 成就徽章</button>
                </div>

                <!-- Tab Content: Progress -->
                <div class="tab-content active" id="tab-progress">
                    ${this.renderProgressSummary(lessons)}
                    <div class="progress-lessons">
                        ${lessons.map(lesson => {
            const progress = getLessonProgress(lesson.id);
            const progressPercent = Math.round(progress * 100);
            return `
                                <div class="progress-lesson">
                                    <div class="progress-lesson-header" data-lesson-id="${lesson.id}">
                                        <span class="progress-lesson-title">${lesson.title}</span>
                                        <span class="progress-lesson-percent">${progressPercent}%</span>
                                    </div>
                                    <div class="progress-phrases" id="phrases-${lesson.id}" style="display: none;">
                                        ${lesson.phrases.map(phrase => {
                const state = getWordState(phrase.term);
                const score = state.score;
                return `
                                                <div class="progress-phrase">
                                                    <span class="phrase-term">${phrase.term}</span>
                                                    <span class="phrase-mastery" style="background: ${masteryColors[score]}">${masteryLabels[score]}</span>
                                                </div>
                                            `;
            }).join('')}
                                    </div>
                                </div>
                            `;
        }).join('')}
                    </div>
                </div>

                <!-- Tab Content: Achievements -->
                <div class="tab-content" id="tab-achievements" style="display: none;">
                    <div class="achievements-grid">
                        ${achievements.map(a => `
                            <div class="achievement-item ${a.unlocked ? 'unlocked' : 'locked'}">
                                <span class="ach-icon">${a.unlocked ? a.icon : '🔒'}</span>
                                <span class="ach-name">${a.unlocked ? a.name : '???'}</span>
                                ${a.unlocked ? `<span class="ach-desc">${a.desc}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    <div class="ach-summary" style="text-align: center; margin-top: 20px; color: #94a3b8;">
                        已解锁 ${achievements.filter(a => a.unlocked).length} / ${achievements.length} 个成就
                    </div>
                </div>
            </div>
        `;

        // --- Logic: Tab Switching ---
        const tabs = container.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class
                container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                container.querySelectorAll('.tab-content').forEach(c => (c as HTMLElement).style.display = 'none');

                // Add active class
                tab.classList.add('active');
                const tabId = `tab-${(tab as HTMLElement).dataset.tab}`;
                const content = document.getElementById(tabId);
                if (content) {
                    content.style.display = 'block';
                    // Trigger animation
                    content.style.opacity = '0';
                    content.style.transform = 'translateY(10px)';
                    setTimeout(() => {
                        content.style.transition = 'all 0.3s ease';
                        content.style.opacity = '1';
                        content.style.transform = 'translateY(0)';
                    }, 50);
                }
            });
        });

        // Toggle phrase visibility
        container.querySelectorAll('.progress-lesson-header').forEach(header => {
            header.addEventListener('click', () => {
                const lessonId = (header as HTMLElement).dataset.lessonId;
                const phrasesEl = document.getElementById(`phrases-${lessonId}`);
                if (phrasesEl) {
                    phrasesEl.style.display = phrasesEl.style.display === 'none' ? 'block' : 'none';
                }
            });
        });

        this.hideControls();
        document.body.classList.remove('noscroll');
    }

    /**
     * Generate HTML for progress summary
     */
    private renderProgressSummary(lessons: ReturnType<typeof getLessons>): string {
        let totalWords = 0;
        let masteredWords = 0; // Score >= 4
        let startedWords = 0; // Score > 0
        let totalScore = 0;
        let maxTotalScore = 0;

        lessons.forEach(lesson => {
            lesson.phrases.forEach(phrase => {
                totalWords++;
                const state = getWordState(phrase.term);
                maxTotalScore += 5;
                totalScore += state.score;

                if (state.score > 0) startedWords++;
                if (state.score >= 4) masteredWords++; // 4=Good, 5=Perfect
            });
        });

        const overallProgress = totalWords > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;
        const masteredPercent = totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;

        return `
            <div class="progress-summary-card">
                <div class="summary-row">
                    <div class="summary-stat">
                        <span class="stat-value highlight">${overallProgress}%</span>
                        <span class="stat-label">总掌握度</span>
                    </div>
                    <div class="summary-stat">
                        <span class="stat-value">${masteredWords} / ${totalWords}</span>
                        <span class="stat-label">精通词汇</span>
                    </div>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-fill" style="width: ${overallProgress}%"></div>
                </div>
                <div class="summary-details">
                    <span>已学习: ${startedWords} 词</span>
                    <span>待解锁: ${totalWords - startedWords} 词</span>
                </div>
            </div>
        `;
    }

    /**
     * Show practice selection screen
     */
    showPracticeSelect(
        onStartPractice: (selectedLessons: number[]) => void
    ): void {
        const container = this.domCache.writingArea;
        if (!container) return;

        const lessons = getLessons();

        this.setHudTransparent(true);

        container.innerHTML = `
            <div class="practice-select">
                <h2 class="practice-select-title">📝 选择练习章节</h2>
                <p class="practice-select-desc">选择要复习的课程（只练习未掌握的词语）</p>
                <div class="practice-lesson-grid">
                    ${lessons.map(lesson => {
            const unmasteredCount = lesson.phrases.filter(p => getWordState(p.term).score < 5).length;
            return `
                            <label class="practice-lesson-item ${unmasteredCount === 0 ? 'all-mastered' : ''}">
                                <input type="checkbox" value="${lesson.id}" ${unmasteredCount === 0 ? 'disabled' : ''}>
                                <span class="practice-lesson-name">${lesson.title.split(':')[0]}</span>
                                <span class="practice-lesson-count">${unmasteredCount > 0 ? `${unmasteredCount}词` : '✓'}</span>
                            </label>
                        `;
        }).join('')}
                </div>
                <div class="practice-actions">
                    <button class="game-btn" id="select-all-lessons">全选</button>
                    <button class="game-btn review-start-btn" id="start-practice-btn" disabled>开始复习 (0)</button>
                </div>
            </div>
        `;

        if (this.domCache.hudControls) this.domCache.hudControls.style.display = 'none';

        // Select all button
        const selectAllBtn = document.getElementById('select-all-lessons');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                container.querySelectorAll('input[type="checkbox"]:not(:disabled)').forEach(cb => {
                    (cb as HTMLInputElement).checked = true;
                });
            });
        }

        // Start practice button
        const startBtn = document.getElementById('start-practice-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                const selected: number[] = [];
                container.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                    selected.push(parseInt((cb as HTMLInputElement).value));
                });
                if (selected.length === 0) {
                    this.showFeedback('请至少选择一课', '#ef4444');
                    return;
                }
                onStartPractice(selected);
            });
        }

        this.hideControls();
        document.body.classList.remove('noscroll');
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
        const container = this.domCache.writingArea;
        if (!container) return;

        const stats = getStats();
        const sessionTime = Math.round((Date.now() - sessionStartTime) / 1000);
        const minutes = Math.floor(sessionTime / 60);
        const seconds = sessionTime % 60;

        container.innerHTML = '';

        const sessionDiv = document.createElement('div');
        sessionDiv.className = 'session-complete';

        sessionDiv.innerHTML = `
            <h2>🎉 练习完成!</h2>
            
            <div class="session-stats">
                <div class="stat-item">
                    <span class="stat-value">${wordsCompleted}</span>
                    <span class="stat-label">词语</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${score}</span>
                    <span class="stat-label">经验</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${minutes}:${seconds.toString().padStart(2, '0')}</span>
                    <span class="stat-label">时间</span>
                </div>
            </div>
            
            <div class="streak-display ${stats.dailyStreak >= 3 ? 'on-fire' : ''}">
                <span class="streak-icon">🔥</span>
                <span class="streak-count">${stats.dailyStreak}</span>
                <span class="streak-label">连胜</span>
            </div>
        `;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'session-actions';

        const reloadBtn = document.createElement('button');
        reloadBtn.className = 'game-btn restart-btn';
        reloadBtn.innerText = '🔄 再练一次';
        reloadBtn.onclick = onRestart;

        const shareBtn = document.createElement('button');
        shareBtn.className = 'game-btn share-btn';
        shareBtn.style.background = 'linear-gradient(to bottom, #8b5cf6, #7c3aed)';
        shareBtn.style.borderColor = '#6d28d9';
        shareBtn.innerHTML = '📤 分享成绩';
        shareBtn.onclick = onShare;

        actionsDiv.appendChild(reloadBtn);
        actionsDiv.appendChild(shareBtn);
        sessionDiv.appendChild(actionsDiv);

        container.appendChild(sessionDiv);

        this.hideControls();

        SoundFX.levelUp();
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                spawnParticles(
                    Math.random() * window.innerWidth,
                    Math.random() * window.innerHeight
                );
            }, i * 150);
        }
        document.body.classList.remove('noscroll');
    }

    /**
     * Show level up animation
     */
    showLevelUp(level: number): void {
        SoundFX.levelUp();

        const overlay = document.createElement('div');
        overlay.className = 'level-up-overlay';
        overlay.innerHTML = `
            <div class="level-up-content">
                <div class="level-up-icon">🎉</div>
                <div class="level-up-text">升级!</div>
                <div class="level-up-level">第 ${level} 级</div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Big confetti burst!
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                spawnParticles(
                    window.innerWidth / 2 + (Math.random() - 0.5) * 400,
                    window.innerHeight / 2 + (Math.random() - 0.5) * 300
                );
            }, i * 80);
        }

        setTimeout(() => overlay.remove(), 2500);
        document.body.classList.remove('noscroll');
    }

    /**
     * Show new achievements
     */
    showNewAchievements(achievements: Achievement[]): void {
        if (!achievements || achievements.length === 0) return;

        achievements.forEach((ach, i) => {
            setTimeout(() => {
                const toast = document.createElement('div');
                toast.className = 'achievement-toast';
                toast.innerHTML = `
                    <div class="achievement-icon">${ach.icon}</div>
                    <div class="achievement-info">
                        <div class="achievement-title">🏅 ${ach.name}</div>
                        <div class="achievement-desc">${ach.desc}</div>
                    </div>
                `;
                document.body.appendChild(toast);

                SoundFX.success();

                setTimeout(() => {
                    toast.classList.add('fade-out');
                    setTimeout(() => toast.remove(), 500);
                }, 3000);
            }, i * 1500);
        });
    }

    /**
     * Show achievements panel
     */
    showAchievements(): void {
        const achievements = getAchievements();
        const overlay = document.createElement('div');
        overlay.className = 'achievements-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        const unlocked = achievements.filter(a => a.unlocked);
        const locked = achievements.filter(a => !a.unlocked);

        overlay.innerHTML = `
            <div class="achievements-panel">
                <div class="ach-header">
                     <button class="nav-back-btn" onclick="this.closest('.achievements-overlay').remove()">❮</button>
                     <h2>🏆 成就</h2>
                     <div style="width: 30px;"></div>
                </div>
                <div class="achievements-grid">
                    ${unlocked.map(a => `
                        <div class="achievement-item unlocked">
                            <span class="ach-icon">${a.icon}</span>
                            <span class="ach-name">${a.name}</span>
                        </div>
                    `).join('')}
                    ${locked.map(() => `
                        <div class="achievement-item locked">
                            <span class="ach-icon">🔒</span>
                            <span class="ach-name">???</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.classList.remove('noscroll');
    }

    /**
     * Show menu/pause overlay
     */
    showMenu(onResume: () => void, onAchievements: () => void, onMainMenu: () => void): void {
        const overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        const panel = document.createElement('div');
        panel.className = 'menu-panel';

        const title = document.createElement('h2');
        title.innerText = '暂停';
        panel.appendChild(title);

        const buttons = document.createElement('div');
        buttons.className = 'menu-buttons';

        const resumeBtn = document.createElement('button');
        resumeBtn.className = 'game-btn';
        resumeBtn.innerText = '▶ 继续';
        resumeBtn.onclick = () => { overlay.remove(); onResume(); };
        buttons.appendChild(resumeBtn);

        // Achievements button removed as per request (moved to Progress screen)

        const menuBtn = document.createElement('button');
        menuBtn.className = 'game-btn';
        menuBtn.style.background = 'linear-gradient(to bottom, #ef4444, #dc2626)';
        menuBtn.style.borderColor = '#b91c1c';
        menuBtn.innerText = '🏠 返回主菜单';
        menuBtn.onclick = () => { overlay.remove(); onMainMenu(); };
        buttons.appendChild(menuBtn);

        panel.appendChild(buttons);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
    }

    /**
     * Show feedback overlay
     */
    showFeedback(text: string, color: string): void {
        const el = this.domCache.feedbackOverlay;
        if (!el) return;
        el.innerText = text;
        el.style.color = color;
        el.style.opacity = '1';
        el.style.animation = 'none';
        void (el as HTMLElement).offsetHeight;
        el.style.animation = 'pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }

    /**
     * Render the footer progress dots
     */
    renderProgressDots(count: number): void {
        const container = this.domCache.footerProgress;
        if (!container) return;
        container.innerHTML = '';
        container.style.display = 'flex';

        for (let i = 0; i < count; i++) {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            dot.id = `dot-${i}`;
            container.appendChild(dot);
        }
    }

    /**
     * Update a specific progress dot
     */
    updateProgressDot(index: number, status: ProgressDotStatus): void {
        const dot = document.getElementById(`dot-${index}`);
        if (!dot) return;

        if (status === 'correct' || status === 'wrong') {
            dot.classList.remove('active');
        }
        dot.classList.add(status);
    }

    /**
     * Update stats display in HUD
     */
    updateStatsDisplay(): void {
        const stats = getStats();

        if (this.domCache.dailyStreak && this.domCache.streakContainer) {
            this.domCache.dailyStreak.textContent = String(stats.dailyStreak);

            if (stats.dailyStreak >= 2) {
                this.domCache.streakContainer.style.display = 'flex';
                if (stats.dailyStreak >= 3) {
                    this.domCache.streakContainer.classList.add('on-fire');
                }
            } else {
                this.domCache.streakContainer.style.display = 'none';
            }
        }

        if (this.domCache.xpFill) {
            this.domCache.xpFill.style.width = `${getLevelProgress() * 100}%`;
        }
        if (this.domCache.xpText) {
            this.domCache.xpText.textContent = `${stats.totalXP} 经验`;
        }
    }

    /**
     * Display personalized greeting with level
     */
    displayGreeting(playerName: string): void {
        const level = getLevel();
        if (this.domCache.greetingEl) {
            const nameDisplay = playerName ? `👋 ${playerName}` : '👋';
            this.domCache.greetingEl.innerHTML = `${nameDisplay} <span class="level-badge">Lv.${level}</span>`;
        }
    }

    /**
     * Update HUD display
     */
    updateHud(score: number, sessionStreak: number): void {
        if (this.domCache.scoreEl) {
            this.domCache.scoreEl.innerText = String(score);
        }

        if (this.domCache.streakCountEl) {
            this.domCache.streakCountEl.innerText = String(sessionStreak);
        }

        if (this.domCache.streakBadge) {
            if (sessionStreak >= 2) {
                this.domCache.streakBadge.style.display = 'flex';
                if (sessionStreak >= 3) {
                    this.domCache.streakBadge.classList.add('active');
                }
            } else {
                this.domCache.streakBadge.style.display = 'none';
                this.domCache.streakBadge.classList.remove('active');
            }
        }
    }

    /**
     * Show pinyin for current word
     */
    showPinyin(pinyin: string): void {
        if (this.domCache.pinyinDisplay) {
            this.domCache.pinyinDisplay.textContent = pinyin;
            this.domCache.pinyinDisplay.classList.add('visible');
        }

        document.querySelectorAll('.char-pinyin-label').forEach(label => {
            label.classList.add('visible');
        });
    }

    /**
     * Hide pinyin display
     */
    hidePinyin(): void {
        if (this.domCache.pinyinDisplay) {
            this.domCache.pinyinDisplay.textContent = '';
            this.domCache.pinyinDisplay.classList.remove('visible');
        }
    }

    /**
     * Show next button
     */
    showNextButton(): void {
        if (this.domCache.nextBtn) {
            this.domCache.nextBtn.style.display = 'flex';
        }
    }

    /**
     * Hide next button
     */
    hideNextButton(): void {
        if (this.domCache.nextBtn) {
            this.domCache.nextBtn.style.display = 'none';
        }
    }

    /**
     * Reset feedback overlay
     */
    resetFeedback(): void {
        if (this.domCache.feedbackOverlay) {
            this.domCache.feedbackOverlay.style.opacity = '0';
        }
    }

    /**
     * Show game controls
     */
    showControls(): void {
        document.body.classList.add('noscroll'); // Disable scrolling in game
        if (this.domCache.controlsArea) {
            this.domCache.controlsArea.style.display = 'flex';
        }
        if (this.domCache.hudControls) {
            this.domCache.hudControls.style.display = 'flex';
        }
    }

    /**
     * Hide game controls and clear game-specific UI elements
     */
    hideControls(): void {
        if (this.domCache.controlsArea) {
            this.domCache.controlsArea.style.display = 'none';
        }
        if (this.domCache.hudControls) {
            this.domCache.hudControls.style.display = 'none';
        }

        // Clear pinyin display
        if (this.domCache.pinyinDisplay) {
            this.domCache.pinyinDisplay.textContent = '';
            this.domCache.pinyinDisplay.classList.remove('visible');
        }
        document.querySelectorAll('.char-pinyin-label').forEach(label => {
            label.classList.remove('visible');
        });

        // Clear feedback overlay
        if (this.domCache.feedbackOverlay) {
            this.domCache.feedbackOverlay.style.opacity = '0';
            this.domCache.feedbackOverlay.innerText = '';
        }
    }

    /**
     * Set HUD transparency mode
     */
    setHudTransparent(transparent: boolean): void {
        if (this.domCache.hud) {
            this.domCache.hud.style.display = 'flex';
            if (transparent) {
                this.domCache.hud.classList.add('transparent');
            } else {
                this.domCache.hud.classList.remove('transparent');
            }
        }
    }

    /**
     * Hide footer progress
     */
    hideFooterProgress(): void {
        if (this.domCache.footerProgress) {
            this.domCache.footerProgress.style.display = 'none';
        }
    }

    /**
     * Clear writing area
     */
    clearWritingArea(): void {
        if (this.domCache.writingArea) {
            this.domCache.writingArea.innerHTML = '';
        }
    }

    /**
     * Get writing area container
     */
    getWritingArea(): HTMLElement | null {
        return this.domCache.writingArea;
    }

    /**
     * Show dictation passage selection
     */
    showDictationSelect(
        onPassageSelect: (passage: { id: string; title: string; text: string; blanks: number[]; hint?: string }) => void
    ): void {
        document.body.classList.remove('noscroll');
        // Hide any existing overlays
        this.setHudTransparent(true);
        this.clearWritingArea();

        const writingArea = this.domCache.writingArea;
        if (!writingArea) return;

        writingArea.innerHTML = `
            <div class="lesson-select">
                <div class="progress-header">
                    <button class="menu-btn nav-back-btn" onclick="location.reload()">❮ 返回</button>
                    <h2 class="lesson-select-title" style="margin: 0;">默写练习</h2>
                </div>
                <!-- <h2 class="lesson-select-title">默写练习</h2> -->
                <div class="lesson-grid" id="dictation-grid">
                    <p style="color: #64748b; grid-column: 1/-1; text-align: center;">加载中...</p>
                </div>
            </div>
        `;

        // Load passages
        fetch('/dictation.json')
            .then(res => res.json())
            .then(data => {
                const grid = document.getElementById('dictation-grid');
                if (!grid) return;

                grid.innerHTML = '';
                data.passages.forEach((passage: { id: string; title: string; text: string; blanks: number[]; hint?: string }, index: number) => {
                    const item = document.createElement('div');
                    item.className = 'lesson-card';

                    // Use a generic icon instead of progress ring for now
                    const iconHtml = `
                        <div class="lesson-progress-ring" style="background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                            📝
                        </div>
                    `;

                    item.innerHTML = `
                        ${iconHtml}
                        <div class="lesson-info">
                            <div class="lesson-title">${passage.title}</div>
                            <div class="lesson-meta">${passage.blanks.length} 个填空</div>
                        </div>
                    `;

                    item.addEventListener('click', () => onPassageSelect(passage));
                    grid.appendChild(item);
                });
            })
            .catch(err => {
                console.error('Failed to load dictation passages:', err);
                const grid = document.getElementById('dictation-grid');
                if (grid) grid.innerHTML = '<p style="color: #ef4444; text-align: center; grid-column: 1/-1;">加载失败</p>';
            });
    }

    /**
     * Show dictation result
     */
    showDictationResult(score: number, total: number, onContinue: () => void): void {
        const percentage = Math.round((score / total) * 100);
        const isGood = percentage >= 70;

        const overlay = document.createElement('div');
        overlay.className = 'feedback-overlay';
        overlay.style.opacity = '1'; // Ensure visible

        const content = document.createElement('div');
        content.className = 'session-complete';
        content.innerHTML = `
            <h2 style="color: ${isGood ? 'var(--success)' : 'var(--danger)'}">
                ${isGood ? '🎉 太棒了!' : '😅 继续加油!'}
            </h2>
            <div class="session-stats">
                <div class="stat-item">
                    <span class="stat-value">${score}/${total}</span>
                    <span class="stat-label">总分</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${percentage}%</span>
                    <span class="stat-label">准确率</span>
                </div>
            </div>
        `;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'session-actions';

        const continueBtn = document.createElement('button');
        continueBtn.className = 'start-btn';
        continueBtn.textContent = '继续';
        continueBtn.onclick = () => {
            overlay.remove();
            onContinue();
        };

        const shareBtn = document.createElement('button');
        shareBtn.className = 'game-btn share-btn';
        shareBtn.style.background = 'linear-gradient(to bottom, #8b5cf6, #7c3aed)';
        shareBtn.style.marginTop = '10px';
        shareBtn.innerHTML = '📤 分享成绩';
        shareBtn.onclick = () => {
            const text = `✨ 星空听写 (默写练习)\n得分: ${score}/${total} (${percentage}%)\n\n快来挑战吧！`;
            if (navigator.share) {
                navigator.share({
                    title: '星空听写成绩',
                    text: text,
                    url: window.location.href
                }).catch(console.error);
            } else {
                navigator.clipboard.writeText(text + ' ' + window.location.href).then(() => {
                    this.showFeedback('已复制到剪贴板！', '#38bdf8');
                });
            }
        };

        actionsDiv.appendChild(continueBtn);
        actionsDiv.appendChild(shareBtn);
        content.appendChild(actionsDiv);
        overlay.appendChild(content);

        document.body.appendChild(overlay);

        if (isGood) {
            SoundFX.success();
            // Particles
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    spawnParticles(
                        window.innerWidth / 2 + (Math.random() - 0.5) * 200,
                        window.innerHeight / 2 + (Math.random() - 0.5) * 200
                    );
                }, i * 150);
            }
        } else {
            SoundFX.wrong();
        }
    }
}

/**
 * Get random praise message based on performance
 */
export function getRandomPraise(quality = 4, streak = 0): string {
    const perfectPraises = [
        "完美! 🌟", "太完美了!", "满分!", "无敌!", "太厉害了!",
        "天才啊!", "简直完美!", "一次过关!", "神了!"
    ];

    const goodPraises = [
        "太棒了! ⭐", "很好!", "厉害!", "不错!", "做得好!",
        "继续加油!", "进步了!", "真棒!", "了不起!"
    ];

    const okayPraises = [
        "加油! 💪", "继续努力!", "有进步!", "坚持住!", "再接再厉!",
        "慢慢来!", "没关系!", "继续练习!"
    ];

    const streakPraises = [
        "🔥 连续答对!", "🔥 势不可挡!", "🔥 火力全开!",
        "连胜中!", "停不下来!", "太猛了!"
    ];

    let praises: string[];
    if (quality === 5) {
        praises = perfectPraises;
    } else if (quality === 4) {
        praises = goodPraises;
    } else {
        praises = okayPraises;
    }

    if (streak >= 5) {
        return streakPraises[Math.floor(Math.random() * streakPraises.length)];
    } else if (streak >= 3 && Math.random() > 0.5) {
        return "🔥 " + praises[Math.floor(Math.random() * praises.length)];
    }

    return praises[Math.floor(Math.random() * praises.length)];
}
