import type { IUIManager } from '../../types';
import { DictationPassage, DictationChunk, CharBox } from '../../types';
import { CardFactory } from '../components/CardFactory';
import { TabbedNav } from '../components/TabbedNav';
import { getDictationPassagesBySet, getAvailableSets } from '../../data/sets';

/**
 * Renders the dictation selection and game screens
 */
export class DictationRenderer {
    private manager: IUIManager;
    private tabbedNav: TabbedNav | null = null;

    constructor(manager: IUIManager) {
        this.manager = manager;
    }

    /**
     * Show dictation passage selection
     */
    showSelect(onStartDictation: (passage: DictationPassage) => void): void {
        this.manager.updateHeaderTitle('默写练习');
        this.manager.toggleMainHeader(true);
        this.manager.toggleBackBtn(false);
        this.manager.toggleAvatar(true);
        this.manager.toggleHeaderStats(false); // Hide stats in dictation mode

        // Remove header progress bar if it exists
        const progressBar = document.getElementById('dictation-header-progress');
        if (progressBar) progressBar.remove();

        // Clean up previous tabbed nav if exists
        if (this.tabbedNav) {
            this.tabbedNav.destroy();
            this.tabbedNav = null;
        }

        // Create tabbed navigation
        const sets = getAvailableSets();
        this.tabbedNav = new TabbedNav({
            tabs: sets.map(set => ({ id: set.id, label: set.name })),
            initialTab: 'A',
            onTabChange: (setId) => this.renderPassagesForSet(setId, onStartDictation)
        });

        this.manager.transitionView(() => {
            const app = document.querySelector('.game-stage') as HTMLElement;
            if (app) {
                app.innerHTML = '';
                app.classList.remove('hidden');
                app.style.display = 'flex';

                this.manager.toggleActiveGameUI(false);

                if (this.tabbedNav) {
                    app.appendChild(this.tabbedNav.getElement());
                    // Render initial set
                    this.renderPassagesForSet('A', onStartDictation);
                }
            }
            this.manager.updateDashboardStats();

            // Update active state in footer
            document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
            document.getElementById('dictation-btn')?.classList.add('active');
        });
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
     * Render dictation passages for a specific set
     */
    private async renderPassagesForSet(
        setId: string,
        onStartDictation: (passage: DictationPassage) => void
    ): Promise<void> {
        if (!this.tabbedNav) return;

        const contentContainer = this.tabbedNav.getContentContainer();
        contentContainer.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--tang-ink-light);">加载中...</div>';

        try {
            const passages = await getDictationPassagesBySet(setId);

            contentContainer.innerHTML = '';

            const lessonSelect = document.createElement('div');
            lessonSelect.className = 'lesson-select';

            const lessonGrid = document.createElement('div');
            lessonGrid.className = 'lesson-grid';

            // For Set B, use grouped/accordion view
            if (setId === 'B') {
                console.log('Rendering Set B with', passages.length, 'passages');
                const grouped = this.groupPassagesByLesson(passages);
                console.log('Grouped into', grouped.length, 'lesson groups:', grouped);

                grouped.forEach((group) => {
                    const groupContainer = this.createLessonGroup(group, onStartDictation);
                    lessonGrid.appendChild(groupContainer);
                });
            } else {
                // For Set A, use flat card list
                passages.forEach((passage) => {
                    const shortenedTitle = DictationRenderer.shortenTitle(passage.title);
                    const card = CardFactory.createLessonCard({
                        id: passage.id,
                        title: shortenedTitle,
                        metaText: `${passage.text.length} 字`,
                        progress: 0,
                        onClick: () => {
                            console.log('Dictation card clicked:', passage.id, passage.title);
                            onStartDictation(passage);
                        }
                    });

                    lessonGrid.appendChild(card);
                });
            }

            if (passages.length === 0) {
                lessonGrid.innerHTML = '<div style="padding: 24px; color: var(--tang-ink-light);">暂无篇章</div>';
            }

            lessonSelect.appendChild(lessonGrid);
            contentContainer.appendChild(lessonSelect);
        } catch (err) {
            console.error('Error loading dictation:', err);
            // Sanitize error message to prevent XSS
            const errorDiv = document.createElement('div');
            errorDiv.style.padding = '24px';
            errorDiv.style.color = 'var(--tang-red)';
            errorDiv.textContent = `加载失败: ${err instanceof Error ? err.message : '未知错误'}`;
            contentContainer.innerHTML = '';
            contentContainer.appendChild(errorDiv);
        }
    }

