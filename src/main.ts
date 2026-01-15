/**
 * Main Entry Point
 */

// CSS Import (all styles from legacy monolith - TODO: gradually migrate to modular files)
// CSS Import (Modular)
import '../public/css/index.css';

// Module Imports
import { initVoices, unlockAudio } from './audio';
import { initParticles } from './particles';
import { Game } from './game';
import { saveDataSync, getStats, getLessons } from './data';

// Expose to window for backward compatibility with onclick and debugging
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

        // Initialize the game core (this will handle stats, avatar, and initial UI state)
        Game.init(false);

        // Set up start button (听写 - Spelling/Dictation listening)
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                const overlay = document.getElementById('start-overlay');
                if (overlay) {
                    // First click - remove overlay and init
                    unlockAudio();
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        overlay.remove();
                        Game.init();
                    }, 500);
                } else {
                    // Subsequent clicks - just navigate
                    Game.showLessonSelect();
                }
            });
        }


        // Review button (进度 - Progress)
        const reviewBtn = document.getElementById('review-btn');
        if (reviewBtn) {
            reviewBtn.addEventListener('click', () => {
                const overlay = document.getElementById('start-overlay');
                if (overlay) {
                    unlockAudio();
                    overlay.remove();
                    Game.init(false);
                }
                Game.showProgress();
            });
        }

        // Dictation mode button (默写 - Silent Writing)
        const dictationBtn = document.getElementById('dictation-btn');
        if (dictationBtn) {
            dictationBtn.addEventListener('click', () => {
                const overlay = document.getElementById('start-overlay');
                if (overlay) {
                    unlockAudio();
                    overlay.remove();
                    Game.init(false);
                }
                Game.showDictationSelect();
            });
        }

        // Set up game control buttons
        const headerBackBtn = document.getElementById('header-back-btn');
        if (headerBackBtn) headerBackBtn.addEventListener('click', () => Game.handleBackNavigation());

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

        const gridBtn = document.getElementById('btn-grid');
        if (gridBtn) gridBtn.addEventListener('click', () => Game.toggleGrid());

        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) nextBtn.addEventListener('click', () => Game.nextLevel());

        console.log('App initialized');

        // Auto-show lesson select on startup (听写 by default)
        // Only if this is a fresh page load (overlay exists)
        const overlay = document.getElementById('start-overlay');
        if (overlay) {
            unlockAudio();
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                Game.showLessonSelect();
            }, 300);
        }
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

// Global Error Handlers
window.addEventListener('error', (event) => {
    console.error('Global Error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
