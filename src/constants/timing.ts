/**
 * Timing Constants
 * Centralized timing values for animations, delays, and transitions
 */

export const Timing = {
    // Animation Durations (ms)
    ANIMATION_FAST: 150,
    ANIMATION_NORMAL: 300,
    ANIMATION_SLOW: 500,
    ANIMATION_CAROUSEL: 400,

    // Delays (ms)
    DELAY_TINY: 10,
    DELAY_SHORT: 50,
    DELAY_MEDIUM: 200,
    DELAY_LONG: 500,
    DELAY_VERY_LONG: 800,
    DELAY_ACHIEVEMENT: 1500,
    DELAY_AUTO_ADVANCE: 800,

    // Feedback Display (ms)
    FEEDBACK_DURATION: 1500,
    TOAST_DURATION: 3000,
    LEVEL_UP_DURATION: 2000,

    // Auto-save and Debounce (ms)
    SAVE_DEBOUNCE: 500,
    INPUT_DEBOUNCE: 300,

    // Audio (seconds)
    AUDIO_FADE_DURATION: 2.0,
    AUDIO_MIN_DELAY: 3000,
    AUDIO_MAX_DELAY: 8000,

    // Particle Effects (ms)
    PARTICLE_INTERVAL: 150,
    PARTICLE_LIFETIME: 2000,
} as const;

export const Dimensions = {
    // Character Slot Sizes
    CHAR_SLOT_SIZE: 240,
    CHAR_SLOT_SIZE_MOBILE: 220,
    CHAR_SLOT_PADDING: 15,
    CHAR_SLOT_PADDING_PERCENT: 0.1,

    // Xizi Mode
    XIZI_WRITER_SIZE: 280,
    XIZI_WRITER_PADDING: 20,

    // Progress Indicators
    PROGRESS_DOT_SIZE: 10,
    PROGRESS_BAR_HEIGHT: 5,

    // Card Dimensions
    CARD_MAX_WIDTH: 400,
    CARD_BORDER_RADIUS: 16,
} as const;

export const Thresholds = {
    // Touch/Swipe
    SWIPE_THRESHOLD: 50,
    SWIPE_MIN_DISTANCE: 10,

    // Scoring
    QUALITY_PERFECT: 5,
    QUALITY_GOOD: 4,
    QUALITY_PASS: 3,
    QUALITY_HINT: 2,
    QUALITY_FAIL: 1,

    // Mistakes
    MAX_MISTAKES_FOR_GOOD: 2,
    HINT_AFTER_MISSES: 3,

    // Leniency
    HANZI_WRITER_LENIENCY: 1.5,
} as const;
