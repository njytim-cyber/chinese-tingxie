/**
 * Fullscreen Utility
 * Handles entering/exiting fullscreen mode on mobile
 */

/**
 * Check if fullscreen is supported
 */
export function isFullscreenSupported(): boolean {
    return !!(
        document.fullscreenEnabled ||
        (document as any).webkitFullscreenEnabled ||
        (document as any).mozFullScreenEnabled ||
        (document as any).msFullscreenEnabled
    );
}

/**
 * Check if currently in fullscreen
 */
export function isFullscreen(): boolean {
    return !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
    );
}

/**
 * Request fullscreen
 */
export async function enterFullscreen(element: HTMLElement = document.documentElement): Promise<void> {
    try {
        if (element.requestFullscreen) {
            await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
            await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
            await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
            await (element as any).msRequestFullscreen();
        }
    } catch (err) {
        console.warn('Failed to enter fullscreen:', err);
    }
}

/**
 * Exit fullscreen
 */
export async function exitFullscreen(): Promise<void> {
    try {
        if (document.exitFullscreen) {
            await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
            await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
            await (document as any).msExitFullscreen();
        }
    } catch (err) {
        console.warn('Failed to exit fullscreen:', err);
    }
}

/**
 * Toggle fullscreen
 */
export async function toggleFullscreen(element?: HTMLElement): Promise<boolean> {
    if (isFullscreen()) {
        await exitFullscreen();
        return false;
    } else {
        await enterFullscreen(element);
        return true;
    }
}