    /**
     * Group passages by lesson number
     */
    private groupPassagesByLesson(passages: DictationPassage[]): {
        lessonNum: number;
        title: string;
        passages: DictationPassage[]
    }[] {
        const groups = new Map<number, { title: string; passages: DictationPassage[] }>();

        passages.forEach((passage) => {
            // Extract lesson number from title like "第1课 - 高兴/笑"
            const match = passage.title.match(/第(\d+)课\s*-\s*(.+?)(?:\s*\(\d+\))?$/);
            if (match) {
                const lessonNum = parseInt(match[1], 10);
                const theme = match[2];

                if (!groups.has(lessonNum)) {
                    groups.set(lessonNum, { title: `第${lessonNum}课 - ${theme}`, passages: [] });
                }
                groups.get(lessonNum)!.passages.push(passage);
            }
        });

        // Convert to array and sort by lesson number
        return Array.from(groups.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([lessonNum, data]) => ({ lessonNum, ...data }));
    }

    /**
     * Create an accordion group for a lesson
     */
    private createLessonGroup(
        group: { lessonNum: number; title: string; passages: DictationPassage[] },
        onStartDictation: (passage: DictationPassage) => void
    ): HTMLElement {
        const groupContainer = document.createElement('div');
        groupContainer.className = 'lesson-group';

        // Header (clickable to expand/collapse)
        const header = document.createElement('div');
        header.className = 'lesson-group-header';

        const titleSection = document.createElement('div');
        titleSection.className = 'lesson-group-title-section';

        const title = document.createElement('div');
        title.className = 'lesson-group-title';
        title.textContent = group.title;

        const count = document.createElement('div');
        count.className = 'lesson-group-count';
        count.textContent = `${group.passages.length} 篇`;

        titleSection.appendChild(title);
        titleSection.appendChild(count);

        // Chevron icon
        const chevron = document.createElement('svg');
        chevron.className = 'lesson-group-chevron';
        chevron.setAttribute('viewBox', '0 0 24 24');
        chevron.setAttribute('fill', 'none');
        chevron.setAttribute('stroke', 'currentColor');
        chevron.setAttribute('stroke-width', '2');
        chevron.innerHTML = '<path d="M6 9l6 6 6-6"/>';

        header.appendChild(titleSection);
        header.appendChild(chevron);

        // Content (passages)
        const content = document.createElement('div');
        content.className = 'lesson-group-content';

        group.passages.forEach((passage, index) => {
            const passageTitle = group.passages.length > 1 ? `篇章 ${index + 1}` : passage.title;
            const displayId = `${group.lessonNum}.${index + 1}`;
            const card = CardFactory.createLessonCard({
                id: displayId,
                title: passageTitle,
                metaText: `${passage.text.length} 字`,
                progress: 0,
                onClick: () => {
                    console.log('Dictation card clicked:', passage.id, passage.title);
                    onStartDictation(passage);
                }
            });

            content.appendChild(card);
        });

        // Toggle expand/collapse
        header.onclick = () => {
            const isExpanded = header.classList.contains('expanded');
            if (isExpanded) {
                header.classList.remove('expanded');
                content.classList.remove('expanded');
            } else {
                header.classList.add('expanded');
                content.classList.add('expanded');
            }
        };

        groupContainer.appendChild(header);
        groupContainer.appendChild(content);

        return groupContainer;
    }

