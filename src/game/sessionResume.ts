/**
 * Session Resume Module
 * Handles resuming saved practice sessions
 */

import {
    loadSession, formatSessionInfo, hasActiveSession, clearSession,
    type SessionData, type TingxieSessionData, type XiziSessionData, type DictationSessionData
} from '../data/sessionPersistence';
import { setCurrentLesson, getCurrentLesson } from '../data';
import { XiziController } from './XiziController';
import type { UIManager } from '../ui/UIManager';
import type { GameState, DOMCache, DictationPassage } from '../types';

/**
 * Check for saved session and offer to resume
 */
export function checkAndOfferResume(
    ui: UIManager,
    onResumeTingxie: (session: TingxieSessionData) => void,
    onResumeXizi: (session: XiziSessionData) => Promise<void>,
    onResumeDictation: (session: DictationSessionData) => Promise<void>
): void {
    if (!hasActiveSession()) return;

    const session = loadSession();
    if (!session) return;

    const sessionInfo = formatSessionInfo(session);

    ui.showResumeDialog(
        sessionInfo,
        () => resumeSession(session, onResumeTingxie, onResumeXizi, onResumeDictation),
        () => {
            clearSession();
            // Stay on lesson select screen
        }
    );
}

/**
 * Resume a saved session based on mode
 */
function resumeSession(
    session: SessionData,
    onResumeTingxie: (session: TingxieSessionData) => void,
    onResumeXizi: (session: XiziSessionData) => Promise<void>,
    onResumeDictation: (session: DictationSessionData) => Promise<void>
): void {
    switch (session.mode) {
        case 'tingxie':
            onResumeTingxie(session as TingxieSessionData);
            break;
        case 'xizi':
            onResumeXizi(session as XiziSessionData);
            break;
        case 'dictation':
            onResumeDictation(session as DictationSessionData);
            break;
    }
}

/**
 * Resume tingxie session
 */
export function resumeTingxieSession(
    session: TingxieSessionData,
    state: GameState,
    ui: UIManager,
    domCache: DOMCache,
    loadLevel: () => void
): void {
    setCurrentLesson(session.lessonId);

    // Restore session state
    state.practiceWords = session.practiceWords;
    state.currentWordIndex = session.currentWordIndex;
    state.sessionStartTime = session.sessionStartTime;
    state.sessionResults = session.sessionResults;
    state.currentView = 'game';

    // Show controls and UI
    ui.hideAllTabs();
    ui.toggleActiveGameUI(true);
    ui.showControls();
    ui.setHudTransparent(false);
    ui.showSessionStats(true);
    ui.renderProgressDots(state.practiceWords.length);

    // Update header
    const lesson = getCurrentLesson();
    ui.updateHeaderTitle(lesson.title);
    if (domCache.lessonLabel) {
        domCache.lessonLabel.textContent = lesson.title;
    }

    // Load current word
    loadLevel();
}

/**
 * Resume xizi session
 */
export async function resumeXiziSession(
    session: XiziSessionData,
    state: GameState,
    ui: UIManager,
    xiziController: XiziController | null,
    onExit: () => void
): Promise<XiziController> {
    state.currentView = 'xizi';

    ui.toggleActiveGameUI(false);
    ui.toggleMainHeader(true);
    ui.toggleBackBtn(true);
    ui.showSessionStats(true);
    ui.updateHeaderTitle(session.lessonTitle);

    if (!xiziController) {
        xiziController = new XiziController(ui, onExit);
    }

    // Restore xizi state
    state.sessionStartTime = session.sessionStartTime;

    // Start from saved position
    await xiziController.start(session.lessonId, session.sessionStartTime, session.wordLimit);

    // Show feedback
    ui.showFeedback('已恢复练习进度', '#4ade80');

    return xiziController;
}

/**
 * Resume dictation session
 */
export async function resumeDictationSession(
    session: DictationSessionData,
    state: GameState,
    startDictation: (passage: DictationPassage) => Promise<void>,
    getDictationManager: () => any,
    ui: UIManager
): Promise<void> {
    state.currentView = 'dictation';

    // Reconstruct passage from session data
    const passage: DictationPassage = {
        id: session.passageId,
        title: session.passageTitle,
        text: session.passageText,
        chunks: session.chunks,
        chunkPinyins: session.chunkPinyins,
        isFullDictation: session.isFullDictation,
        blanks: session.blanks,
        setId: 'B' // Default to B, actual value doesn't matter for resume
    };

    // Start dictation
    await startDictation(passage);

    // After initialization, restore the saved state
    const manager = getDictationManager();
    if (manager) {
        // Restore character boxes and indices
        manager.charBoxes = session.charBoxes;
        manager.currentChunkIndex = session.currentChunkIndex;
        manager.currentCharIndex = session.currentCharIndex;

        // Re-render to show restored state
        if (typeof manager.render === 'function') {
            manager['render'](); // Access private method
        }
    }

    ui.showFeedback('已恢复默写进度', '#4ade80');
}
