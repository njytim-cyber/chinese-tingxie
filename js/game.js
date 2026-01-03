/**
 * Game Logic Module with Gamification
 */

import {
    loadData, getWordScore, getWordsForPractice, getWordState,
    updateWordSRS, recordPractice, addXP, getStats, getLevel,
    getLevelProgress, checkAchievements, getAchievements
} from './data.js';
import { SoundFX, speakWord } from './audio.js';
import { spawnParticles } from './particles.js';

const PLAYER_NAME_KEY = 'tingxie_player_name';

export const Game = {
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
    sessionStartTime: null,
    wordsCompletedThisSession: 0,

    /**
     * Initialize the game
     */
    init: function () {
        loadData();
        this.practiceWords = getWordsForPractice();
        this.sessionStartTime = Date.now();
        this.wordsCompletedThisSession = 0;
        this.sessionStreak = 0;

        // Update UI with stats
        this.updateStatsDisplay();
        this.loadLevel();
        this.displayGreeting();

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
    setPlayerName: function (name) {
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
        if (streakEl) {
            streakEl.textContent = stats.dailyStreak;
            if (stats.dailyStreak >= 3) {
                streakEl.parentElement.classList.add('on-fire');
            }
        }

        // Update XP bar
        const xpFill = document.getElementById('xp-fill');
        const xpText = document.getElementById('xp-text');
        if (xpFill) {
            xpFill.style.width = `${getLevelProgress() * 100}%`;
        }
        if (xpText) {
            xpText.textContent = `${stats.totalXP} XP`;
        }

        // Update level
        const levelEl = document.getElementById('player-level');
        if (levelEl) {
            levelEl.textContent = getLevel();
        }
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

        // UI Reset
        const container = document.getElementById('writing-area');
        container.innerHTML = '';
        document.getElementById('next-btn').style.display = 'none';
        document.getElementById('feedback-overlay').style.opacity = '0';

        // Show word info (due status)
        this.showWordInfo();

        // Generate HanziWriters
        const chars = this.currentWord.term.split('');
        chars.forEach((char, index) => {
            const div = document.createElement('div');
            div.id = `char-${index}`;
            div.className = 'char-slot';
            if (index === 0) div.classList.add('active');
            container.appendChild(div);

            const writer = HanziWriter.create(`char-${index}`, char, {
                width: 140,
                height: 140,
                padding: 10,
                showOutline: false,
                strokeColor: '#38bdf8',
                radicalColor: '#f472b6',
                outlineColor: '#334155',
                drawingWidth: 10,
                showCharacter: false,
            });

            writer.quiz({
                onCorrectStroke: () => {
                    SoundFX.correctStroke();
                },
                onMistake: () => {
                    SoundFX.wrong();
                    this.handleMistake(index);
                },
                onComplete: () => {
                    this.handleCharComplete(index);
                }
            });

            this.writers.push(writer);
        });

        // Add score display
        this.renderWordScore();

        const progress = (this.currentWordIndex / this.practiceWords.length) * 100;
        document.getElementById('xp-bar').style.width = `${progress}%`;
        document.getElementById('level-num').innerText = this.currentWord.level;

        // Play audio after animations settle
        setTimeout(() => this.playCurrentAudio(), 800);
    },

    /**
     * Show word info (new/review status)
     */
    showWordInfo: function () {
        const infoEl = document.getElementById('word-info');
        if (!infoEl) return;

        const state = getWordState(this.currentWord.term);
        if (state.timesCorrect === 0) {
            infoEl.innerHTML = '<span class="new-word">🆕 新词 (New)</span>';
        } else {
            infoEl.innerHTML = '<span class="review-word">🔄 复习 (Review)</span>';
        }

        // Hide pinyin initially (shown after completion or hint)
        const pinyinEl = document.getElementById('pinyin-display');
        if (pinyinEl) {
            pinyinEl.textContent = '';
            pinyinEl.classList.remove('visible');
        }
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
    handleMistake: function (index) {
        this.mistakesMade++;
        const box = document.getElementById(`char-${index}`);
        box.classList.remove('shake');
        void box.offsetWidth;
        box.classList.add('shake');
    },

    /**
     * Handle character completion
     */
    handleCharComplete: function (index) {
        const box = document.getElementById(`char-${index}`);
        box.classList.remove('active');
        box.classList.add('success');

        const rect = box.getBoundingClientRect();
        spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);

        this.completedChars++;

        if (index + 1 < this.writers.length) {
            document.getElementById(`char-${index + 1}`).classList.add('active');
        }

        if (this.completedChars === this.writers.length) {
            this.handleWordSuccess();
        }
    },

    /**
     * Handle successful word completion
     */
    handleWordSuccess: function () {
        SoundFX.success();
        this.sessionStreak++;
        this.wordsCompletedThisSession++;

        // Calculate quality for SM-2 (0-5)
        let quality;
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
        this.showFeedback(`${praise} +${xpEarned} XP`, "#4ade80");

        // Check achievements
        const newAchievements = checkAchievements();
        if (newAchievements.length > 0) {
            setTimeout(() => this.showNewAchievements(newAchievements), 1500);
        }

        // Animate score
        this.animateScoreIncrease();
        this.showPinyin();

        document.getElementById('next-btn').style.display = 'flex';

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
    showLevelUp: function (level) {
        SoundFX.levelUp();

        const overlay = document.createElement('div');
        overlay.className = 'level-up-overlay';
        overlay.innerHTML = `
            <div class="level-up-content">
                <div class="level-up-icon">🎉</div>
                <div class="level-up-text">升级!</div>
                <div class="level-up-level">Level ${level}</div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Particles burst
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                spawnParticles(
                    window.innerWidth / 2 + (Math.random() - 0.5) * 200,
                    window.innerHeight / 2 + (Math.random() - 0.5) * 200
                );
            }, i * 100);
        }

        setTimeout(() => overlay.remove(), 2500);
    },

    /**
     * Show new achievements
     */
    showNewAchievements: function (achievements) {
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
        const stats = getStats();
        const sessionTime = Math.round((Date.now() - this.sessionStartTime) / 1000);
        const minutes = Math.floor(sessionTime / 60);
        const seconds = sessionTime % 60;

        document.getElementById('writing-area').innerHTML = `
            <div class="session-complete">
                <h2>🎉 练习完成!</h2>
                <p class="session-subtitle">Session Complete</p>
                
                <div class="session-stats">
                    <div class="stat-item">
                        <span class="stat-value">${this.wordsCompletedThisSession}</span>
                        <span class="stat-label">词语 (Words)</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${this.score}</span>
                        <span class="stat-label">XP 获得</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${minutes}:${seconds.toString().padStart(2, '0')}</span>
                        <span class="stat-label">时间 (Time)</span>
                    </div>
                </div>
                
                <div class="streak-display ${stats.dailyStreak >= 3 ? 'on-fire' : ''}">
                    <span class="streak-icon">🔥</span>
                    <span class="streak-count">${stats.dailyStreak}</span>
                    <span class="streak-label">天连续 (Day Streak)</span>
                </div>
                
                <button class="game-btn restart-btn" onclick="location.reload()">
                    🔄 再练一次 (Practice Again)
                </button>
            </div>
        `;

        document.querySelector('.controls-area').style.display = 'none';

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
     * Use a hint (show character outline only - does not auto-complete)
     */
    useHint: function () {
        this.sessionStreak = 0;
        this.hintUsed = true;
        this.updateHud();
        SoundFX.wrong();

        this.renderWordScore();
        this.showPinyin(); // Show pinyin when using hint

        // Show outline only - user still needs to trace the character
        this.writers.forEach(w => {
            w.showOutline();
        });
    },

    /**
     * Update the HUD display
     */
    updateHud: function () {
        document.getElementById('score').innerText = this.score;
        document.getElementById('streak-count').innerText = this.sessionStreak;

        const badge = document.getElementById('streak-badge');
        if (this.sessionStreak >= 3) {
            badge.classList.add('active');
        } else {
            badge.classList.remove('active');
        }
    },

    /**
     * Show feedback overlay
     */
    showFeedback: function (text, color) {
        const el = document.getElementById('feedback-overlay');
        el.innerText = text;
        el.style.color = color;
        el.style.opacity = 1;
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = 'pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    },

    /**
     * Get random praise message based on performance
     * @param {number} quality - Performance quality (2-5)
     * @param {number} streak - Current session streak
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

        let praises;
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
                <h2>🏆 成就 (Achievements)</h2>
                <div class="achievements-grid">
                    ${unlocked.map(a => `
                        <div class="achievement-item unlocked">
                            <span class="ach-icon">${a.icon}</span>
                            <span class="ach-name">${a.name}</span>
                        </div>
                    `).join('')}
                    ${locked.map(a => `
                        <div class="achievement-item locked">
                            <span class="ach-icon">🔒</span>
                            <span class="ach-name">???</span>
                        </div>
                    `).join('')}
                </div>
                <button class="game-btn" onclick="this.closest('.achievements-overlay').remove()">关闭 (Close)</button>
            </div>
        `;

        document.body.appendChild(overlay);
    },

    /**
     * Show menu/pause overlay
     */
    showMenu: function () {
        const overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        overlay.innerHTML = `
            <div class="menu-panel">
                <h2>⏸ 暂停 (Paused)</h2>
                <div class="menu-buttons">
                    <button class="game-btn" onclick="this.closest('.menu-overlay').remove()">
                        ▶ 继续 (Resume)
                    </button>
                    <button class="game-btn btn-hint" onclick="game.showAchievements(); this.closest('.menu-overlay').remove()">
                        🏆 成就 (Achievements)
                    </button>
                    <button class="game-btn" style="background: linear-gradient(to bottom, #ef4444, #dc2626); border-color: #b91c1c;" onclick="location.reload()">
                        🏠 返回主菜单 (Main Menu)
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
    }
};
