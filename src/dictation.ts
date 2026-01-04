/**
 * Dictation Module (默写)
 * Fill-in-the-blank dictation from memory
 */

import HanziWriter from 'hanzi-writer';
import { SoundFX } from './audio';

/**
 * Dictation passage data structure
 */
export interface DictationPassage {
    id: string;
    title: string;
    text: string;
    blanks: number[];  // Character indices that are blanks
    isFullDictation?: boolean;
    hint?: string;
    chunks?: string[];
    chunkPinyins?: string[];
}

/**
 * Dictation data file structure
 */
export interface DictationData {
    passages: DictationPassage[];
}

/**
 * Character box state
 */
interface CharBox {
    char: string;
    isBlank: boolean;
    userInput: string; // Unused for strokes, but kept for state
    isCorrect: boolean | null;
    index: number;
}

/**
 * Dictation Manager
 * Handles rendering and interaction for dictation mode
 */
export class DictationManager {
    private container: HTMLElement | null = null;
    private passage: DictationPassage | null = null;
    private charBoxes: CharBox[] = [];

    // Chunking state
    private chunks: { start: number; end: number; text: string; pinyin: string[] }[] = [];
    private currentChunkIndex = 0;

    // Mobile Carousel State
    private mobileCharIndex = 0;

    // HanziWriter instances for current chunk
    private writers: HanziWriter[] = [];
    private _isPlaying = false;

    onComplete: ((score: number, total: number) => void) | null = null;

    /**
     * Initialize dictation with a passage
     */
    init(passage: DictationPassage, container: HTMLElement): void {
        this.passage = passage;
        this.container = container;
        this.currentChunkIndex = 0;
        this.mobileCharIndex = 0;
        this.writers = [];

        // Process chunks
        this.chunks = [];
        const chunkPinyins = passage.chunkPinyins || [];

        if (passage.chunks && passage.chunks.length > 0) {
            let currentIndex = 0;
            this.chunks = passage.chunks.map((chunkText, i) => {
                const start = currentIndex;
                const end = start + chunkText.length;
                currentIndex = end;

                const pinyinStr = chunkPinyins[i] || "";
                const pinyin = pinyinStr.trim() ? pinyinStr.split(" ") : [];

                return { start, end, text: chunkText, pinyin };
            });
        } else {
            // Auto-split fallback
            const punctuationRegex = /([，。！？、：；“”‘’（）《》]+)/;
            const parts = passage.text.split(punctuationRegex);

            this.chunks = [];
            let currentStart = 0;

            for (let i = 0; i < parts.length; i += 2) {
                const phrase = parts[i];
                const punct = parts[i + 1] || "";
                const fullChunk = phrase + punct;

                if (fullChunk) {
                    this.chunks.push({
                        start: currentStart,
                        end: currentStart + fullChunk.length,
                        text: fullChunk,
                        pinyin: []
                    });
                    currentStart += fullChunk.length;
                }
            }
            if (this.chunks.length === 0) {
                this.chunks = [{ start: 0, end: passage.text.length, text: passage.text, pinyin: [] }];
            }
        }

        // Build character boxes
        const isFull = !!passage.isFullDictation;

        this.charBoxes = passage.text.split('').map((char, index) => {
            const isBlank = isFull ? true : passage.blanks.includes(index);
            // Punctuation is technically "blank" in full dictation but we handle it specifically
            return {
                char,
                isBlank,
                userInput: '',
                isCorrect: null,
                index
            };
        });

        this.render();

        // Auto-play audio
        if (isFull) {
            setTimeout(() => this.playAudio(), 500);
        }

        this.renderFooterProgress(); // Initial footer render
    }

    /**
     * Play passage audio
     */
    playAudio(): void {
        if (!this.passage) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(this.passage.text);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.8;
        window.speechSynthesis.speak(utterance);
    }

    stopAudio(): void {
        window.speechSynthesis.cancel();
        this._isPlaying = false;
    }

    toggleAudio(): boolean {
        if (this._isPlaying) {
            this.stopAudio();
        } else {
            this.playAudio();
            this._isPlaying = true;
            // Auto-reset state after delay (approximate)
            setTimeout(() => { this._isPlaying = false; }, 5000);
        }
        return this._isPlaying;
    }

