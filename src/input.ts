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
 */
export class HanziWriterInput implements InputHandler {
    private writers: HanziWriter[] = [];
    private completedChars = 0;
    private mistakesMade = 0;
    private hintUsed = false;
    private hintStrokeIndex: number[] = [];
    private currentWord: PracticeWord | null = null;


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
        this.completedChars = 0;
        this.mistakesMade = 0;
        this.hintUsed = false;
        this.hintStrokeIndex = [];

        const chars = word.term.split('');
        const pinyinSegments = word.pinyin.split(' ');

        chars.forEach((char, index) => {
            const charBox = document.createElement('div');
            charBox.className = 'char-box';

            const div = document.createElement('div');
            div.id = `char-${index}`;
            div.className = 'char-slot';
            if (index === 0) div.classList.add('active');

            const pinyinLabel = document.createElement('div');
            pinyinLabel.className = 'char-pinyin-label';
            pinyinLabel.textContent = pinyinSegments[index] || '';

            charBox.appendChild(div);
            charBox.appendChild(pinyinLabel);
            container.appendChild(charBox);

            const writer = HanziWriter.create(`char-${index}`, char, {
                width: 234,
                height: 234,
                padding: 5,
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

            // Add scroll listener for mobile
            div.addEventListener('pointerdown', () => {
                this.scrollToActiveChar(div);
            });
        });
    }

    /**
     * Clean up and destroy the input handler
     */
    destroy(): void {
        this.writers = [];
        this.currentWord = null;
        this.completedChars = 0;
        this.mistakesMade = 0;
        this.hintUsed = false;
        this.hintStrokeIndex = [];
    }

    /**
     * Show a hint for the current character
     */
    showHint(): void {
        this.hintUsed = true;

        // Find the active character slot
        const activeSlot = document.querySelector('.char-slot.active');
        if (!activeSlot) return;

        const activeIndex = parseInt(activeSlot.id.replace('char-', ''));
        const writer = this.writers[activeIndex];
        if (!writer) return;

        // Get current stroke index based on user's actual progress
        const strokeIndex = this.hintStrokeIndex[activeIndex] || 0;
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

        if (index + 1 < this.writers.length) {
            const nextBox = document.getElementById(`char-${index + 1}`);
            if (nextBox) nextBox.classList.add('active');
        }

        if (this.completedChars === this.writers.length) {
            this.notifyComplete();
        }
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
     * Scroll the element into the center of the viewport (mobile optimization)
     */
    private scrollToActiveChar(element: HTMLElement): void {
        if (window.innerWidth > 600) return;

        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
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
export type InputMode = 'stroke' | 'handwriting';

/**
 * Create an input handler based on mode
 */
export { HandwritingInput } from './handwriting';

