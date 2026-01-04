/**
 * Game Logic Module with Gamification
 * Refactored to use modular architecture for UI and input handling
 */

import {
    loadData, getWordsForPractice,
    updateWordSRS, recordPractice, addXP, getStats, getLevel,
    checkAchievements,
    getCurrentLesson, setCurrentLesson,
    getUnmasteredWords,
    logAttempt, type AttemptLog,
} from './data';
import { SoundFX, speakWord } from './audio';
import { spawnParticles } from './particles';
import { UIManager, getRandomPraise } from './ui';
import { HanziWriterInput, type InputMode, HandwritingInput } from './input';
import { initDOMCache, type GameState, type DOMCache, type InputHandler } from './types';

const PLAYER_NAME_KEY = 'tingxie_player_name';
const INPUT_MODE_KEY = 'tingxie_input_mode';

// DOM cache for performance
let domCache: DOMCache;

// UI Manager instance
let ui: UIManager;

// Input handler instance (stroke or handwriting)
let inputHandler: InputHandler;

// Dictation Manager instance (dynamic)
let dictationManager: import('./dictation').DictationManager | null = null;

// Current input mode
let inputMode: InputMode = 'stroke';

// Game state
const state: GameState = {
    score: 0,
    streak: 0,
    sessionStreak: 0,
    level: 1,
    currentWordIndex: 0,
    currentWord: null,
    completedChars: 0,
    practiceWords: [],
    mistakesMade: 0,
    hintUsed: false,
    hintStrokeIndex: [],
    sessionStartTime: null,
    wordsCompletedThisSession: 0,
    selectedLessonsForPractice: [],
    currentView: 'lesson-select',
    sessionResults: [],
};

/**
 * Get saved input mode from localStorage
 */
function getSavedInputMode(): InputMode {
    // Force handwriting mode by default now
    return 'handwriting';
    // const saved = localStorage.getItem(INPUT_MODE_KEY);
    // return (saved === 'handwriting') ? 'handwriting' : 'stroke';
}

/**
 * Save input mode to localStorage
 */
function saveInputMode(mode: InputMode): void {
    localStorage.setItem(INPUT_MODE_KEY, mode);
}

/**
 * Create input handler based on current mode
 */
function createInputHandler(): InputHandler {
    if (inputMode === 'handwriting') {
        const handler = new HandwritingInput();
        return handler;
    }
    return new HanziWriterInput();
}

/**
 * Game API object - exposed for external access
 */
