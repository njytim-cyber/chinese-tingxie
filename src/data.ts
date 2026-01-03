/**
 * Word Data with Spaced Repetition (SM-2 inspired)
 * Organized by lessons (9 lessons × 15 phrases = 135 total)
 */

// Type definitions
export interface Phrase {
    term: string;
    pinyin: string;
}

export interface Lesson {
    id: number;
    title: string;
    phrases: Phrase[];
}

export interface WordState {
    score: number;
    interval: number;
    nextReview: string;
    easeFactor: number;
    timesCorrect: number;
    timesMistaken: number;
}

export interface PlayerStats {
    totalXP: number;
    dailyStreak: number;
    lastPlayedDate: string | null;
    wordsLearned: number;
    perfectWords: number;
    totalSessions: number;
    achievements: string[];
    currentLessonId: number;
}

export interface Achievement {
    id: string;
    name: string;
    desc: string;
    icon: string;
    check: () => boolean;
    unlocked?: boolean;
}

const STORAGE_KEY = 'tingxie_word_data';
const STATS_KEY = 'tingxie_stats';

// 9 Lessons × 15 Phrases = 135 vocabulary items
export const LESSONS: Lesson[] = [
    {
        id: 1,
        title: "第一课: 一起看电视",
        phrases: [
            { term: "建议", pinyin: "jiàn yì" },
            { term: "观众", pinyin: "guān zhòng" },
            { term: "共有", pinyin: "gòng yǒu" },
            { term: "全岛", pinyin: "quán dǎo" },
            { term: "连续剧", pinyin: "lián xù jù" },
            { term: "忍不住", pinyin: "rěn bù zhù" },
            { term: "了解情况", pinyin: "liǎo jiě qíng kuàng" },
            { term: "藏着秘密", pinyin: "cáng zhe mì mì" },
            { term: "一脸疲倦", pinyin: "yī liǎn pí juàn" },
            { term: "天气预报", pinyin: "tiān qì yù bào" },
            { term: "播放两集", pinyin: "bō fàng liǎng jí" },
            { term: "转换频道", pinyin: "zhuǎn huàn pín dào" },
            { term: "拍着手掌", pinyin: "pāi zhe shǒu zhǎng" },
            { term: "国内外新闻", pinyin: "guó nèi wài xīn wén" },
            { term: "精彩的舞蹈表演", pinyin: "jīng cǎi de wǔ dǎo biǎo yǎn" }
        ]
    },
    {
        id: 2,
        title: "第二课: 我们是兄弟姐妹",
        phrases: [
            { term: "怕冷", pinyin: "pà lěng" },
            { term: "撑伞", pinyin: "chēng sǎn" },
            { term: "急忙", pinyin: "jí máng" },
            { term: "温暖", pinyin: "wēn nuǎn" },
            { term: "大苹果", pinyin: "dà píng guǒ" },
            { term: "烟花棒", pinyin: "yān huā bàng" },
            { term: "讨论心得", pinyin: "tǎo lùn xīn dé" },
            { term: "一只袖子", pinyin: "yī zhī xiù zi" },
            { term: "一串鱼丸", pinyin: "yī chuàn yú wán" },
            { term: "拍打小鼓", pinyin: "pāi dǎ xiǎo gǔ" },
            { term: "挤在一起", pinyin: "jǐ zài yī qǐ" },
            { term: "表示担心", pinyin: "biǎo shì dān xīn" },
            { term: "靠得紧紧的", pinyin: "kào de jǐn jǐn de" },
            { term: "忽然灵机一动", pinyin: "hū rán líng jī yī dòng" },
            { term: "词语的意思", pinyin: "cí yǔ de yì si" }
        ]
    },
    {
        id: 3,
        title: "第三课: 妈妈,对不起",
        phrases: [
            { term: "最近", pinyin: "zuì jìn" },
            { term: "补习", pinyin: "bǔ xí" },
            { term: "批评", pinyin: "pī píng" },
            { term: "煮饭", pinyin: "zhǔ fàn" },
            { term: "说谎", pinyin: "shuō huǎng" },
            { term: "舍不得", pinyin: "shě bù dé" },
            { term: "发脾气", pinyin: "fā pí qi" },
            { term: "尊敬长辈", pinyin: "zūn jìng zhǎng bèi" },
            { term: "落下眼泪", pinyin: "luò xià yǎn lèi" },
            { term: "后悔极了", pinyin: "hòu huǐ jí le" },
            { term: "一碗云吞面", pinyin: "yī wǎn yún tūn miàn" },
            { term: "弄坏飞机模型", pinyin: "nòng huài fēi jī mó xíng" },
            { term: "睁开眼睛醒来", pinyin: "zhēng kāi yǎn jīng xǐng lái" },
            { term: "迷上电脑游戏", pinyin: "mí shàng diàn nǎo yóu xì" },
            { term: "肚子咕噜咕噜叫", pinyin: "dù zi gū lū gū lū jiào" }
        ]
    },
    {
        id: 4,
        title: "第四课: 今天我值日",
        phrases: [
            { term: "由于", pinyin: "yóu yú" },
            { term: "注意", pinyin: "zhù yì" },
            { term: "责任", pinyin: "zé rèn" },
            { term: "玩耍", pinyin: "wán shuǎ" },
            { term: "踮起脚尖", pinyin: "diǎn qǐ jiǎo jiān" },
            { term: "议论纷纷", pinyin: "yì lùn fēn fēn" },
            { term: "皱着眉头", pinyin: "zhòu zhe méi tóu" },
            { term: "阅读角落", pinyin: "yuè dú jiǎo luò" },
            { term: "一片安静", pinyin: "yī piàn ān jìng" },
            { term: "长得矮小", pinyin: "zhǎng de ǎi xiǎo" },
            { term: "好不容易", pinyin: "hǎo bù róng yì" },
            { term: "影响别人", pinyin: "yǐng xiǎng bié rén" },
            { term: "维持秩序", pinyin: "wéi chí zhì xù" },
            { term: "默默地擦干净", pinyin: "mò mò de cā gān jìng" },
            { term: "保证不再插队", pinyin: "bǎo zhèng bù zài chā duì" }
        ]
    },
    {
        id: 5,
        title: "第五课: 我不怕打针",
        phrases: [
            { term: "被骗", pinyin: "bèi piàn" },
            { term: "项目", pinyin: "xiàng mù" },
            { term: "微笑", pinyin: "wēi xiào" },
            { term: "洗澡", pinyin: "xǐ zǎo" },
            { term: "胆小鬼", pinyin: "dǎn xiǎo guǐ" },
            { term: "体育课", pinyin: "tǐ yù kè" },
            { term: "戴眼镜", pinyin: "dài yǎn jìng" },
            { term: "闷闷不乐", pinyin: "mèn mèn bù lè" },
            { term: "打预防针", pinyin: "dǎ yù fáng zhēn" },
            { term: "视力变差了", pinyin: "shì lì biàn chà le" },
            { term: "检查身体", pinyin: "jiǎn chá shēn tǐ" },
            { term: "松了一口气", pinyin: "sōng le yī kǒu qì" },
            { term: "建议吃退烧药", pinyin: "jiàn yì chī tuì shāo yào" },
            { term: "眼睛闭得紧紧的", pinyin: "yǎn jīng bì de jǐn jǐn de" },
            { term: "勇敢地伸出手臂", pinyin: "yǒng gǎn de shēn chū shǒu bì" }
        ]
    },
    {
        id: 6,
        title: "第六课: 我要参加什么活动呢?",
        phrases: [
            { term: "功夫", pinyin: "gōng fu" },
            { term: "开始", pinyin: "kāi shǐ" },
            { term: "分享", pinyin: "fēn xiǎng" },
            { term: "握手", pinyin: "wò shǒu" },
            { term: "武术队", pinyin: "wǔ shù duì" },
            { term: "童子军", pinyin: "tóng zǐ jūn" },
            { term: "身体健康", pinyin: "shēn tǐ jiàn kāng" },
            { term: "好久不见", pinyin: "hǎo jiǔ bù jiàn" },
            { term: "觉得幸运", pinyin: "jué de xìng yùn" },
            { term: "辅助活动", pinyin: "fǔ zhù huó dòng" },
            { term: "登上舞台", pinyin: "dēng shàng wǔ tái" },
            { term: "活动很丰富", pinyin: "huó dòng hěn fēng fù" },
            { term: "训练十分辛苦", pinyin: "xùn liàn shí fēn xīn kǔ" },
            { term: "欢迎新队员", pinyin: "huān yíng xīn duì yuán" },
            { term: "脸红脖子粗", pinyin: "liǎn hóng bó zi cū" }
        ]
    },
    {
        id: 7,
        title: "第七课: 他的脸红了",
        phrases: [
            { term: "孕妇", pinyin: "yùn fù" },
            { term: "舅舅", pinyin: "jiù jiu" },
            { term: "乱抢", pinyin: "luàn qiǎng" },
            { term: "劝告", pinyin: "quàn gào" },
            { term: "悄悄地", pinyin: "qiāo qiāo de" },
            { term: "胖乎乎", pinyin: "pàng hū hū" },
            { term: "圆滚滚", pinyin: "yuán gǔn gǔn" },
            { term: "企鹅馆", pinyin: "qǐ é guǎn" },
            { term: "摇摆身体", pinyin: "yáo bǎi shēn tǐ" },
            { term: "拼命地挤", pinyin: "pīn mìng de jǐ" },
            { term: "节约用水", pinyin: "jié yuē yòng shuǐ" },
            { term: "耐心地等待", pinyin: "nài xīn de děng dài" },
            { term: "做错事要道歉", pinyin: "zuò cuò shì yào dào qiàn" },
            { term: "有秩序地排队", pinyin: "yǒu zhì xù de pái duì" },
            { term: "长长的人龙", pinyin: "cháng cháng de rén lóng" }
        ]
    },
    {
        id: 8,
        title: "第八课: 马路如虎口",
        phrases: [
            { term: "危险", pinyin: "wēi xiǎn" },
            { term: "交警", pinyin: "jiāo jǐng" },
            { term: "民防部", pinyin: "mín fáng bù" },
            { term: "获得表扬", pinyin: "huò dé biǎo yáng" },
            { term: "记者采访", pinyin: "jì zhě cǎi fǎng" },
            { term: "见义勇为", pinyin: "jiàn yì yǒng wéi" },
            { term: "一行标题", pinyin: "yī háng biāo tí" },
            { term: "手臂受伤", pinyin: "shǒu bì shòu shāng" },
            { term: "包扎伤口", pinyin: "bāo zā shāng kǒu" },
            { term: "向行人问路", pinyin: "xiàng xíng rén wèn lù" },
            { term: "摩托车骑士", pinyin: "mó tuō chē qí shì" },
            { term: "巨大的响声", pinyin: "jù dà de xiǎng shēng" },
            { term: "顺利地救出", pinyin: "shùn lì de jiù chū" },
            { term: "司机被困在车里", pinyin: "sī jī bèi kùn zài chē lǐ" },
            { term: "照顾流血的伤者", pinyin: "zhào gù liú xuè de shāng zhě" }
        ]
    },
    {
        id: 9,
        title: "第九课: 爱心无障碍",
        phrases: [
            { term: "居民", pinyin: "jū mín" },
            { term: "其中", pinyin: "qí zhōng" },
            { term: "依然", pinyin: "yī rán" },
            { term: "闸门", pinyin: "zhá mén" },
            { term: "告示牌", pinyin: "gào shì pái" },
            { term: "炸鸡腿", pinyin: "zhà jī tuǐ" },
            { term: "没听清楚", pinyin: "méi tīng qīng chǔ" },
            { term: "饮料摊位", pinyin: "yǐn liào tān wèi" },
            { term: "一则短信", pinyin: "yī zé duǎn xìn" },
            { term: "地铁月台", pinyin: "dì tiě yuè tái" },
            { term: "重复一遍", pinyin: "chóng fù yī biàn" },
            { term: "用菜单点餐", pinyin: "yòng cài dān diǎn cān" },
            { term: "讨厌辣味食物", pinyin: "tǎo yàn là wèi shí wù" },
            { term: "一般的快餐店", pinyin: "yī bān de kuài cān diàn" },
            { term: "离开熟食中心", pinyin: "lí kāi shú shí zhōng xīn" }
        ]
    }
];

