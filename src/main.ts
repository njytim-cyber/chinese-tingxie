/**
 * Main Entry Point
 */

import { initVoices, unlockAudio } from './audio';
import { initParticles } from './particles';
import { Game } from './game';
import { saveDataSync, getStats, getLessons, getAttemptLogs } from './data';

/**
 * Start the game (called from start button)
 */
export function startGame(): void {
    try {
        // ... (keep existing)
        // Save player name
        const nameInput = document.getElementById('player-name') as HTMLInputElement | null;
        if (nameInput && nameInput.value.trim()) {
            Game.setPlayerName(nameInput.value);
        }

        const overlay = document.getElementById('start-overlay');
        if (!overlay) {
            console.error('Start overlay not found!');
            return;
        }

        // Unlock audio (must be in click handler)
        unlockAudio();

        // Remove overlay and initialize game
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
            Game.init();
        }, 500);
    } catch (error) {
        console.error('Error starting game:', error);
        alert('启动失败，请刷新页面重试。');
    }
}

// Expose to window for backward compatibility with onclick and debugging
(window as any).startGame = startGame;
(window as any).Game = Game;

/**
 * Initialize application
 */
function init(): void {
    console.log('Initializing app (v1.21.13)...');
    try {
        // Initialize voices
        initVoices();

        // Initialize particle system
        initParticles();

        // Show Stats on Main Menu
        const statsEl = document.getElementById('home-stats');
        if (statsEl) {
            const stats = getStats();
            // Calculate completion based on stats
            const logs = getAttemptLogs();
            const dictationsDone = logs.filter(l => l.mode === 'dictation').length;

            // Calculate total words
            const lessons = getLessons();
            let totalWords = 0;
            lessons.forEach(l => totalWords += l.phrases.length);

            // Fetch total dictations (approximate or fetch)
            // We can try to fetch, or hardcode if we know. 
            // Since we are in init, let's fetch lightly
            fetch('/dictation.json')
                .then(res => res.json())
                .then(data => {
                    const totalDictations = data.passages ? data.passages.length : 17;

                    if (!statsEl) return;
                    statsEl.style.display = 'flex'; // Ensure visible!
                    statsEl.innerHTML = `
                        <div class="stat-item">
                            <span class="stat-val">📚 ${stats.wordsLearned} / ${totalWords}</span>
                            <span class="stat-label">学会词语</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-val">✏️ ${dictationsDone} / ${totalDictations}</span>
                            <span class="stat-label">完成默写</span>
                        </div>
                    `;
                })
                .catch(() => {
                    // Fallback if fetch fails
                    if (!statsEl) return;
                    statsEl.style.display = 'flex'; // Ensure visible!
                    statsEl.innerHTML = `
                        <div class="stat-item">
                            <span class="stat-val">📚 ${stats.wordsLearned} / ${totalWords}</span>
                            <span class="stat-label">学会词语</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-val">✏️ ${dictationsDone}</span>
                            <span class="stat-label">完成默写</span>
                        </div>
                    `;
                });
        }

        // Load saved player name into input
        const savedName = Game.getPlayerName();
        const nameInput = document.getElementById('player-name') as HTMLInputElement | null;
        if (nameInput && savedName) {
            nameInput.value = savedName;
        }

        // Set up start button
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', startGame);
        }

        // Allow Enter key to start game from name input
        if (nameInput) {
            nameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    startGame();
                }
            });
        }

        const reviewBtn = document.getElementById('review-btn');
        if (reviewBtn) {
            reviewBtn.addEventListener('click', () => {
                const overlay = document.getElementById('start-overlay');
                if (overlay) overlay.remove();

                unlockAudio();
                Game.init(false);
                Game.showProgress();
            });
        }

        const practiceBtn = document.getElementById('main-practice-btn');
        if (practiceBtn) {
            practiceBtn.addEventListener('click', () => {
                const overlay = document.getElementById('start-overlay');
                if (overlay) overlay.remove();

                unlockAudio();
                Game.init(false);
                Game.showPracticeSelect();
            });
        }

        // Dictation mode button
        const dictationBtn = document.getElementById('dictation-btn');
        if (dictationBtn) {
            dictationBtn.addEventListener('click', () => {
                const overlay = document.getElementById('start-overlay');
                if (overlay) overlay.remove();

                unlockAudio();
                Game.init(false);
                Game.showDictationSelect();
            });
        }

        // Set up game control buttons
        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) menuBtn.addEventListener('click', () => Game.handleBackNavigation());

        const audioBtn = document.getElementById('btn-audio');
        if (audioBtn) audioBtn.addEventListener('click', () => Game.playCurrentAudio());

        const hintBtn = document.getElementById('btn-hint');
        if (hintBtn) hintBtn.addEventListener('click', () => Game.useHint());

        const revealBtn = document.getElementById('btn-reveal');
        if (revealBtn) revealBtn.addEventListener('click', () => Game.revealPhrase());

        const skipBtn = document.getElementById('btn-skip');
        if (skipBtn) skipBtn.addEventListener('click', () => Game.skipLevel());

        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) nextBtn.addEventListener('click', () => Game.nextLevel());

        console.log('App initialized');
    } catch (error) {
        console.error('App initialization failed:', error);
    }
}

// Prevent PWA install prompt
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
});

// Ensure data is saved when user leaves
window.addEventListener('beforeunload', () => {
    saveDataSync();
});

// Also save when tab becomes hidden (mobile optimization)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        saveDataSync();
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
