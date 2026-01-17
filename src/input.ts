/**
 * Input Handler Module
 * Abstraction layer for different character input methods
 */

// import HanziWriter from 'hanzi-writer'; // Lazy loaded
import { SoundFX } from './audio';
import { splitTextByPunctuation } from './utils/text';
import type { PracticeWord } from './types';
import type { InputHandler, InputResult } from './types';

/**
 * HanziWriter-based input handler for stroke-by-stroke character writing
 * Now uses dictation-style single character carousel
 */
export class HanziWriterInput implements InputHandler {
    private writers: any[] = []; // HanziWriter instances
    private charElements: HTMLElement[] = [];
    private indicatorsContainer: HTMLElement | null = null;
    private completedChars = 0;
    private mistakesMade = 0;
    private hintUsed = false;
    private hintStrokeIndex: number[] = [];
    private currentWord: PracticeWord | null = null;
    private currentCharIndex = 0;
    private previousCharIndex = 0; // Track for animation direction
    private validCharIndices: number[] = []; // Non-punctuation character indices
    private chunks: { start: number; end: number; text: string }[] = [];
    private currentChunkIndex = 0;
    // private navContainer: HTMLElement | null = null;

    // Track event listeners for cleanup
    private touchStartListener: ((e: TouchEvent) => void) | null = null;
    private touchEndListener: ((e: TouchEvent) => void) | null = null;


    onComplete?: (result: InputResult) => void;
    onCharComplete?: (index: number) => void;
    onMistake?: (index: number) => void;
    onChunkChange?: (chunkText: string, completedText: string) => void;

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

        // Split into chunks using centralized text utility
        const textChunks = splitTextByPunctuation(word.term);
        this.chunks = textChunks.map(chunk => ({
            start: chunk.startPos,
            end: chunk.startPos + chunk.phrase.length,
            text: chunk.phrase
        }));

        // If no chunks were created (e.g. no punctuation), treat whole word as one chunk
        if (this.chunks.length === 0) {
            this.chunks.push({
                start: 0,
                end: word.term.length,
                text: word.term
            });
        }

        this.currentChunkIndex = 0;

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

        // Add indicators for navigation
        this.indicatorsContainer = document.createElement('div');
        this.indicatorsContainer.className = 'dictation-indicators';
        this.indicatorsContainer.id = 'spelling-indicators';
        container.appendChild(this.indicatorsContainer);

        // Add enhanced swipe support on indicators with smooth animations
        let touchStartX = 0;
        let touchStartY = 0;
        let isSwiping = false;

