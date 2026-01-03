/**
 * Game Logic Module with Gamification
 */

import {
    loadData, getWordScore, getWordsForPractice, getWordState,
    updateWordSRS, recordPractice, addXP, getStats, getLevel,
    getLevelProgress, checkAchievements, getAchievements,
    getLessons, getCurrentLesson, setCurrentLesson, getLessonProgress,
    getUnmasteredWords,
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
    selectedLessonsForPractice: number[];
    init: () => void;
    getPlayerName: () => string;
    setPlayerName: (name: string) => void;
    displayGreeting: () => void;
    updateStatsDisplay: () => void;
    showLessonSelect: () => void;
    showProgress: () => void;
    showPracticeSelect: () => void;
    startPractice: () => void;
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
    scrollToActiveChar: (element: HTMLElement) => void;
    updateHud: () => void;
    showFeedback: (text: string, color: string) => void;
    getRandomPraise: (quality?: number, streak?: number) => string;
    showAchievements: () => void;
    showMenu: () => void;
    renderProgressDots: () => void;
    updateProgressDot: (index: number, status: 'active' | 'correct' | 'wrong') => void;
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
    selectedLessonsForPractice: [],

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
                <div class="lesson-select-actions">
                    <button class="game-btn btn-hint" id="view-progress-btn">📊 查看进度</button>
                    <button class="game-btn btn-audio" id="practice-mode-btn">📝 复习模式</button>
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

        // Progress button
        const progressBtn = document.getElementById('view-progress-btn');
        if (progressBtn) {
            progressBtn.addEventListener('click', () => self.showProgress());
        }

        // Practice mode button
        const practiceBtn = document.getElementById('practice-mode-btn');
        if (practiceBtn) {
            practiceBtn.addEventListener('click', () => self.showPracticeSelect());
        }

        // Hide controls during lesson select
        const controlsArea = document.querySelector('.controls-area') as HTMLElement | null;
        if (controlsArea) controlsArea.style.display = 'none';

        // Hide HUD controls (audio, hint, score) in Chapter Selection
        const hudControls = document.querySelector('.hud-controls') as HTMLElement | null;
        if (hudControls) hudControls.style.display = 'none';

        const footer = document.getElementById('footer-progress');
        if (footer) footer.style.display = 'none';
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

        // Ensure HUD controls are visible
        const hudControls = document.querySelector('.hud-controls') as HTMLElement | null;
        if (hudControls) hudControls.style.display = 'flex';

        this.renderProgressDots();

        // Update lesson display in HUD
        const lesson = getCurrentLesson();
        const lessonLabel = document.getElementById('current-lesson-label');
        if (lessonLabel) lessonLabel.textContent = lesson.title;

        this.loadLevel();
    },

    /**
     * Show progress view with all lessons and phrases
     */
    showProgress: function () {
        const container = document.getElementById('writing-area');
        if (!container) return;

        const lessons = getLessons();
        const masteryLabels = ['未学', '入门', '熟悉', '掌握', '精通', '完美'];
        const masteryColors = ['#64748b', '#ef4444', '#f97316', '#eab308', '#22c55e', '#38bdf8'];

        container.innerHTML = `
            <div class="progress-view">
                <h2 class="progress-title">📊 学习进度</h2>
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
        `;

        // Toggle phrase visibility on header click
        container.querySelectorAll('.progress-lesson-header').forEach(header => {
            header.addEventListener('click', () => {
                const lessonId = (header as HTMLElement).dataset.lessonId;
                const phrasesEl = document.getElementById(`phrases-${lessonId}`);
                if (phrasesEl) {
                    phrasesEl.style.display = phrasesEl.style.display === 'none' ? 'block' : 'none';
                }
            });
        });



        // Hide controls area (bottom)
        const controlsArea = document.querySelector('.controls-area') as HTMLElement | null;
        if (controlsArea) controlsArea.style.display = 'none';

        // Hide HUD controls (audio, hint, score) for cleaner view
        const hudControls = document.querySelector('.hud-controls') as HTMLElement | null;
        if (hudControls) hudControls.style.display = 'none';
    },

    /**
     * Show practice selection (choose chapters to practice)
     */
    showPracticeSelect: function () {
        const container = document.getElementById('writing-area');
        if (!container) return;

        const lessons = getLessons();
        this.selectedLessonsForPractice = [];

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
                    <button class="game-btn btn-audio" id="start-practice-btn">开始练习</button>
                    <button class="game-btn btn-hint" id="back-to-lessons-btn">返回</button>
                </div>
            </div>
        `;

        const self = this;

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
                    self.showFeedback('请至少选择一课', '#ef4444');
                    return;
                }
                self.selectedLessonsForPractice = selected;
                self.startPractice();
            });
        }

        // Back button
        const backBtn = document.getElementById('back-to-lessons-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.showLessonSelect());
        }

        // Hide controls
        const controlsArea = document.querySelector('.controls-area') as HTMLElement | null;
        if (controlsArea) controlsArea.style.display = 'none';
    },

    /**
     * Start practice with selected lessons
     */
    startPractice: function () {
        if (this.selectedLessonsForPractice.length === 0) {
            this.showLessonSelect();
            return;
        }

        this.practiceWords = getUnmasteredWords(this.selectedLessonsForPractice);

        if (this.practiceWords.length === 0) {
            this.showFeedback('所有词语都已掌握！', '#22c55e');
            setTimeout(() => this.showLessonSelect(), 1500);
            return;
        }

        this.currentWordIndex = 0;
        this.sessionStartTime = Date.now();
        this.wordsCompletedThisSession = 0;
        this.sessionStreak = 0;

        // Show controls
        const controlsArea = document.querySelector('.controls-area') as HTMLElement | null;
        if (controlsArea) controlsArea.style.display = 'flex';

        // Ensure HUD controls are visible
        const hudControls = document.querySelector('.hud-controls') as HTMLElement | null;
        if (hudControls) hudControls.style.display = 'flex';

        this.renderProgressDots();
        this.loadLevel();
    },

    /**
     * Render the footer progress dots
     */
    renderProgressDots: function () {
        const container = document.getElementById('footer-progress');
        if (!container) return;
        container.innerHTML = '';
        container.style.display = 'flex'; // Ensure visible

        this.practiceWords.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            dot.id = `dot-${i}`;
            container.appendChild(dot);
        });
    },

    /**
     * Update a specific progress dot
     */
    updateProgressDot: function (index: number, status: 'active' | 'correct' | 'wrong') {
        const dot = document.getElementById(`dot-${index}`);
        if (!dot) return;

        // Remove exclusive states if setting definitive status
        if (status === 'correct' || status === 'wrong') {
            dot.classList.remove('active');
        }
        dot.classList.add(status);
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
        const pinyinSegments = this.currentWord.pinyin.split(' ');
        const self = this;

        chars.forEach((char, index) => {
            const charBox = document.createElement('div');
            charBox.className = 'char-box';

            const div = document.createElement('div');
            div.id = `char-${index}`;
            div.className = 'char-slot';
            if (index === 0) div.classList.add('active');

            const pinyinLabel = document.createElement('div');
            pinyinLabel.className = 'char-pinyin-label';
            pinyinLabel.textContent = pinyinSegments[index] || '';

            charBox.appendChild(div);
            charBox.appendChild(pinyinLabel);
            container.appendChild(charBox);

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
                    self.handleMistake(index);
                },
                onComplete: () => {
                    self.handleCharComplete(index);
                }
            });

            self.writers.push(writer);

            // Add scroll listener
            div.addEventListener('pointerdown', () => {
                self.scrollToActiveChar(div);
            });
        });

        // Score display removed per user request
        // this.renderWordScore();

        // Update progress dots
        this.updateProgressDot(this.currentWordIndex, 'active');

        // Play audio after animations settle
        setTimeout(() => {
            this.playCurrentAudio();
            // Scroll to the first active character if on mobile
            const activeChar = document.querySelector('.char-slot.active') as HTMLElement;
            if (activeChar) this.scrollToActiveChar(activeChar);
        }, 800);
    },

    /**
     * Scroll the element into the center of the viewport
     */
    scrollToActiveChar: function (element: HTMLElement) {
        // Only scroll if on mobile/small screen
        if (window.innerWidth > 600) return;

        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        });
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

        // Show per-character pinyin labels
        document.querySelectorAll('.char-pinyin-label').forEach(label => {
            label.classList.add('visible');
        });
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

        // Update Progress Dot
        const isSuccess = quality >= 3;
        this.updateProgressDot(this.currentWordIndex, isSuccess ? 'correct' : 'wrong');

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

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'session-actions';

        const reloadBtn = document.createElement('button');
        reloadBtn.className = 'game-btn restart-btn';
        reloadBtn.innerText = '🔄 再练一次';
        reloadBtn.onclick = () => {
            // Reset and restart with same words
            this.currentWordIndex = 0;
            this.startPractice();
        };

        const shareBtn = document.createElement('button');
        shareBtn.className = 'game-btn share-btn';
        shareBtn.style.background = 'linear-gradient(to bottom, #8b5cf6, #7c3aed)';
        shareBtn.style.borderColor = '#6d28d9';
        shareBtn.innerHTML = '📤 分享成绩';
        shareBtn.onclick = () => {
            const text = `✨ 星空听写\n我刚刚练习了 ${this.wordsCompletedThisSession} 个词语！\n得分: ${this.score} | 连胜: ${stats.dailyStreak}🔥\n等级: Lv.${getLevel()}\n\n快来挑战吧！`;

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

        actionsDiv.appendChild(reloadBtn);
        actionsDiv.appendChild(shareBtn);
        sessionDiv.appendChild(actionsDiv);

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
        title.innerText = '⏸ 暂停';
        panel.appendChild(title);

        const buttons = document.createElement('div');
        buttons.className = 'menu-buttons';

        const resumeBtn = document.createElement('button');
        resumeBtn.className = 'game-btn';
        resumeBtn.innerText = '▶ 继续';
        resumeBtn.onclick = () => overlay.remove();
        buttons.appendChild(resumeBtn);

        const achBtn = document.createElement('button');
        achBtn.className = 'game-btn btn-hint';
        achBtn.innerText = '🏆 成就';
        achBtn.onclick = () => {
            self.showAchievements();
            overlay.remove();
        };
        buttons.appendChild(achBtn);

        const menuBtn = document.createElement('button');
        menuBtn.className = 'game-btn';
        menuBtn.style.background = 'linear-gradient(to bottom, #ef4444, #dc2626)';
        menuBtn.style.borderColor = '#b91c1c';
        menuBtn.innerText = '🏠 返回主菜单';
        menuBtn.onclick = () => location.reload();
        buttons.appendChild(menuBtn);

        panel.appendChild(buttons);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
    }
};
