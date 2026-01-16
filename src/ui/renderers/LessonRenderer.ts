import type { IUIManager } from '../../types';
import { getLessons, getLessonProgress } from '../../data';
import { CardFactory } from '../components/CardFactory';

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
        onLessonSelect: (lessonId: number, wordLimit: number, mode?: 'tingxie' | 'xizi') => void,
        _onProgressClick?: () => void,
        _onPracticeClick?: () => void
    ): void {
        console.log('LessonRenderer.show started');
        try {
            this.manager.updateHeaderTitle('听写练习');
            // Reset main header visibility
            this.manager.toggleMainHeader(true);
            this.manager.toggleBackBtn(false); // No back button on root screen
            this.manager.toggleHeaderStats(false); // Hide stats counter

            const content = document.createElement('div');
            content.className = 'lesson-select';

            // Title removed as it's now in the header

            // Get all categories
            const lessons = getLessons() || [];
            if (lessons.length === 0) console.warn('No lessons found!');

            const categories = ['全部', ...new Set(lessons.map(l => l.category).filter(Boolean))];
            let selectedCategory = '全部';

            // Filter Bar removed as per user request to clean up UI (was causing artifacts)

            // Lesson Grid Container
            const lessonGrid = document.createElement('div');
            lessonGrid.className = 'lesson-grid';

            const renderLessons = (category: string) => {
                lessonGrid.innerHTML = '';
                const filteredLessons = category === '全部'
                    ? lessons
                    : lessons.filter(l => l.category === category);

                filteredLessons.forEach((lesson, _index) => {
                    const card = CardFactory.createLessonCard({
                        id: lesson.id,
                        title: lesson.title,
                        metaText: `${lesson.phrases.length} 词`,
                        progress: getLessonProgress(lesson.id),
                        onClick: () => this.showModeSelectionModal(lesson.id, lesson.title, onLessonSelect)
                    });

                    lessonGrid.appendChild(card);
                });
            };

            // Removed Filter Chip rendering loop

            content.appendChild(lessonGrid);

            renderLessons(selectedCategory);

            this.manager.transitionView(() => {
                try {
                    const app = document.querySelector('.game-stage') as HTMLElement;
                    if (app) {
                        app.innerHTML = '';
                        app.classList.remove('hidden');
                        app.style.display = 'flex';

                        this.manager.toggleActiveGameUI(false);
                        app.appendChild(content);
                    } else {
                        console.error('Game stage not found!');
                    }
                    this.manager.updateDashboardStats();

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

    /**
     * Show mode selection modal (Tingxie vs Xizi)
     */
    private showModeSelectionModal(
        lessonId: number,
        lessonTitle: string,
        onSelect: (lessonId: number, limit: number, mode: 'tingxie' | 'xizi') => void
    ): void {
        const modalId = 'mode-selection-modal';
        let modal = document.getElementById(modalId);

        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <h2 class="modal-title">${lessonTitle}</h2>
                <div class="mode-options">
                    <button id="mode-tingxie" class="mode-btn mode-btn-primary">
                        <div class="mode-btn-content">
                            <span class="mode-btn-icon">📝</span>
                            <div class="mode-btn-text">
                                <div class="mode-btn-title">听写模式</div>
                                <div class="mode-btn-desc">听音写字，考验记忆</div>
                            </div>
                        </div>
                        <span class="mode-btn-arrow">›</span>
                    </button>

                    <button id="mode-xizi" class="mode-btn mode-btn-secondary">
                        <div class="mode-btn-content">
                            <span class="mode-btn-icon">✍️</span>
                            <div class="mode-btn-text">
                                <div class="mode-btn-title">习字模式</div>
                                <div class="mode-btn-desc">描摹笔画，练习书写</div>
                            </div>
                        </div>
                        <span class="mode-btn-arrow">›</span>
                    </button>
                </div>
            </div>
        `;

        // Show back button to close modal
        this.manager.toggleBackBtn(true);

        modal.classList.add('show');

        // Handlers
        const close = () => {
            modal?.classList.remove('show');
            this.manager.toggleBackBtn(false); // Hide back button when modal closes
        };

        // Wire back button to close modal
        const backBtn = document.getElementById('header-back-btn');
        const backHandler = () => close();
        backBtn?.addEventListener('click', backHandler, { once: true });

        document.getElementById('mode-tingxie')?.addEventListener('click', () => {
            close();
            onSelect(lessonId, 0, 'tingxie');
        });

        document.getElementById('mode-xizi')?.addEventListener('click', () => {
            close();
            onSelect(lessonId, 0, 'xizi');
        });

        modal.onclick = (e) => {
            if (e.target === modal) close();
        };
    }
}
