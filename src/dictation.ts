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
    private currentBlankIndex = 0;

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
            chunkContainer.style.background = 'white';
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
                boxEl.className = 'dictation-char-box focus-box';
                // Adjust size for drawing
                boxEl.style.width = '100%';
                boxEl.style.aspectRatio = '0.7'; // Taller for pinyin
                boxEl.style.display = 'flex';
                boxEl.style.flexDirection = 'column';
                boxEl.style.alignItems = 'center';
                boxEl.style.justifyContent = 'center';
                boxEl.style.border = '2px solid #e2e8f0';
                boxEl.style.borderRadius = '8px';
                boxEl.style.position = 'relative'; // For writer positioning

                // Pinyin
                const pinyin = chunkState.pinyin[i - chunkState.start] || '';
                const pinyinEl = document.createElement('div');
                pinyinEl.className = 'char-pinyin';
                pinyinEl.textContent = pinyin;
                pinyinEl.style.fontSize = '0.9rem';
                pinyinEl.style.color = '#94a3b8';
                pinyinEl.style.marginTop = '4px';
                pinyinEl.style.height = '20px';
                boxEl.appendChild(pinyinEl);

                // Content / Writer Container
                const contentEl = document.createElement('div');
                // Unique ID for HanziWriter
                const writerId = `dictation-char-${i}`;
                contentEl.id = writerId;
                contentEl.className = 'char-content';
                contentEl.style.width = '100%';
                contentEl.style.flex = '1';
                contentEl.style.position = 'relative';

                // We won't use textContent for blanks, we use HanziWriter
                if (!box.isBlank) {
                    // Pre-filled (punctuation or non-blank)
                    contentEl.textContent = box.char;
                    contentEl.style.display = 'flex';
                    contentEl.style.alignItems = 'center';
                    contentEl.style.justifyContent = 'center';
                    contentEl.style.fontSize = '2rem';
                    contentEl.style.color = '#64748b';
                    boxEl.classList.add('given');
                    boxEl.style.background = '#e2e8f0';
                } else {
                    // Blank - Writer destination
                    boxEl.classList.add('blank');
                }

                boxEl.appendChild(contentEl);
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
            // But we need to listen to corrections
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
            // If it's punctuation, we skip writer creation (it's already text)
            // If it's a character, we create writer
            const isPunctuation = punctuationRegex.test(box.char);

            if (box.isBlank && !isPunctuation) {
                // Determine dimensions based on container
                const width = el.clientWidth || 60;
                const size = Math.min(width, 100);

                const writer = HanziWriter.create(writerId, box.char, {
                    width: size,
                    height: size,
                    padding: 5,
                    showOutline: false, // UNSEEN dictation
                    strokeColor: '#38bdf8',
                    radicalColor: '#f472b6',
                    outlineColor: '#334155',
                    drawingWidth: 10, // Adjusted for smaller box
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
                        // Auto-advance visual focus if we add it later
                        this.canAdvance();
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
            }
        }
    }

    /**
     * Check if we can advance
     */
    private canAdvance(): void {
        const chunk = this.chunks[this.currentChunkIndex];
        const allCorrect = this.charBoxes.slice(chunk.start, chunk.end).every(b => b.isCorrect);

        const btn = document.querySelector('.dictation-check-btn') as HTMLButtonElement;
        if (btn) {
            if (allCorrect) {
                btn.classList.add('pulse'); // Visual cue
            }
        }
    }

    private destroyWriters(): void {
        // HanziWriter doesn't have a simple destroy on the instance,
        // but removing the DOM element usually clears it.
        // We clear the array.
        this.writers = [];
    }

    private nextChunk(): void {
        const chunk = this.chunks[this.currentChunkIndex];
        const allCorrect = this.charBoxes.slice(chunk.start, chunk.end).every(b => b.isCorrect);

        if (!allCorrect) {
            // Shake effect or feedback
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
        // Find first incomplete writer
        // Mapping writers to boxes is tricky since we store writers in array
        // But we iterate simply.
        // Let's iterate boxes in chunk.

        let writerIndex = 0;
        for (let i = chunk.start; i < chunk.end; i++) {
            const box = this.charBoxes[i];
            const punctuationRegex = /[，。！？、：；“”‘’（）《》]/;
            if (!punctuationRegex.test(box.char) && box.isBlank) {
                if (!box.isCorrect) {
                    // Found the writer
                    const writer = this.writers[writerIndex];
                    if (writer) {
                        // We can't access quiz state easily to know stroke index
                        // But we can trigger a hint animate
                        // writer.animateCharacter(); // Too easy?
                        // writer.outline(); // Show outline briefly
                        // Better: show outline
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
