import type { IUIManager } from '../../types';
import { getLessonProgress } from '../../data';
import { CardFactory } from '../components/CardFactory';
import { TabbedNav } from '../components/TabbedNav';
import { getLessonsBySet, getAvailableSets } from '../../data/sets';

/**
 * Renders the lesson selection screen
 */
export class LessonRenderer {
    private manager: IUIManager;
    private tabbedNav: TabbedNav | null = null;

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

            // Create tabbed navigation
            const sets = getAvailableSets();
            this.tabbedNav = new TabbedNav({
                tabs: sets.map(set => ({ id: set.id, label: set.name })),
                initialTab: 'A',
                onTabChange: (setId) => this.renderLessonsForSet(setId, onLessonSelect)
            });

            this.manager.transitionView(() => {
                try {
                    const app = document.querySelector('.game-stage') as HTMLElement;
                    if (app) {
                        app.innerHTML = '';
                        app.classList.remove('hidden');
                        app.style.display = 'flex';

                        this.manager.toggleActiveGameUI(false);

                        if (this.tabbedNav) {
                            app.appendChild(this.tabbedNav.getElement());
                            // Render initial set
                            this.renderLessonsForSet('A', onLessonSelect);
                        }
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
     * Render lessons for a specific set
     */
    private renderLessonsForSet(
        setId: string,
        onLessonSelect: (lessonId: number, wordLimit: number, mode?: 'tingxie' | 'xizi') => void
    ): void {
        if (!this.tabbedNav) return;

        const contentContainer = this.tabbedNav.getContentContainer();
        contentContainer.innerHTML = '';

        const lessonSelect = document.createElement('div');
        lessonSelect.className = 'lesson-select';

        const lessonGrid = document.createElement('div');
        lessonGrid.className = 'lesson-grid';

        const lessons = getLessonsBySet(setId);

        lessons.forEach((lesson) => {
            const card = CardFactory.createLessonCard({
                id: lesson.id,
                title: lesson.title,
                metaText: `${lesson.phrases.length} 词`,
                progress: getLessonProgress(lesson.id),
                onClick: () => this.showModeSelectionModal(lesson.id, lesson.title, lesson.phrases.length, onLessonSelect)
            });

            lessonGrid.appendChild(card);
        });

        if (lessons.length === 0) {
            lessonGrid.innerHTML = '<div style="padding: 24px; color: var(--tang-ink-light);">暂无课程</div>';
        }

        lessonSelect.appendChild(lessonGrid);
        contentContainer.appendChild(lessonSelect);
    }

    /**
     * Hide tabs when entering practice mode
     */
    hideTabs(): void {
        if (this.tabbedNav) {
            const tabsElement = this.tabbedNav.getElement();
            if (tabsElement) {
                tabsElement.classList.add('hide-tabs');
            }
        }
        // Also hide any tabs-container elements directly
        document.querySelectorAll('.tabs-container').forEach(el => {
            (el as HTMLElement).classList.add('hidden');
        });
    }

    /**
     * Show tabs when returning to selection mode
     */
    showTabs(): void {
        if (this.tabbedNav) {
            const tabsElement = this.tabbedNav.getElement();
            if (tabsElement) {
                tabsElement.classList.remove('hide-tabs');
            }
        }
        // Also show any tabs-container elements
        document.querySelectorAll('.tabs-container').forEach(el => {
            (el as HTMLElement).classList.remove('hidden');
        });
    }

    /**
     * Show mode selection modal (Tingxie vs Xizi)
     */
    private showModeSelectionModal(
        lessonId: number,
        lessonTitle: string,
        phraseCount: number,
        onSelect: (lessonId: number, limit: number, mode: 'tingxie' | 'xizi') => void
    ): void {
        console.log('showModeSelectionModal called for lesson:', lessonId, lessonTitle);
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
                    </button>

                    <button id="mode-xizi" class="mode-btn mode-btn-secondary">
                        <div class="mode-btn-content">
                            <span class="mode-btn-icon">✍️</span>
                            <div class="mode-btn-text">
                                <div class="mode-btn-title">习字模式</div>
                                <div class="mode-btn-desc">描摹笔画，练习书写</div>
                            </div>
                        </div>
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
            // Show word count selection modal for tingxie mode
            this.showWordCountModal(lessonId, lessonTitle, phraseCount, onSelect);
        });

        document.getElementById('mode-xizi')?.addEventListener('click', () => {
            close();
            onSelect(lessonId, 0, 'xizi');
        });

        modal.onclick = (e) => {
            if (e.target === modal) close();
        };
    }

    /**
     * Show word count selection modal for tingxie mode
     */
    private showWordCountModal(
        lessonId: number,
        lessonTitle: string,
        totalWords: number,
        onSelect: (lessonId: number, limit: number, mode: 'tingxie' | 'xizi') => void
    ): void {
        const modalId = 'word-count-modal';
        let modal = document.getElementById(modalId);

        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        // Create button options based on available words
        const options = [];

        if (totalWords >= 5) {
            options.push({ limit: 5, label: '5 词', desc: '快速练习' });
        }

        if (totalWords >= 10) {
            options.push({ limit: 10, label: '10 词', desc: '标准练习' });
        }

        options.push({ limit: 0, label: `全部 ${totalWords} 词`, desc: '完整掌握' });

        const optionsHTML = options.map((opt, index) => `
            <button class="mode-btn ${index === options.length - 1 ? 'mode-btn-primary' : 'mode-btn-secondary'}" data-limit="${opt.limit}">
                <div class="mode-btn-content">
                    <span class="mode-btn-icon">${index === 0 ? '⚡' : index === 1 ? '📚' : '🎯'}</span>
                    <div class="mode-btn-text">
                        <div class="mode-btn-title">${opt.label}</div>
                        <div class="mode-btn-desc">${opt.desc}</div>
                    </div>
                </div>
            </button>
        `).join('');

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <h2 class="modal-title">${lessonTitle}</h2>
                <p style="text-align: center; color: var(--tang-ink-light); margin-bottom: 20px; font-size: 0.95rem;">
                    选择练习数量
                </p>
                <div class="mode-options">
                    ${optionsHTML}
                </div>
            </div>
        `;

        // Show back button to close modal
        this.manager.toggleBackBtn(true);

        modal.classList.add('show');

        // Handlers
        const close = () => {
            modal?.classList.remove('show');
            this.manager.toggleBackBtn(false);
        };

        // Wire back button to close modal
        const backBtn = document.getElementById('header-back-btn');
        const backHandler = () => close();
        backBtn?.addEventListener('click', backHandler, { once: true });

        // Add click handlers to all option buttons
        modal.querySelectorAll('[data-limit]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const limit = parseInt((btn as HTMLElement).dataset.limit || '0');
                close();
                onSelect(lessonId, limit, 'tingxie');
            });
        });

        modal.onclick = (e) => {
            if (e.target === modal) close();
        };
    }

    /**
     * Cleanup resources and event listeners
     */
    destroy(): void {
        if (this.tabbedNav) {
            this.tabbedNav.destroy();
            this.tabbedNav = null;
        }
    }
}
