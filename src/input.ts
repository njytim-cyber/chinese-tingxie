/**
 * Input Handler Module
 * Abstraction layer for different character input methods
 */

// import HanziWriter from 'hanzi-writer'; // Lazy loaded
import { SoundFX } from './audio';
import type { PracticeWord } from './types';
import type { InputHandler, InputResult } from './types';

/**
 * HanziWriter-based input handler for stroke-by-stroke character writing
 * Now uses dictation-style single character carousel
 */
export class HanziWriterInput implements InputHandler {
    private writers: any[] = []; // HanziWriter instances
    private charElements: HTMLElement[] = [];
    private completedChars = 0;
    private mistakesMade = 0;
    private hintUsed = false;
    private hintStrokeIndex: number[] = [];
    private currentWord: PracticeWord | null = null;
    private currentCharIndex = 0;
    private validCharIndices: number[] = []; // Non-punctuation character indices
    // private navContainer: HTMLElement | null = null;


    onComplete?: (result: InputResult) => void;
    onCharComplete?: (index: number) => void;
    onMistake?: (index: number) => void;

    private gridState: 'tian' | 'mi' | 'blank' = 'tian';

    /**
     * Initialize the input handler for a word
     */
    async init(word: PracticeWord, container: HTMLElement): Promise<void> {
        this.destroy(); // Clean up any existing state

        this.currentWord = word;

        this.writers = [];
        this.charElements = [];
        this.completedChars = 0;
        this.mistakesMade = 0;
        this.hintUsed = false;
        this.hintStrokeIndex = [];
        this.currentCharIndex = 0;
        this.validCharIndices = [];

        const chars = word.term.split('');
        // const pinyinSegments = word.pinyin.split(' '); // Unused here
        const punctuationRegex = /[，。！？、：；""''（）《》.,!?;:'"()]/;

        // Build valid character indices (skip punctuation)
        chars.forEach((char, index) => {
            if (!punctuationRegex.test(char)) {
                this.validCharIndices.push(index);
            }
        });

        // Character boxes container (Directly utilize container for flex layout)
        const charData: { char: string; index: number; element: HTMLElement }[] = [];

        chars.forEach((char, index) => {
            // Skip punctuation entirely
            if (punctuationRegex.test(char)) {
                return;
            }

            const charBox = document.createElement('div');
            // First char is visible, rest are hidden
            const isFirst = this.charElements.length === 0;
            charBox.className = isFirst ? 'char-box spelling-active' : 'char-box spelling-hidden';
            charBox.id = `char-box-${index}`;
            // Ensure char-box takes full size in card
            charBox.style.width = '100%';
            charBox.style.height = '100%';
            charBox.style.display = isFirst ? 'flex' : 'none';
            charBox.style.justifyContent = 'center';
            charBox.style.alignItems = 'center';

            const div = document.createElement('div');
            div.id = `char-${index}`;
            // Apply current grid state
            const baseClass = isFirst ? 'char-slot active' : 'char-slot';
            div.className = `${baseClass} grid-${this.gridState}`;

            charBox.appendChild(div);
            // No pinyin label here anymore

            container.appendChild(charBox);
            this.charElements.push(charBox);
            charData.push({ char, index, element: div });
        });

        // Dynamic import for HanziWriter
        try {
            const HanziWriterModule = await import('hanzi-writer');
            const HanziWriter = HanziWriterModule.default;

            // Create HanziWriters AFTER DOM insertion (elements must be visible)
            charData.forEach(({ char, index }) => {
                const writer = HanziWriter.create(`char-${index}`, char, {
                    width: 200, // Match CSS .char-slot
                    height: 200,
                    padding: 10,
                    showOutline: false,
                    strokeColor: '#2B2B2B', // Dark Charcoal (Soot Black)
                    radicalColor: '#C44032', // Cinnabar Red for radicals (optional refinement)
                    outlineColor: '#E5E0D6', // Rice paper dark for outlines
                    drawingWidth: 12, // Slightly thicker for brush look
                    showCharacter: false,
                    drawingFadeDuration: 300,
                });

                writer.quiz({
                    leniency: 1.5,
                    showHintAfterMisses: 3,
                    highlightOnComplete: true,
                    onCorrectStroke: (strokeData: any) => {
                        SoundFX.correctStroke();
                        this.hintStrokeIndex[index] = strokeData.strokeNum + 1;
                    },
                    onMistake: () => {
                        this.handleMistake(index);
                    },
                    onComplete: () => {
                        this.handleCharComplete(index);
                    }
                });

                this.writers.push(writer);
            });

            // Update the view after writers are created
            this.updateCarouselView();

        } catch (error) {
            console.error('Failed to load HanziWriter:', error);
        }
    }

    /**
     * Navigate to previous character (Used by carousel UI)
     */
    public previousCharacter(): void {
        if (this.currentCharIndex > 0) {
            this.currentCharIndex--;
            this.updateCarouselView();
        }
    }

    /**
     * Navigate to next character (Used by carousel UI)
     */
    public nextCharacter(): void {
        if (this.currentCharIndex < this.validCharIndices.length - 1) {
            this.currentCharIndex++;
            this.updateCarouselView();
        }
    }

    /**
     * Update the carousel view to show current character
     */
    private updateCarouselView(): void {
        // Hide all, show active
        this.charElements.forEach((el, i) => {
            if (i === this.currentCharIndex) {
                el.style.display = 'flex';
                el.classList.remove('spelling-hidden');
                el.classList.add('spelling-active');
                el.querySelector('.char-slot')?.classList.add('active');
            } else {
                el.style.display = 'none';
                el.classList.add('spelling-hidden');
                el.classList.remove('spelling-active');
                el.querySelector('.char-slot')?.classList.remove('active');
            }
        });

        // Update Global Pinyin Display
        const pinyinDisplay = document.getElementById('pinyin-display');
        if (pinyinDisplay && this.currentWord) {
            const pinyinSegments = this.currentWord.pinyin.split(' ');
            // Need to map visual index back to original index if there was punctuation
            // But simplified logic: assume pinyin segments match valid chars for now 
            // OR better: use visual index
            const charIndex = this.validCharIndices[this.currentCharIndex];
            pinyinDisplay.textContent = pinyinSegments[charIndex] || '';
        }

        // Update Progress Bar
        const progressFill = document.getElementById('char-progress-fill');
        if (progressFill) {
            const progressPercent = (this.completedChars / this.validCharIndices.length) * 100;
            progressFill.style.width = `${progressPercent}%`;
        }

        // Update Definition (Placeholder if empty)
        const defDisplay = document.getElementById('definition-display');
        if (defDisplay && this.currentWord) {
            // Assuming definition is on term, or we use placeholder
            defDisplay.textContent = (this.currentWord as any).definition || ''; // Need to add definition to types
        }
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.writers.forEach(writer => {
            try {
                if (writer && typeof writer.cancelQuiz === 'function') {
                    writer.cancelQuiz();
                }
            } catch (e) {
                // Ignore cleanup errors
            }
        });
        this.writers = [];
        this.charElements = [];
        this.currentWord = null;
        this.completedChars = 0;
        this.mistakesMade = 0;
        this.hintUsed = false;
        this.hintStrokeIndex = [];
        this.currentCharIndex = 0;
        this.validCharIndices = [];
    }

    /**
     * Show a hint for the current character
     */
    showHint(): void {
        this.hintUsed = true;

        const charIndex = this.validCharIndices[this.currentCharIndex];
        const writerIndex = this.currentCharIndex;
        const writer = this.writers[writerIndex];
        if (!writer) return;

        const strokeIndex = this.hintStrokeIndex[charIndex] || 0;
        writer.highlightStroke(strokeIndex);
    }

    /**
     * Get whether a hint was used
     */
    wasHintUsed(): boolean {
        return this.hintUsed;
    }

    /**
     * Get mistake count for current word
     */
    getMistakeCount(): number {
        return this.mistakesMade;
    }

    /**
     * Handle a stroke mistake
     */
    private handleMistake(index: number): void {
        this.mistakesMade++;
        const box = document.getElementById(`char-${index}`);
        if (!box) return;
        box.classList.remove('shake');
        void (box as HTMLElement).offsetWidth; // Force reflow for animation
        box.classList.add('shake');

        if (this.onMistake) {
            this.onMistake(index);
        }
    }

    /**
     * Handle character completion
     */
    private handleCharComplete(index: number): void {
        const box = document.getElementById(`char-${index}`);
        if (!box) return;
        box.classList.remove('active');
        box.classList.add('success');

        this.completedChars++;

        // Show vermilion stamp animation
        this.showSuccessStamp(box);

        if (this.onCharComplete) {
            this.onCharComplete(index);
        }

        // Auto-advance to next character
        if (this.currentCharIndex < this.validCharIndices.length - 1) {
            setTimeout(() => {
                this.currentCharIndex++;
                this.updateCarouselView();
            }, 600); // Slightly longer delay to see the success animation
        } else if (this.completedChars === this.validCharIndices.length) {
            // All done - auto complete on last char
            setTimeout(() => this.notifyComplete(), 600);
        }

        this.updateCarouselView();
    }

    /**
     * Show the vermilion stamp success animation
     */
    private showSuccessStamp(container: HTMLElement): void {
        // Check if stamp already exists
        let stamp = container.querySelector('.success-stamp') as HTMLElement;

        if (!stamp) {
            stamp = document.createElement('div');
            stamp.className = 'success-stamp';
            stamp.innerHTML = `
                <svg viewBox="0 0 80 80">
                    <rect class="stamp-rect" x="5" y="5" width="70" height="70"/>
                    <text class="stamp-text" x="40" y="44">优</text>
                </svg>
            `;
            container.appendChild(stamp);
        }

        // Trigger animation
        stamp.classList.remove('show');
        void stamp.offsetWidth; // Force reflow
        stamp.classList.add('show');

        // Play success sound
        SoundFX.success();
    }

    /**
     * Notify that input is complete
     */
    private notifyComplete(): void {
        if (this.onComplete && this.currentWord) {
            this.onComplete({
                input: this.currentWord.term,
                success: true,
                mistakeCount: this.mistakesMade,
                hintUsed: this.hintUsed,
            });
        }
    }

    /**
     * Toggle the grid style
     */
    toggleGrid(): void {
        const states: ('tian' | 'mi' | 'blank')[] = ['tian', 'mi', 'blank'];
        const currentIndex = states.indexOf(this.gridState);
        this.gridState = states[(currentIndex + 1) % states.length];

        // Update all char slots
        this.charElements.forEach(box => {
            const slot = box.querySelector('.char-slot');
            if (slot) {
                slot.classList.remove('grid-tian', 'grid-mi', 'grid-blank');
                slot.classList.add(`grid-${this.gridState}`);
            }
        });
    }
}

/**
 * Create the default input handler (HanziWriter-based)
 */
export function createDefaultInputHandler(): InputHandler {
    return new HanziWriterInput();
}

/**
 * Input mode type
 */
export type InputMode = 'stroke';


