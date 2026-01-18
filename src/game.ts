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
    getWordState,
    logAttempt,
    type AttemptLog,
    type PracticeWord
} from './data';
import {
    saveSession, clearSession, loadSession, formatSessionInfo, hasActiveSession,
    type TingxieSessionData, type XiziSessionData, type DictationSessionData, type SessionData
} from './data/sessionPersistence';
import { SoundFX, speakWord } from './audio';
import { spawnParticles } from './particles';
import { UIManager, getRandomPraise } from './ui/UIManager';
import { HanziWriterInput } from './input';
import { initDOMCache, type GameState, type DOMCache, type InputHandler, type DictationPassage } from './types';
import { GameLogic } from './game/GameLogic';
import { DictationController } from './game/DictationController';
import { XiziController } from './game/XiziController';
import { WordCompletionHandler } from './game/WordCompletionHandler';
import { SessionManager } from './game/SessionManager';
import { DictationRenderer } from './ui/renderers/DictationRenderer';
import {
    checkAndOfferResume, resumeTingxieSession, resumeXiziSession, resumeDictationSession
} from './game/sessionResume';

const PLAYER_NAME_KEY = 'tingxie_player_name';

// DOM cache for performance
let domCache: DOMCache;

// UI Manager instance
let ui: UIManager;

// Input handler instance (stroke or handwriting)
let inputHandler: InputHandler;

