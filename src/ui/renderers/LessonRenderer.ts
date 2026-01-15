import type { IUIManager } from '../../types';
import { getLessons, getLessonProgress } from '../../data';

/**
 * Renders the lesson selection screen
 */
export class LessonRenderer {
    private manager: IUIManager;

    constructor(manager: IUIManager) {
        this.manager = manager;
    }

    /**
     * Show lesson selection screen
     */
    show(
        onLessonSelect: (lessonId: number, wordLimit: number) => void,
        _onProgressClick?: () => void,
        _onPracticeClick?: () => void
    ): void {
        console.log('LessonRenderer.show started');
        try {
            this.manager.updateHeaderTitle('心织笔耕');
            this.manager.toggleMainHeader(true);
            this.manager.toggleBackBtn(false);
            this.manager.toggleHeaderStats(false);

            const content = document.createElement('div');
            content.className = 'lesson-select';

            const title = document.createElement('h2');
            title.className = 'screen-title';
            title.innerText = '选择课程';
            content.appendChild(title);

            // Scroll container for Shan Shui scroll effect
            const lessonGrid = document.createElement('div');
            lessonGrid.className = 'lesson-grid';

            const lessons = getLessons() || [];
            if (lessons.length === 0) console.warn('No lessons found!');

            lessons.forEach((lesson, _index) => {
                const card = document.createElement('div');
                // Check if active (unlocked logic to be implemented, for now all active)
                const isActive = true;
                card.className = `lesson-card ${isActive ? 'active' : 'locked'}`;

                // Progress ring color based on completion
                const progress = getLessonProgress(lesson.id);
                const progressPercent = Math.round(progress * 100);

                card.innerHTML = `
                <div class="lesson-progress-ring">
                    <div class="lesson-number">${lesson.id}</div>
                </div>
                <div class="lesson-info">
                    <h3 class="lesson-title">${lesson.title}</h3>
                    <div class="lesson-stats">
                        <span>${lesson.phrases.length} 词语</span>
                        ${progressPercent > 0 ? `<span class="lesson-completion">${progressPercent}% 完成</span>` : ''}
                    </div>
                </div>
            `;

                card.onclick = () => {
                    onLessonSelect(lesson.id, 0); // 0 = all words
                };

                lessonGrid.appendChild(card);
            });

            content.appendChild(lessonGrid);

            this.manager.transitionView(() => {
                try {
                    const app = document.querySelector('.game-stage') as HTMLElement;
                    if (app) {
                        // Clear existing content to ensure clean render state
                        app.innerHTML = '';
                        app.classList.remove('hidden'); // Ensure it's visible
                        app.style.display = 'flex'; // Enforce flex

                        this.manager.toggleActiveGameUI(false);
                        app.appendChild(content);
                    } else {
                        console.error('Game stage not found!');
                    }
                    this.manager.updateDashboardStats();

                    // Update active state in footer
                    document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
                    document.getElementById('start-btn')?.classList.add('active');
                } catch (e) {
                    console.error('Error inside transition callback:', e);
                }
            });
        } catch (e) {
            console.error('Error in LessonRenderer.show:', e);
        }
    }
}
