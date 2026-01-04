/**
 * Handwriting Input Module
 * Canvas-based freeform writing with HanziLookup character recognition
 * 
 * Flow:
 * 1. User writes on canvas
 * 2. System recognizes characters using HanziLookupJS
 * 3. Candidates ranked by similarity to recognized text
 * 4. User selects from ranked options
 */

import type { PracticeWord } from './data';
import type { InputHandler, InputResult } from './types';

// Declare HanziLookup as global (loaded via CDN)
declare const HanziLookup: {
    init: (name: string, url: string, callback: (success: boolean) => void) => void;
    AnalyzedCharacter: new (strokes: number[][][]) => unknown;
    Matcher: new (name: string) => {
        match: (char: unknown, count: number, callback: (matches: { character: string; score: number }[]) => void) => void;
    };
};

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

// Track if HanziLookup is initialized
let hanziLookupReady = false;
let hanziLookupInitializing = false;

/**
 * Initialize HanziLookup (called once)
 */
function initHanziLookup(): Promise<boolean> {
    return new Promise((resolve) => {
        if (hanziLookupReady) {
            resolve(true);
            return;
        }
        if (hanziLookupInitializing) {
            // Wait for existing initialization
            const checkReady = setInterval(() => {
                if (hanziLookupReady) {
                    clearInterval(checkReady);
                    resolve(true);
                }
            }, 100);
            return;
        }

        hanziLookupInitializing = true;

        // Check if HanziLookup is available
        if (typeof HanziLookup === 'undefined') {
            console.warn('HanziLookup not loaded - falling back to basic mode');
            resolve(false);
            return;
        }

        // Load MMAH character data
        HanziLookup.init(
            'mmah',
            'https://cdn.jsdelivr.net/gh/gugray/HanziLookupJS@master/dist/mmah.json',
            (success) => {
                hanziLookupReady = success;
                hanziLookupInitializing = false;
                if (!success) {
                    console.warn('Failed to load HanziLookup data');
                }
                resolve(success);
            }
        );
    });
}

