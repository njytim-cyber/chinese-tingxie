/**
 * Handwriting Input Module
 * Canvas-based freeform writing with phrase candidate selection
 * 
 * This is a simpler approach for advanced students:
 * - User writes on canvas (practice without guidance)
 * - User self-selects from phrase candidates what they wrote
 * - System matches selection to expected answer
 */

import type { PracticeWord } from './data';
import type { InputHandler, InputResult } from './types';

/**
 * Point on the canvas
 */
interface Point {
    x: number;
    y: number;
}

/**
 * A stroke is a series of points
 */
interface Stroke {
    points: Point[];
}

/**
 * Handwriting-based input handler
 * User writes freely, then selects from phrase candidates
 */
export class HandwritingInput implements InputHandler {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private strokes: Stroke[] = [];
    private currentStroke: Stroke | null = null;
    private isDrawing = false;
    private currentWord: PracticeWord | null = null;

    private candidateContainer: HTMLElement | null = null;
    private lessonPhrases: PracticeWord[] = [];

    onComplete: ((result: InputResult) => void) | null = null;
    onCharComplete: ((index: number) => void) | null = null;
    onMistake: ((index: number) => void) | null = null;

    /**
     * Set the lesson phrases for candidate generation
     */
    setLessonPhrases(phrases: PracticeWord[]): void {
        this.lessonPhrases = phrases;
    }

    /**
     * Initialize the handwriting input
     */
    init(word: PracticeWord, container: HTMLElement): void {
        this.destroy();

        this.currentWord = word;

        this.strokes = [];

        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'handwriting-wrapper';

        // Create canvas container
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'handwriting-canvas-container';

        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'handwriting-canvas';
        this.canvas.width = 350;
        this.canvas.height = 200;
        this.ctx = this.canvas.getContext('2d');

        if (this.ctx) {
            this.ctx.strokeStyle = '#38bdf8';
            this.ctx.lineWidth = 4;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
        }

        // Drawing event handlers
        this.canvas.addEventListener('pointerdown', this.startStroke.bind(this));
        this.canvas.addEventListener('pointermove', this.continueStroke.bind(this));
        this.canvas.addEventListener('pointerup', this.endStroke.bind(this));
        this.canvas.addEventListener('pointerleave', this.endStroke.bind(this));

        canvasContainer.appendChild(this.canvas);

        // Create control buttons
        const controls = document.createElement('div');
        controls.className = 'handwriting-controls';

        const clearBtn = document.createElement('button');
        clearBtn.className = 'game-btn handwriting-clear-btn';
        clearBtn.textContent = '🗑️ 清除';
        clearBtn.addEventListener('click', () => this.clearCanvas());

        const doneBtn = document.createElement('button');
        doneBtn.className = 'game-btn handwriting-done-btn';
        doneBtn.textContent = '✓ 完成';
        doneBtn.addEventListener('click', () => this.showCandidates());

        controls.appendChild(clearBtn);
        controls.appendChild(doneBtn);
        canvasContainer.appendChild(controls);

        wrapper.appendChild(canvasContainer);

        // Create candidate selection container (hidden initially)
        this.candidateContainer = document.createElement('div');
        this.candidateContainer.className = 'phrase-candidates';
        this.candidateContainer.style.display = 'none';
        wrapper.appendChild(this.candidateContainer);

        // Add instruction text
        const instruction = document.createElement('div');
        instruction.className = 'handwriting-instruction';
        instruction.innerHTML = `<span class="instruction-text">写出这个词语: </span><span class="expected-chars">${word.term.length}个字</span>`;
        wrapper.insertBefore(instruction, canvasContainer);

        container.appendChild(wrapper);
    }

    /**
     * Clean up
     */
    destroy(): void {
        if (this.canvas) {
            this.canvas.removeEventListener('pointerdown', this.startStroke.bind(this));
            this.canvas.removeEventListener('pointermove', this.continueStroke.bind(this));
            this.canvas.removeEventListener('pointerup', this.endStroke.bind(this));
            this.canvas.removeEventListener('pointerleave', this.endStroke.bind(this));
        }
        this.canvas = null;
        this.ctx = null;
        this.candidateContainer = null;
        this.currentWord = null;
        this.strokes = [];
        this.currentStroke = null;
    }

