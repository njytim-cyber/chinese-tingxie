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
    playTone: (freq, type, duration) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    },

    correctStroke: () => SoundFX.playTone(800, 'sine', 0.1),

    wrong: () => {
        SoundFX.playTone(150, 'sawtooth', 0.3);
        SoundFX.playTone(100, 'sawtooth', 0.3);
    },

    success: () => {
        setTimeout(() => SoundFX.playTone(523.25, 'sine', 0.2), 0);
        setTimeout(() => SoundFX.playTone(659.25, 'sine', 0.2), 100);
        setTimeout(() => SoundFX.playTone(783.99, 'sine', 0.4), 200);
    },

    levelUp: () => {
        setTimeout(() => SoundFX.playTone(400, 'square', 0.1), 0);
        setTimeout(() => SoundFX.playTone(600, 'square', 0.1), 100);
        setTimeout(() => SoundFX.playTone(1000, 'square', 0.4), 200);
    }
};

/**
 * Speak a Chinese word
 * @param {string} text - Text to speak
 */
export function speakWord(text) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);

    if (selectedVoice) {
        u.voice = selectedVoice;
        u.lang = selectedVoice.lang;
    } else {
        u.lang = 'zh-CN';
    }

    u.rate = 0.8;
    window.speechSynthesis.speak(u);
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
