/**
 * Game Logic Module with Gamification
 */

import {
    loadData, getWordScore, getWordsForPractice,
    updateWordSRS, recordPractice, addXP, getStats, getLevel,
    getLevelProgress, checkAchievements, getAchievements,
    getLessons, getCurrentLesson, setCurrentLesson, getLessonProgress,
    type PracticeWord, type Achievement
} from './data';
import { SoundFX, speakWord } from './audio';
import { spawnParticles } from './particles';
import HanziWriter from 'hanzi-writer';

const PLAYER_NAME_KEY = 'tingxie_player_name';

// Game state interface
interface GameState {
    score: number;
    streak: number;
    sessionStreak: number;
    level: number;
    currentWordIndex: number;
    currentWord: PracticeWord | null;
    writers: HanziWriter[];
    completedChars: number;
    practiceWords: PracticeWord[];
    mistakesMade: number;
    hintUsed: boolean;
    hintStrokeIndex: number[];
    sessionStartTime: number | null;
    wordsCompletedThisSession: number;
    init: () => void;
    getPlayerName: () => string;
    setPlayerName: (name: string) => void;
    displayGreeting: () => void;
    updateStatsDisplay: () => void;
    showLessonSelect: () => void;
    selectLesson: (lessonId: number) => void;
    loadLevel: () => void;
    showPinyin: () => void;
    renderWordScore: () => void;
    handleMistake: (index: number) => void;
    handleCharComplete: (index: number) => void;
    handleWordSuccess: () => void;
    showLevelUp: (level: number) => void;
    showNewAchievements: (achievements: Achievement[]) => void;
    showSessionComplete: () => void;
    animateScoreIncrease: () => void;
    nextLevel: () => void;
    playCurrentAudio: () => void;
    useHint: () => void;
    updateHud: () => void;
    showFeedback: (text: string, color: string) => void;
    getRandomPraise: (quality?: number, streak?: number) => string;
    showAchievements: () => void;
    showMenu: () => void;
}

