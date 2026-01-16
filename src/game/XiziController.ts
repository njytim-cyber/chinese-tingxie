import HanziWriter from 'hanzi-writer';
import { UIManager } from '../ui/UIManager';
import { getPhrasesForLesson, updateCharacterProgress, getLessons, type Phrase } from '../data';
import { SoundFX } from '../audio';
import { spawnParticles } from '../particles';

/**
 * Xizi (Character Practice) Controller
 * Manages phrase-based practice with 3-stage scaffolding per phrase
 */
export class XiziController {
    private ui: UIManager;
    private onExit: () => void;
    private sessionStartTime: number = 0;

    // Practice Queue
    private practiceQueue: Phrase[] = [];
    private currentQueueIndex: number = 0;
    private currentLessonId: number = 0; // Store for continuing practice

    // Writers
    private writers: HanziWriter[] = [];
    private currentPhrase: Phrase | null = null;
    private currentCharIndexInPhrase: number = 0;

    // Scaffolding State
    private currentStage: number = 0; // 0=Full Guide, 1=Half Guide, 2=Blank
    private mistakesInCurrentStage: number = 0;
    private totalPhrasesInLesson: number = 0; // Track full lesson size for progress
    private allLessonPhrases: Phrase[] = []; // Full phrase list for chunking

    // DOM Elements
    private phraseContainer: HTMLElement | null = null;
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

        // 1. Get phrases
        const phrases = getPhrasesForLesson(lessonId);

        if (phrases.length === 0) {
            this.ui.showFeedback('没有可练习的词组', '#ef4444');
            setTimeout(() => this.onExit(), 2000);
            return;
        }

        // Store all phrases and auto-chunk to 5 phrases max for 5-minute sessions
        this.allLessonPhrases = phrases;
        this.totalPhrasesInLesson = phrases.length;
        this.practiceQueue = phrases.slice(0, Math.min(5, phrases.length));
        this.currentQueueIndex = 0;

        // 2. Setup UI
        this.setupUI();

        // 3. Set lesson title in header
        const lessons = getLessons();
        const lesson = lessons.find(l => l.id === lessonId);
        if (lesson) {
            this.ui.updateHeaderTitle(lesson.title);
        }

        // 4. Start first phrase
        await this.loadCurrentPhrase();
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

        // Phrase Container - horizontal layout for multiple characters
        const phraseWrapper = document.createElement('div');
        phraseWrapper.className = 'xizi-phrase-wrapper';
        phraseWrapper.style.cssText = `
            display: flex;
            gap: 12px;
            justify-content: center;
            align-items: center;
            margin-bottom: 30px;
            flex-wrap: wrap;
        `;

        const phraseContainer = document.createElement('div');
        phraseContainer.id = 'xizi-phrase-container';
        phraseContainer.style.cssText = `
            display: flex;
            gap: 12px;
            justify-content: center;
            align-items: center;
        `;

        phraseWrapper.appendChild(phraseContainer);
        container.appendChild(phraseWrapper);