export const Game = {
    /**
     * Initialize the game
     */
    init(showUI = true): void {
        loadData();

        // Load saved input mode
        inputMode = getSavedInputMode();

        // Initialize DOM cache
        domCache = initDOMCache();
        ui = new UIManager(domCache);
        inputHandler = createInputHandler();

        // Set up input handler callbacks
        inputHandler.onCharComplete = handleCharComplete;
        inputHandler.onMistake = handleMistake;
        inputHandler.onComplete = handleInputComplete;

        state.sessionStartTime = Date.now();
        state.wordsCompletedThisSession = 0;
        state.sessionStreak = 0;

        // Update UI with stats
        ui.updateStatsDisplay();
        ui.displayGreeting(Game.getPlayerName());

        // Show lesson selection screen if requested
        if (showUI) {
            Game.showLessonSelect();
        }

        // Record that player practiced today
        recordPractice();

        // Check for new achievements on start
        ui.showNewAchievements(checkAchievements());
    },

    /**
     * Get player name from localStorage
     */
    getPlayerName(): string {
        return localStorage.getItem(PLAYER_NAME_KEY) || '';
    },

    /**
     * Save player name to localStorage
     */
    setPlayerName(name: string): void {
        localStorage.setItem(PLAYER_NAME_KEY, name.trim());
    },

    /**
     * Get current input mode
     */
    getInputMode(): InputMode {
        return inputMode;
    },

    /**
     * Set input mode
     */
    setInputMode(mode: InputMode): void {
        inputMode = mode;
        saveInputMode(mode);
        // Recreate input handler with new mode
        inputHandler = createInputHandler();
        inputHandler.onCharComplete = handleCharComplete;
        inputHandler.onMistake = handleMistake;
        inputHandler.onComplete = handleInputComplete;
    },

    /**
     * Show lesson selection screen
     */
    showLessonSelect(): void {
        state.currentView = 'lesson-select';
        ui.hideFooterProgress();
        ui.showLessonSelect(
            (lessonId, wordLimit) => Game.selectLesson(lessonId, wordLimit),
            () => Game.showProgress(),
            () => Game.showPracticeSelect()
        );
    },

    /**
     * Select a lesson and start practicing
     */
    selectLesson(lessonId: number, wordLimit = 0): void {
        setCurrentLesson(lessonId);
        let words = getWordsForPractice();

        if (wordLimit > 0 && words.length > wordLimit) {
            words = words.slice(0, wordLimit);
        }

        state.practiceWords = words;
        state.currentWordIndex = 0;
        state.sessionStartTime = Date.now();
        state.wordsCompletedThisSession = 0;
        state.sessionStreak = 0;
        state.sessionResults = [];
        state.currentView = 'game';

        // Set lesson phrases for handwriting mode candidate generation
        if (inputHandler instanceof HandwritingInput) {
            inputHandler.setLessonPhrases(words);
        }

        // Show controls
        ui.showControls();
        ui.setHudTransparent(false);
        ui.renderProgressDots(state.practiceWords.length);

        // Update lesson display in HUD
        const lesson = getCurrentLesson();
        if (domCache.lessonLabel) {
            domCache.lessonLabel.textContent = lesson.title;
        }

        loadLevel();
    },

    /**
     * Show progress view
     */
    showProgress(): void {
        state.currentView = 'progress';
        ui.showProgress();
    },

    /**
     * Show practice selection
     */
    showPracticeSelect(): void {
        state.currentView = 'practice-select';
        ui.showPracticeSelect((selectedLessons) => {
            state.selectedLessonsForPractice = selectedLessons;
            Game.startPractice();
        });
    },

    /**
     * Start practice with selected lessons
     */
    startPractice(): void {
        try {
            if (state.selectedLessonsForPractice.length === 0) {
                Game.showLessonSelect();
                return;
            }

            state.practiceWords = getUnmasteredWords(state.selectedLessonsForPractice);

            if (state.practiceWords.length === 0) {
                ui.showFeedback('所有词语都已掌握！', '#22c55e');
                setTimeout(() => Game.showLessonSelect(), 1500);
                return;
            }

            state.currentWordIndex = 0;
            state.sessionStartTime = Date.now();
            state.wordsCompletedThisSession = 0;
            state.sessionStreak = 0;
            state.currentView = 'game';

            // Set lesson phrases for handwriting mode
            if (inputHandler instanceof HandwritingInput) {
                inputHandler.setLessonPhrases(state.practiceWords);
            }

            // Ensure valid state before UI updates
            if (!state.practiceWords || state.practiceWords.length === 0) {
                throw new Error("No words available for practice");
            }

            ui.showControls();
            ui.setHudTransparent(false);
            ui.renderProgressDots(state.practiceWords.length);

            loadLevel();
        } catch (error) {
            console.error("Failed to start practice:", error);
            ui.showFeedback("启动失败，请刷新页面", "#ef4444");
            // Fallback to lesson select after delay
            setTimeout(() => Game.showLessonSelect(), 2000);
        }
    },

    /**
     * Skip current level
     */
    skipLevel(): void {
        // Dictation Mode: Skip button acts as Pause/Play toggle
        if (state.currentView === 'dictation' && dictationManager) {
            const isPlaying = dictationManager.toggleAudio();
            const btn = document.getElementById('btn-skip');
            if (btn) {
                btn.innerHTML = isPlaying ? '⏸' : '▶';
                btn.title = isPlaying ? '暂停' : '播放';
                // Add active class if playing to show state
                if (isPlaying) btn.classList.add('active');
                else btn.classList.remove('active');
            }
            return;
        }

        ui.updateProgressDot(state.currentWordIndex, 'wrong');
        state.sessionStreak = 0;
        ui.updateHud(state.score, state.sessionStreak);

        state.currentWordIndex++;
        loadLevel();
    },

    /**
     * Handle back navigation
     */
    handleBackNavigation(): void {
        if (state.currentView === 'practice-select' || state.currentView === 'progress' || state.currentView === 'dictation-select') {
            Game.showLessonSelect(); // Return to main menu (SPA mode)
        } else if (state.currentView === 'lesson-select') {
            location.reload();
        } else if (state.currentView === 'dictation') {
            Game.showDictationSelect(); // Back to dictation select
        } else {
            Game.showMenu();
        }
    },

    /**
     * Play audio for current word (or toggle in dictation mode)
     */
    playCurrentAudio(): void {
        // In dictation mode, toggle audio playback
        if (state.currentView === 'dictation' && dictationManager) {
            const isPlaying = dictationManager.toggleAudio();
            const btn = document.getElementById('btn-audio');
            if (btn) {
                btn.innerHTML = isPlaying ? '⏸' : '▶';
                btn.title = isPlaying ? '暂停' : '播放';
            }
            return;
        }

        if (!state.currentWord) return;
        speakWord(state.currentWord.term);
    },

    /**
     * Use a hint
     */
    useHint(): void {
        state.sessionStreak = 0;
        state.hintUsed = true;
        ui.updateHud(state.score, state.sessionStreak);

        inputHandler.showHint();

        // Show pinyin on hint
        if (state.currentWord) {
            ui.showPinyin(state.currentWord.pinyin);
        }
    },

    /**
     * Move to next level/word
     */
    nextLevel(): void {
        state.currentWordIndex++;
        loadLevel();
    },

    /**
     * Show menu
     */
    showMenu(): void {
        ui.showMenu(
            () => { }, // Resume - just close menu
            () => location.reload()
        );
    },

    /**
     * Show achievements
     */
    showAchievements(): void {
        ui.showAchievements();
    },

    /**
     * Show dictation passage selection
     */
    showDictationSelect(): void {
        state.currentView = 'dictation-select';
        ui.showDictationSelect(
            (passage) => this.startDictation(passage)
        );
    },

    /**
     * Start dictation with selected passage
     */
    startDictation(passage: import('./dictation').DictationPassage): void {
        state.currentView = 'dictation';
        const container = document.getElementById('writing-area');
        if (!container) return;

        container.innerHTML = '';

        // Dynamically import and create dictation manager
        import('./dictation').then(({ DictationManager }) => {
            const dictation = new DictationManager();
            dictationManager = dictation; // Assign to global for access

            // Hide skip button in dictation mode (redundant with audio toggle)
            const skipBtn = document.getElementById('btn-skip');
            if (skipBtn) {
                skipBtn.style.display = 'none';
            }

            // Use audio button as Play/Pause toggle
            const audioBtn = document.getElementById('btn-audio');
            if (audioBtn) {
                audioBtn.innerHTML = '▶'; // Initial state (stopped)
                audioBtn.title = '播放/暂停';
            }

            dictation.onComplete = (score, total) => {
                ui.showDictationResult(score, total, () => {
                    this.showDictationSelect();
                });
            };
            dictation.init(passage, container);

            // Sync button state if auto-play is on (init calls playAudio)
            if (passage.isFullDictation) {
                if (audioBtn) audioBtn.innerHTML = '⏸';
            }
        });
    },

    /**
     * Reveal phrase modal - shows term and pinyin (toggle on/off)
     */
    revealPhrase(): void {
        const modal = document.getElementById('reveal-modal');
        const termEl = document.getElementById('reveal-term');
        const pinyinEl = document.getElementById('reveal-pinyin');

        if (!modal || !termEl || !pinyinEl) return;

        // Special handling for dictation mode
        if (state.currentView === 'dictation' && dictationManager) {
            const passage = dictationManager.getPassage();
            if (!passage) return;

            // Toggle: if already visible, hide it
            if (modal.style.display === 'flex') {
                modal.style.display = 'none';
                return;
            }

            // Notify manager that reveal was used (score penalty)
            dictationManager.notifyReveal();

            termEl.innerHTML = `<div style="text-align: left; font-size: 1.2rem; line-height: 1.6;">${passage.text}</div>`;
            pinyinEl.textContent = ''; // No pinyin for full passage
            modal.style.display = 'flex';

            // Dismiss on click or keypress
            const dismiss = () => {
                modal.style.display = 'none';
                modal.removeEventListener('click', dismiss);
                document.removeEventListener('keydown', dismiss);
            };

            modal.addEventListener('click', dismiss);
            document.addEventListener('keydown', dismiss);
            return;
        }

        if (!state.currentWord) return;

        // Toggle: if already visible, hide it
        if (modal.style.display === 'flex') {
            modal.style.display = 'none';
            return;
        }

        termEl.textContent = state.currentWord.term;
        pinyinEl.textContent = state.currentWord.pinyin;
        modal.style.display = 'flex';

        // Mark as revealed (penalty)
        state.hintUsed = true;
        // Also force a mistake count to ensure it's not marked as perfect/green
        if (state.mistakesMade === 0) state.mistakesMade = 999;
        state.isRevealed = true;

        // Dismiss on click or keypress
        const dismiss = () => {
            modal.style.display = 'none';
            modal.removeEventListener('click', dismiss);
            document.removeEventListener('keydown', dismiss);
        };

        modal.addEventListener('click', dismiss);
        document.addEventListener('keydown', dismiss);
    },
};

