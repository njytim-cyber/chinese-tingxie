/**
 * SVG Utilities - Centralized SVG definitions to eliminate duplication
 *
 * This module provides reusable SVG components used throughout the app,
 * particularly gradient definitions for coins and icons.
 */

/**
 * Gold coin gradient definition (used in stats, achievements, etc.)
 * Creates a linear gradient from bronze -> gold -> bronze
 */
export const GOLD_GRADIENT_DEFS = `
<defs>
    <linearGradient id="y-body" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#B45309"/>
        <stop offset="50%" stop-color="#fbbf24"/>
        <stop offset="100%" stop-color="#B45309"/>
    </linearGradient>
</defs>
`;

/**
 * Creates a complete gold coin SVG icon
 * @param size - Size in pixels (default: 24)
 * @param className - Optional CSS class name
 * @returns Complete SVG markup
 */
export function createGoldCoinSVG(size: number = 24, className: string = ''): string {
    return `
<svg width="${size}" height="${size}" viewBox="0 0 24 24" class="${className}" xmlns="http://www.w3.org/2000/svg">
    ${GOLD_GRADIENT_DEFS}
    <circle cx="12" cy="12" r="10" fill="url(#y-body)" stroke="#92400e" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="6" fill="none" stroke="#fef3c7" stroke-width="1" opacity="0.5"/>
</svg>`.trim();
}

/**
 * Creates a streak flame SVG icon
 * @param size - Size in pixels (default: 24)
 * @param className - Optional CSS class name
 * @returns SVG markup for flame icon
 */
export function createFlameIconSVG(size: number = 24, className: string = ''): string {
    return `
<svg width="${size}" height="${size}" viewBox="0 0 24 24" class="${className}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="flame-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#dc2626"/>
            <stop offset="50%" stop-color="#f97316"/>
            <stop offset="100%" stop-color="#fbbf24"/>
        </linearGradient>
    </defs>
    <path d="M12 2C8 6 6 10 6 14c0 3.31 2.69 6 6 6s6-2.69 6-6c0-4-2-8-6-12zm0 15c-1.66 0-3-1.34-3-3 0-1.5 1-3 3-5 2 2 3 3.5 3 5 0 1.66-1.34 3-3 3z"
          fill="url(#flame-gradient)"/>
</svg>`.trim();
}

/**
 * Creates a progress ring SVG for lesson cards
 * @param progress - Progress value 0-1
 * @param size - Size in pixels (default: 40)
 * @param strokeWidth - Width of the ring stroke (default: 3)
 * @returns SVG markup for progress ring
 */
export function createProgressRingSVG(
    progress: number,
    size: number = 40,
    strokeWidth: number = 3
): string {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - progress);
    const center = size / 2;

    return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="progress-ring">
    <defs>
        <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="var(--tang-jade)"/>
            <stop offset="100%" stop-color="var(--tang-red)"/>
        </linearGradient>
    </defs>
    <circle class="ring-bg"
        cx="${center}"
        cy="${center}"
        r="${radius}"
        fill="none"
        stroke="rgba(0,0,0,0.1)"
        stroke-width="${strokeWidth}"/>
    <circle class="ring-progress"
        cx="${center}"
        cy="${center}"
        r="${radius}"
        fill="none"
        stroke="url(#ring-gradient)"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${offset}"
        stroke-linecap="round"
        transform="rotate(-90 ${center} ${center})"/>
</svg>`.trim();
}

/**
 * Injects SVG definitions into the document head (for global gradients)
 * Call this once during app initialization to make gradients available globally
 */
export function injectGlobalSVGDefs(): void {
    const existingDefs = document.getElementById('global-svg-defs');
    if (existingDefs) {
        return; // Already injected
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'global-svg-defs';
    svg.style.display = 'none';
    svg.style.position = 'absolute';
    svg.innerHTML = `
        ${GOLD_GRADIENT_DEFS}
        <linearGradient id="flame-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#dc2626"/>
            <stop offset="50%" stop-color="#f97316"/>
            <stop offset="100%" stop-color="#fbbf24"/>
        </linearGradient>
        <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="var(--tang-jade)"/>
            <stop offset="100%" stop-color="var(--tang-red)"/>
        </linearGradient>
    `;

    document.body.appendChild(svg);
}
