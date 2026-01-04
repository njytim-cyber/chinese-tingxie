/**
 * Input Handler Module
 * Abstraction layer for different character input methods
 */

import HanziWriter from 'hanzi-writer';
import { SoundFX } from './audio';
import type { PracticeWord } from './data';
import type { InputHandler, InputResult } from './types';

/**
 * HanziWriter-based input handler for stroke-by-stroke character writing
 * Now uses dictation-style single character carousel
 */
export class HanziWriterInput implements InputHandler {
    private writers: HanziWriter[] = [];
    private charElements: HTMLElement[] = [];
    private completedChars = 0;
    private mistakesMade = 0;
    private hintUsed = false;
    private hintStrokeIndex: number[] = [];
    private currentWord: PracticeWord | null = null;
    private currentCharIndex = 0;
    private validCharIndices: number[] = []; // Non-punctuation character indices
    private navContainer: HTMLElement | null = null;


    onComplete: ((result: InputResult) => void) | null = null;
    onCharComplete: ((index: number) => void) | null = null;
    onMistake: ((index: number) => void) | null = null;

    /**
     * Initialize the input handler for a word
     */
    init(word: PracticeWord, container: HTMLElement): void {
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
        const pinyinSegments = word.pinyin.split(' ');
        const punctuationRegex = /[，。！？、：；""''（）《》.,!?;:'"()]/;

        // Build valid character indices (skip punctuation)
        chars.forEach((char, index) => {
            if (!punctuationRegex.test(char)) {
                this.validCharIndices.push(index);
            }
        });

        // Create navigation wrapper
        this.navContainer = document.createElement('div');
        this.navContainer.className = 'spelling-carousel';

        // Prev button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'spelling-nav-btn';
        prevBtn.id = 'spelling-prev-btn';
        prevBtn.textContent = '❮';
        prevBtn.onclick = () => this.prevChar();
        this.navContainer.appendChild(prevBtn);

        // Character boxes container
        const charsContainer = document.createElement('div');
        charsContainer.className = 'spelling-chars-container';
        charsContainer.style.display = 'flex';
        charsContainer.style.justifyContent = 'center';

        // Store char data for deferred writer creation
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

            const div = document.createElement('div');
            div.id = `char-${index}`;
            div.className = isFirst ? 'char-slot active' : 'char-slot';

            const pinyinLabel = document.createElement('div');
            pinyinLabel.className = 'char-pinyin-label';
            pinyinLabel.textContent = pinyinSegments[index] || '';

            charBox.appendChild(div);
            charBox.appendChild(pinyinLabel);
            charsContainer.appendChild(charBox);
            this.charElements.push(charBox);
            charData.push({ char, index, element: div });
        });

        this.navContainer.appendChild(charsContainer);

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'spelling-nav-btn';
        nextBtn.id = 'spelling-next-btn';
        nextBtn.textContent = '❯';
        nextBtn.onclick = () => this.nextChar();
        this.navContainer.appendChild(nextBtn);

        container.appendChild(this.navContainer);

        // Progress indicator
        const progressEl = document.createElement('div');
        progressEl.className = 'spelling-progress';
        progressEl.id = 'spelling-progress';
        container.appendChild(progressEl);

        // Create HanziWriters AFTER DOM insertion (elements must be visible)
        // Use setTimeout to ensure DOM is fully rendered
        setTimeout(() => {
            charData.forEach(({ char, index }) => {
                const writer = HanziWriter.create(`char-${index}`, char, {
                    width: 234,
                    height: 234,
                    padding: 15,
                    showOutline: false,
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
                    onCorrectStroke: (strokeData) => {
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
        }, 50);
    }

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
     * Update the carousel view to show current character
     */
    private updateCarouselView(): void {
        // Hide all, show active
        this.charElements.forEach((el, i) => {
            if (i === this.currentCharIndex) {
                el.classList.remove('spelling-hidden');
                el.classList.add('spelling-active');
                el.querySelector('.char-slot')?.classList.add('active');
            } else {
                el.classList.add('spelling-hidden');
                el.classList.remove('spelling-active');
                el.querySelector('.char-slot')?.classList.remove('active');
            }
        });

        // Update nav buttons
        const prevBtn = document.getElementById('spelling-prev-btn');
        const nextBtn = document.getElementById('spelling-next-btn');

        if (prevBtn) {
            prevBtn.style.visibility = this.currentCharIndex === 0 ? 'hidden' : 'visible';
        }

        if (nextBtn) {
            const isLast = this.currentCharIndex === this.validCharIndices.length - 1;
            // Hide next button on last character (auto-complete handles it)
            nextBtn.style.visibility = isLast ? 'hidden' : 'visible';
        }

        // Update progress
        const progressEl = document.getElementById('spelling-progress');
        if (progressEl) {
            progressEl.textContent = `${this.completedChars}/${this.validCharIndices.length}`;
        }
    }

    /**
     * Clean up and destroy the input handler
     */
    destroy(): void {
        this.writers = [];
        this.charElements = [];
        this.currentWord = null;
        this.completedChars = 0;
        this.mistakesMade = 0;
        this.hintUsed = false;
        this.hintStrokeIndex = [];
        this.currentCharIndex = 0;
        this.validCharIndices = [];
        this.navContainer = null;
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
     * Get the number of mistakes made
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
export type InputMode = 'stroke' | 'handwriting';

/**
 * Create an input handler based on mode
 */
export { HandwritingInput } from './handwriting';

