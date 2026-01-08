
/**
 * Dictation Module (默写)
 * Fill-in-the-blank dictation from memory
 */

import HanziWriter from 'hanzi-writer';
import { SoundFX } from './audio';
import type { UIManager } from './ui';

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

    constructor(_ui: UIManager) {
        // UI manager passed for future use (e.g., reveal modal)
    }

    // Chunking state
    public chunks: {
        start: number;
        end: number;
        text: string;
        pinyin: string[];
        hintUsed: boolean;
        revealUsed: boolean;
        score: number;
    }[] = [];
    private currentChunkIndex = 0;

    // Single-char carousel state
    private currentCharIndex = 0;

    // HanziWriter instances for current chunk
    private writers: HanziWriter[] = [];
    private _isPlaying = false;

    onComplete: ((score: number, total: number) => void) | null = null;

    getPassage(): DictationPassage | null {
        return this.passage;
    }

    /**
     * Initialize dictation with a passage
     */
    init(passage: DictationPassage, container: HTMLElement): void {
        this.passage = passage;
        this.container = container;
        this.currentChunkIndex = 0;
        this.currentCharIndex = 0;
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

                return {
                    start,
                    end,
                    text: chunkText,
                    pinyin,
                    hintUsed: false,
                    revealUsed: false,
                    score: 0
                };
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
                        pinyin: [],
                        hintUsed: false,
                        revealUsed: false,
                        score: 0
                    });
                    currentStart += fullChunk.length;
                }
            }
            if (this.chunks.length === 0) {
                this.chunks = [{
                    start: 0,
                    end: passage.text.length,
                    text: passage.text,
                    pinyin: [],
                    hintUsed: false,
                    revealUsed: false,
                    score: 0
                }];
            }
        }
        // ... (rest of init)
        // I need to skip 'init' middle part since replace_file_content handles contiguous blocks. 
        // Ah, I see I included 'chunks' definition which is high up properly.
        // But I need to preserve the rest of 'init' which is not shown in my replacement content.
        // I should split this into two replacements or use a specific target.
        // Let's target the 'private chunks' definition first.

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
     * Render the dictation UI (Single-char carousel like spelling mode)
     */
    private render(): void {
        if (!this.container || !this.passage || !this.chunks.length) return;

        // Cleanup old writers before clearing DOM
        this.destroyWriters();

        this.container.innerHTML = '';
        this.container.className = 'dictation-container';

        // 1. Completed Phrases Display (shows verified phrases above)
        const completedArea = document.createElement('div');
        completedArea.className = 'dictation-completed-phrases';
        completedArea.style.textAlign = 'center';
        completedArea.style.fontSize = '1.5rem';
        completedArea.style.color = '#94a3b8';
        completedArea.style.marginBottom = '20px';
        completedArea.style.padding = '10px';
        completedArea.style.minHeight = '2rem';

        // Build completed text from previous chunks
        let completedText = '';
        for (let i = 0; i < this.currentChunkIndex; i++) {
            const chunk = this.chunks[i];
            completedText += chunk.text;
        }
        if (completedText) {
            completedArea.textContent = completedText;
            completedArea.style.color = 'var(--success)';
        }
        this.container.appendChild(completedArea);

        // 2. Current Chunk - Single Character Carousel (reuse spelling structure)
        if (this.currentChunkIndex < this.chunks.length) {
            const chunkState = this.chunks[this.currentChunkIndex];

            // Build valid char indices for this chunk (skip punctuation)
            const validIndices: number[] = [];
            const punctuationRegex = /[，。！？、：；""''（）《》]/;
            for (let i = chunkState.start; i < chunkState.end; i++) {
                const box = this.charBoxes[i];
                if (!punctuationRegex.test(box.char)) {
                    validIndices.push(i);
                } else {
                    // Auto-complete punctuation
                    box.isCorrect = true;
                    box.userInput = box.char;
                }
            }
            this.validCharIndices = validIndices;

            // Carousel wrapper (reuse spelling-carousel class)
            const carousel = document.createElement('div');
            carousel.className = 'spelling-carousel';

            // Prev button
            const prevBtn = document.createElement('button');
            prevBtn.className = 'spelling-nav-btn';
            prevBtn.id = 'dictation-prev-btn';
            prevBtn.textContent = '❮';
            prevBtn.onclick = () => this.prevChar();
            carousel.appendChild(prevBtn);

            // Single char container
            const charContainer = document.createElement('div');
            charContainer.className = 'spelling-chars-container';
            charContainer.style.display = 'flex';
            charContainer.style.justifyContent = 'center';

            // Create char boxes (all hidden except current)
            validIndices.forEach((globalIdx, localIdx) => {
                const isActive = localIdx === this.currentCharIndex;

                const charBox = document.createElement('div');
                charBox.className = isActive ? 'char-box spelling-active' : 'char-box spelling-hidden';
                charBox.id = `dictation-box-${globalIdx}`;

                const slot = document.createElement('div');
                slot.id = `dictation-char-${globalIdx}`;
                slot.className = isActive ? 'char-slot active' : 'char-slot';
                slot.style.width = '240px';
                slot.style.height = '240px';

                const pinyinLabel = document.createElement('div');
                pinyinLabel.className = 'char-pinyin-label';
                pinyinLabel.textContent = chunkState.pinyin[globalIdx - chunkState.start] || '';

                charBox.appendChild(slot);
                charBox.appendChild(pinyinLabel);
                charContainer.appendChild(charBox);
            });

            carousel.appendChild(charContainer);

            // Next button
            const nextBtn = document.createElement('button');
            nextBtn.className = 'spelling-nav-btn';
            nextBtn.id = 'dictation-next-btn';
            nextBtn.textContent = '❯';
            nextBtn.onclick = () => this.nextChar();
            carousel.appendChild(nextBtn);

            this.container.appendChild(carousel);

            // Progress indicator
            const progressEl = document.createElement('div');
            progressEl.className = 'spelling-progress';
            progressEl.id = 'dictation-progress';
            const completed = validIndices.filter(i => this.charBoxes[i].isCorrect).length;
            progressEl.textContent = `${completed}/${validIndices.length}`;
            this.container.appendChild(progressEl);

            // Initialize writers after DOM insertion
            setTimeout(() => {
                this.initWritersForChunk();
                this.updateCarouselView();
            }, 50);
        }
    }

    // Valid char indices for current chunk (non-punctuation)
    private validCharIndices: number[] = [];

    /**
     * Navigate to previous character
     */
    private prevChar(): void {
        if (this.currentCharIndex > 0) {
            this.currentCharIndex--;
            this.updateCarouselView();
        }
    }

    /**
     * Navigate to next character
     */
    private nextChar(): void {
        if (this.currentCharIndex < this.validCharIndices.length - 1) {
            this.currentCharIndex++;
            this.updateCarouselView();
        }
    }

    /**
     * Update carousel view to show current character
     */
    private updateCarouselView(): void {
        const boxes = document.querySelectorAll('.spelling-chars-container .char-box');
        boxes.forEach((box, i) => {
            if (i === this.currentCharIndex) {
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
        const nextBtn = document.getElementById('dictation-next-btn');

        if (prevBtn) {
            prevBtn.style.visibility = this.currentCharIndex === 0 ? 'hidden' : 'visible';
        }

        if (nextBtn) {
            const isLast = this.currentCharIndex === this.validCharIndices.length - 1;
            nextBtn.style.visibility = isLast ? 'hidden' : 'visible';
        }

        // Update progress
        const progressEl = document.getElementById('dictation-progress');
        if (progressEl) {
            const completed = this.validCharIndices.filter(i => this.charBoxes[i].isCorrect).length;
            progressEl.textContent = `${completed}/${this.validCharIndices.length}`;
        }
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
                // Use exact same dimensions as spelling mode (input.ts)
                const writer = HanziWriter.create(writerId, box.char, {
                    width: 234,
                    height: 234,
                    padding: 15,
                    showOutline: false, // Unseen dictation mode
                    strokeColor: '#38bdf8',
                    radicalColor: '#f472b6',
                    outlineColor: '#334155',
                    drawingWidth: 12,
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

                        // Check if ALL chars in chunk are correct (Auto-Verify)
                        const chunk = this.chunks[this.currentChunkIndex];
                        const allCorrect = this.charBoxes.slice(chunk.start, chunk.end).every(b => b.isCorrect);

                        if (allCorrect) {
                            SoundFX.success(); // Play success sound

                            // Auto-advance after small delay
                            setTimeout(() => {
                                this.nextChunk();
                            }, 800);
                        }

                        // Auto-advance to next char in carousel
                        if (!allCorrect && this.currentCharIndex < this.validCharIndices.length - 1) {
                            setTimeout(() => {
                                this.currentCharIndex++;
                                this.updateCarouselView();
                            }, 400);
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
            // Shake effect on carousel
            const container = document.querySelector('.spelling-carousel');
            container?.classList.add('shake');
            setTimeout(() => container?.classList.remove('shake'), 400);
            return;
        }

        if (this.currentChunkIndex < this.chunks.length - 1) {
            // Calculate Score for this chunk
            if (chunk.revealUsed) {
                chunk.score = 0;
            } else if (chunk.hintUsed) {
                chunk.score = 1;
            } else {
                chunk.score = 2; // Perfect
            }

            this.currentChunkIndex++;
            this.currentCharIndex = 0; // Reset char index for new chunk
            this.render();
            this.renderFooterProgress(); // Update footer
        } else {
            // Calculate last chunk score
            if (chunk.revealUsed) {
                chunk.score = 0;
            } else if (chunk.hintUsed) {
                chunk.score = 1;
            } else {
                chunk.score = 2;
            }
            this.showResults();
        }
    }

    private showResults(): void {
        // Calculate total weighted score
        let totalScore = 0;
        let maxScore = this.chunks.length * 2;

        this.chunks.forEach(chunk => {
            totalScore += chunk.score;
        });

        if (this.onComplete) {
            this.onComplete(totalScore, maxScore);
        }
    }

    showHint(): void {
        // Mark hint as used for this chunk
        this.chunks[this.currentChunkIndex].hintUsed = true;

        const chunk = this.chunks[this.currentChunkIndex];

        // In mobile view, user is focused on ONE char (mobileCharIndex)
        // So hint should target visible char first if active.
        if (window.innerWidth <= 600) {
            const activeCharIndex = chunk.start + this.currentCharIndex;


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

    /**
     * Notify that reveal was used
     */
    notifyReveal(): void {
        if (this.chunks && this.chunks[this.currentChunkIndex]) {
            this.chunks[this.currentChunkIndex].revealUsed = true;
        }
    }

    /**
     * Reveal current chunk answers
     */
    revealCurrentChunk(): void {
        this.notifyReveal();

        // Show all characters in current chunk
        this.writers.forEach(writer => {
            writer.showCharacter();
        });

        // Also update charBoxes to mark as populated (but not necessarily "correct" for scoring, 
        // though notifyReveal sets score to 0).
        // If we want to allow "next" to proceed, we might need to pretend they are filled.
        const chunk = this.chunks[this.currentChunkIndex];
        for (let i = chunk.start; i < chunk.end; i++) {
            const box = this.charBoxes[i];
            // If it was blank, now it's effectively "filled" by the reveal
            if (box.isBlank) {
                box.isCorrect = true; // Mark as "correct" so nextChunk checks pass
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

        // Score Display
        let currentScore = 0;
        let currentMax = 0;
        this.chunks.forEach((chunk, index) => {
            if (index < this.currentChunkIndex) {
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