    /**
     * Render the dictation UI (Focus View)
     */
    private render(): void {
        if (!this.container || !this.passage || !this.chunks.length) return;

        // Cleanup old writers before clearing DOM
        this.destroyWriters();

        this.container.innerHTML = '';
        this.container.className = 'dictation-container focus-view';

        // 1. Top Bar
        const header = document.createElement('div');
        header.className = 'focus-header';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '15px';

        const progress = document.createElement('div');
        progress.className = 'focus-progress';
        const filled = this.charBoxes.filter(b => b.isCorrect).length;
        const total = this.charBoxes.filter(b => b.isBlank).length;
        progress.innerHTML = `<span class="progress-count" style="font-weight:bold;color:var(--primary)">${filled}/${total}</span>`;
        header.appendChild(progress);

        // 2. Context Area
        const contextArea = document.createElement('div');
        contextArea.className = 'focus-context';
        // Styled via CSS for "small font above big squares"
        // keeping DOM structure simple

        let contextText = "";
        for (let i = 0; i < this.currentChunkIndex; i++) {
            const chunk = this.chunks[i];
            for (let j = chunk.start; j < chunk.end; j++) {
                const box = this.charBoxes[j];
                contextText += (box.isCorrect || !box.isBlank) ? box.char : '_';
            }
        }
        if (contextText) {
            contextArea.textContent = contextText;
            this.container.appendChild(contextArea);
        }

        // 3. Active Chunk
        if (this.currentChunkIndex < this.chunks.length) {
            const chunkState = this.chunks[this.currentChunkIndex];

            const chunkContainer = document.createElement('div');
            chunkContainer.className = 'focus-chunk-container';
            // chunkContainer.style.background = 'white'; // REMOVED per valid request
            chunkContainer.style.padding = '15px';
            chunkContainer.style.borderRadius = '16px';
            chunkContainer.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';

            // Mobile Navigation Container (Arrows)
            const mobileNav = document.createElement('div');
            mobileNav.className = 'mobile-nav-container';
            // Hidden by default, shown via CSS on mobile

            const prevBtn = document.createElement('button');
            prevBtn.id = 'mobile-prev-btn'; // ID for selection
            prevBtn.className = 'mobile-nav-btn';
            prevBtn.textContent = '❮';
            prevBtn.onclick = () => this.prevMobileChar();

            const nextBtn = document.createElement('button');
            nextBtn.id = 'mobile-next-btn'; // ID for selection
            nextBtn.className = 'mobile-nav-btn';
            nextBtn.textContent = '❯';
            nextBtn.onclick = () => this.nextMobileChar();

            mobileNav.appendChild(prevBtn);
            // Grid inserted here

            const grid = document.createElement('div');
            grid.className = 'dictation-grid focus-grid';
            mobileNav.appendChild(grid); // Wrap grid in nav for mobile layout

            mobileNav.appendChild(nextBtn);
            chunkContainer.appendChild(mobileNav);

            const chunkLen = chunkState.end - chunkState.start;
            const cols = Math.min(Math.max(chunkLen, 4), 8); // Adjust layout
            grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

            for (let i = chunkState.start; i < chunkState.end; i++) {
                const box = this.charBoxes[i];
                const boxEl = document.createElement('div');
                boxEl.className = 'dictation-char-box';
                // Mark initial active char for mobile
                if (i - chunkState.start === this.mobileCharIndex) {
                    boxEl.classList.add('active-mobile-char');
                } else {
                    boxEl.classList.add('mobile-hidden');
                }

                boxEl.style.width = '100%';
                boxEl.style.display = 'flex';
                boxEl.style.flexDirection = 'column';
                boxEl.style.alignItems = 'center';
                boxEl.style.justifyContent = 'center';
                boxEl.style.position = 'relative';

                // Content / Writer Container
                const contentEl = document.createElement('div');
                const writerId = `dictation-char-${i}`;
                contentEl.id = writerId;
                contentEl.className = 'char-content focus-box';
                contentEl.style.width = '100%';
                contentEl.style.aspectRatio = '1';
                contentEl.style.position = 'relative';

                if (!box.isBlank) {
                    contentEl.textContent = box.char;
                    contentEl.style.display = 'flex';
                    contentEl.style.alignItems = 'center';
                    contentEl.style.justifyContent = 'center';
                    contentEl.style.fontSize = '2rem';
                    contentEl.style.color = '#94a3b8';
                    contentEl.style.background = '#e2e8f0';
                    contentEl.style.border = '3px solid #cbd5e1';
                    contentEl.style.borderRadius = '16px';
                    contentEl.classList.remove('focus-box');
                } else {
                    boxEl.classList.add('blank');
                }

                boxEl.appendChild(contentEl);

                // Pinyin
                const pinyin = chunkState.pinyin[i - chunkState.start] || '';
                const pinyinEl = document.createElement('div');
                pinyinEl.className = 'char-pinyin';
                pinyinEl.textContent = pinyin;
                if (!pinyin) pinyinEl.innerHTML = '&nbsp;';

                boxEl.appendChild(pinyinEl);
                grid.appendChild(boxEl);
            }
            this.container.appendChild(chunkContainer);

            // Controls
            const controls = document.createElement('div');
            controls.className = 'dictation-controls focus-controls';
            controls.style.marginTop = '20px';
            controls.style.display = 'flex';
            controls.style.justifyContent = 'center';
            controls.style.gap = '15px';

            const checkBtn = document.createElement('button');
            checkBtn.className = 'game-btn dictation-check-btn';
            const isLastChunk = this.currentChunkIndex === this.chunks.length - 1;
            checkBtn.textContent = isLastChunk ? '✓ 完成' : '✓ 下一步';
            checkBtn.style.padding = '12px 30px';
            checkBtn.style.fontSize = '1.1rem';

            checkBtn.onclick = () => this.nextChunk();
            controls.appendChild(checkBtn);

            const hintBtn = document.createElement('button');
            hintBtn.className = 'game-btn dictation-hint-btn';
            hintBtn.textContent = '💡 提示';
            hintBtn.style.padding = '12px 20px';
            hintBtn.onclick = () => this.showHint();
            controls.appendChild(hintBtn);

            this.container.appendChild(controls);

            // Initialize writers AFTER DOM is ready
            setTimeout(() => {
                this.initWritersForChunk();
                this.updateMobileView(); // Correctly init mobile view
            }, 10);
        }
    }

