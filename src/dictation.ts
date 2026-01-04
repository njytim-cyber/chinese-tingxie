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

    onComplete: ((score: number, total: number) => void) | null = null;

    /**
     * Initialize dictation with a passage
     */
    init(passage: DictationPassage, container: HTMLElement): void {
        this.passage = passage;
        this.container = container;
        this.currentBlankIndex = 0;

        // Build character boxes
        const isFull = !!passage.isFullDictation;
        const punctuationRegex = /[，。！？、：；“”‘’（）《》]/;

        this.charBoxes = passage.text.split('').map((char, index) => {
            // In full dictation, everything is a blank except punctuation
            // In partial dictation, only specified indices are blanks
            const isPunctuation = punctuationRegex.test(char);
            const isBlank = isFull ? !isPunctuation : passage.blanks.includes(index);

            return {
                char,
                isBlank,
                userInput: '',
                isCorrect: null,
                index
            };
        });

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
     * Render the dictation UI
     */
    private render(): void {
        if (!this.container || !this.passage) return;

        this.container.innerHTML = '';
        this.container.className = 'dictation-container';

        // Title & Audio Control
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.gap = '10px';
        header.style.marginBottom = '20px';

        const title = document.createElement('h2');
        title.className = 'dictation-title';
        title.style.margin = '0';
        title.textContent = `默写: ${this.passage.title}`;
        header.appendChild(title);

        const audioBtn = document.createElement('button');
        audioBtn.className = 'game-btn btn-audio';
        audioBtn.textContent = '🔊';
        audioBtn.title = '播放读音';
        audioBtn.onclick = () => this.playAudio();
        header.appendChild(audioBtn);

        this.container.appendChild(header);

        // Progress indicator
        const progress = document.createElement('div');
        progress.className = 'dictation-progress';
        const filled = this.charBoxes.filter(b => b.isBlank && b.userInput).length;
        const total = this.charBoxes.filter(b => b.isBlank).length;
        progress.textContent = `${filled}/${total} 已填写`;
        this.container.appendChild(progress);

        // Character grid
        const grid = document.createElement('div');
        grid.className = 'dictation-grid';

        this.charBoxes.forEach((box, idx) => {
            const boxEl = document.createElement('div');
            boxEl.className = 'dictation-char-box';

            if (box.isBlank) {
                boxEl.classList.add('blank');
                if (box.userInput) {
                    boxEl.textContent = box.userInput;
                    boxEl.classList.add('filled');
                    if (box.isCorrect === true) boxEl.classList.add('correct');
                    if (box.isCorrect === false) boxEl.classList.add('wrong');
                }

                // Highlight current blank
                const blankIdx = this.getBlankIndexAt(idx);
                if (blankIdx === this.currentBlankIndex) {
                    boxEl.classList.add('active');
                    // Scroll into view if needed
                    setTimeout(() => {
                        boxEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                    }, 0);
                }

                boxEl.addEventListener('click', () => {
                    this.currentBlankIndex = blankIdx;
                    this.render();
                    this.focusCurrentBlank();
                });
            } else {
                boxEl.textContent = box.char;
                boxEl.classList.add('given');
            }

            grid.appendChild(boxEl);
        });

        this.container.appendChild(grid);

        // Hidden input for mobile keyboard
        this.inputField = document.createElement('input');
        this.inputField.type = 'text';
        this.inputField.className = 'dictation-input';
        this.inputField.autocomplete = 'off';
        this.inputField.inputMode = 'text';
        this.inputField.addEventListener('input', (e) => this.handleInput(e));
        this.inputField.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.inputField.addEventListener('blur', () => {
            // Keep focus on mobile to avoid keyboard closing
            // but only if we are still active
            // setTimeout(() => this.inputField?.focus(), 10);
        });
        this.container.appendChild(this.inputField);

        // Control buttons
        const controls = document.createElement('div');
        controls.className = 'dictation-controls';

        const checkBtn = document.createElement('button');
        checkBtn.className = 'game-btn dictation-check-btn';
        checkBtn.textContent = '✓ 检查答案';
        checkBtn.addEventListener('click', () => this.checkAnswers());
        controls.appendChild(checkBtn);

        const hintBtn = document.createElement('button');
        hintBtn.className = 'game-btn dictation-hint-btn';
        hintBtn.textContent = '💡 提示';
        hintBtn.addEventListener('click', () => this.showHint());
        controls.appendChild(hintBtn);

        this.container.appendChild(controls);
    }

    /**
     * Get blank index for a character position
     */
    private getBlankIndexAt(charIndex: number): number {
        const blanks = this.charBoxes.filter(b => b.isBlank);
        return blanks.findIndex(b => b.index === charIndex);
    }

    /**
     * Get character index for current blank
     */
    private getCurrentBlankCharIndex(): number {
        const blanks = this.charBoxes.filter(b => b.isBlank);
        return blanks[this.currentBlankIndex]?.index ?? -1;
    }

    /**
     * Focus the input field
     */
    private focusCurrentBlank(): void {
        if (this.inputField) {
            this.inputField.value = '';
            this.inputField.focus();
        }
    }

    /**
     * Handle input
     */
    private handleInput(e: Event): void {
        const input = (e.target as HTMLInputElement).value;
        if (!input) return;

        // Get the last character entered
        const char = input.slice(-1);

        // Fill current blank
        const charIndex = this.getCurrentBlankCharIndex();
        if (charIndex >= 0) {
            this.charBoxes[charIndex].userInput = char;
        }

        // Move to next blank
        const totalBlanks = this.charBoxes.filter(b => b.isBlank).length;
        if (this.currentBlankIndex < totalBlanks - 1) {
            this.currentBlankIndex++;
        }

        this.render();
        this.focusCurrentBlank();
    }

    /**
     * Handle keyboard navigation
     */
    private handleKeydown(e: KeyboardEvent): void {
        const totalBlanks = this.charBoxes.filter(b => b.isBlank).length;

        if (e.key === 'Backspace') {
            e.preventDefault();
            const charIndex = this.getCurrentBlankCharIndex();
            if (charIndex >= 0 && this.charBoxes[charIndex].userInput) {
                this.charBoxes[charIndex].userInput = '';
            } else if (this.currentBlankIndex > 0) {
                this.currentBlankIndex--;
                const prevCharIndex = this.getCurrentBlankCharIndex();
                if (prevCharIndex >= 0) {
                    this.charBoxes[prevCharIndex].userInput = '';
                }
            }
            this.render();
            this.focusCurrentBlank();
        } else if (e.key === 'ArrowLeft' && this.currentBlankIndex > 0) {
            this.currentBlankIndex--;
            this.render();
            this.focusCurrentBlank();
        } else if (e.key === 'ArrowRight' && this.currentBlankIndex < totalBlanks - 1) {
            this.currentBlankIndex++;
            this.render();
            this.focusCurrentBlank();
        } else if (e.key === 'Enter') {
            this.checkAnswers();
        }
    }

    /**
     * Check all answers
     */
    private checkAnswers(): void {
        let correct = 0;
        let total = 0;

        this.charBoxes.forEach(box => {
            if (box.isBlank) {
                total++;
                box.isCorrect = box.userInput === box.char;
                if (box.isCorrect) correct++;
            }
        });

        this.render();

        if (this.onComplete) {
            this.onComplete(correct, total);
        }
    }

    /**
     * Show hint for current blank
     */
    private showHint(): void {
        const charIndex = this.getCurrentBlankCharIndex();
        if (charIndex >= 0) {
            this.charBoxes[charIndex].userInput = this.charBoxes[charIndex].char;
            this.charBoxes[charIndex].isCorrect = true;

            // Move to next unfilled blank
            const blanks = this.charBoxes.filter(b => b.isBlank);
            const nextUnfilled = blanks.findIndex((b, i) => i > this.currentBlankIndex && !b.userInput);
            if (nextUnfilled >= 0) {
                this.currentBlankIndex = nextUnfilled;
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