/**
 * Load the current level/word
 */
function loadLevel(): void {
    if (state.currentWordIndex >= state.practiceWords.length) {
        showSessionComplete();
        return;
    }

    state.currentWord = state.practiceWords[state.currentWordIndex];
    state.completedChars = 0;
    state.mistakesMade = 0;
    state.hintUsed = false;
    state.hintStrokeIndex = [];

    // UI Reset
    ui.clearWritingArea();
    ui.hideNextButton();
    ui.resetFeedback();
    ui.hidePinyin();

    // Initialize input handler
    const container = ui.getWritingArea();
    if (container && state.currentWord) {
        inputHandler.init(state.currentWord, container);
    }

    // Update progress dots
    ui.updateProgressDot(state.currentWordIndex, 'active');

    // Play audio after animations settle
    setTimeout(() => {
        Game.playCurrentAudio();
        // Scroll to the first active character if on mobile
        const activeChar = document.querySelector('.char-slot.active') as HTMLElement;
        if (activeChar) {
            scrollToActiveChar(activeChar);
        }
    }, 800);
}

/**
 * Handle character completion from input handler
 */
function handleCharComplete(index: number): void {
    const box = document.getElementById(`char-${index}`);
    if (box) {
        const rect = box.getBoundingClientRect();
        spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
    state.completedChars++;
}

/**
 * Handle mistake from input handler
 */
function handleMistake(_index: number): void {
    state.mistakesMade++;
}

/**
 * Handle input completion
 */
function handleInputComplete(result?: { success: boolean; mistakeCount: number; hintUsed: boolean }): void {
    // For handwriting mode, check if the selection was correct
    if (result && !result.success) {
        // Wrong selection in handwriting mode
        handleWordFailure();
        return;
    }
    handleWordSuccess(result);
}

/**
 * Handle failed word (wrong selection in handwriting mode)
 */
function handleWordFailure(): void {
    if (!state.currentWord) return;

    SoundFX.wrong();
    state.sessionStreak = 0;

    // Update SRS with failure
    updateWordSRS(state.currentWord.term, 2);

    // Update Progress Dot
    ui.updateProgressDot(state.currentWordIndex, 'wrong');

    ui.updateHud(state.score, state.sessionStreak);
    ui.showFeedback('再试一次! 💪', '#ef4444');
    // Track result
    state.sessionResults.push({
        term: state.currentWord.term,
        correct: false,
        mistakeCount: 2,
        hintUsed: true,
    });

    // Show pinyin as hint
    ui.showPinyin(state.currentWord.pinyin);
    ui.showNextButton();
}

/**
 * Handle successful word completion
 */
function handleWordSuccess(result?: { mistakeCount: number; hintUsed: boolean }): void {
    if (!state.currentWord) return;

    SoundFX.success();
    state.sessionStreak++;
    state.wordsCompletedThisSession++;

    // Get hint/mistake state from input handler or result
    const hintUsed = result?.hintUsed || inputHandler.wasHintUsed() || state.hintUsed;
    const mistakeCount = result?.mistakeCount ?? inputHandler.getMistakeCount();

    // Calculate quality for SM-2 (0-5)
    let quality: number;

    // Check if revealed first (highest penalty)
    if ((state as any).isRevealed) {
        quality = 1; // Incorrect response; the correct one remembered
        // Reset flag
        (state as any).isRevealed = false;
    } else if (hintUsed) {
        quality = 2; // Failed - used hint
    } else {
        if (mistakeCount === 0) {
            quality = 5; // Perfect
        } else if (mistakeCount <= 2) {
            quality = 4; // Good
        } else {
            quality = 3; // Pass
        }
    }

    // Update SRS
    updateWordSRS(state.currentWord.term, quality);

    // Update Progress Dot
    const isSuccess = quality >= 3;
    ui.updateProgressDot(state.currentWordIndex, isSuccess ? 'correct' : 'wrong');

    // Calculate XP earned
    let xpEarned = 10;
    if (quality === 5) xpEarned += 10;
    if (state.sessionStreak >= 3) xpEarned += 5;
    if (state.sessionStreak >= 5) xpEarned += 5;

    const oldLevel = getLevel();
    state.score += xpEarned;
    addXP(xpEarned);
    const newLevel = getLevel();

    // Check for level up
    if (newLevel > oldLevel) {
        ui.showLevelUp(newLevel);
    }

    ui.updateHud(state.score, state.sessionStreak);
    ui.updateStatsDisplay();
    ui.displayGreeting(Game.getPlayerName());

    // Show feedback
    const praise = getRandomPraise(quality, state.sessionStreak);
    ui.showFeedback(`${praise} +${xpEarned} 经验`, "#4ade80");

    // Check achievements
    const newAchievements = checkAchievements();
    if (newAchievements.length > 0) {
        setTimeout(() => ui.showNewAchievements(newAchievements), 1500);
    }

    // Show pinyin and next button
    if (state.currentWord) {
        ui.showPinyin(state.currentWord.pinyin);
    }
    ui.showNextButton();

    // Track result
    state.sessionResults.push({
        term: state.currentWord.term,
        correct: isSuccess,
        mistakeCount: mistakeCount,
        hintUsed: hintUsed,
    });

    // Celebration particles
    const particleCount = quality === 5 ? 5 : (state.sessionStreak >= 3 ? 3 : 1);
    for (let i = 0; i < particleCount; i++) {
        setTimeout(() => {
            spawnParticles(
                window.innerWidth / 2 + (Math.random() - 0.5) * 200,
                window.innerHeight / 2 + (Math.random() - 0.5) * 100
            );
        }, i * 150);
    }
}

/**
 * Show session complete screen
 */
function showSessionComplete(): void {
    // Log the attempt
    const lesson = getCurrentLesson();
    const duration = state.sessionStartTime ? Math.round((Date.now() - state.sessionStartTime) / 1000) : 0;
    const correctCount = state.sessionResults.filter(r => r.correct).length;

    const attempt: AttemptLog = {
        timestamp: new Date().toISOString(),
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        mode: 'spelling',
        phrases: state.sessionResults,
        totalScore: correctCount,
        totalPhrases: state.sessionResults.length,
        duration: duration,
    };
    logAttempt(attempt);

    ui.showSessionComplete(
        state.wordsCompletedThisSession,
        state.score,
        state.sessionStartTime || Date.now(),
        () => {
            state.currentWordIndex = 0;
            Game.startPractice();
        },
        () => {
            const stats = getStats();
            const text = `✨ 星空听写\n我刚刚练习了 ${state.wordsCompletedThisSession} 个词语！\n得分: ${state.score} | 连胜: ${stats.dailyStreak}🔥\n等级: Lv.${getLevel()}\n\n快来挑战吧！`;

            if (navigator.share) {
                navigator.share({
                    title: '星空听写成绩',
                    text: text,
                    url: window.location.href
                }).catch(console.error);
            } else {
                navigator.clipboard.writeText(text + ' ' + window.location.href).then(() => {
                    ui.showFeedback('已复制到剪贴板！', '#38bdf8');
                });
            }
        }
    );
}

/**
 * Scroll element into view (mobile optimization)
 */
function scrollToActiveChar(element: HTMLElement): void {
    if (window.innerWidth > 600) return;

    element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
    });
}

// Expose for backward compatibility
(window as any).Game = Game;
