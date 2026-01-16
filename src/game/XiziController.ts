import HanziWriter from 'hanzi-writer';
import { UIManager } from '../ui/UIManager';
import { getCharactersForLesson, getCharacterState, updateCharacterProgress } from '../data';
import { SoundFX } from '../audio';
import { spawnParticles } from '../particles';

/**
 * Xizi (Character Practice) Controller
 * Manages the 5-stage scaffolding practice session
 */
export class XiziController {
    private ui: UIManager;
    private onExit: () => void;
    private sessionStartTime: number = 0;

    // Practice Queue
    private practiceQueue: string[] = [];
    private currentQueueIndex: number = 0;

    // Writers
    private writer: HanziWriter | null = null;
    private targetChar: string = '';

    // Scaffolding State
    private currentStage: number = 0; // 0=Trace, 1=3/4, 2=1/2, 3=1/4, 4=Blank
    private mistakesInCurrentStage: number = 0;

    // DOM Elements
    private container: HTMLElement | null = null;
    private instructionsEl: HTMLElement | null = null;

    constructor(ui: UIManager, onExit: () => void) {
        this.ui = ui;
        this.onExit = onExit;
    }

    /**
     * Start a Xizi practice session for a lesson
     */
    async start(lessonId: number, startTime: number): Promise<void> {
        this.sessionStartTime = startTime;

        // 1. Get characters
        const chars = getCharactersForLesson(lessonId);

        // Filter out simple punctuation/numbers if needed, but getCharactersForLesson should handle most
        // Shuffle or sort by weakest? For now, simple shuffle or sequential
        this.practiceQueue = chars;
        this.currentQueueIndex = 0;

        if (this.practiceQueue.length === 0) {
            this.ui.showFeedback('没有可练习的汉字', '#ef4444');
            setTimeout(() => this.onExit(), 2000);
            return;
        }

        // 2. Setup UI
        this.setupUI();

        // 3. Start first character
        await this.loadCurrentCharacter();
    }

