/**
 * HanziWriter Helper Utilities
 *
 * CRITICAL: These helpers prevent the "invisible strokes after reveal" regression bug.
 *
 * Root cause of bug:
 * - Calling hideCharacter() without {duration} option in quiz mode doesn't properly
 *   reset the visibility state, leaving strokes invisible even though sounds play.
 *
 * Prevention:
 * - Always use these helper functions instead of calling showCharacter/hideCharacter directly
 * - These functions enforce the correct {duration} parameter pattern
 * - Centralized implementation prevents scattered bugs across the codebase
 *
 * DO NOT call writer.showCharacter() or writer.hideCharacter() directly elsewhere!
 */

import type HanziWriter from 'hanzi-writer';

/**
 * Safely reveal a character temporarily in quiz mode
 *
 * This function ensures the character is properly shown and hidden with
 * the correct duration parameters to prevent stroke visibility issues.
 *
 * @param writer - The HanziWriter instance
 * @param options - Configuration options
 * @param options.showDuration - How long the show animation takes (default: 400ms)
 * @param options.hideDuration - How long the hide animation takes (default: 200ms)
 * @param options.displayTime - How long to show the character before hiding (default: 1000ms)
 */
export function revealCharacterSafely(
    writer: HanziWriter,
    options: {
        showDuration?: number;
        hideDuration?: number;
        displayTime?: number;
    } = {}
): void {
    const {
        showDuration = 400,
        hideDuration = 200,
        displayTime = 1000
    } = options;

    // Step 1: Safety reset - ensure character is hidden first
    // This prevents any lingering visibility state from previous operations
    try {
        writer.hideCharacter({ duration: 0 });
    } catch (e) {
        // Ignore - character might already be hidden
    }

    // Step 2: Show the character with animation
    writer.showCharacter({ duration: showDuration });

    // Step 3: Hide after display time
    setTimeout(() => {
        try {
            // CRITICAL: Must use {duration} option or strokes won't show after reveal
            writer.hideCharacter({ duration: hideDuration });
        } catch (e) {
            console.warn('Error hiding character:', e);
        }
    }, displayTime);
}

/**
 * Safely hide a character in quiz mode
 *
 * Always use this instead of calling writer.hideCharacter() directly
 * to ensure the {duration} parameter is provided.
 *
 * @param writer - The HanziWriter instance
 * @param duration - Animation duration in milliseconds (default: 200ms)
 */
export function hideCharacterSafely(
    writer: HanziWriter,
    duration: number = 200
): void {
    try {
        // CRITICAL: Always provide {duration} to prevent stroke visibility issues
        writer.hideCharacter({ duration });
    } catch (e) {
        console.warn('Error hiding character:', e);
    }
}

/**
 * Safely show a character in quiz mode
 *
 * @param writer - The HanziWriter instance
 * @param duration - Animation duration in milliseconds (default: 400ms)
 */
export function showCharacterSafely(
    writer: HanziWriter,
    duration: number = 400
): void {
    try {
        writer.showCharacter({ duration });
    } catch (e) {
        console.warn('Error showing character:', e);
    }
}