        // Pinyin below the boxes
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
        this.phraseContainer = phraseContainer;
    }

    private async loadCurrentPhrase(): Promise<void> {
        if (this.currentQueueIndex >= this.practiceQueue.length) {
            this.finishSession();
            return;
        }

        this.currentPhrase = this.practiceQueue[this.currentQueueIndex];

        // Reset stages for this phrase (3 stages: 0, 1, 2)
        this.currentStage = 0;
        this.currentCharIndexInPhrase = 0;

        await this.startStage();
    }

    private async startStage(): Promise<void> {
        if (this.currentStage > 2) {
            // Phrase Complete (3 stages: 0, 1, 2)
            SoundFX.success();

            // Update Data for all characters in the phrase
            if (this.currentPhrase) {
                const chineseChars = this.currentPhrase.term.split('').filter(c => /[\u4e00-\u9fa5]/.test(c));
                chineseChars.forEach(char => {
                    updateCharacterProgress(char, true);
                });
            }

            // Check for milestone celebrations
            const phrasesCompleted = this.currentQueueIndex + 1;
            const totalInChunk = this.practiceQueue.length;
            const percentComplete = Math.round((phrasesCompleted / totalInChunk) * 100);

            if (phrasesCompleted === totalInChunk) {
                // Chunk complete!
                this.showChunkComplete();
                return;
            } else if (phrasesCompleted % 3 === 0 || percentComplete >= 50 && phrasesCompleted === Math.ceil(totalInChunk / 2)) {
                // Milestone celebration
                this.ui.showFeedback(`太棒了！已完成 ${phrasesCompleted} 个词组！`, '#4ade80');
            } else {
                this.ui.showFeedback('完成!', '#4ade80');
            }

            setTimeout(() => {
                this.currentQueueIndex++;
                this.loadCurrentPhrase();
            }, 1000);
            return;
        }

        this.mistakesInCurrentStage = 0;
        this.currentCharIndexInPhrase = 0;
        this.updateInstructions();

        // Init Writers for all characters in phrase
        if (this.phraseContainer && this.currentPhrase) {
            this.phraseContainer.innerHTML = ''; // Start fresh
            this.writers = [];

            // Get only Chinese characters from the phrase
            const chineseChars = this.currentPhrase.term.split('').filter(c => /[\u4e00-\u9fa5]/.test(c));

            // Create a writer box for each Chinese character
            chineseChars.forEach((char, index) => {
                const writerBox = document.createElement('div');
                writerBox.className = 'xizi-char-box';
                writerBox.style.cssText = `
                    width: 140px;
                    height: 140px;
                    background: #fff;
                    border-radius: var(--scholar-radius);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    position: relative;
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
                    pointer-events: none;
                `;
                writerBox.appendChild(grid);

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
                writerBox.appendChild(diag);

                const writerTarget = document.createElement('div');
                writerTarget.id = `xizi-char-${index}`;
                writerBox.appendChild(writerTarget);

                this.phraseContainer!.appendChild(writerBox);

                // Create HanziWriter instance
                const writer = HanziWriter.create(`xizi-char-${index}`, char, {
                    width: 140,
                    height: 140,
                    padding: 10,
                    showOutline: false, // We control this
                    strokeColor: '#2B2B2B', // Ink color
                    radicalColor: '#9CA3AF', // Optional distinction
                    showCharacter: false, // We control visibility
                    highlightOnComplete: true,
                    drawingWidth: 20, // Thicker brush
                    drawingColor: '#2B2B2B',
                });

                this.writers.push(writer);
            });

            // Start quiz for first character
            await this.startCharacterQuiz();
        }
    }

    private async startCharacterQuiz(): Promise<void> {
        if (this.currentCharIndexInPhrase >= this.writers.length) {
            // All characters in phrase completed for this stage
            SoundFX.success();
            setTimeout(() => {
                this.currentStage++;
                this.startStage();
            }, 800);
            return;
        }

        const writer = this.writers[this.currentCharIndexInPhrase];

        // Set outline visibility based on stage
        // Stage 0: Full guide (show outline)
        // Stage 1: Half guide (show outline with less emphasis)
        // Stage 2: Blank (no outline)
        if (this.currentStage === 2) {
            writer.hideOutline();
        } else {
            writer.showOutline();
        }

        await writer.quiz({
            onMistake: () => {
                this.mistakesInCurrentStage++;
                SoundFX.click();
                spawnParticles(0, 0);

                // On final stage (blank), show hint briefly on mistake
                if (this.currentStage === 2) {
                    writer.showOutline();
                    setTimeout(() => writer.hideOutline(), 500);
                }
            },
            onCorrectStroke: () => {
                SoundFX.pop();
            },
            onComplete: () => {
                // Character complete, move to next character in phrase
                SoundFX.pop();
                setTimeout(() => {
                    this.currentCharIndexInPhrase++;
                    this.startCharacterQuiz();
                }, 400);
            }
        });
    }

    private updateInstructions(): void {
        if (!this.instructionsEl || !this.pinyinEl || !this.currentPhrase) return;

        const stageNames = [
            '第一步: 描红',
            '第二步: 辅助',
            '第三步: 默写'
        ];

        // Stage dots
        const stageDots = Array(3).fill(0).map((_, i) =>
            i === this.currentStage ? '●' : '○'
        ).join(' ');

        // Update pinyin to show full phrase pinyin
        this.pinyinEl.textContent = this.currentPhrase.pinyin;

        // Simple, clean instructions - show phrase term
        this.instructionsEl.innerHTML = `
            <div style="font-size: 0.95rem; color: var(--tang-ink); margin-bottom: 8px;">
                ${stageNames[this.currentStage]}
            </div>
            <div style="font-size: 1.4rem; color: var(--tang-gold); margin-bottom: 8px; font-weight: 600;">
                ${this.currentPhrase.term}
            </div>
            <div style="font-size: 1.2rem; color: var(--tang-gold); letter-spacing: 4px;">
                ${stageDots}
            </div>
        `;
    }

    private showChunkComplete(): void {
        const phrasesCompleted = this.practiceQueue.length;
        const hasMorePhrases = this.totalPhrasesInLesson > phrasesCompleted;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.innerHTML = `
            <div class="modal-content result-card" style="max-width: 400px;">
                <h2 class="result-title">本组练习完成！</h2>
                <div class="result-score-large">${phrasesCompleted}</div>
                <div class="result-percentage">个词组完成</div>
                <p class="result-message">太棒了！继续保持！</p>
                ${hasMorePhrases ? `
                    <div style="padding: 12px; background: var(--tang-paper); border-radius: var(--scholar-radius); margin: 16px 0; color: var(--tang-ink-light); font-size: 0.9rem;">
                        还有 ${this.totalPhrasesInLesson - phrasesCompleted} 个词组可以练习
                    </div>
                ` : ''}
                <div class="modal-actions">
                    ${hasMorePhrases ? `
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
        // Calculate how many phrases we've already practiced
        const completedCount = this.practiceQueue.length;
        const remainingPhrases = this.allLessonPhrases.slice(completedCount);

        if (remainingPhrases.length === 0) {
            // No more phrases, finish
            this.finishSession();
            return;
        }

        // Get next chunk (up to 5 phrases)
        this.practiceQueue = remainingPhrases.slice(0, Math.min(5, remainingPhrases.length));
        this.currentQueueIndex = 0;

        // Restart with first phrase of new chunk
        await this.loadCurrentPhrase();
    }

    private finishSession(): void {
        this.ui.showFeedback('练习完成!', '#4ade80');
        this.onExit();
    }
}