export const Game: GameState = {
    score: 0,
    streak: 0,
    sessionStreak: 0, // Streak within current session
    level: 1,
    currentWordIndex: 0,
    currentWord: null,
    writers: [],
    completedChars: 0,
    practiceWords: [],
    mistakesMade: 0,
    hintUsed: false,
    hintStrokeIndex: [], // Track which stroke to hint next for each character
    sessionStartTime: null,
    wordsCompletedThisSession: 0,

    /**
     * Initialize the game
     */
    init: function () {
        loadData();
        this.sessionStartTime = Date.now();
        this.wordsCompletedThisSession = 0;
        this.sessionStreak = 0;

        // Update UI with stats
        this.updateStatsDisplay();
        this.displayGreeting();

        // Show lesson selection screen
        this.showLessonSelect();

        // Record that player practiced today
        recordPractice();

        // Check for new achievements on start
        this.showNewAchievements(checkAchievements());
    },

    /**
     * Get player name from localStorage
     */
    getPlayerName: function () {
        return localStorage.getItem(PLAYER_NAME_KEY) || '';
    },

    /**
     * Save player name to localStorage
     */
    setPlayerName: function (name: string) {
        localStorage.setItem(PLAYER_NAME_KEY, name.trim());
    },

    /**
     * Display personalized greeting with level
     */
    displayGreeting: function () {
        const name = this.getPlayerName();
        const level = getLevel();
        const greetingEl = document.getElementById('player-greeting');
        if (greetingEl) {
            const nameDisplay = name ? `👋 ${name}` : '👋';
            greetingEl.innerHTML = `${nameDisplay} <span class="level-badge">Lv.${level}</span>`;
        }
    },

    /**
     * Update stats display in HUD
     */
    updateStatsDisplay: function () {
        const stats = getStats();

        // Update daily streak display
        const streakEl = document.getElementById('daily-streak');
        const streakContainer = document.getElementById('streak-container');

        if (streakEl && streakContainer) {
            streakEl.textContent = String(stats.dailyStreak);

            // Only show if streak is 2 or more
            if (stats.dailyStreak >= 2) {
                streakContainer.style.display = 'flex';
                if (stats.dailyStreak >= 3) {
                    streakContainer.classList.add('on-fire');
                }
            } else {
                streakContainer.style.display = 'none';
            }
        }

        // Update XP bar
        const xpFill = document.getElementById('xp-fill');
        const xpText = document.getElementById('xp-text');
        if (xpFill) {
            xpFill.style.width = `${getLevelProgress() * 100}%`;
        }
        if (xpText) {
            xpText.textContent = `${stats.totalXP} 经验`;
        }
    },

    /**
     * Show lesson selection screen
     */
    showLessonSelect: function () {
        const container = document.getElementById('writing-area');
        if (!container) return;

        const lessons = getLessons();
        const currentLesson = getCurrentLesson();

        container.innerHTML = `
            <div class="lesson-select">
                <h2 class="lesson-select-title">选择课程</h2>
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
            </div>
        `;

        // Add click handlers
        const self = this;
        container.querySelectorAll('.lesson-card').forEach(card => {
            card.addEventListener('click', () => {
                const lessonId = parseInt((card as HTMLElement).dataset.lessonId || '1');
                self.selectLesson(lessonId);
            });
        });

        // Hide controls during lesson select
        const controlsArea = document.querySelector('.controls-area') as HTMLElement | null;
        if (controlsArea) controlsArea.style.display = 'none';
    },

    /**
     * Select a lesson and start practicing
     */
    selectLesson: function (lessonId: number) {
        setCurrentLesson(lessonId);
        this.practiceWords = getWordsForPractice();
        this.currentWordIndex = 0;
        this.sessionStartTime = Date.now();
        this.wordsCompletedThisSession = 0;
        this.sessionStreak = 0;

        // Show controls
        const controlsArea = document.querySelector('.controls-area') as HTMLElement | null;
        if (controlsArea) controlsArea.style.display = 'flex';

        // Update lesson display in HUD
        const lesson = getCurrentLesson();
        const lessonLabel = document.getElementById('current-lesson-label');
        if (lessonLabel) lessonLabel.textContent = lesson.title;

        this.loadLevel();
    },

    /**
     * Load the current level/word
     */
    loadLevel: function () {
        if (this.currentWordIndex >= this.practiceWords.length) {
            this.showSessionComplete();
            return;
        }

        this.currentWord = this.practiceWords[this.currentWordIndex];
        this.writers = [];
        this.completedChars = 0;
        this.mistakesMade = 0;
        this.hintUsed = false;
        this.hintStrokeIndex = []; // Reset hint tracking for new word

        // UI Reset
        const container = document.getElementById('writing-area');
        if (!container) return;
        container.innerHTML = '';

        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) nextBtn.style.display = 'none';

        const feedbackOverlay = document.getElementById('feedback-overlay');
        if (feedbackOverlay) feedbackOverlay.style.opacity = '0';

        // Hide pinyin initially (shown after completion or hint)
        const pinyinEl = document.getElementById('pinyin-display');
        if (pinyinEl) {
            pinyinEl.textContent = '';
            pinyinEl.classList.remove('visible');
        }

        // Generate HanziWriters
        const chars = this.currentWord.term.split('');
        const self = this;
        chars.forEach((char, index) => {
            const div = document.createElement('div');
            div.id = `char-${index}`;
            div.className = 'char-slot';
            if (index === 0) div.classList.add('active');
            container.appendChild(div);

            const writer = HanziWriter.create(`char-${index}`, char, {
                width: 230,
                height: 230,
                padding: 5,
                showOutline: false,
                strokeColor: '#38bdf8',
                radicalColor: '#f472b6',
                outlineColor: '#334155',
                drawingWidth: 12,  // Slightly thicker for easier touch
                showCharacter: false,
                drawingFadeDuration: 300,
            });

            writer.quiz({
                leniency: 1.5,
                showHintAfterMisses: 3,
                highlightOnComplete: true,
                onCorrectStroke: (strokeData) => {
                    SoundFX.correctStroke();
                    self.hintStrokeIndex[index] = strokeData.strokeNum + 1;
                },
                onMistake: () => {
                    SoundFX.wrong();
                    self.handleMistake(index);
                },
                onComplete: () => {
                    self.handleCharComplete(index);
                }
            });

            self.writers.push(writer);
        });

        // Add score display
        this.renderWordScore();

        const progress = (this.currentWordIndex / this.practiceWords.length) * 100;
        const xpBar = document.getElementById('xp-bar');
        if (xpBar) xpBar.style.width = `${progress}%`;

        // Play audio after animations settle
        setTimeout(() => this.playCurrentAudio(), 800);
    },

    /**
     * Show pinyin for current word
     */
    showPinyin: function () {
        const pinyinEl = document.getElementById('pinyin-display');
        if (pinyinEl && this.currentWord) {
            pinyinEl.textContent = this.currentWord.pinyin;
            pinyinEl.classList.add('visible');
        }
    },

    /**
     * Render the current word's mastery score
     */
    renderWordScore: function () {
        const container = document.getElementById('writing-area');
        if (!container || !this.currentWord) return;

        // Remove existing score display
        const existing = document.getElementById('word-score-display');
        if (existing) existing.remove();

        const scoreDiv = document.createElement('div');
        scoreDiv.id = 'word-score-display';
        scoreDiv.className = 'word-score';
        scoreDiv.style.width = '100%';

        const currentScore = getWordScore(this.currentWord.term);
        for (let i = 0; i < 5; i++) {
            const star = document.createElement('span');
            star.className = 'score-star';
            star.textContent = '⭐';
            if (i < currentScore) {
                star.classList.add('filled');
            }
            scoreDiv.appendChild(star);
        }

        container.appendChild(scoreDiv);
    },

    /**
     * Handle a stroke mistake
     */
    handleMistake: function (index: number) {
        this.mistakesMade++;
        const box = document.getElementById(`char-${index}`);
        if (!box) return;
        box.classList.remove('shake');
        void (box as HTMLElement).offsetWidth;
        box.classList.add('shake');
    },

    /**
     * Handle character completion
     */
    handleCharComplete: function (index: number) {
        const box = document.getElementById(`char-${index}`);
        if (!box) return;
        box.classList.remove('active');
        box.classList.add('success');

        const rect = box.getBoundingClientRect();
        spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);

        this.completedChars++;

        if (index + 1 < this.writers.length) {
            const nextBox = document.getElementById(`char-${index + 1}`);
            if (nextBox) nextBox.classList.add('active');
        }

        if (this.completedChars === this.writers.length) {
            this.handleWordSuccess();
        }
    },

    /**
     * Handle successful word completion
     */
    handleWordSuccess: function () {
        if (!this.currentWord) return;

        SoundFX.success();
        this.sessionStreak++;
        this.wordsCompletedThisSession++;

        // Calculate quality for SM-2 (0-5)
        let quality: number;
        if (this.hintUsed) {
            quality = 2; // Failed - used hint
        } else if (this.mistakesMade === 0) {
            quality = 5; // Perfect
        } else if (this.mistakesMade <= 2) {
            quality = 4; // Good
        } else if (this.mistakesMade <= 5) {
            quality = 3; // Pass
        } else {
            quality = 2; // Fail
        }

        // Update SRS
        updateWordSRS(this.currentWord.term, quality);

        // Calculate XP earned
        let xpEarned = 10;
        if (quality === 5) xpEarned += 10; // Perfect bonus
        if (this.sessionStreak >= 3) xpEarned += 5; // Streak bonus
        if (this.sessionStreak >= 5) xpEarned += 5; // Hot streak bonus

        const oldLevel = getLevel();
        this.score += xpEarned;
        addXP(xpEarned);
        const newLevel = getLevel();

        // Check for level up
        if (newLevel > oldLevel) {
            this.showLevelUp(newLevel);
        }

        this.updateHud();
        this.updateStatsDisplay();
        this.displayGreeting();

        // Show feedback with XP and extra encouragement
        const praise = this.getRandomPraise(quality, this.sessionStreak);
        this.showFeedback(`${praise} +${xpEarned} 经验`, "#4ade80");

        // Check achievements
        const newAchievements = checkAchievements();
        if (newAchievements.length > 0) {
            setTimeout(() => this.showNewAchievements(newAchievements), 1500);
        }

        // Animate score
        this.animateScoreIncrease();
        this.showPinyin();

        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) nextBtn.style.display = 'flex';

        // More celebration for perfect/streak
        const particleCount = quality === 5 ? 5 : (this.sessionStreak >= 3 ? 3 : 1);
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                spawnParticles(
                    window.innerWidth / 2 + (Math.random() - 0.5) * 200,
                    window.innerHeight / 2 + (Math.random() - 0.5) * 100
                );
            }, i * 150);
        }
    },

    /**
     * Show level up animation
     */
    showLevelUp: function (level: number) {
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
    },

    /**
     * Show new achievements
     */
    showNewAchievements: function (achievements: Achievement[]) {
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
    },

    /**
     * Show session complete screen
     */
    showSessionComplete: function () {
        // Set progress bar to 100%
        const xpBar = document.getElementById('xp-bar');
        if (xpBar) xpBar.style.width = '100%';

        const stats = getStats();
        const sessionTime = Math.round((Date.now() - (this.sessionStartTime || Date.now())) / 1000);
        const minutes = Math.floor(sessionTime / 60);
        const seconds = sessionTime % 60;

        const container = document.getElementById('writing-area');
        if (!container) return;
        container.innerHTML = '';

        const sessionDiv = document.createElement('div');
        sessionDiv.className = 'session-complete';

        sessionDiv.innerHTML = `
            <h2>🎉 练习完成!</h2>
            
            <div class="session-stats">
                <div class="stat-item">
                    <span class="stat-value">${this.wordsCompletedThisSession}</span>
                    <span class="stat-label">词语</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${this.score}</span>
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

        const reloadBtn = document.createElement('button');
        reloadBtn.className = 'game-btn restart-btn';
        reloadBtn.innerText = '🔄 再练一次';
        reloadBtn.onclick = () => location.reload();

        sessionDiv.appendChild(reloadBtn);
        container.appendChild(sessionDiv);

        const controlsArea = document.querySelector('.controls-area') as HTMLElement | null;
        if (controlsArea) controlsArea.style.display = 'none';

        SoundFX.levelUp();
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                spawnParticles(
                    Math.random() * window.innerWidth,
                    Math.random() * window.innerHeight
                );
            }, i * 150);
        }
    },

    /**
     * Animate score stars filling up
     */
    animateScoreIncrease: function () {
        if (!this.currentWord) return;
        const stars = document.querySelectorAll('#word-score-display .score-star');
        const newScore = getWordScore(this.currentWord.term);

        stars.forEach((star, i) => {
            if (i < newScore && !star.classList.contains('filled')) {
                setTimeout(() => {
                    star.classList.add('filled', 'animate');
                }, i * 100);
            }
        });
    },

    /**
     * Move to next level/word
     */
    nextLevel: function () {
        this.currentWordIndex++;
        this.loadLevel();
    },

    /**
     * Play audio for current word
     */
    playCurrentAudio: function () {
        if (!this.currentWord) return;
        speakWord(this.currentWord.term);
    },

    /**
     * Use a hint (highlight the next stroke based on user's progress)
     */
    useHint: function () {
        this.sessionStreak = 0;
        this.hintUsed = true;
        this.updateHud();

        // Find the active character slot
        const activeSlot = document.querySelector('.char-slot.active');
        if (!activeSlot) return;

        const activeIndex = parseInt(activeSlot.id.replace('char-', ''));
        const writer = this.writers[activeIndex];
        if (!writer) return;

        // Get current stroke index based on user's actual progress
        const strokeIndex = this.hintStrokeIndex[activeIndex] || 0;

        // Highlight the next stroke they need to write
        writer.highlightStroke(strokeIndex);

        // Show pinyin on first hint
        this.showPinyin();
    },

    /**
     * Update the HUD display
     */
    updateHud: function () {
        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.innerText = String(this.score);

        const streakCountEl = document.getElementById('streak-count');
        if (streakCountEl) streakCountEl.innerText = String(this.sessionStreak);

        const badge = document.getElementById('streak-badge');
        if (badge) {
            if (this.sessionStreak >= 2) {
                badge.style.display = 'flex';
                if (this.sessionStreak >= 3) {
                    badge.classList.add('active');
                }
            } else {
                badge.style.display = 'none';
                badge.classList.remove('active');
            }
        }
    },

    /**
     * Show feedback overlay
     */
    showFeedback: function (text: string, color: string) {
        const el = document.getElementById('feedback-overlay');
        if (!el) return;
        el.innerText = text;
        el.style.color = color;
        el.style.opacity = '1';
        el.style.animation = 'none';
        void (el as HTMLElement).offsetHeight;
        el.style.animation = 'pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    },

    /**
     * Get random praise message based on performance
     * @param quality - Performance quality (2-5)
     * @param streak - Current session streak
     */
    getRandomPraise: function (quality = 4, streak = 0) {
        // Perfect performance
        const perfectPraises = [
            "完美! 🌟", "太完美了!", "满分!", "无敌!", "太厉害了!",
            "天才啊!", "简直完美!", "一次过关!", "神了!"
        ];

        // Good performance
        const goodPraises = [
            "太棒了! ⭐", "很好!", "厉害!", "不错!", "做得好!",
            "继续加油!", "进步了!", "真棒!", "了不起!"
        ];

        // Okay performance
        const okayPraises = [
            "加油! 💪", "继续努力!", "有进步!", "坚持住!", "再接再厉!",
            "慢慢来!", "没关系!", "继续练习!"
        ];

        // Streak bonuses
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

        // Add streak praise for hot streaks
        if (streak >= 5) {
            return streakPraises[Math.floor(Math.random() * streakPraises.length)];
        } else if (streak >= 3 && Math.random() > 0.5) {
            return "🔥 " + praises[Math.floor(Math.random() * praises.length)];
        }

        return praises[Math.floor(Math.random() * praises.length)];
    },

    /**
     * Show achievements panel
     */
    showAchievements: function () {
        const achievements = getAchievements();
        const overlay = document.createElement('div');
        overlay.className = 'achievements-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        const unlocked = achievements.filter(a => a.unlocked);
        const locked = achievements.filter(a => !a.unlocked);

        overlay.innerHTML = `
            <div class="achievements-panel">
                <h2>🏆 成就</h2>
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
                <button class="game-btn" onclick="this.closest('.achievements-overlay').remove()">关闭</button>
            </div>
        `;

        document.body.appendChild(overlay);
    },

    /**
     * Show menu/pause overlay
     */
    showMenu: function () {
        const self = this;
        const overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        const panel = document.createElement('div');
        panel.className = 'menu-panel';

        const title = document.createElement('h2');
        title.innerText = '⏸ 暂停 (Paused)';
        panel.appendChild(title);

        const buttons = document.createElement('div');
        buttons.className = 'menu-buttons';

        const resumeBtn = document.createElement('button');
        resumeBtn.className = 'game-btn';
        resumeBtn.innerText = '▶ 继续 (Resume)';
        resumeBtn.onclick = () => overlay.remove();
        buttons.appendChild(resumeBtn);

        const achBtn = document.createElement('button');
        achBtn.className = 'game-btn btn-hint';
        achBtn.innerText = '🏆 成就 (Achievements)';
        achBtn.onclick = () => {
            self.showAchievements();
            overlay.remove();
        };
        buttons.appendChild(achBtn);

        const menuBtn = document.createElement('button');
        menuBtn.className = 'game-btn';
        menuBtn.style.background = 'linear-gradient(to bottom, #ef4444, #dc2626)';
        menuBtn.style.borderColor = '#b91c1c';
        menuBtn.innerText = '🏠 返回主菜单 (Main Menu)';
        menuBtn.onclick = () => location.reload();
        buttons.appendChild(menuBtn);

        panel.appendChild(buttons);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
    }
};
