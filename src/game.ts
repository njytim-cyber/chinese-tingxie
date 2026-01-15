/**
 * Game Logic Module with Gamification
 * Refactored to use modular architecture for UI, input handling, and game logic
 */

import {
    loadData, getWordsForPractice,
    updateWordSRS, recordPractice, addXP, getStats, getLevel,
    checkAchievements,
    getCurrentLesson, setCurrentLesson,
    getUnmasteredWords,
    logAttempt,
    type AttemptLog
} from './data';
import { SoundFX, speakWord } from './audio';
import { spawnParticles } from './particles';
import { UIManager, getRandomPraise } from './ui/UIManager';
import { HanziWriterInput } from './input';
import { initDOMCache, type GameState, type DOMCache, type InputHandler, type DictationPassage } from './types';
import { GameLogic } from './game/GameLogic';
import { DictationController } from './game/DictationController';

const PLAYER_NAME_KEY = 'tingxie_player_name';

// DOM cache for performance
let domCache: DOMCache;

// UI Manager instance
let ui: UIManager;

// Input handler instance (stroke or handwriting)
let inputHandler: InputHandler;

// Dictation Controller instance
let dictationController: DictationController | null = null;

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
 * Create input handler based on current mode
 */
function createInputHandler(): InputHandler {
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
        if (!ui) {
            loadData();

            // Initialize DOM cache
            domCache = initDOMCache();
            ui = new UIManager(domCache);
            inputHandler = createInputHandler();

            // Set up input handler callbacks
            inputHandler.onCharComplete = handleCharComplete;
            inputHandler.onMistake = handleMistake;
            inputHandler.onComplete = handleInputComplete;
        }

        // Always reset session stats
        state.sessionStartTime = Date.now();
        state.wordsCompletedThisSession = 0;
        state.sessionStreak = 0;

        // Update UI with stats
        ui.updateStatsDisplay();
        ui.setRandomAvatar();
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
    getInputMode(): string {
        return 'stroke';
    },

    /**
     * Set input mode - Deprecated
     */
    setInputMode(_mode: string): void {
        // No-op
    },

    /**
     * General navigation method with progress check
     */
    navigate(targetView: GameState['currentView'], onNavigate: () => void): void {
        const isGameActive = state.currentView === 'game' && (state.wordsCompletedThisSession > 0 || state.completedChars > 0);

        let isDictationActive = false;
        if (state.currentView === 'dictation' && dictationController) {
            // Check internal dictation state if possible
            const manager = dictationController.getManager();
            if (manager) {
                // Access private or public state if exposed, or just assume active if in view
                // Since we don't have easy access to 'completedChunks', we'll assume any active dictation session 
                // (where time has passed > 2s) is worth confirming
                const duration = state.sessionStartTime ? (Date.now() - state.sessionStartTime) : 0;
                if (duration > 2000) isDictationActive = true;
            }
        }

        if (isGameActive || isDictationActive) {
            ui.showConfirm(
                '退出练习?',
                '当前进度将不会保存。确定要退出吗?',
                () => {
                    this.cleanupCurrentView();
                    onNavigate();
                }
            );
        } else {
            this.cleanupCurrentView();
            onNavigate();
        }
    },

    cleanupCurrentView(): void {
        // Stop any audio
        if (window.speechSynthesis) window.speechSynthesis.cancel();

        // Clean up Dictation Mode
        if (dictationController && dictationController.getManager()) {
            dictationController.getManager()?.destroy();
            // Reset UI state for Dictation
            const card = document.getElementById('writing-card');
            if (card) {
                const toolbar = card.querySelector('.card-toolbar');
                if (toolbar) (toolbar as HTMLElement).style.display = '';
            }
        }
    },

    /**
     * Show lesson selection screen
     */
    showLessonSelect(force: boolean = false): void {
        const doShow = () => {
            state.currentView = 'lesson-select';
            ui.hideFooterProgress();
            // Ensure UI is reset for Spelling Mode (restores writing-card if needed)
            if (domCache && domCache.writingArea) {
                // GameRenderer handles this via internal logic usually, but 
                // we might need to nudge it if we are coming from Dictation
            }

            ui.showLessonSelect(
                (lessonId, wordLimit) => Game.selectLesson(lessonId, wordLimit),
                () => Game.showProgress(),
                () => Game.showPracticeSelect()
            );
        };

        if (force) {
            this.cleanupCurrentView();
            doShow();
        } else {
            this.navigate('lesson-select', doShow);
        }
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

        // Show controls
        ui.toggleActiveGameUI(true);
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
        this.navigate('progress', () => {
            state.currentView = 'progress';
            ui.showProgress();
        });
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

            // Ensure valid state before UI updates
            if (!state.practiceWords || state.practiceWords.length === 0) {
                throw new Error("No words available for practice");
            }

            ui.toggleActiveGameUI(true);
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
        // Dictation Mode
        if (state.currentView === 'dictation' && dictationController) {
            const manager = dictationController.getManager();
            if (manager) {
                const isPlaying = manager.toggleAudio();
                const btn = document.getElementById('btn-skip');
                if (btn) {
                    btn.innerHTML = isPlaying ? '⏸' : '▶';
                    btn.title = isPlaying ? '暂停' : '播放';
                    if (isPlaying) btn.classList.add('active');
                    else btn.classList.remove('active');
                }
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
        if (state.currentView === 'dictation' && dictationController?.getManager()) {
            const manager = dictationController.getManager();
            if (manager) {
                const isPlaying = manager.toggleAudio();
                const btn = document.getElementById('btn-audio');
                if (btn) {
                    btn.innerHTML = isPlaying ? '⏸' : '▶';
                    btn.title = isPlaying ? '暂停' : '播放';
                }
            }
            return;
        }

        if (!state.currentWord) return;
        speakWord(state.currentWord.term);
    },

    /**
     * Toggle grid style
     */
    toggleGrid(): void {
        if (inputHandler && inputHandler.toggleGrid) {
            inputHandler.toggleGrid();
        }
    },

    /**
     * Use a hint
     */
    useHint(): void {
        state.sessionStreak = 0;
        state.hintUsed = true;
        ui.updateHud(state.score, state.sessionStreak);

        inputHandler.showHint();
        // Pinyin is now always visible, so no need to show it here
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
        this.navigate('dictation-select', () => {
            state.currentView = 'dictation-select';
            ui.toggleHeaderStats(false);
            ui.showDictationSelect(
                (passage) => this.startDictation(passage)
            );
        });
    },

    /**
     * Start dictation with selected passage
     */
    async startDictation(passage: DictationPassage): Promise<void> {
        console.log('Game.startDictation called with passage:', passage.id, passage.title);
        state.currentView = 'dictation';

        if (!dictationController) {
            console.log('Creating new DictationController');
            dictationController = new DictationController(ui, () => this.showDictationSelect());
        }

        state.sessionStartTime = Date.now();
        console.log('Calling dictationController.start...');
        await dictationController.start(passage, state.sessionStartTime);
        console.log('dictationController.start completed');
    },

    /**
     * Reveal phrase modal
     */
    revealPhrase(): void {
        // Special handling for dictation mode is now handled in DictationController UI, 
        // but triggered via buttons handled there. 
        // If this is called from keyboard shortcut, we redirect.
        if (state.currentView === 'dictation' && dictationController) {
            // Logic moved to Controller/Manager interactions via UI buttons.
            // For simplicity, we can ignore keyboard reveal in dictation or forward it if needed.
            // But existing code had 'revealBtn.onclick', not Game.revealPhrase().
            return;
        }

        const modal = document.getElementById('reveal-modal');
        const termEl = document.getElementById('reveal-term');
        const pinyinEl = document.getElementById('reveal-pinyin');

        if (!modal || !termEl || !pinyinEl) return;
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

    // Always show Pinyin as requested
    if (state.currentWord) {
        ui.showPinyin(state.currentWord.pinyin);
    }
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

function scrollToActiveChar(activeChar: HTMLElement): void {
    const container = document.querySelector('.writing-grid');
    if (container) {
        const containerRect = container.getBoundingClientRect();
        const charRect = activeChar.getBoundingClientRect();

        // Check if char is out of view
        const isOutOfView = charRect.left < containerRect.left || charRect.right > containerRect.right;

        if (isOutOfView) {
            // Calculate scroll position to center the char
            const scrollLeft = activeChar.offsetLeft - (container.clientWidth / 2) + (activeChar.clientWidth / 2);
            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
        }
    }
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

    // Calculate quality using GameLogic
    const isRevealed = (state as any).isRevealed || false;
    const quality = GameLogic.calculateQuality(mistakeCount, hintUsed, isRevealed);

    // Reset revealed flag
    if (isRevealed) (state as any).isRevealed = false;

    // Update SRS
    updateWordSRS(state.currentWord.term, quality);

    // Update Progress Dot
    const isSuccess = quality >= 3;
    ui.updateProgressDot(state.currentWordIndex, isSuccess ? 'correct' : 'wrong');

    // Calculate XP using GameLogic
    const xpEarned = GameLogic.calculateXP(quality, state.sessionStreak);

    const oldLevel = getLevel();
    state.score += xpEarned;
    addXP(xpEarned);

    // Check for level up
    if (GameLogic.checkLevelUp(oldLevel)) {
        ui.showLevelUp(getLevel());
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

            // Web Share API
            if (navigator.share) {
                navigator.share({
                    title: '星空听写 - 中文学习',
                    text: text,
                    url: window.location.href
                }).catch(console.error);
            } else {
                // Clipboard fallback
                navigator.clipboard.writeText(text).then(() => {
                    alert('成绩已复制到剪贴板！');
                }).catch(() => {
                    alert('分享功能暂不可用');
                });
            }
        }
    );
}