// Dictation Controller instance
let dictationController: DictationController | null = null;
let xiziController: XiziController | null = null;

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
            inputHandler.onChunkChange = handleChunkChange;

            // Set up auto-save on page unload
            setupAutoSave();
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

        // Check for saved session and offer to resume
        checkAndOfferResume(
            ui,
            (session) => resumeTingxieSession(session, state, ui, domCache, loadLevel),
            async (session) => {
                xiziController = await resumeXiziSession(session, state, ui, xiziController, () => Game.showLessonSelect());
            },
            async (session) => {
                await resumeDictationSession(
                    session,
                    state,
                    (passage) => Game.startDictation(passage),
                    () => dictationController?.getManager(),
                    ui
                );
            }
        );
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
     * Update header title
     */
    updateHeaderTitle(title: string): void {
        ui.updateHeaderTitle(title);
    },

    cleanupCurrentView(): void {
        // Stop any audio
        if (window.speechSynthesis) window.speechSynthesis.cancel();

        // Clean up Input Handler (Tingxie mode)
        if (inputHandler && typeof inputHandler.destroy === 'function') {
            inputHandler.destroy();
        }

        // Remove spelling header progress bar
        ui.removeSpellingProgress();

        // Clean up Dictation Mode
        if (dictationController && dictationController.getManager()) {
            dictationController.getManager()?.destroy();
            // Reset UI state for Dictation
            const card = document.getElementById('writing-card');
            if (card) {
                const toolbar = card.querySelector('.card-toolbar');
                if (toolbar) (toolbar as HTMLElement).style.display = '';
            }
            // Remove dictation header progress bar
            const progressBar = document.getElementById('dictation-header-progress');
            if (progressBar) progressBar.remove();
        }

        // Clean up UI renderers (removes event listeners)
        ui.cleanupRenderers();

        // Note: XiziController doesn't have a destroy method - it cleans up naturally
        // when the DOM is replaced during view transitions
    },

    /**
     * Navigation guards - check for active sessions before navigating
     */
    navigateToLessonSelect(): void {
        if (this.isInActiveSession()) {
            this.confirmExitSession(() => this.showLessonSelect(true));
        } else {
            this.showLessonSelect();
        }
    },

    navigateToProgress(): void {
        if (this.isInActiveSession()) {
            this.confirmExitSession(() => this.showProgress(true));
        } else {
            this.showProgress();
        }
    },

    navigateToDictationSelect(): void {
        if (this.isInActiveSession()) {
            this.confirmExitSession(() => this.showDictationSelect(true));
        } else {
            this.showDictationSelect();
        }
    },

    navigateToShop(): void {
        if (this.isInActiveSession()) {
            this.confirmExitSession(() => ui.showShop());
        } else {
            ui.showShop();
        }
    },

    isInActiveSession(): boolean {
        return state.currentView === 'game' ||
               state.currentView === 'xizi' ||
               state.currentView === 'dictation';
    },

    confirmExitSession(onConfirm: () => void): void {
        ui.showConfirm(
            '退出练习',
            '确定要退出当前练习吗？进度将不会保存。',
            () => {
                this.cleanupCurrentView();
                onConfirm();
            }
        );
    },

    /**
     * Show lesson selection screen
     */
    showLessonSelect(force: boolean = false): void {
        if (force) {
            this.cleanupCurrentView();
        }

        state.currentView = 'lesson-select';
        ui.hideFooterProgress();
        ui.showSessionStats(false); // Show global stats in header

        // Ensure UI is reset for Spelling Mode (restores writing-card if needed)
        if (domCache && domCache.writingArea) {
            // GameRenderer handles this via internal logic usually, but
            // we might need to nudge it if we are coming from Dictation
        }

        ui.showLessonSelect(
            (lessonId, wordLimit, mode) => Game.selectLesson(lessonId, wordLimit, mode),
            () => Game.showProgress(),
            () => Game.showPracticeSelect()
        );
    },

    /**
     * Select a lesson and start practicing
     */
    selectLesson(lessonId: number, wordLimit = 0, mode: 'tingxie' | 'xizi' = 'tingxie'): void {
        console.log(`Starting lesson ${lessonId} in ${mode} mode`);
        setCurrentLesson(lessonId);

        // Hide tabs when starting practice
        ui.hideAllTabs();

        if (mode === 'xizi') {
            Game.startXizi(lessonId, wordLimit);
            return;
        }

        // For tingxie mode, practice ALL words in the lesson (ignore SRS)
        // This ensures users can practice the full lesson content
        const lesson = getCurrentLesson();
        let words: PracticeWord[] = lesson.phrases.map((phrase, index) => ({
            term: phrase.term,
            pinyin: phrase.pinyin,
            level: Math.ceil((index + 1) / 3),
            lessonId: lesson.id,
            ...getWordState(phrase.term)
        }));

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
        ui.showSessionStats(true); // Show session stats in header
        ui.renderProgressDots(state.practiceWords.length);

        // Update lesson display in HUD
        ui.updateHeaderTitle(lesson.title);
        if (domCache.lessonLabel) {
            domCache.lessonLabel.textContent = lesson.title;
        }

        loadLevel();
    },

    /**
     * Show progress view
     */
    showProgress(force: boolean = false): void {
        if (force) {
            this.cleanupCurrentView();
        }

        state.currentView = 'progress';
        ui.showSessionStats(false); // Show global stats in header
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

            // Ensure valid state before UI updates
            if (!state.practiceWords || state.practiceWords.length === 0) {
                throw new Error("No words available for practice");
            }

            ui.toggleActiveGameUI(true);
            ui.showControls();
            ui.setHudTransparent(false);
            ui.showSessionStats(true); // Show session stats in header
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
        // Confirm before leaving active practice with in-app modal
        if (state.currentView === 'dictation' || state.currentView === 'game' || state.currentView === 'xizi') {
            ui.showConfirm(
                '离开练习',
                '确定要离开当前练习吗？你的进度将不会被保存。',
                () => {
                    // User confirmed - proceed with navigation
                    this.performBackNavigation();
                }
            );
            return;
        }

        // No confirmation needed for other views
        this.performBackNavigation();
    },

    /**
     * Perform the actual back navigation (extracted for confirmation flow)
     */
    performBackNavigation(): void {
        if (state.currentView === 'practice-select' || state.currentView === 'progress' || state.currentView === 'dictation-select') {
            Game.showLessonSelect(); // Return to main menu (SPA mode)
        } else if (state.currentView === 'lesson-select') {
            location.reload();
        } else if (state.currentView === 'dictation') {
            this.cleanupCurrentView(); // Clean up dictation manager
            Game.showDictationSelect(); // Back to dictation select
        } else if (state.currentView === 'game' || state.currentView === 'xizi') {
            this.cleanupCurrentView(); // Clean up active session
            Game.showLessonSelect(); // Back to lesson select
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

        // Check for active chunk
        if (inputHandler && inputHandler.getCurrentChunkText) {
            const chunkText = inputHandler.getCurrentChunkText();
            if (chunkText) {
                speakWord(chunkText);
                return;
            }
        }

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
        saveTingxieSession(); // Save progress after each word
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
    showDictationSelect(force: boolean = false): void {
        if (force) {
            this.cleanupCurrentView();
        }

        state.currentView = 'dictation-select';
        ui.toggleHeaderStats(false);
        ui.showSessionStats(false); // Show global stats in header
        ui.showDictationSelect(
            (passage) => this.startDictation(passage)
        );
    },

    /**
     * Start dictation with selected passage
     */
    async startDictation(passage: DictationPassage): Promise<void> {
        console.log('Game.startDictation called with passage:', passage.id, passage.title);
        state.currentView = 'dictation';

        // Update header title to passage name (shortened for better display)
        ui.updateHeaderTitle(DictationRenderer.shortenTitle(passage.title));
        ui.toggleMainHeader(true);
        ui.toggleBackBtn(true);
        ui.showSessionStats(true); // Show session stats in header

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
            return;
        }

        // In spelling mode, we prefer to reveal the character in-place
        if (state.currentView === 'game' && inputHandler && inputHandler.revealCharacter) {
            inputHandler.revealCharacter();
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

    /**
     * Show word list for current lesson
     */
    showWordList(): void {
        console.log('showWordList called, current view:', state.currentView);
        console.log('practiceWords:', state.practiceWords);
        console.log('currentWordIndex:', state.currentWordIndex);

        if (state.practiceWords && state.practiceWords.length > 0) {
            ui.showWordListModal(state.practiceWords, state.currentWordIndex);
        } else {
            ui.showFeedback('词语表仅在听写模式下可用', '#f59e0b');
        }
    },

    /**
     * Start Xizi (Character Practice) Mode
     */
    async startXizi(lessonId: number, wordLimit = 0): Promise<void> {
        state.currentView = 'xizi';

        // Hide standard game UI elements that might conflict
        ui.toggleActiveGameUI(false);
        ui.toggleMainHeader(true);
        ui.toggleBackBtn(true);
        ui.showSessionStats(true); // Show session stats in header

        // Use lesson title
        const lesson = getCurrentLesson();
        ui.updateHeaderTitle(lesson.title);

        if (!xiziController) {
            xiziController = new XiziController(ui, () => Game.showLessonSelect());
        }

        state.sessionStartTime = Date.now();
        await xiziController.start(lessonId, state.sessionStartTime, wordLimit);
    }
};

/**
 * Save current tingxie session state
 */
function saveTingxieSession(): void {
    if (state.currentView !== 'game' || !state.practiceWords.length) return;

    const lesson = getCurrentLesson();
    const sessionData: TingxieSessionData = {
        mode: 'tingxie',
        timestamp: Date.now(),
        sessionStartTime: state.sessionStartTime || Date.now(),
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        practiceWords: state.practiceWords,
        currentWordIndex: state.currentWordIndex,
        wordLimit: state.practiceWords.length,
        sessionResults: state.sessionResults
    };

    saveSession(sessionData);
}

/**
 * Set up auto-save on page unload
 */
function setupAutoSave(): void {
    // Save session when user navigates away or refreshes
    window.addEventListener('beforeunload', () => {
        // Save tingxie session if active
        if (state.currentView === 'game' && state.practiceWords.length) {
            saveTingxieSession();
        }
        // Xizi and Dictation modes handle their own saving in their respective managers
    });
}

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

    // Reset chunk tracking so audio plays for first chunk of new word
    lastChunkText = null;

    // UI Reset
    ui.clearWritingArea();
    ui.gameRenderer.updateCompletedText(''); // Reset completed text
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

        // Hide completed text div if there's only one chunk (single character word)
        const completedTextDiv = document.getElementById('completed-text');
        if (completedTextDiv && inputHandler.getChunks) {
            const chunks = inputHandler.getChunks();
            if (chunks && chunks.length <= 1) {
                completedTextDiv.style.display = 'none';
            } else {
                completedTextDiv.style.display = 'block';
            }
        }
    }

    // Update progress dots
    ui.updateProgressDot(state.currentWordIndex, 'active');

    // Update header progress bar
    ui.renderSpellingProgress(state.currentWordIndex, state.practiceWords.length);

    // Audio is now handled by handleChunkChange callback during init
    // Scroll to the first active character if on mobile
    setTimeout(() => {
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
 * Handle chunk change (autplay audio and update UI)
 */
let lastChunkText: string | null = null;
function handleChunkChange(chunkText: string, completedText: string): void {
    // Update completed text UI
    ui.gameRenderer.updateCompletedText(completedText);

    // Play audio ONLY when chunk actually changes
    if (chunkText !== lastChunkText) {
        lastChunkText = chunkText;
        // We delay slightly to allow UI to settle
        setTimeout(() => {
            speakWord(chunkText);
        }, 200);
    }
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

    WordCompletionHandler.handleWordSuccess(
        state.currentWord,
        inputHandler,
        state,
        ui,
        Game.getPlayerName(),
        state.currentWordIndex,
        result
    );
}

/**
 * Show session complete screen
 */
function showSessionComplete(): void {
    // Clear saved session when completing
    clearSession();

    SessionManager.showSessionComplete(
        state,
        ui,
        () => {
            state.currentWordIndex = 0;
            Game.startPractice();
        }
    );
}
