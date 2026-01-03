/**
 * Main Entry Point
 */

import { initVoices, unlockAudio } from './audio';
import { initParticles } from './particles';
import { Game } from './game';
import '../styles.css';

/**
 * Start the game (called from start button)
 */
export function startGame(): void {
    console.log('Starting game...');
    try {
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
    console.log('Initializing app (v1.3.0)...');
    try {
        // Initialize voices
        initVoices();

        // Initialize particle system
        initParticles();

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

        // Set up game control buttons
        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) menuBtn.addEventListener('click', () => Game.showMenu());

        const audioBtn = document.getElementById('btn-audio');
        if (audioBtn) audioBtn.addEventListener('click', () => Game.playCurrentAudio());

        const hintBtn = document.getElementById('btn-hint');
        if (hintBtn) hintBtn.addEventListener('click', () => Game.useHint());

        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) nextBtn.addEventListener('click', () => Game.nextLevel());

        console.log('App initialized successfully.');
    } catch (error) {
        console.error('App initialization failed:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
