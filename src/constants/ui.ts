/**
 * UI Constants
 * Centralized constants for UI elements to maintain DRY principle
 */

// Button Classes
export const ButtonClasses = {
    PRIMARY: 'action-btn-primary',
    SECONDARY: 'action-btn-secondary',
    LARGE: 'action-btn-large',
    TOOL: 'tool-btn',
    TEXT: 'text-btn',
} as const;

// Container Classes
export const ContainerClasses = {
    NEXT_CHUNK: 'next-chunk-container',
    NEXT_PHRASE: 'next-phrase-container',
    MODAL_OVERLAY: 'modal-overlay',
    MODAL_CONTENT: 'modal-content',
    WRITING_CARD: 'writing-card',
    DICTATION_CONTAINER: 'dictation-container',
    XIZI_CONTAINER: 'xizi-container',
} as const;

// Element IDs
export const ElementIds = {
    // Buttons
    BTN_NEXT_CHUNK: 'btn-next-chunk',
    BTN_NEXT_PHRASE: 'btn-next-phrase',
    BTN_AUDIO: 'btn-audio',
    BTN_GRID: 'btn-grid',
    BTN_HINT: 'btn-hint',
    BTN_REVEAL: 'btn-reveal',
    BTN_WORDLIST: 'btn-wordlist',

    // Containers
    NEXT_CHUNK_CONTAINER: 'next-chunk-container',
    NEXT_PHRASE_CONTAINER: 'next-phrase-container',
    WRITING_CARD: 'writing-card',
    COMPLETED_TEXT: 'completed-text',

    // Progress
    SPELLING_PROGRESS_BAR: 'spelling-progress-bar',
    DICTATION_HEADER_PROGRESS: 'dictation-header-progress',
    FOOTER_PROGRESS: 'footer-progress',
} as const;

// Common Text
export const UIText = {
    CONTINUE: '继续 →',
    COMPLETE: '完成',
    CANCEL: '取消',
    CONFIRM: '确定',
    LOADING: '加载中...',
} as const;

// Common Styles
export const CommonStyles = {
    NEXT_BUTTON_CONTAINER: {
        width: '100%',
        padding: '16px 10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '60px',
    },
    NEXT_BUTTON: {
        width: '100%',
        minHeight: '44px',
        padding: '12px 24px',
        fontSize: '1rem',
    },
} as const;

// Grid Types
export const GridTypes = {
    TIAN: 'tian',
    MI: 'mi',
    BLANK: 'blank',
} as const;

// Feedback Colors
export const FeedbackColors = {
    SUCCESS: '#4ade80',
    ERROR: '#ef4444',
    WARNING: '#f59e0b',
    INFO: '#3b82f6',
} as const;
