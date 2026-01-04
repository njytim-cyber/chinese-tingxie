/**
 * Handwriting Input Module
 * Canvas-based freeform writing with Google Cloud Vision OCR
 * 
 * Flow:
 * 1. User writes on canvas
 * 2. Canvas exported as image, sent to Vision API (via Netlify Function)
 * 3. Top 5 OCR recognition results shown as candidates
 * 4. User selects the phrase they wrote
 */

import type { PracticeWord } from './data';
import type { InputHandler, InputResult } from './types';

/**
 * OCR recognition result
 */
interface OCRResult {
    text: string;
    alternatives: string[];
}

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
 * Handwriting-based input handler with Vision API OCR
 */
export class HandwritingInput implements InputHandler {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private strokes: Stroke[] = [];
    private currentStroke: Stroke | null = null;
    private isDrawing = false;
    private currentWord: PracticeWord | null = null;
    private candidateContainer: HTMLElement | null = null;
    private ocrResults: string[] = [];

    onComplete: ((result: InputResult) => void) | null = null;
    onCharComplete: ((index: number) => void) | null = null;
    onMistake: ((index: number) => void) | null = null;

    /**
     * Set lesson phrases (not used in OCR mode, but required by interface)
     */
    setLessonPhrases(_phrases: PracticeWord[]): void {
        // Not used in OCR mode - candidates come from recognition
    }

    /**
     * Initialize the handwriting input
     */
    init(word: PracticeWord, container: HTMLElement): void {
        this.destroy();

        this.currentWord = word;
        this.strokes = [];
        this.ocrResults = [];

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
            // White background for OCR (important!)
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.strokeStyle = '#000000'; // Black strokes for OCR
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
        doneBtn.addEventListener('click', () => this.recognizeAndShowCandidates());

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
        this.ocrResults = [];
    }

    /**
     * Show hint - shows candidates
     */
    showHint(): void {
        if (this.currentWord && this.candidateContainer) {
            this.recognizeAndShowCandidates();
        }
    }

    wasHintUsed(): boolean {
        return false;
    }

    getMistakeCount(): number {
        return 0;
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

        // White background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.strokes = [];
        this.ocrResults = [];

        if (this.candidateContainer) {
            this.candidateContainer.style.display = 'none';
        }
    }

    /**
     * Call Vision API and show OCR results as candidates
     */
    private async recognizeAndShowCandidates(): Promise<void> {
        if (!this.candidateContainer || !this.currentWord || !this.canvas) return;

        // Show loading state
        this.candidateContainer.innerHTML = '<div class="candidates-title">识别中...</div>';
        this.candidateContainer.style.display = 'block';

        try {
            // Get canvas as base64 image
            const dataUrl = this.canvas.toDataURL('image/png');
            const base64Image = dataUrl.replace(/^data:image\/png;base64,/, '');

            // Call Vision API via Netlify Function
            const response = await fetch('/.netlify/functions/vision-ocr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image: base64Image })
            });

            if (!response.ok) {
                throw new Error(`OCR failed: ${response.status}`);
            }

            const result: OCRResult = await response.json();

            // Build candidates from OCR results
            this.ocrResults = [result.text, ...result.alternatives].filter(Boolean);

            if (this.ocrResults.length === 0) {
                this.ocrResults = ['(无法识别)'];
            }

            this.showCandidates();

        } catch (error) {
            console.error('[Vision OCR] Error:', error);
            this.candidateContainer.innerHTML = `<div class="candidates-title">识别失败: ${error}</div>`;

            // Fall back to showing just the correct answer
            this.ocrResults = [this.currentWord.term];
            this.showCandidates();
        }
    }

    /**
     * Display OCR candidates
     */
    private showCandidates(): void {
        if (!this.candidateContainer || !this.currentWord) return;

        const topResult = this.ocrResults[0] || ''; // Keep for potential future use
        void topResult; // Suppress unused warning
        this.candidateContainer.innerHTML = `<div class="candidates-title">识别结果 (前5个匹配):</div>`;

        // Show top 5 OCR results
        this.ocrResults.slice(0, 5).forEach((text, index) => {
            const btn = document.createElement('button');
            btn.className = 'candidate-item';
            btn.innerHTML = `<span class="candidate-term">${text}</span><span class="candidate-rank">#${index + 1}</span>`;
            btn.addEventListener('click', () => this.selectCandidate(text));
            this.candidateContainer!.appendChild(btn);
        });

        // Always show correct answer if not in results
        if (!this.ocrResults.includes(this.currentWord.term)) {
            const correctBtn = document.createElement('button');
            correctBtn.className = 'candidate-item candidate-correct-answer';
            correctBtn.innerHTML = `<span class="candidate-term">${this.currentWord.term}</span><span class="candidate-rank">正确答案</span>`;
            correctBtn.addEventListener('click', () => this.selectCandidate(this.currentWord!.term));
            this.candidateContainer.appendChild(correctBtn);
        }
    }

    /**
     * Handle candidate selection
     */
    private selectCandidate(text: string): void {
        if (!this.currentWord) return;

        const isCorrect = text === this.currentWord.term;

        // Visual feedback on buttons
        const buttons = this.candidateContainer?.querySelectorAll('.candidate-item');
        buttons?.forEach(btn => {
            const term = btn.querySelector('.candidate-term')?.textContent;
            if (term === this.currentWord!.term) {
                btn.classList.add('correct');
            } else if (term === text && !isCorrect) {
                btn.classList.add('wrong');
            }
            (btn as HTMLButtonElement).disabled = true;
        });

        // Trigger completion after brief delay
        setTimeout(() => {
            if (this.onComplete) {
                this.onComplete({
                    input: text,
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