    private setupUI(): void {
        const app = document.querySelector('.game-stage');
        if (!app) return;

        // Clear existing
        app.innerHTML = '';

        // Create Xizi Layout
        const container = document.createElement('div');
        container.className = 'xizi-container';
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding: 20px;
            text-align: center;
        `;

        // Instructions / Stage Indicator
        this.instructionsEl = document.createElement('div');
        this.instructionsEl.className = 'xizi-instructions';
        this.instructionsEl.style.cssText = `
            font-size: 1.2rem;
            color: var(--ink-light);
            margin-bottom: 20px;
            font-family: var(--font-serif);
        `;
        container.appendChild(this.instructionsEl);

        // Character Writer Container
        // We'll use a larger box for detail
        const writerWrapper = document.createElement('div');
        writerWrapper.className = 'xizi-writer-wrapper';
        writerWrapper.style.cssText = `
            width: 280px;
            height: 280px;
            background: #fff;
            border-radius: var(--scholar-radius);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            position: relative;
            margin-bottom: 30px;
            border: 2px solid var(--tang-gold);
        `;

        // Grid background (Tian Zi Ge)
        const grid = document.createElement('div');
        grid.style.cssText = `
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background-image: 
                linear-gradient(rgba(180, 83, 9, 0.2) 1px, transparent 1px),
                linear-gradient(90deg, rgba(180, 83, 9, 0.2) 1px, transparent 1px);
            background-size: 50% 50%;
            background-position: center;
            pointer-events: none; /* Let clicks pass to SVG */
        `;
        writerWrapper.appendChild(grid);
        // Diagonal lines
        const diag = document.createElement('div');
        diag.style.cssText = `
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: 
                linear-gradient(45deg, transparent 49.5%, rgba(180, 83, 9, 0.1) 49.5%, rgba(180, 83, 9, 0.1) 50.5%, transparent 50.5%),
                linear-gradient(-45deg, transparent 49.5%, rgba(180, 83, 9, 0.1) 49.5%, rgba(180, 83, 9, 0.1) 50.5%, transparent 50.5%);
            pointer-events: none;
        `;
        writerWrapper.appendChild(diag);

        const writerTarget = document.createElement('div');
        writerTarget.id = 'xizi-target';
        writerWrapper.appendChild(writerTarget);

        container.appendChild(writerWrapper);

        app.appendChild(container);
        this.container = writerTarget;
    }

    private async loadCurrentCharacter(): Promise<void> {
        if (this.currentQueueIndex >= this.practiceQueue.length) {
            this.finishSession();
            return;
        }

        this.targetChar = this.practiceQueue[this.currentQueueIndex];
        const state = getCharacterState(this.targetChar);

        // Reset stages for this session
        // Only trigger stage 1-5 loop. 
        // If already master (level 5), maybe skip? No, explicit practice means we practice.
        this.currentStage = 0;

        await this.startStage();
    }

    private async startStage(): Promise<void> {
        if (this.currentStage > 4) {
            // Char Complete
            SoundFX.success();
            // Update Data
            updateCharacterProgress(this.targetChar, true);

            this.ui.showFeedback('完成!', '#4ade80');
            setTimeout(() => {
                this.currentQueueIndex++;
                this.loadCurrentCharacter();
            }, 1000);
            return;
        }

        this.mistakesInCurrentStage = 0;
        this.updateInstructions();

        // Init Writer
        if (this.container) {
            this.container.innerHTML = ''; // Start fresh

            this.writer = HanziWriter.create('xizi-target', this.targetChar, {
                width: 280,
                height: 280,
                padding: 20,
                showOutline: false, // We control this
                strokeColor: '#2B2B2B', // Ink color
                radicalColor: '#9CA3AF', // Optional distinction
                showCharacter: false, // We control visibility
                highlightOnComplete: true,
                drawingWidth: 30, // Thicker brush
                drawingColor: '#2B2B2B',
            });

            // Start Quiz
            // Wait for load via quiz

            // Set Outline Opacity via CSS Hack after load
            // We use an interval to check for SVG presence
            const setOpacity = () => {
                const svg = document.querySelector('#xizi-target svg');
                if (svg) {
                    // Stage Config
                    let outlineOpacity = 0;
                    switch (this.currentStage) {
                        case 0: outlineOpacity = 0.7; break; // Full Trace
                        case 1: outlineOpacity = 0.5; break;
                        case 2: outlineOpacity = 0.3; break;
                        case 3: outlineOpacity = 0.15; break;
                        case 4: outlineOpacity = 0; break;   // Blank
                    }

                    if (outlineOpacity > 0) {
                        this.writer?.showOutline();
                        // Find the outline group in SVG and force opacity
                        // HanziWriter usually puts outlines in a group. We look for 'g' tags.
                        // This is a best-effort visual hack.
                        const groups = svg.querySelectorAll('g');
                        groups.forEach(g => {
                            // HanziWriter outlines often have a specific fill color/opacity attr
                            // We attempt to set opacity on everything that looks like an outline (grey)
                            // or simplified, just set the SVG root opacity for outlines if identifiable.
                            // Better approach: HanziWriter API 'showOutline' creates an SVG element.
                            // We can select based on color if we knew it? 
                            // Actually, just relying on show/hide is safer logic-wise, 
                            // but let's try to simulate checking mistakes for the "Flash" effect if needed.

                            // For this implementation, we will stick to:
                            // 0-3: Show Outline
                            // 4: Hide Outline

                            // If we want opacity difference, we might need to recreate writer.
                            // But for "good enough" visual differentiation without recreating:
                            // We just use show/hide.
                        });
                    } else {
                        this.writer?.hideOutline();
                    }
                }
            };

            // Re-create writer if we really want to change stroke options (like outline opacity)
            // But checking performance, let's keep the instance and just toggle visibility for now.
            // If stage 4 (Blank), we hide.
            if (this.currentStage === 4) {
                this.writer.hideOutline();
            } else {
                this.writer.showOutline();
            }

            await this.writer.quiz({
                onMistake: () => {
                    this.mistakesInCurrentStage++;
                    SoundFX.click();
                    spawnParticles(0, 0);

                    // In later stages (Masked), show hint briefly on mistake
                    if (this.currentStage >= 4) {
                        this.writer?.showOutline();
                        setTimeout(() => this.writer?.hideOutline(), 500);
                    }
                },
                onCorrectStroke: () => {
                    SoundFX.pop();
                },
                onComplete: () => {
                    // Stage Complete
                    SoundFX.success();
                    // Slight delay before next stage
                    setTimeout(() => {
                        this.currentStage++;
                        this.startStage();
                    }, 800);
                }
            });
        }
    }

    private updateInstructions(): void {
        if (!this.instructionsEl) return;

        const stageNames = [
            '第一步: 描红',
            '第二步: 辅助',
            '第三步: 进阶',
            '第四步: 记忆',
            '第五步: 默写'
        ];

        this.instructionsEl.innerHTML = `
            <div style="font-size: 1.1rem; font-weight: 600; color: var(--tang-ink); margin-bottom: 8px;">
                ${stageNames[this.currentStage]}
            </div>
            <div style="font-size: 0.95rem; color: var(--tang-ink-light); opacity: 0.8;">
                ${this.currentQueueIndex + 1} / ${this.practiceQueue.length}
            </div>
        `;
    }

    private finishSession(): void {
        this.ui.showFeedback('练习完成!', '#4ade80');
        this.onExit();
    }
}
