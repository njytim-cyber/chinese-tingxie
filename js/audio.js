/**
 * Audio System - Sound Effects and Speech Synthesis
 */

export const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
export let selectedVoice = null;

/**
 * Load available Chinese voices
 */
export function loadVoices() {
    const voices = window.speechSynthesis.getVoices();
    const statusEl = document.getElementById('audio-status');

    if (voices.length === 0) {
        if (statusEl) statusEl.innerHTML = "Loading voices... (Please wait)";
        return;
    }

    // Priority: zh-CN (Mainland) -> zh-TW (Taiwan) -> zh-HK (Hong Kong) -> any 'zh'
    const zhCN = voices.find(v => v.lang.includes('zh-CN') || v.lang === 'zh');
    const zhTW = voices.find(v => v.lang.includes('zh-TW'));
    const zhAny = voices.find(v => v.lang.includes('zh'));

    selectedVoice = zhCN || zhTW || zhAny;

    if (statusEl) {
        if (selectedVoice) {
            statusEl.innerHTML = `✅ Voice Ready: ${selectedVoice.name} (${selectedVoice.lang})`;
            statusEl.style.color = '#4ade80';
        } else {
            statusEl.innerHTML = "⚠️ No Chinese voice found. Audio may be silent.<br>Please install a Chinese Language Pack in OS Settings.";
            statusEl.style.color = '#fbbf24';
        }
    }
}

/**
 * Initialize voice loading
 */
export function initVoices() {
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();
}

/**
 * Sound Effects using Web Audio API
 */
export const SoundFX = {
    playTone: (freq, type, duration, volume = 0.15) => {
        try {
            // Resume audio context if suspended (required on some devices)
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(volume, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {
            console.warn('Audio playback failed:', e);
        }
    },

    correctStroke: () => SoundFX.playTone(800, 'sine', 0.08, 0.1),

    // Wrong sound removed - was annoying to users
    wrong: () => {
        // Silent - no sound on wrong strokes
    },

    success: () => {
        setTimeout(() => SoundFX.playTone(523.25, 'sine', 0.2, 0.15), 0);
        setTimeout(() => SoundFX.playTone(659.25, 'sine', 0.2, 0.15), 100);
        setTimeout(() => SoundFX.playTone(783.99, 'sine', 0.4, 0.15), 200);
    },

    levelUp: () => {
        setTimeout(() => SoundFX.playTone(400, 'square', 0.1, 0.12), 0);
        setTimeout(() => SoundFX.playTone(600, 'square', 0.1, 0.12), 100);
        setTimeout(() => SoundFX.playTone(1000, 'square', 0.4, 0.12), 200);
    }
};

/**
 * Speak a Chinese word with clear pronunciation
 * @param {string} text - Text to speak
 * @param {boolean} slow - Whether to speak slowly (for learning)
 */
export function speakWord(text, slow = false) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);

    if (selectedVoice) {
        u.voice = selectedVoice;
        u.lang = selectedVoice.lang;
    } else {
        u.lang = 'zh-CN';
    }

    // Slower rate for clearer pronunciation
    u.rate = slow ? 0.6 : 0.75;
    u.pitch = 1.0;
    u.volume = 1.0;

    window.speechSynthesis.speak(u);
}

/**
 * Speak word slowly with character-by-character option
 * @param {string} text - Text to speak
 */
export function speakWordSlow(text) {
    speakWord(text, true);
}

/**
 * Speak each character separately for learning
 * @param {string} text - Text to speak (each character spoken separately)
 */
export function speakCharacters(text) {
    const chars = text.split('');
    let delay = 0;

    chars.forEach((char, i) => {
        setTimeout(() => {
            speakWord(char, true);
        }, delay);
        delay += 1200; // 1.2 second gap between characters
    });
}

/**
 * Unlock audio context and speech synthesis (must be called from user gesture)
 */
export function unlockAudio() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    // Unlock Speech Synthesis with a dummy utterance
    const u = new SpeechSynthesisUtterance('准备');
    if (selectedVoice) u.voice = selectedVoice;
    u.volume = 0.1;
    u.rate = 2.0;
    window.speechSynthesis.speak(u);
}
