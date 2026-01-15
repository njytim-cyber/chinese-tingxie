import type { IUIManager } from '../../types';
import { DictationPassage, DictationChunk, CharBox } from '../../types';

/**
 * Renders the dictation selection and game screens
 */
export class DictationRenderer {
    private manager: IUIManager;

    constructor(manager: IUIManager) {
        this.manager = manager;
    }

    /**
     * Show dictation passage selection
     */
    showSelect(onStartDictation: (passage: any) => void): void {
        this.manager.updateHeaderTitle('心织笔耕');
        this.manager.toggleMainHeader(true);
        this.manager.toggleBackBtn(false);
        this.manager.toggleHeaderStats(false);

        const content = document.createElement('div');
        content.className = 'dictation-lesson-select';

        const title = document.createElement('h2');
        title.className = 'screen-title';
        title.innerText = '默写练习';
        content.appendChild(title);

        const lessonGrid = document.createElement('div');
        lessonGrid.className = 'lesson-grid';

        // Load dictation data
        fetch('/dictation.json')
            .then(res => res.json())
            .then(data => {
                const passages = data.passages || [];
                passages.forEach((passage: any) => {
                    const card = document.createElement('div');
                    card.className = 'lesson-card active';
                    card.innerHTML = `
                        <div class="lesson-progress-ring">
                            <div class="lesson-number">${passage.id}</div>
                        </div>
                        <div class="lesson-info">
                            <h3 class="lesson-title">${passage.title}</h3>
                            <div class="lesson-meta">${passage.chunks.length} 段落 | ${passage.text.length} 字</div>
                        </div>
                    `;
                    card.onclick = () => {
                        console.log('Dictation card clicked:', passage.id, passage.title);
                        onStartDictation(passage);
                    };
                    lessonGrid.appendChild(card);
                });

                if (passages.length === 0) {
                    lessonGrid.innerHTML = '<div style="padding: 24px; color: var(--tang-ink-light);">暂无篇章</div>';
                }
            });

        content.appendChild(lessonGrid);

        this.manager.transitionView(() => {
            const app = document.querySelector('.game-stage');
            if (app) {
                // Remove existing list if any
                const existingList = app.querySelector('.lesson-select, .dictation-lesson-select, .progress-view');
                if (existingList) existingList.remove();

                this.manager.toggleActiveGameUI(false);
                app.appendChild(content);
            }
            this.manager.updateDashboardStats();

            // Update active state in footer
            document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
            document.getElementById('dictation-btn')?.classList.add('active');
        });
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
        }
    ): void {
        container.innerHTML = '';
        container.classList.add('dictation-container');

        // 1. Completed Phrases Display
        const completedArea = document.createElement('div');
        completedArea.className = 'dictation-completed-phrases';

        if (completedText) {
            completedArea.textContent = completedText;
            completedArea.style.color = 'var(--success)';
        }
        container.appendChild(completedArea);

        // 2. Carousel Wrapper
        const carousel = document.createElement('div');
        carousel.className = 'spelling-carousel';

        // Prev button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'spelling-nav-btn';
        prevBtn.id = 'dictation-prev-btn';
        prevBtn.textContent = '❮';
        prevBtn.onclick = callbacks.onPrev;
        // Visibility set by updateCarouselView
        carousel.appendChild(prevBtn);

        // Single char container
        const charContainer = document.createElement('div');
        charContainer.className = 'spelling-chars-container';
        charContainer.style.display = 'flex';
        charContainer.style.justifyContent = 'center';

        // Create char boxes
        validCharIndices.forEach((globalIdx, localIdx) => {
            // We use standard HTML structure that DictationManager expects for HanziWriter
            const box = charBoxes[globalIdx];

            const charBox = document.createElement('div');
            // Initial classes set here, but updateCarouselView handles visibility
            charBox.className = 'char-box spelling-hidden';
            charBox.id = `dictation-box-${globalIdx}`;

            const slot = document.createElement('div');
            slot.id = `dictation-char-${globalIdx}`; // ID used by HanziWriter
            slot.className = 'char-slot grid-mi';
            slot.style.width = '240px';
            slot.style.height = '240px';

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
        audioBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
        audioBtn.title = 'Read Phrase';
        audioBtn.onclick = callbacks.onPlayAudio;

        // 2. Grid Button
        const gridBtn = document.createElement('button');
        gridBtn.className = 'tool-btn';
        gridBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18"/></svg>`;
        gridBtn.onclick = callbacks.onToggleGrid;

        // 3. Hint Button
        const hintBtn = document.createElement('button');
        hintBtn.className = 'tool-btn';
        hintBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21h6v-2H9v2zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>`;
        hintBtn.onclick = callbacks.onShowHint;

        // 4. Reveal Button
        const revealBtn = document.createElement('button');
        revealBtn.className = 'tool-btn';
        revealBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        revealBtn.onclick = callbacks.onReveal;

        toolbar.appendChild(audioBtn);
        toolbar.appendChild(gridBtn);
        toolbar.appendChild(hintBtn);
        toolbar.appendChild(revealBtn);

        carousel.appendChild(toolbar);
        container.appendChild(carousel);

        // Swipe support
        let touchStartX = 0;
        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        carousel.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) callbacks.onNext();
                else callbacks.onPrev();
            }
        }, { passive: true });

        // Initial view update
        this.updateCarouselView(currentCharIndex, validCharIndices, charBoxes);
    }

    /**
     * Update carousel visibility state
     */
    updateCarouselView(
        currentCharIndex: number,
        validCharIndices: number[],
        charBoxes: CharBox[]
    ): void {
        const boxes = document.querySelectorAll('.spelling-chars-container .char-box');
        boxes.forEach((box, i) => {
            if (i === currentCharIndex) {
                box.classList.remove('spelling-hidden');
                box.classList.add('spelling-active');
                box.querySelector('.char-slot')?.classList.add('active');
            } else {
                box.classList.add('spelling-hidden');
                box.classList.remove('spelling-active');
                box.querySelector('.char-slot')?.classList.remove('active');
            }
        });

        // Update nav buttons
        const prevBtn = document.getElementById('dictation-prev-btn');
        if (prevBtn) {
            prevBtn.style.visibility = currentCharIndex === 0 ? 'hidden' : 'visible';
        }

        // Update indicators (dots)
        const indicatorsEl = document.getElementById('dictation-indicators');
        if (indicatorsEl) {
            indicatorsEl.innerHTML = '';
            validCharIndices.forEach((_, i) => {
                const dot = document.createElement('div');
                dot.className = `indicator-dot ${i === currentCharIndex ? 'active' : ''}`;

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

        const scoreEl = document.createElement('div');
        scoreEl.className = 'dictation-footer-score';
        scoreEl.textContent = `得分: ${currentScore}/${currentMax}`;
        scoreEl.style.marginRight = '15px';
        scoreEl.style.fontWeight = 'bold';
        scoreEl.style.color = 'var(--primary)';
        footer.appendChild(scoreEl);

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

    showResult(score: number, total: number, onContinue: () => void): void {
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
                <h2 class="result-title">默写完成</h2>
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
}