        this.touchStartListener = (e: TouchEvent) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            isSwiping = false;
        };

        const touchMoveListener = (e: TouchEvent) => {
            if (!touchStartX) return;

            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const deltaX = touchX - touchStartX;
            const deltaY = touchY - touchStartY;

            // Detect horizontal swipe (more horizontal than vertical)
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
                isSwiping = true;
                // Prevent vertical scrolling while swiping horizontally on indicators
                e.preventDefault();
            }
        };

        this.touchEndListener = (e: TouchEvent) => {
            if (!isSwiping || !touchStartX) {
                touchStartX = 0;
                touchStartY = 0;
                return;
            }

            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > 50) {
                if (diff > 0) this.nextCharacter();
                else this.previousCharacter();
            }

            touchStartX = 0;
            touchStartY = 0;
            isSwiping = false;
        };

        this.indicatorsContainer.addEventListener('touchstart', this.touchStartListener, { passive: true });
        this.indicatorsContainer.addEventListener('touchmove', touchMoveListener, { passive: false });
        this.indicatorsContainer.addEventListener('touchend', this.touchEndListener, { passive: true });

        // Dynamic import for HanziWriter
        try {
            const HanziWriterModule = await import('hanzi-writer');
            const HanziWriter = HanziWriterModule.default;

            // Calculate consistent size for all characters based on CSS: min(240px, 60vw)
            // This ensures all characters use the same size regardless of visibility
            const viewportWidth = window.innerWidth;
            const size = Math.min(240, viewportWidth * 0.6);

            // Create HanziWriters AFTER DOM insertion
            charData.forEach(({ char, index }) => {
                const writer = HanziWriter.create(`char-${index}`, char, {
                    width: size,
                    height: size,
                    padding: size * 0.1, // 10% padding for better centering
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
        // Determine animation direction
        const direction = this.currentCharIndex > this.previousCharIndex ? 'next' : 'prev';

        // Hide all, show active with animations
        this.charElements.forEach((el, i) => {
            // Remove all animation classes first
            el.classList.remove('slide-in-left', 'slide-in-right', 'slide-out-left', 'slide-out-right');

            if (i === this.currentCharIndex) {
                // Showing this element - slide in from appropriate direction
                el.style.display = 'flex';
                el.classList.remove('spelling-hidden');
                el.classList.add('spelling-active');

                // Add slide-in animation
                requestAnimationFrame(() => {
                    el.classList.add(direction === 'next' ? 'slide-in-right' : 'slide-in-left');
                });

                el.querySelector('.char-slot')?.classList.add('active');
            } else if (i === this.previousCharIndex && this.previousCharIndex !== this.currentCharIndex) {
                // Hiding previous element - slide out in opposite direction
                el.classList.add(direction === 'next' ? 'slide-out-left' : 'slide-out-right');

                // Hide after animation completes
                setTimeout(() => {
                    el.style.display = 'none';
                    el.classList.add('spelling-hidden');
                    el.classList.remove('spelling-active');
                }, 300); // Match animation duration

                el.querySelector('.char-slot')?.classList.remove('active');
            } else {
                // Already hidden elements
                el.style.display = 'none';
                el.classList.add('spelling-hidden');
                el.classList.remove('spelling-active');
                el.querySelector('.char-slot')?.classList.remove('active');
            }
        });

        // Update previous index for next transition
        this.previousCharIndex = this.currentCharIndex;

        // Trigger chunk change callback
        if (this.onChunkChange) {
            const currentText = this.getCurrentChunkText();
            const completedText = this.getCompletedText();
            this.onChunkChange(currentText, completedText);
        }

        // Update Indicators (Dots for CURRENT CHUNK ONLY)
        if (this.indicatorsContainer) {
            this.indicatorsContainer.innerHTML = '';

            const chunk = this.chunks[this.currentChunkIndex];
            const chunkCharIndices = this.validCharIndices.filter(idx => idx >= chunk.start && idx < chunk.end);

            chunkCharIndices.forEach((globalIndex) => {
                const dot = document.createElement('div');
                const isCurrent = this.validCharIndices[this.currentCharIndex] === globalIndex;
                dot.className = `indicator-dot ${isCurrent ? 'active' : ''}`;
                dot.style.cursor = 'pointer';

                // Jump to the index in validCharIndices
                dot.onclick = () => {
                    const targetIdx = this.validCharIndices.indexOf(globalIndex);
                    if (targetIdx !== -1) {
                        this.currentCharIndex = targetIdx;
                        this.updateCarouselView();
                    }
                };

                // Check if this character is completed by looking at the DOM element directly
                const charSlot = document.getElementById(`char-${globalIndex}`);
                if (charSlot?.classList.contains('success')) {
                    dot.classList.add('correct');
                }

                this.indicatorsContainer?.appendChild(dot);
            });

            // If there are multiple chunks, add a chunk indicator/counter
            if (this.chunks.length > 1) {
                const counter = document.createElement('div');
                counter.className = 'chunk-counter';
                counter.textContent = `${this.currentChunkIndex + 1} / ${this.chunks.length}`;
                counter.style.fontSize = '0.8rem';
                counter.style.marginTop = '10px';
                counter.style.opacity = '0.7';
                this.indicatorsContainer.appendChild(counter);
            }
        }

        // Update Global Pinyin Display
        const pinyinDisplay = document.getElementById('pinyin-display');
        if (pinyinDisplay && this.currentWord) {
            const pinyinSegments = this.currentWord.pinyin.split(' ');
            const charIndex = this.validCharIndices[this.currentCharIndex];
            // Add bounds checking for array access
            if (charIndex !== undefined && charIndex >= 0 && charIndex < pinyinSegments.length) {
                pinyinDisplay.textContent = pinyinSegments[charIndex] || '';
            } else {
                pinyinDisplay.textContent = '';
            }
        }

        // Update Progress Bar
        const progressContainer = document.getElementById('spelling-progress-bar');
        if (progressContainer) {
            const progressPercent = (this.completedChars / this.validCharIndices.length) * 100;
            progressContainer.innerHTML = `<div class="dictation-progress-fill" style="width: ${progressPercent}%"></div>`;
        }

        // Update Definition (Placeholder if empty)
        const defDisplay = document.getElementById('definition-display');
        if (defDisplay && this.currentWord) {
            defDisplay.textContent = (this.currentWord as any).definition || '';
        }
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        // Clean up event listeners before removing DOM elements
        if (this.indicatorsContainer) {
            if (this.touchStartListener) {
                this.indicatorsContainer.removeEventListener('touchstart', this.touchStartListener);
                this.touchStartListener = null;
            }
            if (this.touchEndListener) {
                this.indicatorsContainer.removeEventListener('touchend', this.touchEndListener);
                this.touchEndListener = null;
            }
            this.indicatorsContainer.remove();
            this.indicatorsContainer = null;
        }

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

        // Auto-advance logic
        if (this.currentCharIndex < this.validCharIndices.length - 1) {
            const nextGlobalIdx = this.validCharIndices[this.currentCharIndex + 1];
            const currentChunk = this.chunks[this.currentChunkIndex];

            if (nextGlobalIdx < currentChunk.end) {
                // Next char in SAME chunk
                setTimeout(() => {
                    this.currentCharIndex++;
                    this.updateCarouselView();
                }, 600);
            } else {
                // End of chunk reached
                if (this.currentChunkIndex < this.chunks.length - 1) {
                    // Advance to NEXT chunk
                    setTimeout(() => {
                        this.currentChunkIndex++;
                        this.currentCharIndex++;
                        this.updateCarouselView();
                        // Optional: play audio for next chunk? 
                        // For spelling, we usually play the whole sentence, but let's stick to dictation logic if possible.
                    }, 600);
                } else {
                    // All chars in all chunks done
                    setTimeout(() => this.notifyComplete(), 600);
                }
            }
        } else if (this.completedChars === this.validCharIndices.length) {
            // All done (last char of last chunk)
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

    /**
     * Reveal current character
     *
     * IMPORTANT: hideCharacter MUST be called with {duration} option in quiz mode
     * Otherwise strokes become invisible after reveal (regression bug)
     */
    revealCharacter(): void {
        this.hintUsed = true;

        const writerIndex = this.currentCharIndex;
        const writer = this.writers[writerIndex];
        if (!writer) return;

        // First ensure character is hidden (safety reset)
        try {
            writer.hideCharacter({ duration: 0 });
        } catch (e) {
            // Ignore - character might already be hidden
        }

        // Show character briefly
        writer.showCharacter({ duration: 400 });

        // Hide after 1 second to give user a "glimpse"
        setTimeout(() => {
            try {
                // CRITICAL: Must use {duration} option or strokes won't show after reveal
                writer.hideCharacter({ duration: 200 });
            } catch (e) {
                console.warn('Error hiding character:', e);
            }
        }, 1000);

        // Mark hint as used for penalty in SRS
        this.mistakesMade += 2; // Penalty for using reveal

        // No auto-advance, user must write it out
        this.updateCarouselView();
    }

    /**
     * Get all chunks
     */
    getChunks(): { start: number; end: number; text: string }[] {
        return this.chunks;
    }

    /**
     * Get text of current active chunk
     */
    getCurrentChunkText(): string {
        if (this.chunks.length > 0 && this.currentChunkIndex < this.chunks.length) {
            return this.chunks[this.currentChunkIndex].text;
        }
        return this.currentWord ? this.currentWord.term : '';
    }

    /**
     * Get text completed SO FAR (for UI display)
     */
    private getCompletedText(): string {
        if (!this.currentWord) return '';
        if (this.chunks.length <= 1) return ''; // Don't show partial for single chunk words

        // Return text of all PREVIOUS chunks
        let text = '';
        for (let i = 0; i < this.currentChunkIndex; i++) {
            // Include punctuation between chunks if needed (simplified: just concat chunk text for now, 
            // but chunks usually include punctuation if regex split correctly? 
            // Our regex split kept punctuation as separate parts then merged. 
            // Wait, logic says: fullChunk = phrase + punct. 
            // this.chunks stores 'phrase', but effectively we skip punctuation in indices.
            // Let's reconstruct from Chunks data or source word?)

            // Actually, best to rebuild from source word using indices.
            const chunk = this.chunks[i];
            // We want the text including punctuation that followed it
            const nextChunkStart = (i + 1 < this.chunks.length) ? this.chunks[i + 1].start : this.currentWord.term.length;
            text += this.currentWord.term.substring(chunk.start, nextChunkStart);
        }
        return text;
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


