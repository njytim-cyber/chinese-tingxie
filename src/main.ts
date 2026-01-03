/**
 * Main Entry Point
 */

import { initVoices, unlockAudio } from './audio';
import { initParticles } from './particles';
import { Game } from './game';

/**
 * Start the game (called from start button)
 */
function startGame(): void {
    // Save player name
    const nameInput = document.getElementById('player-name') as HTMLInputElement | null;
    if (nameInput && nameInput.value.trim()) {
        Game.setPlayerName(nameInput.value);
    }

    const overlay = document.getElementById('start-overlay');
    if (!overlay) return;

    // Unlock audio (must be in click handler)
    unlockAudio();

    // Remove overlay and initialize game
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.remove();
        Game.init();
    }, 500);
}

/**
 * Initialize application
 */
function init(): void {
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
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
