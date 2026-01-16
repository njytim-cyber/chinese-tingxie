
/**
 * Dictation Module (默写)
 * Fill-in-the-blank dictation from memory
 */

import HanziWriter from 'hanzi-writer';
import { SoundFX } from './audio';
import { UIManager } from './ui/UIManager';
import { splitTextByPunctuation } from './utils/text';

import type { DictationPassage, DictationData, CharBox, DictationChunk } from './types';

/**
 * Dictation Manager
 * Handles logic and interaction for dictation mode
 * Delegating UI rendering to DictationRenderer
 */
export class DictationManager {
    private container: HTMLElement | null = null;
    private passage: DictationPassage | null = null;
    private charBoxes: CharBox[] = [];
    private ui: UIManager;

    constructor(ui: UIManager) {
        this.ui = ui;
    }

    // Chunking state
    public chunks: DictationChunk[] = [];
    private currentChunkIndex = 0;

    // Single-char carousel state
    private currentCharIndex = 0;

    // HanziWriter instances for current chunk
    private writers: HanziWriter[] = [];
    private _isPlaying = false;

    // Valid char indices for current chunk (non-punctuation)
    private validCharIndices: number[] = [];

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
            // Auto-split fallback using centralized text utility
            const textChunks = splitTextByPunctuation(passage.text);

            if (textChunks.length > 0) {
                this.chunks = textChunks.map(chunk => ({
                    start: chunk.startPos,
                    end: chunk.endPos,
                    text: chunk.fullText,
                    pinyin: [],
                    hintUsed: false,
                    revealUsed: false,
                    score: 0
                }));
            } else {
                // Fallback for plain text with no punctuation
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

        this.renderFooter(); // Initial footer render
    }