// Legacy compatibility - flat list of all words
export interface Word {
    term: string;
    pinyin: string;
    level: number;
    lessonId: number;
}

// Get all words as flat array for backward compatibility
export function getAllWords(): Word[] {
    const words: Word[] = [];
    LESSONS.forEach(lesson => {
        lesson.phrases.forEach((phrase, index) => {
            words.push({
                term: phrase.term,
                pinyin: phrase.pinyin,
                level: Math.ceil((index + 1) / 3), // 5 levels per lesson
                lessonId: lesson.id
            });
        });
    });
    return words;
}

// Word learning state - stored separately
let wordState: Record<string, WordState> = {};

// Player statistics
let playerStats: PlayerStats = {
    totalXP: 0,
    dailyStreak: 0,
    lastPlayedDate: null,
    wordsLearned: 0,
    perfectWords: 0,
    totalSessions: 0,
    achievements: [],
    currentLessonId: 1
};

/**
 * Get today's date as string (YYYY-MM-DD)
 */
function getToday(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Initialize word state for all words
 */
function initWordState(): void {
    LESSONS.forEach(lesson => {
        lesson.phrases.forEach(phrase => {
            if (!wordState[phrase.term]) {
                wordState[phrase.term] = {
                    score: 0,
                    interval: 0,
                    nextReview: getToday(),
                    easeFactor: 2.5,
                    timesCorrect: 0,
                    timesMistaken: 0
                };
            }
        });
    });
}

/**
 * Load saved data from localStorage
 */
export function loadData(): void {
    try {
        const savedWords = localStorage.getItem(STORAGE_KEY);
        if (savedWords) {
            wordState = JSON.parse(savedWords);
        }

        const savedStats = localStorage.getItem(STATS_KEY);
        if (savedStats) {
            playerStats = { ...playerStats, ...JSON.parse(savedStats) };
        }

        initWordState();
        updateDailyStreak();
    } catch (e) {
        console.warn('Could not load data:', e);
        initWordState();
    }
}

/**
 * Save data to localStorage
 */
export function saveData(): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wordState));
        localStorage.setItem(STATS_KEY, JSON.stringify(playerStats));
    } catch (e) {
        console.warn('Could not save data:', e);
    }
}