    // Mobile Navigation Methods
    private prevMobileChar(): void {
        if (this.mobileCharIndex > 0) {
            this.mobileCharIndex--;
            this.updateMobileView();
        }
    }

    private nextMobileChar(): void {
        const chunk = this.chunks[this.currentChunkIndex];
        const len = chunk.end - chunk.start;
        if (this.mobileCharIndex < len - 1) {
            this.mobileCharIndex++;
            this.updateMobileView();
        } else {
            // On last char, next button acts as Submit
            this.nextChunk();
        }
    }

    private updateMobileView(): void {
        const container = document.querySelector('.focus-chunk-container');
        if (!container) return;

        // Smart Navigation Logic
        const prevBtn = document.getElementById('mobile-prev-btn');
        const nextBtn = document.getElementById('mobile-next-btn');
        const chunk = this.chunks[this.currentChunkIndex];
        const len = chunk.end - chunk.start;

        if (prevBtn) {
            // Hide prev button at start
            prevBtn.style.visibility = this.mobileCharIndex === 0 ? 'hidden' : 'visible';
        }

        if (nextBtn) {
            // Transform next button at end
            if (this.mobileCharIndex === len - 1) {
                nextBtn.innerHTML = '✓'; // Submit icon
                nextBtn.style.background = 'var(--success)';
                nextBtn.style.borderColor = '#16a34a';
            } else {
                nextBtn.innerHTML = '❯';
                nextBtn.style.background = ''; // Reset to default (via CSS class)
                nextBtn.style.borderColor = '';
            }
        }

        const boxes = container.querySelectorAll('.dictation-char-box');
        boxes.forEach((box, index) => {
            if (index === this.mobileCharIndex) {
                box.classList.add('active-mobile-char');
                box.classList.remove('mobile-hidden');
            } else {
                box.classList.remove('active-mobile-char');
                box.classList.add('mobile-hidden');
            }
        });
    }

    /**
     * Initialize HanziWriters for current chunk
     */
    private initWritersForChunk(): void {
        this.destroyWriters();
        if (this.currentChunkIndex >= this.chunks.length) return;

        const chunk = this.chunks[this.currentChunkIndex];
        const punctuationRegex = /[，。！？、：；“”‘’（）《》]/;

        for (let i = chunk.start; i < chunk.end; i++) {
            const box = this.charBoxes[i];
            const writerId = `dictation-char-${i}`; // Must match ID in render
            const el = document.getElementById(writerId);

            if (!el) continue;

            // Determine if we should create a writer
            const isPunctuation = punctuationRegex.test(box.char);

            if (box.isBlank && !isPunctuation) {
                // Determine dimensions based on container
                // On mobile, the box might be hidden initially, so clientWidth is 0
                // We default to a standard size or force a check
                // For HanziWriter, it adapts, but initial size matters.
                // Mobile layout forces large box.
                const isMobile = window.innerWidth <= 600;
                let width = el.clientWidth;
                if (width === 0 && isMobile) width = 280; // Fallback for hidden mobile boxes
                if (width === 0) width = 60; // Desktop fallback

                const size = Math.min(width, 300);

                const writer = HanziWriter.create(writerId, box.char, {
                    width: size,
                    height: size,
                    padding: 5,
                    showOutline: false, // UNSEEN dictation
                    strokeColor: '#38bdf8',
                    radicalColor: '#f472b6',
                    outlineColor: '#334155',
                    drawingWidth: 10,
                    showCharacter: false,
                    drawingFadeDuration: 300,
                });

                writer.quiz({
                    leniency: 1.5,
                    showHintAfterMisses: 3,
                    highlightOnComplete: true,
                    onCorrectStroke: () => {
                        SoundFX.correctStroke();
                    },
                    onMistake: () => {
                        // Shake?
                    },
                    onComplete: () => {
                        box.isCorrect = true;
                        box.userInput = box.char;

                        // Auto-advance logic for mobile
                        if (window.innerWidth <= 600) {
                            setTimeout(() => this.nextMobileChar(), 400);
                        }
                    }
                });

                this.writers.push(writer);
            } else if (box.isBlank && isPunctuation) {
                // Auto-fill punctuation
                box.isCorrect = true;
                box.userInput = box.char;
                el.textContent = box.char;
                el.style.fontSize = '2rem';
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
                // Explicit punctuation styling
                el.style.border = '3px solid #cbd5e1';
                el.style.borderRadius = '16px';
                el.style.background = '#e2e8f0';
                el.classList.remove('focus-box');
            }
        }
    }

