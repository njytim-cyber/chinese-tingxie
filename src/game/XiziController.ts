import HanziWriter from 'hanzi-writer';
import { UIManager } from '../ui/UIManager';
import { getCharactersForLesson, updateCharacterProgress, getCharacterContext, getLessons } from '../data';
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
    private currentLessonId: number = 0; // Store for continuing practice

    // Writers
    private writer: HanziWriter | null = null;
    private targetChar: string = '';

    // Scaffolding State
    private currentStage: number = 0; // 0=Full Guide, 1=Half Guide, 2=Blank
    private mistakesInCurrentStage: number = 0;
    private totalCharactersInLesson: number = 0; // Track full lesson size for progress
    private allLessonCharacters: string[] = []; // Full character list for chunking

    // DOM Elements
    private container: HTMLElement | null = null;
    private instructionsEl: HTMLElement | null = null;
    private pinyinEl: HTMLElement | null = null;

    constructor(ui: UIManager, onExit: () => void) {
        this.ui = ui;
        this.onExit = onExit;
    }

    /**
     * Start a Xizi practice session for a lesson
     */
    async start(lessonId: number, startTime: number): Promise<void> {
        this.sessionStartTime = startTime;
        this.currentLessonId = lessonId;

        // 1. Get characters
        const chars = getCharactersForLesson(lessonId);

        if (chars.length === 0) {
            this.ui.showFeedback('没有可练习的汉字', '#ef4444');
            setTimeout(() => this.onExit(), 2000);
            return;
        }

        // Store all characters and auto-chunk to 5 characters max for 5-minute sessions
        this.allLessonCharacters = chars;
        this.totalCharactersInLesson = chars.length;
        this.practiceQueue = chars.slice(0, Math.min(5, chars.length));
        this.currentQueueIndex = 0;

        // 2. Setup UI
        this.setupUI();

        // 3. Set lesson title in header
        const lessons = getLessons();
        const lesson = lessons.find(l => l.id === lessonId);
        if (lesson) {
            this.ui.updateHeaderTitle(lesson.title);
        }

        // 4. Start first character
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

        // Lesson Title removed - it's in the header now

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

        // Pinyin below the box
        this.pinyinEl = document.createElement('div');
        this.pinyinEl.className = 'xizi-pinyin';
        this.pinyinEl.style.cssText = `
            font-size: 1.3rem;
            color: var(--tang-red);
            margin-top: 12px;
            margin-bottom: 16px;
            font-style: italic;
            font-weight: 500;
        `;
        container.appendChild(this.pinyinEl);

        app.appendChild(container);
        this.container = writerTarget;
    }

    private async loadCurrentCharacter(): Promise<void> {
        if (this.currentQueueIndex >= this.practiceQueue.length) {
            this.finishSession();
            return;
        }

        this.targetChar = this.practiceQueue[this.currentQueueIndex];

        // Reset stages for this character (3 stages: 0, 1, 2)
        this.currentStage = 0;

        await this.startStage();
    }

    private async startStage(): Promise<void> {
        if (this.currentStage > 2) {
            // Char Complete (3 stages: 0, 1, 2)
            SoundFX.success();
            // Update Data
            updateCharacterProgress(this.targetChar, true);

            // Check for milestone celebrations
            const charsCompleted = this.currentQueueIndex + 1;
            const totalInChunk = this.practiceQueue.length;
            const percentComplete = Math.round((charsCompleted / totalInChunk) * 100);

            if (charsCompleted === totalInChunk) {
                // Chunk complete!
                this.showChunkComplete();
                return;
            } else if (charsCompleted % 3 === 0 || percentComplete >= 50 && charsCompleted === Math.ceil(totalInChunk / 2)) {
                // Milestone celebration
                this.ui.showFeedback(`太棒了！已完成 ${charsCompleted} 个字！`, '#4ade80');
            } else {
                this.ui.showFeedback('完成!', '#4ade80');
            }

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

            // Set outline visibility based on stage
            // Stage 0: Full guide (60% opacity)
            // Stage 1: Half guide (30% opacity)
            // Stage 2: Blank (no outline)
            if (this.currentStage === 2) {
                this.writer.hideOutline();
            } else {
                this.writer.showOutline();
            }

            await this.writer.quiz({
                onMistake: () => {
                    this.mistakesInCurrentStage++;
                    SoundFX.click();
                    spawnParticles(0, 0);

                    // On final stage (blank), show hint briefly on mistake
                    if (this.currentStage === 2) {
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
        if (!this.instructionsEl || !this.pinyinEl) return;

        const stageNames = [
            '第一步: 描红',
            '第二步: 辅助',
            '第三步: 默写'
        ];

        // Stage dots
        const stageDots = Array(3).fill(0).map((_, i) =>
            i === this.currentStage ? '●' : '○'
        ).join(' ');

        // Get character context
        const context = getCharacterContext(this.targetChar, this.currentLessonId);
        const pinyinText = context ? context.pinyin : '';

        // Update pinyin below the box
        this.pinyinEl.textContent = pinyinText;

        // Simple, clean instructions - one character at a time
        this.instructionsEl.innerHTML = `
            <div style="font-size: 0.95rem; color: var(--tang-ink); margin-bottom: 8px;">
                ${stageNames[this.currentStage]}
            </div>
            <div style="font-size: 1.2rem; color: var(--tang-gold); letter-spacing: 4px;">
                ${stageDots}
            </div>
        `;
    }

    private showChunkComplete(): void {
        const charsCompleted = this.practiceQueue.length;
        const hasMoreCharacters = this.totalCharactersInLesson > charsCompleted;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.innerHTML = `
            <div class="modal-content result-card" style="max-width: 400px;">
                <h2 class="result-title">本组练习完成！</h2>
                <div class="result-score-large">${charsCompleted}</div>
                <div class="result-percentage">个字完成</div>
                <p class="result-message">太棒了！继续保持！</p>
                ${hasMoreCharacters ? `
                    <div style="padding: 12px; background: var(--tang-paper); border-radius: var(--scholar-radius); margin: 16px 0; color: var(--tang-ink-light); font-size: 0.9rem;">
                        还有 ${this.totalCharactersInLesson - charsCompleted} 个字可以练习
                    </div>
                ` : ''}
                <div class="modal-actions">
                    ${hasMoreCharacters ? `
                        <button class="action-btn-large" id="xizi-continue-btn">继续练习</button>
                        <button class="text-btn" id="xizi-finish-btn">结束练习</button>
                    ` : `
                        <button class="action-btn-large" id="xizi-finish-btn">完成</button>
                    `}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const continueBtn = document.getElementById('xizi-continue-btn');
        const finishBtn = document.getElementById('xizi-finish-btn');

        if (continueBtn) {
            continueBtn.onclick = () => {
                modal.remove();
                // Continue with next chunk
                this.continueWithNextChunk();
            };
        }

        if (finishBtn) {
            finishBtn.onclick = () => {
                modal.remove();
                this.finishSession();
            };
        }
    }

    private async continueWithNextChunk(): Promise<void> {
        // Calculate how many characters we've already practiced
        const completedCount = this.practiceQueue.length;
        const remainingChars = this.allLessonCharacters.slice(completedCount);

        if (remainingChars.length === 0) {
            // No more characters, finish
            this.finishSession();
            return;
        }

        // Get next chunk (up to 5 characters)
        this.practiceQueue = remainingChars.slice(0, Math.min(5, remainingChars.length));
        this.currentQueueIndex = 0;

        // Restart with first character of new chunk
        await this.loadCurrentCharacter();
    }

    private finishSession(): void {
        this.ui.showFeedback('练习完成!', '#4ade80');
        this.onExit();
    }
}
