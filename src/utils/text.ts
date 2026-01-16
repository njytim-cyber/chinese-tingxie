/**
 * Text Utilities - Helpers for text processing and Chinese character handling
 *
 * This module provides utilities for text chunking, character analysis,
 * and other text processing tasks common in the dictation app.
 */

/**
 * Represents a text chunk with position information
 */
export interface TextChunk {
    /** The phrase/text content (without punctuation) */
    phrase: string;
    /** Trailing punctuation marks */
    punctuation: string;
    /** Combined phrase + punctuation */
    fullText: string;
    /** Start position in original text */
    startPos: number;
    /** End position in original text */
    endPos: number;
}

/**
 * Splits Chinese text into chunks based on punctuation
 * This is the canonical implementation used throughout the app
 *
 * @param text - Chinese text to split
 * @returns Array of text chunks with position information
 *
 * @example
 * const chunks = splitTextByPunctuation('你好，世界！');
 * // Returns:
 * // [
 * //   { phrase: '你好', punctuation: '，', fullText: '你好，', startPos: 0, endPos: 3 },
 * //   { phrase: '世界', punctuation: '！', fullText: '世界！', startPos: 3, endPos: 6 }
 * // ]
 */
export function splitTextByPunctuation(text: string): TextChunk[] {
    // Chinese punctuation regex (full-width and half-width)
    const splitRegex = /([，。！？、：；""''（）《》]+)/;
    const parts = text.split(splitRegex);
    const chunks: TextChunk[] = [];
    let currentStart = 0;

    // Process pairs of phrase + punctuation
    for (let i = 0; i < parts.length; i += 2) {
        const phrase = parts[i];
        const punct = parts[i + 1] || '';
        const fullChunk = phrase + punct;

        if (fullChunk.trim()) {
            chunks.push({
                phrase: phrase,
                punctuation: punct,
                fullText: fullChunk,
                startPos: currentStart,
                endPos: currentStart + fullChunk.length
            });
        }

        currentStart += fullChunk.length;
    }

    return chunks;
}

/**
 * Extracts just the phrase strings from text chunks
 * @param text - Chinese text to split
 * @returns Array of phrase strings (no punctuation)
 */
export function extractPhrases(text: string): string[] {
    return splitTextByPunctuation(text).map(chunk => chunk.phrase);
}

/**
 * Extracts individual Chinese characters from text
 * Filters out punctuation, whitespace, and non-Chinese characters
 *
 * @param text - Text to extract characters from
 * @returns Array of Chinese characters
 */
export function extractChineseCharacters(text: string): string[] {
    // Chinese character Unicode ranges: 4E00-9FFF (CJK Unified Ideographs)
    const chineseCharRegex = /[\u4E00-\u9FFF]/g;
    return text.match(chineseCharRegex) || [];
}

/**
 * Checks if a character is a Chinese character
 * @param char - Character to check
 * @returns True if Chinese character
 */
export function isChineseCharacter(char: string): boolean {
    return /[\u4E00-\u9FFF]/.test(char);
}

/**
 * Checks if text contains any Chinese characters
 * @param text - Text to check
 * @returns True if contains at least one Chinese character
 */
export function containsChinese(text: string): boolean {
    return /[\u4E00-\u9FFF]/.test(text);
}

/**
 * Counts Chinese characters in text (excluding punctuation)
 * @param text - Text to analyze
 * @returns Number of Chinese characters
 */
export function countChineseCharacters(text: string): number {
    return extractChineseCharacters(text).length;
}

/**
 * Checks if a character is Chinese punctuation
 * @param char - Character to check
 * @returns True if Chinese punctuation
 */
export function isChinesePunctuation(char: string): boolean {
    return /[，。！？、：；""''（）《》]/.test(char);
}

/**
 * Removes all punctuation from text
 * @param text - Text to clean
 * @returns Text with punctuation removed
 */
export function removePunctuation(text: string): string {
    return text.replace(/[，。！？、：；""''（）《》]/g, '');
}

/**
 * Normalizes whitespace in text
 * Replaces multiple spaces with single space, trims
 * @param text - Text to normalize
 * @returns Normalized text
 */
export function normalizeWhitespace(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

/**
 * Splits text into individual characters preserving position
 * Includes both Chinese characters and punctuation
 *
 * @param text - Text to split
 * @returns Array of objects with char and position
 */
export function splitIntoCharacters(text: string): Array<{ char: string; pos: number }> {
    return Array.from(text).map((char, index) => ({
        char,
        pos: index
    }));
}

/**
 * Groups characters into words based on punctuation boundaries
 * Useful for creating input fields for dictation mode
 *
 * @param text - Text to analyze
 * @returns Array of word groups
 */
export function groupByWords(text: string): string[] {
    const chunks = splitTextByPunctuation(text);
    return chunks.map(chunk => chunk.phrase).filter(phrase => phrase.trim());
}

/**
 * Calculates text similarity (Levenshtein distance based)
 * Returns similarity score 0-1 (1 = identical)
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score 0-1
 */
export function calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    const matrix: number[][] = Array(len1 + 1)
        .fill(null)
        .map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    const maxLen = Math.max(len1, len2);
    const distance = matrix[len1][len2];
    return 1 - distance / maxLen;
}

/**
 * Formats pinyin with tone marks
 * Note: This is a placeholder for future pinyin formatting
 * @param pinyin - Pinyin text
 * @returns Formatted pinyin
 */
export function formatPinyin(pinyin: string): string {
    // TODO: Implement tone mark conversion (ma1 -> mā)
    return pinyin.trim();
}

/**
 * Truncates text to specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param ellipsis - Ellipsis string (default: '...')
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number, ellipsis: string = '...'): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param text - Text to escape
 * @returns Escaped text safe for HTML
 */
export function escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Creates a safe HTML string from template
 * Automatically escapes values to prevent XSS
 * @param strings - Template strings
 * @param values - Values to insert
 * @returns Safe HTML string
 */
export function safeHTML(strings: TemplateStringsArray, ...values: unknown[]): string {
    return strings.reduce((result, str, i) => {
        const value = values[i];
        const escaped = value !== undefined
            ? escapeHTML(String(value))
            : '';
        return result + str + escaped;
    }, '');
}