    private destroyWriters(): void {
        this.writers = [];
    }

    private nextChunk(): void {
        const chunk = this.chunks[this.currentChunkIndex];
        const allCorrect = this.charBoxes.slice(chunk.start, chunk.end).every(b => b.isCorrect);

        if (!allCorrect) {
            // Shake effect
            const container = document.querySelector('.focus-chunk-container');
            container?.classList.add('shake');
            setTimeout(() => container?.classList.remove('shake'), 400);
            return;
        }

        if (this.currentChunkIndex < this.chunks.length - 1) {
            this.currentChunkIndex++;
            this.mobileCharIndex = 0; // Reset mobile index
            this.render();
            this.renderFooterProgress(); // Update footer
        } else {
            this.showResults();
        }
    }

    private showResults(): void {
        let correct = 0;
        let total = 0;
        this.charBoxes.forEach(box => {
            if (box.isBlank) {
                total++;
                if (box.isCorrect) correct++;
            }
        });

        if (this.onComplete) {
            this.onComplete(correct, total);
        }
    }

    private showHint(): void {
        const chunk = this.chunks[this.currentChunkIndex];

        // In mobile view, user is focused on ONE char (mobileCharIndex)
        // So hint should target visible char first if active.
        if (window.innerWidth <= 600) {
            const activeCharIndex = chunk.start + this.mobileCharIndex;


            // HanziWriter instance doesn't easily expose ID.
            // Fallback: iterate chunk, count writers
            let writerIdx = 0;
            for (let i = chunk.start; i < chunk.end; i++) {
                const box = this.charBoxes[i];
                const punctuationRegex = /[，。！？、：；“”‘’（）《》]/;
                if (!punctuationRegex.test(box.char) && box.isBlank) {
                    if (i === activeCharIndex) {
                        const w = this.writers[writerIdx];
                        if (w) {
                            w.hideOutline();
                            w.showOutline({ duration: 1000 });
                        }
                        return;
                    }
                    writerIdx++;
                }
            }
            return;
        }

        let writerIndex = 0;
        for (let i = chunk.start; i < chunk.end; i++) {
            const box = this.charBoxes[i];
            const punctuationRegex = /[，。！？、：；“”‘’（）《》]/;
            if (!punctuationRegex.test(box.char) && box.isBlank) {
                if (!box.isCorrect) {
                    const writer = this.writers[writerIndex];
                    if (writer) {
                        writer.hideOutline();
                        writer.showOutline({ duration: 1000 });
                    }
                    return;
                }
                writerIndex++;
            }
        }
    }

    destroy(): void {
        this.destroyWriters();
        this.container = null;
        this.passage = null;
        this.charBoxes = [];
        // Clear footer
        const footer = document.getElementById('footer-progress');
        if (footer) footer.innerHTML = '';
    }

    private renderFooterProgress(): void {
        const footer = document.getElementById('footer-progress');
        if (!footer) return;

        footer.innerHTML = '';
        const bar = document.createElement('div');
        bar.className = 'dictation-progress-bar';

        this.chunks.forEach((_, index) => {
            const segment = document.createElement('div');
            segment.className = 'dictation-progress-segment';

            if (index < this.currentChunkIndex) {
                segment.classList.add('completed');
            } else if (index === this.currentChunkIndex) {
                segment.classList.add('current');
            }

            bar.appendChild(segment);
        });

        footer.appendChild(bar);
    }
}

/**
 * Load dictation data
 */
export async function loadDictationData(): Promise<DictationData> {
    const response = await fetch('/dictation.json');
    return response.json();
}
