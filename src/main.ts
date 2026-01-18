/**
 * Main Entry Point
 */

// CSS Import (Modular)
import '../public/css/index.css';
import '../public/css/components/update-notification.css';

// Module Imports
import { initVoices, unlockAudio, resumeAudioContext } from './audio';
import { initParticles } from './particles';
import { injectGlobalSVGDefs } from './utils/svg';
import { Game } from './game';
import { saveDataSync } from './data';
import { checkVersion } from './utils/versionChecker';

// Expose to window for backward compatibility with onclick and debugging
(window as any).Game = Game;

/**
 * Initialize application
 */
function init(): void {
    console.log('%c🎨 心织笔耕 - Chinese Dictation App', 'color: #dc2626; font-size: 16px; font-weight: bold');
    console.log('%c📦 Version: 2.1.0', 'color: #059669; font-weight: bold');
    console.log('%c🚀 Initializing...', 'color: #0891b2');
    try {
        // Check for app version updates
        checkVersion();

        // Initialize global SVG definitions (for shared gradients)
        injectGlobalSVGDefs();

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
                    // Check if in active session before navigating
                    Game.navigateToLessonSelect();
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
                // Use navigation guard to check for active sessions
                Game.navigateToProgress();
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
                // Use navigation guard to check for active sessions
                Game.navigateToDictationSelect();
            });
        }

        // Shop button (商店 - Shop)
        const shopBtn = document.getElementById('shop-btn');
        if (shopBtn) {
            shopBtn.addEventListener('click', () => {
                const overlay = document.getElementById('start-overlay');
                if (overlay) {
                    unlockAudio();
                    overlay.remove();
                    Game.init(false);
                }
                // Use navigation guard to check for active sessions
                Game.navigateToShop();
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

        const wordlistBtn = document.getElementById('btn-wordlist');
        if (wordlistBtn) wordlistBtn.addEventListener('click', () => Game.showWordList());

        console.log('%c✓ App initialized successfully', 'color: #059669; font-weight: bold');

        // Splash Screen Logic & Auto-Start
        const splash = document.getElementById('splash-screen');
        const hasSeenSplash = sessionStorage.getItem('seenSplash');

        // Handle Splash
        if (splash) {
            if (hasSeenSplash) {
                // If already seen, hide usage immediately
                splash.style.display = 'none';
            } else {
                // Show splash, then fade out
                setTimeout(() => {
                    splash.classList.add('hidden');
                    // Remove from DOM after fade
                    setTimeout(() => splash.remove(), 800);
                    sessionStorage.setItem('seenSplash', 'true');
                }, 2000);
            }
        }

        // Auto-remove static overlay and start Game Logic
        // This puts us into Lesson Select state
        const overlay = document.getElementById('start-overlay');
        if (overlay) {
            overlay.remove();
            Game.init(true);
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

// Persistent audio context resume for stubborn devices (Huawei tablets)
// This ensures audio works even if initial unlock failed
let audioUnlockAttempted = false;
const persistentAudioUnlock = () => {
    if (audioUnlockAttempted) return;
    audioUnlockAttempted = true;

    // Try to resume on ANY user interaction
    ['touchstart', 'touchend', 'click', 'keydown'].forEach(eventType => {
        document.addEventListener(eventType, resumeAudioContext, { once: true, passive: true });
    });
};

// Start persistent unlock after a short delay
setTimeout(persistentAudioUnlock, 1000);

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
