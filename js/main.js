/**
 * Main Entry Point
 */

import { initVoices, unlockAudio } from './audio.js';
import { initParticles } from './particles.js';
import { Game } from './game.js';

/**
 * Start the game (called from start button)
 */
function startGame() {
    // Save player name
    const nameInput = document.getElementById('player-name');
    if (nameInput && nameInput.value.trim()) {
        Game.setPlayerName(nameInput.value);
    }

    const overlay = document.getElementById('start-overlay');

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
function init() {
    // Initialize voices
    initVoices();

    // Initialize particle system
    initParticles();

    // Load saved player name into input
    const savedName = Game.getPlayerName();
    const nameInput = document.getElementById('player-name');
    if (nameInput && savedName) {
        nameInput.value = savedName;
    }

    // Set up start button
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', startGame);
    }

    // Expose game for button handlers
    window.game = Game;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
