import { Lesson, DictationPassage } from '../types';
import { LESSONS as LESSONS_A } from './lessons';
import { LESSONS_SET_B } from './lessons-set-b';

/**
 * Set data manager
 * Handles lesson and dictation data for different sets (A and B)
 */

// Mark all Set A lessons with setId
const LESSONS_SET_A = LESSONS_A.map(lesson => ({ ...lesson, setId: 'A' }));

// All lessons from both sets
export const ALL_LESSONS: Lesson[] = [...LESSONS_SET_A, ...LESSONS_SET_B];

/**
 * Get lessons by set ID
 */
export function getLessonsBySet(setId: string): Lesson[] {
    return ALL_LESSONS.filter(lesson => lesson.setId === setId);
}

/**
 * Get all available sets
 */
export function getAvailableSets(): { id: string; name: string }[] {
    return [
        { id: 'A', name: '甲' },
        { id: 'B', name: '乙' }
    ];
}

/**
 * Get dictation passages by set (loaded from JSON files)
 */
export async function getDictationPassagesBySet(setId: string): Promise<DictationPassage[]> {
    try {
        const filename = setId === 'A' ? '/dictation.json' : '/dictation-set-b.json';
        // Add cache-busting timestamp to force fresh load
        const url = `${filename}?v=${Date.now()}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load ${filename}`);
        const data = await response.json();
        return data.passages.map((p: DictationPassage) => ({ ...p, setId }));
    } catch (error) {
        console.error(`Error loading dictation set ${setId}:`, error);
        return [];
    }
}

/**
 * Get all dictation passages from both sets
 */
export async function getAllDictationPassages(): Promise<DictationPassage[]> {
    const [setA, setB] = await Promise.all([
        getDictationPassagesBySet('A'),
        getDictationPassagesBySet('B')
    ]);
    return [...setA, ...setB];
}
