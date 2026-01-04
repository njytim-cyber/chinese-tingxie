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

    // HanziWriter instances for current chunk
    private writers: HanziWriter[] = [];

    onComplete: ((score: number, total: number) => void) | null = null;

    /**
     * Initialize dictation with a passage
     */
    init(passage: DictationPassage, container: HTMLElement): void {
        this.passage = passage;
        this.container = container;
        this.currentChunkIndex = 0;
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

        const audioBtn = document.createElement('button');
        audioBtn.className = 'game-btn btn-audio compact-btn';
        audioBtn.textContent = '🔊';
        audioBtn.style.padding = '8px 12px';
        audioBtn.onclick = () => this.playAudio();
        header.appendChild(audioBtn);

        this.container.appendChild(header);

        // 2. Context Area
        const contextArea = document.createElement('div');
        contextArea.className = 'focus-context';
        contextArea.style.marginBottom = '20px';
        contextArea.style.padding = '10px';
        contextArea.style.background = '#f1f5f9';
        contextArea.style.borderRadius = '8px';
        contextArea.style.minHeight = '40px';
        contextArea.style.color = '#475569';
        contextArea.style.fontSize = '1rem';
        contextArea.style.lineHeight = '1.6';

        let contextText = "";
        for (let i = 0; i < this.currentChunkIndex; i++) {
            const chunk = this.chunks[i];
            for (let j = chunk.start; j < chunk.end; j++) {
                // Use check or just show char if correct
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
            chunkContainer.style.background = 'white'; // Keep container white/clean
            chunkContainer.style.padding = '15px';
            chunkContainer.style.borderRadius = '16px';
            chunkContainer.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';

            const grid = document.createElement('div');
            grid.className = 'dictation-grid focus-grid';
            grid.style.display = 'grid';
            grid.style.gap = '8px';
            grid.style.justifyContent = 'center';

            const chunkLen = chunkState.end - chunkState.start;
            const cols = Math.min(Math.max(chunkLen, 4), 8); // Adjust layout
            grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

            for (let i = chunkState.start; i < chunkState.end; i++) {
                const box = this.charBoxes[i];
                const boxEl = document.createElement('div');
                boxEl.className = 'dictation-char-box';
                // Remove fixed size/ratio on wrapper to allow flexible Pinyin
                boxEl.style.width = '100%';
                boxEl.style.display = 'flex';
                boxEl.style.flexDirection = 'column';
                boxEl.style.alignItems = 'center';
                boxEl.style.justifyContent = 'center';
                boxEl.style.position = 'relative';

                // Content / Writer Container (FIRST)
                const contentEl = document.createElement('div');
                // Unique ID for HanziWriter
                const writerId = `dictation-char-${i}`;
                contentEl.id = writerId;
                contentEl.className = 'char-content focus-box'; // Style HERE
                contentEl.style.width = '100%';
                contentEl.style.aspectRatio = '1'; // Square box
                contentEl.style.position = 'relative';

                if (!box.isBlank) {
                    // Pre-filled (punctuation or given)
                    contentEl.textContent = box.char;
                    contentEl.style.display = 'flex';
                    contentEl.style.alignItems = 'center';
                    contentEl.style.justifyContent = 'center';
                    contentEl.style.fontSize = '2rem';
                    contentEl.style.color = '#94a3b8';
                    contentEl.style.background = '#e2e8f0'; // Given visual
                    contentEl.style.border = '3px solid #cbd5e1'; // Explicit subtle border
                    contentEl.style.borderRadius = '16px';
                    contentEl.classList.remove('focus-box'); // Remove glow focus for given chars
                } else {
                    boxEl.classList.add('blank');
                }

                boxEl.appendChild(contentEl);

                // Pinyin (SECOND)
                const pinyin = chunkState.pinyin[i - chunkState.start] || '';
                const pinyinEl = document.createElement('div');
                pinyinEl.className = 'char-pinyin';
                pinyinEl.textContent = pinyin;
                if (!pinyin) pinyinEl.innerHTML = '&nbsp;';

                boxEl.appendChild(pinyinEl);
                grid.appendChild(boxEl);
            }
            chunkContainer.appendChild(grid);
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

            // Auto-enable if chunk is fully correct (HanziWriter handles internal state)
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
            setTimeout(() => this.initWritersForChunk(), 10);
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
                // Determine dimensions based on container
                const width = el.clientWidth || 60;
                const size = Math.min(width, 240); // Max size constraint

                const writer = HanziWriter.create(writerId, box.char, {
                    width: size,
                    height: size,
                    padding: 5,
                    showOutline: false, // UNSEEN dictation
                    strokeColor: '#38bdf8',
                    radicalColor: '#f472b6',
                    outlineColor: '#334155',
                    drawingWidth: 10, // Standard width
                    showCharacter: false,
                    drawingFadeDuration: 300,
                });

                writer.quiz({
                    leniency: 1.5,
                    showHintAfterMisses: 3,
                    highlightOnComplete: true,
                    onCorrectStroke: () => {
                        SoundFX.correctStroke(); // Assuming imported
                    },
                    onMistake: () => {
                        // Shake?
                    },
                    onComplete: () => {
                        box.isCorrect = true;
                        box.userInput = box.char; // Mark as done
                        // Auto-advance logic if needed
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
            this.render();
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
    }
}

/**
 * Load dictation data
 */
export async function loadDictationData(): Promise<DictationData> {
    const response = await fetch('/dictation.json');
    return response.json();
}
