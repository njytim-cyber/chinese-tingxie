/**
 * Haptic Feedback Utility
 * Provides vibration feedback for touch devices
 */

/**
 * Check if vibration is supported
 */
function isVibrationSupported(): boolean {
    return 'vibrate' in navigator;
}

/**
 * Light tap feedback (correct stroke)
 */
export function hapticLight(): void {
    if (isVibrationSupported()) {
        navigator.vibrate(10);
    }
}

/**
 * Medium feedback (hint, reveal)
 */
export function hapticMedium(): void {
    if (isVibrationSupported()) {
        navigator.vibrate(20);
    }
}

/**
 * Strong feedback (mistake)
 */
export function hapticError(): void {
    if (isVibrationSupported()) {
        navigator.vibrate([30, 10, 30]);
    }
}

/**
 * Success pattern (character completed)
 */
export function hapticSuccess(): void {
    if (isVibrationSupported()) {
        navigator.vibrate([15, 10, 15, 10, 15]);
    }
}

/**
 * Chunk completed pattern
 */
export function hapticChunkComplete(): void {
    if (isVibrationSupported()) {
        navigator.vibrate([20, 15, 30, 15, 40]);
    }
}
