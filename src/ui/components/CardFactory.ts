/**
 * Factory for creating standardized UI cards
 */
export class CardFactory {
    /**
     * Create a standard Lesson/Dictation card
     * 
     * @param options Configuration options for the card
     * @returns HTMLElement The constructed card element
     */
    static createLessonCard(options: {
        id: number | string;
        title: string;
        metaText: string;
        progress: number; // 0 to 1
        onClick: () => void;
        isLocked?: boolean;
    }): HTMLElement {
        const { id, title, metaText, progress, onClick, isLocked } = options;

        const card = document.createElement('div');
        // Standard class 'lesson-card', adding 'locked' if needed
        card.className = `lesson-card ${isLocked ? 'locked' : ''}`;

        // SVG Progress Ring Calculations
        const radius = 16;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (progress * circumference);

        card.innerHTML = `
            <div class="lesson-progress-ring">
                 <svg width="40" height="40" viewBox="0 0 40 40">
                    <circle class="ring-bg" cx="20" cy="20" r="${radius}"></circle>
                    <circle class="ring-fill" cx="20" cy="20" r="${radius}" 
                        stroke-dasharray="${circumference}" 
                        stroke-dashoffset="${offset}"></circle>
                </svg>
                <div class="lesson-number">${id}</div>
            </div>
            <div class="lesson-info" style="display: flex; flex-direction: column; justify-content: center;">
                 <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <h3 class="lesson-title" style="margin: 0;">${title}</h3>
                    <span style="font-size: 0.9rem; color: #94a3b8; white-space: nowrap; margin-left: 10px;">${metaText}</span>
                </div>
            </div>
        `;

        card.onclick = onClick;
        return card;
    }
}