    /**
     * Render the main dictation game area
     */
    renderGame(
        container: HTMLElement,
        completedText: string,
        currentChunk: DictationChunk,
        charBoxes: CharBox[],
        currentCharIndex: number,
        validCharIndices: number[],
        callbacks: {
            onPrev: () => void;
            onNext: () => void;
            onPlayAudio: () => void;
            onToggleGrid: () => void;
            onShowHint: () => void;
            onReveal: () => void;
            onJumpTo: (index: number) => void;
        }
    ): void {
        container.innerHTML = '';
        container.classList.add('dictation-container');

        // Title removed - it's already in the header

        // 1. Completed Phrases Display (Outside card)
        const completedArea = document.createElement('div');
        completedArea.className = 'dictation-completed-phrases';

        if (completedText) {
            completedArea.textContent = completedText;
            completedArea.style.color = 'var(--success)';
        } else {
            completedArea.textContent = '您输入的词组将显示在这里...';
            completedArea.style.color = 'var(--tang-ink-light)';
            completedArea.style.opacity = '0.6';
            completedArea.style.fontSize = '1.2rem';
        }
        container.appendChild(completedArea);

        // Progress bar (positioned between completed text and white card)
        const progressBar = document.createElement('div');
        progressBar.id = 'dictation-header-progress';
        progressBar.className = 'dictation-header-progress';
        container.appendChild(progressBar);

        // 2. White Card Wrapper (matching 听写 mode)
        const card = document.createElement('div');
        card.className = 'writing-card';

        // 3. Carousel Wrapper
        const carousel = document.createElement('div');
        carousel.className = 'spelling-carousel';


        // Single char container
        const charContainer = document.createElement('div');
        charContainer.className = 'spelling-chars-container';
        charContainer.style.display = 'flex';
        charContainer.style.justifyContent = 'center';

        // Create char boxes
        validCharIndices.forEach((globalIdx) => {
            // We use standard HTML structure that DictationManager expects for HanziWriter
            const charBox = document.createElement('div');
            // Initial classes set here, but updateCarouselView handles visibility
            charBox.className = 'char-box spelling-hidden';
            charBox.id = `dictation-box-${globalIdx}`;

            const slot = document.createElement('div');
            slot.id = `dictation-char-${globalIdx}`; // ID used by HanziWriter
            slot.className = 'char-slot grid-mi';

            const pinyinLabel = document.createElement('div');
            pinyinLabel.className = 'char-pinyin-label';
            pinyinLabel.textContent = currentChunk.pinyin[globalIdx - currentChunk.start] || '';

            charBox.appendChild(slot);
            charBox.appendChild(pinyinLabel);
            charContainer.appendChild(charBox);
        });

        carousel.appendChild(charContainer);

        // Indicator dots (placed above buttons)
        const indicators = document.createElement('div');
        indicators.className = 'dictation-indicators';
        indicators.id = 'dictation-indicators';
        carousel.appendChild(indicators);

        // 5-Button Toolbar (Matching Spelling/Design)
        const toolbar = document.createElement('div');
        toolbar.className = 'card-toolbar';

        // 1. Audio Button
        const audioBtn = document.createElement('button');
        audioBtn.className = 'tool-btn';
        audioBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 010 7.07"/><path d="M18.37 5.64a9 9 0 010 12.73"/></svg>`;
        audioBtn.title = '听读音';
        audioBtn.onclick = callbacks.onPlayAudio;

        // 2. Grid Button
        const gridBtn = document.createElement('button');
        gridBtn.className = 'tool-btn';
        gridBtn.id = 'btn-grid'; // Added for consistency
        gridBtn.title = '切换格线';
        gridBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M12 3v18"/></svg>`;
        gridBtn.onclick = callbacks.onToggleGrid;

        // 3. Hint Button
        const hintBtn = document.createElement('button');
        hintBtn.className = 'tool-btn';
        hintBtn.title = '提示';
        hintBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2C8 2 5 5.5 5 9c0 2.5 2 5 3 6v2a2 2 0 002 2h4a2 2 0 002-2v-2c1-1 3-3.5 3-6 0-3.5-3-7-7-7z"/><path d="M9 21h6"/></svg>`;
        hintBtn.onclick = callbacks.onShowHint;

        // 4. Reveal Button
        const revealBtn = document.createElement('button');
        revealBtn.className = 'tool-btn';
        revealBtn.title = '显示';
        revealBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/></svg>`;
        revealBtn.onclick = callbacks.onReveal;

        toolbar.appendChild(audioBtn);
        toolbar.appendChild(gridBtn);
        toolbar.appendChild(hintBtn);
        toolbar.appendChild(revealBtn);

        carousel.appendChild(toolbar);

        // Append carousel to card, then card to container
        card.appendChild(carousel);
        container.appendChild(card);

        // Enhanced swipe support for easier navigation
        let touchStartX = 0;
        let touchStartY = 0;

        const handleTouchStart = (e: TouchEvent) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;

            // Only trigger swipe if horizontal movement is dominant
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) callbacks.onNext();
                else callbacks.onPrev();
            }
        };

        // Add swipe to indicators
        indicators.addEventListener('touchstart', handleTouchStart, { passive: true });
        indicators.addEventListener('touchend', handleTouchEnd, { passive: true });

        // Add swipe to card area for easier swiping
        card.addEventListener('touchstart', handleTouchStart, { passive: true });
        card.addEventListener('touchend', handleTouchEnd, { passive: true });

        // Initial view update
        this.updateCarouselView(currentCharIndex, validCharIndices, charBoxes, callbacks.onJumpTo);
    }

    /**
     * Update carousel visibility state
     */
    updateCarouselView(
        currentCharIndex: number,
        validCharIndices: number[],
        charBoxes: CharBox[],
        onJumpTo?: (index: number) => void
    ): void {
        const boxes = document.querySelectorAll('.spelling-chars-container .char-box');
        boxes.forEach((box, i) => {
            if (i === currentCharIndex) {
                box.classList.remove('spelling-hidden');
                box.classList.add('spelling-active');
                box.querySelector('.char-slot')?.classList.add('active');

                // Auto-scroll to active character on mobile
                if (window.innerWidth <= 600) {
                    setTimeout(() => {
                        box.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                            inline: 'center'
                        });
                    }, 100);
                }
            } else {
                box.classList.add('spelling-hidden');
                box.classList.remove('spelling-active');
                box.querySelector('.char-slot')?.classList.remove('active');
            }
        });


        // Update indicators (dots)
        const indicatorsEl = document.getElementById('dictation-indicators');
        if (indicatorsEl) {
            indicatorsEl.innerHTML = '';
            validCharIndices.forEach((_, i) => {
                const dot = document.createElement('div');
                dot.className = `indicator-dot ${i === currentCharIndex ? 'active' : ''}`;

                if (onJumpTo) {
                    dot.style.cursor = 'pointer';
                    dot.onclick = () => onJumpTo(i);
                }

                // If it's correct, show a tick or different color
                const globalIdx = validCharIndices[i];
                if (charBoxes[globalIdx].isCorrect) {
                    dot.classList.add('correct');
                }

                indicatorsEl.appendChild(dot);
            });
        }
    }

    /**
     * Render footer progress bar
     */
    renderFooterProgress(chunks: DictationChunk[], currentChunkIndex: number): void {
        const footer = document.getElementById('footer-progress');
        if (!footer) return;

        footer.innerHTML = '';

        // Score Display
        let currentScore = 0;
        let currentMax = 0;
        chunks.forEach((chunk, index) => {
            if (index < currentChunkIndex) {
                currentScore += chunk.score;
                currentMax += 2;
            }
        });

        // Update HUD star counter (Sync with spelling mode layout)
        this.manager.updateHud(currentScore, 0);

        const bar = document.createElement('div');
        bar.className = 'dictation-progress-bar';

        chunks.forEach((_, index) => {
            const segment = document.createElement('div');
            segment.className = 'dictation-progress-segment';

            if (index < currentChunkIndex) {
                segment.classList.add('completed');
            } else if (index === currentChunkIndex) {
                segment.classList.add('current');
            }

            bar.appendChild(segment);
        });

        footer.appendChild(bar);
    }

    /**
     * Render header progress bar
     */
    renderHeaderProgress(chunks: DictationChunk[], currentChunkIndex: number): void {
        // Find progress bar container (it's now in the dictation container)
        const progressContainer = document.getElementById('dictation-header-progress');

        if (!progressContainer) {
            console.warn('Progress bar container not found');
            return;
        }

        // Calculate progress percentage
        const progress = chunks.length > 0 ? (currentChunkIndex / chunks.length) * 100 : 0;

        // Update progress bar
        progressContainer.innerHTML = `
            <div class="dictation-progress-fill" style="width: ${progress}%"></div>
        `;
    }

    showResult(score: number, total: number, onContinue: () => void): void {
        // Remove header progress bar when showing result
        const progressBar = document.getElementById('dictation-header-progress');
        if (progressBar) progressBar.remove();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';

        const percentage = Math.round((score / total) * 100);
        let message = '';
        if (percentage === 100) message = '完美！太棒了！';
        else if (percentage >= 80) message = '很棒！继续加油！';
        else if (percentage >= 60) message = '不错，再接再厉。';
        else message = '加油，多练习几次。';

        modal.innerHTML = `
            <div class="modal-content result-card">
                <h2 class="result-title">练习完成</h2>
                <div class="result-score-large">${score} / ${total}</div>
                <div class="result-percentage">${percentage}%</div>
                <p class="result-message">${message}</p>
                <div class="modal-actions">
                    <button class="action-btn-large" id="dictation-continue-btn">完成</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const btn = document.getElementById('dictation-continue-btn');
        if (btn) {
            btn.onclick = () => {
                modal.remove();
                onContinue();
            };
        }
    }

    /**
     * Toggle grid style
     */
    toggleGrid(): void {
        const slots = document.querySelectorAll('.dictation-container .char-slot');
        slots.forEach(slot => {
            if (slot.classList.contains('grid-mi')) {
                slot.classList.remove('grid-mi');
                slot.classList.add('grid-tian');
            } else if (slot.classList.contains('grid-tian')) {
                slot.classList.remove('grid-tian');
            } else {
                slot.classList.add('grid-mi');
            }
        });
    }

    static shortenTitle(title: string): string {
        // Requested: Break at punctuation or reasonable length to prevent truncation of phrases
        const MAX_LEN = 10;

        // If short enough, just return
        if (title.length <= MAX_LEN + 2) return title;

        // Try to split at first punctuation
        const match = title.match(/^([^，。；！？,.;!?]+)[，。；！？,.;!?]/);
        if (match && match[1]) {
            // If the first part is reasonably long (but not TOO long), use it
            if (match[1].length > 2 && match[1].length <= MAX_LEN + 2) {
                return match[1];
            }
        }

        // Fallback: simple truncation
        return title.substring(0, MAX_LEN) + '...';
    }
}