/**
 * Update daily streak
 */
function updateDailyStreak(): void {
    const today = getToday();
    const lastPlayed = playerStats.lastPlayedDate;

    if (!lastPlayed) {
        playerStats.dailyStreak = 0;
    } else if (lastPlayed === today) {
        // Already played today
    } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastPlayed !== yesterdayStr) {
            playerStats.dailyStreak = 0;
        }
    }
}

/**
 * Record that player practiced today
 */
export function recordPractice(): void {
    const today = getToday();
    if (playerStats.lastPlayedDate !== today) {
        playerStats.dailyStreak++;
        playerStats.lastPlayedDate = today;
        playerStats.totalSessions++;
        saveData();
        checkAchievements();
    }
}

/**
 * Get word's current state
 */
export function getWordState(term: string): WordState {
    return wordState[term] || { score: 0, interval: 0, nextReview: getToday(), easeFactor: 2.5, timesCorrect: 0, timesMistaken: 0 };
}

/**
 * Get word's mastery score
 */
export function getWordScore(term: string): number {
    return getWordState(term).score;
}

/**
 * Update word using SM-2 algorithm
 */
export function updateWordSRS(term: string, quality: number): void {
    const state = wordState[term];
    if (!state) return;

    state.easeFactor = Math.max(1.3, state.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    if (quality < 3) {
        state.interval = 0;
        state.score = Math.max(0, state.score - 1);
        state.timesMistaken++;
    } else {
        if (state.interval === 0) {
            state.interval = 1;
        } else if (state.interval === 1) {
            state.interval = 6;
        } else {
            state.interval = Math.round(state.interval * state.easeFactor);
        }

        if (quality >= 4) {
            state.score = Math.min(5, state.score + 1);
        }
        state.timesCorrect++;

        if (state.score >= 4 && state.timesCorrect >= 3) {
            if (!playerStats.achievements.includes(`learned_${term}`)) {
                playerStats.wordsLearned++;
            }
        }

        if (quality === 5 && state.score === 5) {
            if (!playerStats.achievements.includes(`perfect_${term}`)) {
                playerStats.perfectWords++;
            }
        }
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + state.interval);
    state.nextReview = nextDate.toISOString().split('T')[0];

    saveData();
}

// Extended word type for practice
export interface PracticeWord extends Word, Partial<WordState> { }

/**
 * Get all lessons
 */
export function getLessons(): Lesson[] {
    return LESSONS;
}

/**
 * Get current lesson
 */
export function getCurrentLesson(): Lesson {
    return LESSONS.find(l => l.id === playerStats.currentLessonId) || LESSONS[0];
}

/**
 * Set current lesson
 */
export function setCurrentLesson(lessonId: number): void {
    playerStats.currentLessonId = lessonId;
    saveData();
}

/**
 * Get lesson progress (0-1)
 */
export function getLessonProgress(lessonId: number): number {
    const lesson = LESSONS.find(l => l.id === lessonId);
    if (!lesson) return 0;

    let totalScore = 0;
    lesson.phrases.forEach(phrase => {
        totalScore += getWordScore(phrase.term);
    });

    return totalScore / (lesson.phrases.length * 5); // Max score is 5 per phrase
}

/**
 * Get words for practice from current lesson
 */
export function getWordsForPractice(): PracticeWord[] {
    const lesson = getCurrentLesson();
    const today = getToday();
    const dueWords: PracticeWord[] = [];
    const newWords: PracticeWord[] = [];

    lesson.phrases.forEach((phrase, index) => {
        const state = getWordState(phrase.term);
        const practiceWord: PracticeWord = {
            term: phrase.term,
            pinyin: phrase.pinyin,
            level: Math.ceil((index + 1) / 3),
            lessonId: lesson.id,
            ...state
        };

        if (state.nextReview <= today) {
            if (state.timesCorrect === 0) {
                newWords.push(practiceWord);
            } else {
                dueWords.push(practiceWord);
            }
        }
    });

    shuffle(dueWords);
    shuffle(newWords);

    // Allow selecting all available new words (count is limited in selectLesson)
    // const maxNewWords = 5; 
    const result = [...dueWords, ...newWords];

    // If nothing due, return weakest words
    if (result.length === 0) {
        const allWords: PracticeWord[] = lesson.phrases.map((phrase, index) => ({
            term: phrase.term,
            pinyin: phrase.pinyin,
            level: Math.ceil((index + 1) / 3),
            lessonId: lesson.id,
            ...getWordState(phrase.term)
        }));
        allWords.sort((a, b) => (a.score || 0) - (b.score || 0));
        return allWords.slice(0, 6);
    }

    return result;
}

/**
 * Get unmastered words from selected lessons (score < 5)
 */
export function getUnmasteredWords(lessonIds: number[]): PracticeWord[] {
    const result: PracticeWord[] = [];

    lessonIds.forEach(lessonId => {
        const lesson = LESSONS.find(l => l.id === lessonId);
        if (!lesson) return;

        lesson.phrases.forEach((phrase, index) => {
            const state = getWordState(phrase.term);
            // Only include words not yet mastered (score < 5)
            if (state.score < 5) {
                result.push({
                    term: phrase.term,
                    pinyin: phrase.pinyin,
                    level: Math.ceil((index + 1) / 3),
                    lessonId: lesson.id,
                    ...state
                });
            }
        });
    });

    // Sort by score (weakest first) then shuffle within same score
    result.sort((a, b) => (a.score || 0) - (b.score || 0));

    return result;
}

/**
 * Shuffle array in place
 */
function shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

/**
 * Get player stats
 */
export function getStats(): PlayerStats {
    return { ...playerStats };
}

/**
 * Add XP and check for level up
 */
export function addXP(amount: number): number {
    playerStats.totalXP += amount;
    saveData();
    checkAchievements();
    return playerStats.totalXP;
}

/**
 * Get player level from XP
 */
export function getLevel(): number {
    return Math.floor(Math.sqrt(playerStats.totalXP / 100)) + 1;
}

/**
 * Get XP needed for next level
 */
export function getXPForNextLevel(): number {
    const level = getLevel();
    return level * level * 100;
}

/**
 * Get XP progress to next level (0-1)
 */
export function getLevelProgress(): number {
    const currentLevel = getLevel();
    const currentLevelXP = (currentLevel - 1) * (currentLevel - 1) * 100;
    const nextLevelXP = currentLevel * currentLevel * 100;
    return (playerStats.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP);
}

// Achievement definitions
const ACHIEVEMENTS: Achievement[] = [
    { id: 'first_word', name: '第一步', desc: '完成第一个词语', icon: '🎯', check: () => playerStats.totalSessions >= 1 },
    { id: 'streak_3', name: '连续三天', desc: '连续练习三天', icon: '🔥', check: () => playerStats.dailyStreak >= 3 },
    { id: 'streak_7', name: '一周勇士', desc: '连续练习七天', icon: '⚔️', check: () => playerStats.dailyStreak >= 7 },
    { id: 'streak_30', name: '月度大师', desc: '连续练习三十天', icon: '👑', check: () => playerStats.dailyStreak >= 30 },
    { id: 'level_5', name: '初学者', desc: '达到等级 5', icon: '⭐', check: () => getLevel() >= 5 },
    { id: 'level_10', name: '学习者', desc: '达到等级 10', icon: '🌟', check: () => getLevel() >= 10 },
    { id: 'learned_10', name: '词汇新手', desc: '学会 10 个词语', icon: '📚', check: () => playerStats.wordsLearned >= 10 },
    { id: 'learned_50', name: '词汇达人', desc: '学会 50 个词语', icon: '📖', check: () => playerStats.wordsLearned >= 50 },
    { id: 'learned_all', name: '词汇大师', desc: '学会所有 135 个词语', icon: '🏆', check: () => playerStats.wordsLearned >= 135 },
    { id: 'perfect_10', name: '完美主义', desc: '完美完成 10 个词语', icon: '💎', check: () => playerStats.perfectWords >= 10 },
    { id: 'xp_1000', name: '千分达人', desc: '获得 1000 经验', icon: '🎮', check: () => playerStats.totalXP >= 1000 },
    {
        id: 'lesson_complete', name: '完成一课', desc: '完成一课的所有词语', icon: '📝', check: () => {
            return LESSONS.some(lesson => getLessonProgress(lesson.id) >= 0.8);
        }
    },
];

/**
 * Check and unlock achievements
 */
export function checkAchievements(): Achievement[] {
    const newAchievements: Achievement[] = [];

    ACHIEVEMENTS.forEach(ach => {
        if (!playerStats.achievements.includes(ach.id) && ach.check()) {
            playerStats.achievements.push(ach.id);
            newAchievements.push(ach);
        }
    });

    if (newAchievements.length > 0) {
        saveData();
    }

    return newAchievements;
}

/**
 * Get all achievements with unlock status
 */
export function getAchievements(): (Achievement & { unlocked: boolean })[] {
    return ACHIEVEMENTS.map(ach => ({
        ...ach,
        unlocked: playerStats.achievements.includes(ach.id)
    }));
}

/**
 * Legacy compatibility
 */
export function loadScores(): void { loadData(); }
export function updateWordScore(term: string, delta: number): void {
    const quality = delta > 0 ? (delta >= 2 ? 5 : 4) : 2;
    updateWordSRS(term, quality);
}
