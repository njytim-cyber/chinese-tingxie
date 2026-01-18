/**
 * Audio System - Sound Effects and Speech Synthesis
 */

// Extend Window interface for webkit prefix
declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

// Lazy initialization of audio context for better performance
let audioCtx: AudioContext | null = null;
let audioUnlocked = false;

function getAudioContext(): AudioContext {
    if (!audioCtx) {
        // Create context - will be in suspended state until user gesture
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        // Auto-resume on first user interaction if not already unlocked
        if (!audioUnlocked && audioCtx.state === 'suspended') {
            const autoResume = () => {
                if (audioCtx && audioCtx.state === 'suspended') {
                    audioCtx.resume().catch(() => {});
                }
                audioUnlocked = true;
            };

            // Listen for first user interaction
            ['click', 'touchstart', 'keydown'].forEach(event => {
                document.addEventListener(event, autoResume, { once: true, passive: true });
            });
        }
    }
    return audioCtx;
}

/**
 * Force resume audio context (for persistent unlock)
 */
export function resumeAudioContext(): void {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
    }
    audioUnlocked = true;
}

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
            const ctx = getAudioContext();
            if (ctx.state === 'suspended') {
                void ctx.resume();
            }

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            gain.gain.setValueAtTime(volume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.warn('Audio playback failed:', e);
        }
    },

    // Weiqi Stone clack (Stone on Wood)
    tap: (): void => {
        SoundFX.playTone(1200, 'sine', 0.05, 0.1);
        setTimeout(() => SoundFX.playTone(800, 'triangle', 0.03, 0.05), 10);
        if (navigator.vibrate) navigator.vibrate(10);
    },

    correctStroke: (): void => {
        SoundFX.playTone(1000, 'sine', 0.1, 0.08);
        if (navigator.vibrate) navigator.vibrate(5);
    },

    // Alias for UI clicks
    click: (): void => {
        SoundFX.tap();
    },

    // Alias for pop sound
    pop: (): void => {
        SoundFX.playTone(800, 'sine', 0.08, 0.1);
    },

    // Bamboo Woodblock thud
    wrong: (): void => {
        SoundFX.playTone(150, 'square', 0.15, 0.1);
        SoundFX.playTone(100, 'sine', 0.2, 0.1);
        if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    },

    // Porcelain Bell / Single Guzheng pluck
    success: (): void => {
        SoundFX.playTone(880, 'sine', 0.6, 0.15); // A5
        setTimeout(() => SoundFX.playTone(1320, 'sine', 0.4, 0.1), 50); // E6 
        if (navigator.vibrate) navigator.vibrate(50);
    },

    levelUp: (): void => {
        setTimeout(() => SoundFX.playTone(523.25, 'sine', 0.2, 0.12), 0);
        setTimeout(() => SoundFX.playTone(659.25, 'sine', 0.2, 0.12), 150);
        setTimeout(() => SoundFX.playTone(783.99, 'sine', 0.5, 0.12), 300);
    },

    // Paper Rustle (White noise burst)
    pageTurn: (): void => {
        try {
            const ctx = getAudioContext();
            const bufferSize = ctx.sampleRate * 0.1;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            noise.connect(gain);
            gain.connect(ctx.destination);
            noise.start();
        } catch (e) {
            console.warn('Paper rustle failed:', e);
        }
    }
};

/**
 * Generative Ambient Music (Pentatonic Wind Chimes)
 */
export class GenerativeAmbient {
    private static isPlaying = false;
    private static intervalId: number | null = null;
    private static gainNode: GainNode | null = null;

    // Pentatonic scale (C4, D4, E4, G4, A4, C5)
    private static readonly frequencies = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25] as const;

    static get isAmbientPlaying(): boolean {
        return this.isPlaying;
    }

    static toggle(enable: boolean): void {
        if (enable) {
            this.start();
        } else {
            this.stop();
        }
    }

    static start(): void {
        if (this.isPlaying) return;
        this.isPlaying = true;

        const ctx = getAudioContext();
        // Create master gain for ambience
        this.gainNode = ctx.createGain();
        this.gainNode.gain.value = 0.05; // Very subtle
        this.gainNode.connect(ctx.destination);

        this.scheduleNextNote();
    }

    static stop(): void {
        this.isPlaying = false;
        if (this.intervalId) {
            window.clearTimeout(this.intervalId);
            this.intervalId = null;
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }
    }

    private static scheduleNextNote(): void {
        if (!this.isPlaying) return;

        // Play a note
        const index = Math.floor(Math.random() * this.frequencies.length);
        const freq = this.frequencies[index];
        if (!freq) return;

        const duration = 2.0 + Math.random() * 3.0;

        this.playAmbientTone(freq, duration);

        // Schedule next note (random interval 3-8 seconds)
        const nextDelay = 3000 + Math.random() * 5000;
        this.intervalId = window.setTimeout(() => this.scheduleNextNote(), nextDelay);
    }

    private static playAmbientTone(freq: number, duration: number): void {
        const ctx = getAudioContext();
        if (!this.gainNode || ctx.state !== 'running') return;

        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Slow attack and release for ambient feel
        noteGain.gain.setValueAtTime(0, ctx.currentTime);
        noteGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.5); // Attack
        noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration); // Decay

        osc.connect(noteGain);
        noteGain.connect(this.gainNode);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    }
}

/**
 * Speak a Chinese word with clear pronunciation
 * @param text - Text to speak
 * @param slow - Whether to speak slowly (for learning)
 */
export function speakWord(text: string, slow = false, onEnd?: () => void): void {
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

    if (onEnd) {
        u.onend = onEnd;
    }

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
    const ctx = getAudioContext();
    audioUnlocked = true;

    // Immediate resume attempt
    if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
            console.log('[Audio] Context resumed successfully');
        }).catch((err) => {
            console.warn('[Audio] Resume failed:', err);
        });
    }

    // Play a silent tone to force audio unlock on stubborn devices (Huawei, some Android)
    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.001; // Nearly silent
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);
        osc.stop(ctx.currentTime + 0.01);
    } catch (e) {
        console.warn('[Audio] Silent tone unlock failed:', e);
    }

    // Aggressive unlock handler for touch devices
    const unlockHandler = () => {
        if (ctx.state === 'suspended') {
            ctx.resume().then(() => {
                console.log('[Audio] Context unlocked via touch');
            });
        }

        // Force play a test sound
        try {
            const testOsc = ctx.createOscillator();
            const testGain = ctx.createGain();
            testGain.gain.value = 0.001;
            testOsc.connect(testGain);
            testGain.connect(ctx.destination);
            testOsc.start(0);
            testOsc.stop(ctx.currentTime + 0.01);
        } catch (e) {
            // Silently ignore
        }

        window.removeEventListener('touchstart', unlockHandler);
        window.removeEventListener('touchend', unlockHandler);
        window.removeEventListener('click', unlockHandler);
    };

    window.addEventListener('touchstart', unlockHandler, { passive: true, once: true });
    window.addEventListener('touchend', unlockHandler, { passive: true, once: true });
    window.addEventListener('click', unlockHandler, { once: true });

    // Unlock Speech Synthesis with a dummy utterance (silent)
    try {
        const u = new SpeechSynthesisUtterance(' ');
        if (selectedVoice) u.voice = selectedVoice;
        u.volume = 0.01; // Very quiet but not zero (some devices ignore 0)
        u.rate = 10; // Very fast
        window.speechSynthesis.speak(u);
    } catch (e) {
        console.warn('[Audio] Speech unlock failed:', e);
    }
}
