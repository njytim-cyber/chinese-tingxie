/**
 * Audio System - Sound Effects and Speech Synthesis
 */

// Extend Window interface for webkit prefix
declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

export const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
export let selectedVoice: SpeechSynthesisVoice | null = null;

/**
 * Load available Chinese voices
 */
export function loadVoices(): void {
    const voices = window.speechSynthesis.getVoices();
    const statusEl = document.getElementById('audio-status');

    if (voices.length === 0) {
        if (statusEl) statusEl.innerHTML = "正在加载语音...";
        return;
    }

    // Priority: zh-CN (Mainland) -> zh-TW (Taiwan) -> zh-HK (Hong Kong) -> any 'zh'
    const zhCN = voices.find(v => v.lang.includes('zh-CN') || v.lang === 'zh');
    const zhTW = voices.find(v => v.lang.includes('zh-TW'));
    const zhAny = voices.find(v => v.lang.includes('zh'));

    selectedVoice = zhCN || zhTW || zhAny || null;

    if (statusEl) {
        if (selectedVoice) {
            statusEl.innerHTML = `✅ 语音就绪: ${selectedVoice.name}`;
            statusEl.style.color = '#4ade80';
        } else {
            statusEl.innerHTML = "⚠️ 未找到中文语音。请检查系统设置。";
            statusEl.style.color = '#fbbf24';
        }
    }
}

/**
 * Initialize voice loading
 */
export function initVoices(): void {
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();
}

/**
 * Sound Effects using Web Audio API
 */
export const SoundFX = {
    playTone: (freq: number, type: OscillatorType, duration: number, volume = 0.15): void => {
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

    correctStroke: (): void => { SoundFX.playTone(800, 'sine', 0.08, 0.1); },

    // Wrong sound removed - was annoying to users
    wrong: (): void => {
        // Silent - no sound on wrong strokes
    },

    success: (): void => {
        setTimeout(() => SoundFX.playTone(523.25, 'sine', 0.2, 0.15), 0);
        setTimeout(() => SoundFX.playTone(659.25, 'sine', 0.2, 0.15), 100);
        setTimeout(() => SoundFX.playTone(783.99, 'sine', 0.4, 0.15), 200);
    },

    levelUp: (): void => {
        setTimeout(() => SoundFX.playTone(400, 'square', 0.1, 0.12), 0);
        setTimeout(() => SoundFX.playTone(600, 'square', 0.1, 0.12), 100);
        setTimeout(() => SoundFX.playTone(1000, 'square', 0.4, 0.12), 200);
    }
};

/**
 * Speak a Chinese word with clear pronunciation
 * @param text - Text to speak
 * @param slow - Whether to speak slowly (for learning)
 */
export function speakWord(text: string, slow = false): void {
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
 * @param text - Text to speak
 */
export function speakWordSlow(text: string): void {
    speakWord(text, true);
}

/**
 * Speak each character separately for learning
 * @param text - Text to speak (each character spoken separately)
 */
export function speakCharacters(text: string): void {
    const chars = text.split('');
    let delay = 0;

    chars.forEach((char) => {
        setTimeout(() => {
            speakWord(char, true);
        }, delay);
        delay += 1200; // 1.2 second gap between characters
    });
}

/**
 * Unlock audio context and speech synthesis (must be called from user gesture)
 */
export function unlockAudio(): void {
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