    /**
     * Show hint - for handwriting, show first character
     */
    showHint(): void {
        if (this.currentWord && this.candidateContainer) {
            // Show candidates as hint
            this.showCandidates();
        }
    }

    /**
     * Check if hint was used (candidates shown before completion)
     */
    wasHintUsed(): boolean {
        return false; // In handwriting mode, showing candidates is the normal flow
    }

    /**
     * Get mistake count
     */
    getMistakeCount(): number {
        return 0; // Handwriting mode doesn't track stroke mistakes
    }

    /**
     * Start a new stroke
     */
    private startStroke(e: PointerEvent): void {
        if (!this.canvas) return;

        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.currentStroke = { points: [{ x, y }] };

        if (this.ctx) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
        }

        // Capture pointer for better tracking
        this.canvas.setPointerCapture(e.pointerId);
    }

    /**
     * Continue drawing stroke
     */
    private continueStroke(e: PointerEvent): void {
        if (!this.isDrawing || !this.canvas || !this.ctx || !this.currentStroke) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.currentStroke.points.push({ x, y });

        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }

    /**
     * End current stroke
     */
    private endStroke(e: PointerEvent): void {
        if (!this.isDrawing) return;

        this.isDrawing = false;

        if (this.currentStroke && this.currentStroke.points.length > 1) {
            this.strokes.push(this.currentStroke);
        }

        this.currentStroke = null;

        if (this.canvas) {
            this.canvas.releasePointerCapture(e.pointerId);
        }
    }

    /**
     * Clear the canvas
     */
    private clearCanvas(): void {
        if (!this.ctx || !this.canvas) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.strokes = [];

        // Hide candidates if shown
        if (this.candidateContainer) {
            this.candidateContainer.style.display = 'none';
        }
    }

    /**
     * Generate and show phrase candidates
     */
    private showCandidates(): void {
        if (!this.candidateContainer || !this.currentWord) return;

        // Get candidates from lesson phrases
        const candidates = this.generateCandidates();

        this.candidateContainer.innerHTML = '<div class="candidates-title">选择你写的词语:</div>';
        this.candidateContainer.style.display = 'block';

        candidates.forEach(phrase => {
            const btn = document.createElement('button');
            btn.className = 'candidate-item';
            btn.innerHTML = `<span class="candidate-term">${phrase.term}</span><span class="candidate-pinyin">${phrase.pinyin}</span>`;
            btn.addEventListener('click', () => this.selectCandidate(phrase));
            this.candidateContainer!.appendChild(btn);
        });
    }

    /**
     * Generate phrase candidates from lesson vocabulary
     * Always includes the correct answer + random others
     */
    private generateCandidates(): PracticeWord[] {
        if (!this.currentWord) return [];

        const candidates: PracticeWord[] = [this.currentWord];

        // Get other phrases from lesson (excluding current)
        const otherPhrases = this.lessonPhrases.filter(
            p => p.term !== this.currentWord!.term
        );

        // Shuffle and take up to 4 more
        const shuffled = otherPhrases.sort(() => Math.random() - 0.5);
        candidates.push(...shuffled.slice(0, 4));

        // Shuffle final list so correct answer isn't always first
        return candidates.sort(() => Math.random() - 0.5);
    }

    /**
     * Handle candidate selection
     */
    private selectCandidate(phrase: PracticeWord): void {
        if (!this.currentWord) return;

        const isCorrect = phrase.term === this.currentWord.term;

        // Visual feedback on buttons
        const buttons = this.candidateContainer?.querySelectorAll('.candidate-item');
        buttons?.forEach(btn => {
            const term = btn.querySelector('.candidate-term')?.textContent;
            if (term === this.currentWord!.term) {
                btn.classList.add('correct');
            } else if (term === phrase.term && !isCorrect) {
                btn.classList.add('wrong');
            }
            (btn as HTMLButtonElement).disabled = true;
        });

        // Trigger completion after brief delay
        setTimeout(() => {
            if (this.onComplete) {
                this.onComplete({
                    input: phrase.term,
                    success: isCorrect,
                    mistakeCount: isCorrect ? 0 : 1,
                    hintUsed: false,
                });
            }
        }, 800);
    }
}

/**
 * Create a handwriting input handler
 */
export function createHandwritingInputHandler(): HandwritingInput {
    return new HandwritingInput();
}
