/**
 * Dictation Module (默写)
 * Fill-in-the-blank dictation from memory
 */

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
    userInput: string;
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
    private inputField: HTMLInputElement | null = null;

    // Chunking state
    private chunks: { start: number; end: number; text: string }[] = [];
    private currentChunkIndex = 0;

    onComplete: ((score: number, total: number) => void) | null = null;

    /**
     * Initialize dictation with a passage
     */
    init(passage: DictationPassage, container: HTMLElement): void {
        this.passage = passage;
        this.container = container;
        this.currentBlankIndex = 0;
        this.currentChunkIndex = 0;

        // Process chunks
        this.chunks = [];
        if (passage.chunks && passage.chunks.length > 0) {
            let currentIndex = 0;
            this.chunks = passage.chunks.map(chunkText => {
                const start = currentIndex;
                const end = start + chunkText.length;
                currentIndex = end; // Assuming chunks are contiguous
                return { start, end, text: chunkText };
            });
        } else {
            // Auto-split by punctuation if no chunks provided
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
                        text: fullChunk
                    });
                    currentStart += fullChunk.length;
                }
            }

            if (this.chunks.length === 0) {
                this.chunks = [{ start: 0, end: passage.text.length, text: passage.text }];
            }
        }

        // Build character boxes
        const isFull = !!passage.isFullDictation;

        this.charBoxes = passage.text.split('').map((char, index) => {
            const isBlank = isFull ? true : passage.blanks.includes(index);

            return {
                char,
                isBlank,
                userInput: '',
                isCorrect: null,
                index
            };
        });

        // Set initial blank index to start of first chunk
        if (this.chunks.length > 0) {
            this.currentBlankIndex = this.chunks[0].start;
        }

        this.render();
        this.focusCurrentBlank();

        // Auto-play audio for full dictation
        if (isFull) {
            setTimeout(() => this.playAudio(), 500);
        }
    }

    /**
     * Play passage audio
     */
    playAudio(): void {
        if (!this.passage) return;

        // Cancel any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(this.passage.text);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.8; // Slightly slower for dictation
        window.speechSynthesis.speak(utterance);
    }

    /**
     * Render the dictation UI (Focus View)
     */
    private render(): void {
        if (!this.container || !this.passage || !this.chunks.length) return;

        this.container.innerHTML = '';
        this.container.className = 'dictation-container focus-view';

        // 1. Top Bar: Progress & Audio
        const header = document.createElement('div');
        header.className = 'focus-header';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '15px';

        const progress = document.createElement('div');
        progress.className = 'focus-progress';
        const filled = this.charBoxes.filter(b => b.isBlank && b.userInput).length;
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

        // 2. Context Area (Previously typed chunks)
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
            // In context, show what was typed (or the char if it wasn't blank)
            for (let j = chunk.start; j < chunk.end; j++) {
                contextText += this.charBoxes[j].userInput || this.charBoxes[j].char;
            }
        }

        if (contextText) {
            contextArea.textContent = contextText;
            this.container.appendChild(contextArea);
        }

        // 3. Active Chunk (Magnified)
        if (this.currentChunkIndex < this.chunks.length) {
            const chunkState = this.chunks[this.currentChunkIndex];

            const chunkContainer = document.createElement('div');
            chunkContainer.className = 'focus-chunk-container';
            chunkContainer.style.background = 'white';
            chunkContainer.style.padding = '20px';
            chunkContainer.style.borderRadius = '16px';
            chunkContainer.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';

            const grid = document.createElement('div');
            grid.className = 'dictation-grid focus-grid';
            grid.style.display = 'grid';
            grid.style.gap = '8px';
            grid.style.justifyContent = 'center';
            // Scale columns: min 5, max 10
            const chunkLen = chunkState.end - chunkState.start;
            const cols = Math.min(Math.max(chunkLen, 5), 10);
            grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

            for (let i = chunkState.start; i < chunkState.end; i++) {
                const box = this.charBoxes[i];
                const boxEl = document.createElement('div');
                boxEl.className = 'dictation-char-box focus-box';
                boxEl.style.width = '100%';
                boxEl.style.aspectRatio = '1';
                boxEl.style.fontSize = '1.5rem';
                boxEl.style.display = 'flex';
                boxEl.style.alignItems = 'center';
                boxEl.style.justifyContent = 'center';
                boxEl.style.border = '2px solid #e2e8f0';
                boxEl.style.borderRadius = '8px';
                boxEl.style.cursor = 'pointer';

                if (box.isBlank) {
                    boxEl.classList.add('blank');
                    boxEl.style.background = '#f8fafc';
                    if (box.userInput) {
                        boxEl.textContent = box.userInput;
                        boxEl.classList.add('filled');
                        boxEl.style.color = '#0f172a';

                        if (box.isCorrect === true) {
                            boxEl.classList.add('correct');
                            boxEl.style.borderColor = '#22c55e';
                            boxEl.style.color = '#22c55e';
                            boxEl.style.background = '#f0fdf4';
                        }
                        if (box.isCorrect === false) {
                            boxEl.classList.add('wrong');
                            boxEl.style.borderColor = '#ef4444';
                            boxEl.style.color = '#ef4444';
                            boxEl.style.background = '#fef2f2';
                        }
                    }

                    // Highlight current blank
                    if (i === this.currentBlankIndex) {
                        boxEl.classList.add('active');
                        boxEl.style.borderColor = '#3b82f6';
                        boxEl.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
                    }

                    boxEl.addEventListener('click', () => {
                        this.currentBlankIndex = i;
                        this.render();
                        this.focusCurrentBlank();
                    });
                } else {
                    boxEl.textContent = box.char;
                    boxEl.classList.add('given');
                    boxEl.style.background = '#e2e8f0';
                    boxEl.style.color = '#64748b';
                }
                grid.appendChild(boxEl);
            }
            chunkContainer.appendChild(grid);
            this.container.appendChild(chunkContainer);

            // Controls
            const controls = document.createElement('div');
            controls.className = 'dictation-controls focus-controls';
            controls.style.marginTop = '30px';
            controls.style.display = 'flex';
            controls.style.justifyContent = 'center';
            controls.style.gap = '15px';

            // Check if current chunk is filled
            let isChunkFilled = true;
            for (let i = chunkState.start; i < chunkState.end; i++) {
                if (this.charBoxes[i].isBlank && !this.charBoxes[i].userInput) {
                    isChunkFilled = false;
                    break;
                }
            }

            const checkBtn = document.createElement('button');
            checkBtn.className = 'game-btn dictation-check-btn';
            checkBtn.textContent = '✓ 下一步'; // Next
            checkBtn.style.padding = '12px 30px';
            checkBtn.style.fontSize = '1.1rem';
            checkBtn.disabled = !isChunkFilled;
            checkBtn.onclick = () => this.validateChunk();
            controls.appendChild(checkBtn);

            const hintBtn = document.createElement('button');
            hintBtn.className = 'game-btn dictation-hint-btn';
            hintBtn.textContent = '💡 提示';
            hintBtn.style.padding = '12px 20px';
            hintBtn.onclick = () => this.showHint();
            controls.appendChild(hintBtn);

            this.container.appendChild(controls);
        }

        // 4. Input Field (Hidden)
        this.inputField = document.createElement('input');
        this.inputField.type = 'text';
        this.inputField.className = 'dictation-input';
        this.inputField.style.position = 'absolute';
        this.inputField.style.opacity = '0';
        this.inputField.style.pointerEvents = 'none';
        this.inputField.autocomplete = 'off';
        this.inputField.inputMode = 'text';
        this.inputField.addEventListener('input', (e) => this.handleInput(e));
        this.inputField.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.container.appendChild(this.inputField);
    }

    /**
     * Focus the input field
     */
    private focusCurrentBlank(): void {
        const isMobile = /Mobi|Android/i.test(navigator.userAgent);
        if (this.inputField) {
            this.inputField.value = '';
            // Only force focus on user interaction to avoid virtual keyboard flicker
            // But we need it active for typing. 
            // The hidden input strategy requires focus.
            this.inputField.focus();
        }
    }

    /**
     * Handle input
     */
    private handleInput(e: Event): void {
        const input = (e.target as HTMLInputElement).value;
        if (!input) return;

        // Normalize punctuation (English -> Chinese)
        const punctMap: Record<string, string> = {
            ',': '，', '.': '。', '?': '？', '!': '！',
            ':': '：', ';': '；', '(': '（', ')': '）'
        };

        const lastChar = input.slice(-1);
        const mappedChar = punctMap[lastChar] || lastChar;

        // Fill current blank
        if (this.currentBlankIndex >= 0 && this.currentBlankIndex < this.charBoxes.length) {
            this.charBoxes[this.currentBlankIndex].userInput = mappedChar;
        }

        // Move to next blank WITHIN current chunk
        if (this.currentChunkIndex < this.chunks.length) {
            const chunk = this.chunks[this.currentChunkIndex];
            // Find next blank in this chunk
            let nextIdx = this.currentBlankIndex + 1;
            while (nextIdx < chunk.end) {
                if (this.charBoxes[nextIdx].isBlank) {
                    this.currentBlankIndex = nextIdx;
                    break;
                }
                nextIdx++;
            }
        }

        this.render();
        this.focusCurrentBlank();
    }

    /**
     * Handle keyboard navigation
     */
    private handleKeydown(e: KeyboardEvent): void {
        if (this.chunks.length === 0) return;
        const chunk = this.chunks[this.currentChunkIndex];

        if (e.key === 'Backspace') {
            e.preventDefault();

            // If current box has content, clear it. 
            // If empty, move back and clear.
            if (this.charBoxes[this.currentBlankIndex].userInput) {
                this.charBoxes[this.currentBlankIndex].userInput = '';
            } else {
                // Move back within chunk
                let prevIdx = this.currentBlankIndex - 1;
                while (prevIdx >= chunk.start) {
                    if (this.charBoxes[prevIdx].isBlank) {
                        this.currentBlankIndex = prevIdx;
                        this.charBoxes[prevIdx].userInput = '';
                        break;
                    }
                    prevIdx--;
                }
            }
            this.render();
            this.focusCurrentBlank();
        } else if (e.key === 'Enter') {
            this.validateChunk();
        }
    }

    /**
     * Validate current chunk and move to next
     */
    private validateChunk(): void {
        const chunk = this.chunks[this.currentChunkIndex];

        // Validate inputs in this chunk
        let isCorrect = true;
        for (let i = chunk.start; i < chunk.end; i++) {
            const box = this.charBoxes[i];
            if (box.isBlank) {
                box.isCorrect = box.userInput === box.char;
                if (!box.isCorrect) isCorrect = false;
            }
        }

        this.render(); // Show validation colors

        if (isCorrect) {
            // Wait a moment then move to next chunk
            setTimeout(() => {
                if (this.currentChunkIndex < this.chunks.length - 1) {
                    this.currentChunkIndex++;
                    // Find first blank in next chunk
                    const nextChunk = this.chunks[this.currentChunkIndex];
                    let foundSort = false;
                    for (let i = nextChunk.start; i < nextChunk.end; i++) {
                        if (this.charBoxes[i].isBlank) {
                            this.currentBlankIndex = i;
                            foundSort = true;
                            break;
                        }
                    }
                    if (!foundSort) this.currentBlankIndex = nextChunk.start;

                    this.render();
                    this.focusCurrentBlank();
                } else {
                    this.showResults();
                }
            }, 500);
        } else {
            // Shake effect?
        }
    }

    /**
     * Show final results
     */
    private showResults(): void {
        let correct = 0;
        let total = 0;
        this.charBoxes.forEach(box => {
            if (box.isBlank) {
                total++;
                if (box.userInput === box.char) correct++;
            }
        });

        if (this.onComplete) {
            this.onComplete(correct, total);
        }
    }

    /**
     * Show hint for current blank
     */
    private showHint(): void {
        if (this.currentBlankIndex >= 0) {
            const box = this.charBoxes[this.currentBlankIndex];
            box.userInput = box.char;
            box.isCorrect = true;

            // Move to next unfilled blank in chunk
            if (this.currentChunkIndex < this.chunks.length) {
                const chunk = this.chunks[this.currentChunkIndex];
                let nextIdx = this.currentBlankIndex + 1;
                while (nextIdx < chunk.end) {
                    if (this.charBoxes[nextIdx].isBlank && !this.charBoxes[nextIdx].userInput) {
                        this.currentBlankIndex = nextIdx;
                        break;
                    }
                    nextIdx++;
                }
            }

            this.render();
            this.focusCurrentBlank();
        }
    }

    /**
     * Clean up
     */
    destroy(): void {
        this.container = null;
        this.passage = null;
        this.charBoxes = [];
        this.inputField = null;
    }
}

/**
 * Load dictation data
 */
export async function loadDictationData(): Promise<DictationData> {
    const response = await fetch('/dictation.json');
    return response.json();
}
