/**
 * Game Logic Module
 */

import { WORDS, loadScores, updateWordScore, getWordScore, getWordsForPractice } from './data.js';
import { SoundFX, speakWord } from './audio.js';
import { spawnParticles } from './particles.js';

const PLAYER_NAME_KEY = 'tingxie_player_name';

export const Game = {
    score: 0,
    streak: 0,
    level: 1,
    currentWordIndex: 0,
    currentWord: null,
    writers: [],
    completedChars: 0,
    practiceWords: [],
    mistakesMade: 0,
    hintUsed: false,

    /**
     * Initialize the game
     */
    init: function () {
        loadScores();
        this.practiceWords = getWordsForPractice();
        this.loadLevel();
        this.displayGreeting();
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
     * Display personalized greeting
     */
    displayGreeting: function () {
        const name = this.getPlayerName();
        const greetingEl = document.getElementById('player-greeting');
        if (greetingEl && name) {
            greetingEl.textContent = `👋 ${name}`;
        }
    },

    /**
     * Load the current level/word
     */
    loadLevel: function () {
        if (this.currentWordIndex >= this.practiceWords.length) {
            this.showFeedback("🎉 全部完成! (All Done!)", "#fbbf24");
            SoundFX.levelUp();
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
        this.streak++;
        this.score += 10 + (this.streak * 2);
        this.updateHud();

        // Calculate score change based on performance
        let scoreDelta = 1; // Base: increase by 1
        if (this.hintUsed) {
            scoreDelta = 0; // No increase if hint was used
        } else if (this.mistakesMade === 0) {
            scoreDelta = 2; // Perfect: increase by 2
        } else if (this.mistakesMade > 3) {
            scoreDelta = 0; // Too many mistakes: no increase
        }

        if (scoreDelta > 0) {
            updateWordScore(this.currentWord.term, scoreDelta);
            this.animateScoreIncrease();
        }

        this.showFeedback(this.getRandomPraise(), "#4ade80");

        document.getElementById('next-btn').style.display = 'flex';
        spawnParticles(window.innerWidth / 2, window.innerHeight / 2);
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
     * Use a hint (show character outline)
     */
    useHint: function () {
        this.streak = 0;
        this.hintUsed = true;
        this.updateHud();
        SoundFX.wrong();

        // Decrease score for using hint
        updateWordScore(this.currentWord.term, -1);
        this.renderWordScore();

        this.writers.forEach(w => {
            w.showOutline = true;
            w.updateColor('outlineColor', '#64748b');
            w.animateCharacter();
        });
    },

    /**
     * Update the HUD display
     */
    updateHud: function () {
        document.getElementById('score').innerText = this.score;
        document.getElementById('streak-count').innerText = this.streak;

        const badge = document.getElementById('streak-badge');
        if (this.streak >= 3) {
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
     * Get random praise message
     */
    getRandomPraise: function () {
        const praises = ["太棒了! (Great!)", "完美! (Perfect!)", "厉害! (Awesome!)", "天才! (Genius!)"];
        return praises[Math.floor(Math.random() * praises.length)];
    }
};