    /**
     * Play passage audio
     */
    playAudio(): void {
        if (!this.passage || !this.chunks[this.currentChunkIndex]) return;
        window.speechSynthesis.cancel();

        // Play only current chunk
        const textToRead = this.chunks[this.currentChunkIndex].text;

        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.8;

        this._isPlaying = true;
        utterance.onend = () => {
            this._isPlaying = false;
        };

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
        }
        return this._isPlaying;
    }

    /**
     * Coordinate rendering
     */
    private render(): void {
        if (!this.container || !this.passage || !this.chunks.length) return;

        // Cleanup old writers before clearing DOM
        this.destroyWriters();

        // Logic: Prepare indices for new chunk
        this.computeValidIndicesForChunk();

        // Logic: Build completed text string
        let completedText = '';
        for (let i = 0; i < this.currentChunkIndex; i++) {
            completedText += this.chunks[i].text;
        }

        // UI: Delegate to Renderer
        if (this.currentChunkIndex < this.chunks.length) {
            this.ui.dictationRenderer.renderGame(
                this.container,
                completedText,
                this.chunks[this.currentChunkIndex],
                this.charBoxes,
                this.currentCharIndex,
                this.validCharIndices,
                {
                    onPrev: () => this.prevChar(),
                    onNext: () => this.nextChar(),
                    onPlayAudio: () => this.toggleAudio(),
                    onToggleGrid: () => this.ui.dictationRenderer.toggleGrid(),
                    onShowHint: () => this.showHint(),
                    onReveal: () => this.revealCurrentChunk(),
                    onJumpTo: (index: number) => this.goToChar(index)
                }
            );

            // Initialize writers after DOM insertion
            setTimeout(() => {
                this.initWritersForChunk();
                // updateCarouselView is called by renderer initially
            }, 50);
        }
    }

    /**
     * Compute valid char indices for current chunk (Logic)
     */
    private computeValidIndicesForChunk(): void {
        if (this.currentChunkIndex >= this.chunks.length) return;

        const chunkState = this.chunks[this.currentChunkIndex];
        const validIndices: number[] = [];
        const punctuationRegex = /[，。！？、：；“”‘’（）《》]/;

        for (let i = chunkState.start; i < chunkState.end; i++) {
            const box = this.charBoxes[i];
            if (!punctuationRegex.test(box.char)) {
                validIndices.push(i);
            } else {
                // Logic: Auto-complete punctuation
                box.isCorrect = true;
                box.userInput = box.char;
            }
        }
        this.validCharIndices = validIndices;
    }

    /**
     * Navigate to previous character
     */
    private prevChar(): void {
        if (this.currentCharIndex > 0) {
            this.currentCharIndex--;
            this.ui.dictationRenderer.updateCarouselView(
                this.currentCharIndex,
                this.validCharIndices,
                this.charBoxes
            );
        }
    }

    /**
     * Navigate to next character
     */
    private nextChar(): void {
        if (this.currentCharIndex < this.validCharIndices.length - 1) {
            this.currentCharIndex++;
            this.ui.dictationRenderer.updateCarouselView(
                this.currentCharIndex,
                this.validCharIndices,
                this.charBoxes
            );
        }
    }

    /**
     * Navigate to a specific character
     */
    private goToChar(index: number): void {
        if (index >= 0 && index < this.validCharIndices.length) {
            this.currentCharIndex = index;
            this.ui.dictationRenderer.updateCarouselView(
                this.currentCharIndex,
                this.validCharIndices,
                this.charBoxes
            );
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
            const writerId = `dictation-char-${i}`; // Match ID from Renderer
            const el = document.getElementById(writerId);

            if (!el) continue;

            // Determine if we should create a writer
            const isPunctuation = punctuationRegex.test(box.char);

            if (box.isBlank && !isPunctuation) {
                // Use exact same dimensions as spelling mode
                const writer = HanziWriter.create(writerId, box.char, {
                    width: 234,
                    height: 234,
                    padding: 15,
                    showOutline: false, // Unseen dictation mode
                    strokeColor: '#2B2B2B', // Synchronized with spelling mode
                    radicalColor: '#C44032',
                    outlineColor: '#E5E0D6',
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
                        const currentChunkState = this.chunks[this.currentChunkIndex];
                        const allCorrect = this.charBoxes.slice(currentChunkState.start, currentChunkState.end).every(b => b.isCorrect);

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
                                this.ui.dictationRenderer.updateCarouselView(
                                    this.currentCharIndex,
                                    this.validCharIndices,
                                    this.charBoxes
                                );
                            }, 400);
                        }
                    }
                });

                this.writers.push(writer);
            } else if (box.isBlank && isPunctuation) {
                // Auto-fill punctuation UI Logic
                // Ideally this styling should be in Renderer or CSS
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
        this.writers.forEach(writer => {
            try {
                // HanziWriter definitions are loose, check for method existence
                if (writer && typeof (writer as any).cancelQuiz === 'function') {
                    (writer as any).cancelQuiz();
                }
                // Also hide/remove if needed, but container clear usually handles DOM.
                // cancelling quiz stops timers/event listeners.
            } catch (e) {
                console.warn('Error cleaning up writer:', e);
            }
        });
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
            this.renderFooter(); // Update footer

            // Auto-play next chunk audio
            setTimeout(() => this.playAudio(), 500);
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

        // Delegate UI to Renderer
        this.ui.dictationRenderer.showResult(totalScore, maxScore, () => {
            if (this.onComplete) {
                this.onComplete(totalScore, maxScore);
            }
        });
    }

    showHint(): void {
        // Mark hint as used for this chunk
        this.chunks[this.currentChunkIndex].hintUsed = true;
        const chunk = this.chunks[this.currentChunkIndex];

        // Hint Logic
        if (window.innerWidth <= 600) {
            const activeCharIndex = chunk.start + this.currentCharIndex;

            // Map global index to writer index
            let writerIdx = 0;
            for (let i = chunk.start; i < chunk.end; i++) {
                const box = this.charBoxes[i];
                const punctuationRegex = /[，。！？、：；“”‘’（）《》]/;
                if (!punctuationRegex.test(box.char) && box.isBlank) {
                    if (i === activeCharIndex) {
                        const w = this.writers[writerIdx];
                        if (w) {
                            (w as any).highlightStroke?.(0);
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
                        (writer as any).highlightStroke?.(0);
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
     * Reveal current chunk characters temporarily
     */
    revealCurrentChunk(): void {
        this.notifyReveal();

        // Show all characters in current chunk
        this.writers.forEach(writer => {
            writer.showCharacter();
            // Hide after 1 second to give user a "glimpse"
            setTimeout(() => {
                try {
                    (writer as any).hideCharacter?.();
                } catch (e) {
                    // Fallback or ignore
                }
            }, 1000);
        });

        // DO NOT mark as correct, user must still write it out
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

    private renderFooter(): void {
        this.ui.dictationRenderer.renderFooterProgress(
            this.chunks,
            this.currentChunkIndex
        );
        this.ui.dictationRenderer.renderHeaderProgress(
            this.chunks,
            this.currentChunkIndex
        );
    }
}

/**
 * Load dictation data
 */
export async function loadDictationData(): Promise<DictationData> {
    try {
        const response = await fetch('/dictation.json');
        if (!response.ok) {
            throw new Error(`Failed to load dictation data: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading dictation data:', error);
        throw new Error('无法加载听写数据，请检查网络连接');
    }
}
