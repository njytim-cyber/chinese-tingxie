/**
 * Session Persistence Module
 * Saves and restores in-progress practice sessions for all modes
 * Allows users to resume from where they left off after page refresh
 */

import { getLocalStorageItem, setLocalStorageItem, removeLocalStorageItem } from '../utils/errors';
import type { PracticeWord } from '../types';
import type { CharBox } from '../types';

const SESSION_KEY = 'tingxie_active_session';
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Base session data shared across all modes
 */
interface BaseSessionData {
    mode: 'tingxie' | 'xizi' | 'dictation';
    timestamp: number;
    sessionStartTime: number;
}

/**
 * Tingxie (Spelling) Mode Session
 */
export interface TingxieSessionData extends BaseSessionData {
    mode: 'tingxie';
    lessonId: number;
    lessonTitle: string;
    practiceWords: PracticeWord[];
    currentWordIndex: number;
    wordLimit: number;
    sessionResults: Array<{
        term: string;
        correct: boolean;
        mistakeCount: number;
        hintUsed: boolean;
    }>;
}

/**
 * Xizi (Character Practice) Mode Session
 */
export interface XiziSessionData extends BaseSessionData {
    mode: 'xizi';
    lessonId: number;
    lessonTitle: string;
    allPhrases: Array<{ term: string; pinyin: string; definition?: string }>;
    practiceQueue: Array<{ term: string; pinyin: string; definition?: string }>;
    currentQueueIndex: number;
    currentStage: number; // 0=Full Guide, 1=Half Guide, 2=Blank
    currentCharIndexInPhrase: number;
    wordLimit: number;
}

/**
 * Dictation (默写) Mode Session
 */
export interface DictationSessionData extends BaseSessionData {
    mode: 'dictation';
    passageId: string;
    passageTitle: string;
    passageText: string;
    chunks: string[];
    chunkPinyins?: string[];
    isFullDictation: boolean;
    blanks: number[];
    currentChunkIndex: number;
    currentCharIndex: number;
    charBoxes: CharBox[]; // Save user input progress
}

/**
 * Union type for all session data
 */
export type SessionData = TingxieSessionData | XiziSessionData | DictationSessionData;

/**
 * Save current session to localStorage
 */
export function saveSession(sessionData: SessionData): void {
    const dataWithTimestamp = {
        ...sessionData,
        timestamp: Date.now()
    };
    setLocalStorageItem(SESSION_KEY, dataWithTimestamp);
}

/**
 * Load saved session from localStorage
 * Returns null if no session found or session is stale
 */
export function loadSession(): SessionData | null {
    const saved = getLocalStorageItem<SessionData | null>(SESSION_KEY, null);

    if (!saved) return null;

    // Check if session is stale (older than 24 hours)
    const age = Date.now() - saved.timestamp;
    if (age > SESSION_MAX_AGE_MS) {
        clearSession();
        return null;
    }

    return saved;
}

/**
 * Clear saved session
 */
export function clearSession(): void {
    removeLocalStorageItem(SESSION_KEY);
}

/**
 * Check if there's an active session
 */
export function hasActiveSession(): boolean {
    return loadSession() !== null;
}

/**
 * Get session age in minutes
 */
export function getSessionAge(): number | null {
    const session = loadSession();
    if (!session) return null;

    return Math.floor((Date.now() - session.timestamp) / 1000 / 60);
}

/**
 * Format session for display in resume dialog
 */
export function formatSessionInfo(session: SessionData): { title: string; progress: string; age: string } {
    const ageMinutes = getSessionAge();
    const ageStr = ageMinutes === null ? '未知' :
        ageMinutes < 60 ? `${ageMinutes} 分钟前` :
        ageMinutes < 1440 ? `${Math.floor(ageMinutes / 60)} 小时前` :
        `${Math.floor(ageMinutes / 1440)} 天前`;

    let title = '';
    let progress = '';

    switch (session.mode) {
        case 'tingxie':
            title = `听写: ${session.lessonTitle}`;
            progress = `第 ${session.currentWordIndex + 1}/${session.practiceWords.length} 词`;
            break;
        case 'xizi':
            title = `习字: ${session.lessonTitle}`;
            const stages = ['描红', '辅助', '默写'];
            progress = `第 ${session.currentQueueIndex + 1}/${session.practiceQueue.length} 词组 (${stages[session.currentStage]})`;
            break;
        case 'dictation':
            title = `默写: ${session.passageTitle}`;
            progress = `第 ${session.currentChunkIndex + 1}/${session.chunks.length} 段`;
            break;
    }

    return { title, progress, age: ageStr };
}