/**
 * Handwriting-based input handler with character recognition
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
    private recognizedText = '';

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
        this.recognizedText = '';

        // Initialize HanziLookup in background
        initHanziLookup();

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
        this.recognizedText = '';
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

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.strokes = [];
        this.recognizedText = '';

        if (this.candidateContainer) {
            this.candidateContainer.style.display = 'none';
        }
    }

    /**
     * Recognize drawn characters and show ranked candidates
     */
    private async recognizeAndShowCandidates(): Promise<void> {
        if (!this.candidateContainer || !this.currentWord) return;

        // Show loading state
        this.candidateContainer.innerHTML = '<div class="candidates-title">识别中...</div>';
        this.candidateContainer.style.display = 'block';

        // Try to recognize characters
        if (hanziLookupReady && this.strokes.length > 0) {
            try {
                this.recognizedText = await this.recognizeCharacters();
            } catch (e) {
                console.warn('Recognition failed:', e);
                this.recognizedText = '';
            }
        }

        // Generate and show ranked candidates
        const candidates = this.generateRankedCandidates();
        this.showCandidates(candidates);
    }

    /**
     * Recognize characters from strokes using HanziLookup
     * Segments strokes by horizontal position to handle multi-character phrases
     */
    private async recognizeCharacters(): Promise<string> {
        if (!this.currentWord || this.strokes.length === 0) {
            return '';
        }

        // Segment strokes into character groups based on X position
        const charGroups = this.segmentStrokesIntoCharacters();

        console.log(`[HandwritingRecog] Segmented ${this.strokes.length} strokes into ${charGroups.length} character groups`);

        // Recognize each character group
        const recognizedChars: string[] = [];

        for (const group of charGroups) {
            try {
                const char = await this.recognizeSingleCharacter(group);
                if (char) {
                    recognizedChars.push(char);
                    console.log(`[HandwritingRecog] Recognized: ${char}`);
                }
            } catch (e) {
                console.warn('[HandwritingRecog] Error recognizing character:', e);
            }
        }

        const result = recognizedChars.join('');
        console.log(`[HandwritingRecog] Full recognition result: "${result}"`);
        return result;
    }

    /**
     * Segment strokes into groups representing individual characters
     * Uses horizontal clustering based on stroke center X positions
     */
    private segmentStrokesIntoCharacters(): Stroke[][] {
        if (this.strokes.length === 0) return [];
        if (!this.currentWord) return [this.strokes];

        const expectedCharCount = this.currentWord.term.length;

        // Calculate center X for each stroke
        const strokeData = this.strokes.map((stroke, index) => {
            let sumX = 0;
            for (const p of stroke.points) {
                sumX += p.x;
            }
            return {
                index,
                stroke,
                centerX: sumX / stroke.points.length
            };
        });

        // Sort by X position (left to right)
        strokeData.sort((a, b) => a.centerX - b.centerX);

        // Divide strokes into equal groups based on expected character count
        const groups: Stroke[][] = [];
        const groupSize = Math.ceil(strokeData.length / expectedCharCount);

        for (let i = 0; i < expectedCharCount; i++) {
            const start = i * groupSize;
            const end = Math.min(start + groupSize, strokeData.length);
            const groupStrokes = strokeData.slice(start, end).map(d => d.stroke);
            if (groupStrokes.length > 0) {
                groups.push(groupStrokes);
            }
        }

        return groups;
    }

    /**
     * Recognize a single character from a group of strokes
     */
    private recognizeSingleCharacter(strokes: Stroke[]): Promise<string> {
        return new Promise((resolve) => {
            if (strokes.length === 0) {
                resolve('');
                return;
            }

            // Convert to HanziLookup format
            const hlStrokes: number[][][] = strokes.map(stroke =>
                stroke.points.map(p => [p.x, p.y])
            );

            try {
                const analyzedChar = new HanziLookup.AnalyzedCharacter(hlStrokes);
                const matcher = new HanziLookup.Matcher('mmah');

                matcher.match(analyzedChar, 3, (matches) => {
                    if (matches && matches.length > 0) {
                        resolve(matches[0].character);
                    } else {
                        resolve('');
                    }
                });
            } catch (e) {
                console.warn('[HandwritingRecog] Single char recognition error:', e);
                resolve('');
            }
        });
    }

    /**
     * Calculate similarity between two strings
     * Uses character overlap scoring
     */
    private calculateSimilarity(recognized: string, candidate: string): number {
        if (!recognized || recognized.length === 0) return 0;

        let score = 0;
        const recognizedChars = recognized.split('');
        const candidateChars = candidate.split('');

        // Check for matching characters
        for (const char of recognizedChars) {
            if (candidateChars.includes(char)) {
                score += 1;
            }
        }

        // Bonus for exact match
        if (recognized === candidate) {
            score += 10;
        }

        // Bonus for same length
        if (recognizedChars.length === candidateChars.length) {
            score += 0.5;
        }

        return score;
    }

    /**
     * Generate candidates ranked by similarity to recognized text
     */
    private generateRankedCandidates(): PracticeWord[] {
        if (!this.currentWord) return [];

        // Always include current word
        const allCandidates = [...this.lessonPhrases];

        // If we have recognized text, rank by similarity
        if (this.recognizedText) {
            allCandidates.sort((a, b) => {
                const scoreA = this.calculateSimilarity(this.recognizedText, a.term);
                const scoreB = this.calculateSimilarity(this.recognizedText, b.term);
                return scoreB - scoreA; // Higher score first
            });
        } else {
            // No recognition - shuffle
            allCandidates.sort(() => Math.random() - 0.5);
        }

        // Ensure correct answer is included (if not already in top 5)
        const topCandidates = allCandidates.slice(0, 5);
        const correctIncluded = topCandidates.some(c => c.term === this.currentWord!.term);

        if (!correctIncluded) {
            // Replace last candidate with correct answer
            topCandidates[4] = this.currentWord;
            // Re-shuffle so correct isn't always last
            topCandidates.sort(() => Math.random() - 0.5);
        }

        return topCandidates;
    }

    /**
     * Display candidates
     */
    private showCandidates(candidates: PracticeWord[]): void {
        if (!this.candidateContainer) return;

        const titleText = this.recognizedText
            ? `识别到: "${this.recognizedText}" - 选择正确的词语:`
            : '选择你写的词语:';

        this.candidateContainer.innerHTML = `<div class="candidates-title">${titleText}</div>`;

        candidates.forEach(phrase => {
            const btn = document.createElement('button');
            btn.className = 'candidate-item';
            btn.innerHTML = `<span class="candidate-term">${phrase.term}</span><span class="candidate-pinyin">${phrase.pinyin}</span>`;
            btn.addEventListener('click', () => this.selectCandidate(phrase));
            this.candidateContainer!.appendChild(btn);
        });
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
