/**
 * Content Shop Items
 * Unlockable content: lesson sets, specialized packs, thematic collections
 */

import type { ShopItem } from '../../types';

export const contentItems: ShopItem[] = [
    // ===== Bonus Sets =====
    {
        id: 'bonus-set-d',
        name: '丁集（Set D）',
        description: '解锁额外的20篇默写内容',
        price: 250,
        type: 'content',
        category: 'content',
        icon: '📚',
        data: { setId: 'D' }
    },
    {
        id: 'bonus-set-e',
        name: '戊集（Set E）',
        description: '解锁高级难度默写内容（20篇）',
        price: 300,
        type: 'content',
        category: 'content',
        icon: '📚',
        data: { setId: 'E' }
    },
    {
        id: 'bonus-set-f',
        name: '己集（Set F）',
        description: '解锁进阶默写内容（20篇）',
        price: 280,
        type: 'content',
        category: 'content',
        icon: '📚',
        data: { setId: 'F' }
    },
    {
        id: 'bonus-set-g',
        name: '庚集（Set G）',
        description: '解锁专业级默写内容（20篇）',
        price: 320,
        type: 'content',
        category: 'content',
        icon: '📚',
        data: { setId: 'G' }
    },
    {
        id: 'bonus-set-h',
        name: '辛集（Set H）',
        description: '解锁大师级默写内容（20篇）',
        price: 350,
        type: 'content',
        category: 'content',
        icon: '📚',
        data: { setId: 'H' }
    },

    // ===== Specialized Packs =====
    {
        id: 'idiom-pack',
        name: '成语专辑',
        description: '50个常用成语专项练习',
        price: 180,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'idioms' }
    },
    {
        id: 'idiom-advanced',
        name: '成语进阶',
        description: '100个高级成语精选',
        price: 300,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'idioms-advanced' }
    },
    {
        id: 'poetry-pack',
        name: '诗词专辑',
        description: '经典唐诗宋词默写集',
        price: 200,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'poetry' }
    },
    {
        id: 'poetry-modern',
        name: '现代诗歌',
        description: '现代诗歌精选集',
        price: 220,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'poetry-modern' }
    },
    {
        id: 'classical-texts',
        name: '文言文经典',
        description: '古文观止选段',
        price: 280,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'classical' }
    },

    // ===== Thematic Collections =====
    {
        id: 'nature-vocab',
        name: '自然主题',
        description: '山川河海、花鸟虫鱼词汇',
        price: 150,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'nature' }
    },
    {
        id: 'culture-vocab',
        name: '文化主题',
        description: '传统文化、节日习俗词汇',
        price: 160,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'culture' }
    },
    {
        id: 'food-vocab',
        name: '美食主题',
        description: '中华美食、烹饪词汇',
        price: 140,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'food' }
    },
    {
        id: 'travel-vocab',
        name: '旅游主题',
        description: '地理名胜、旅行词汇',
        price: 155,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'travel' }
    },
    {
        id: 'business-vocab',
        name: '商务主题',
        description: '商务交流、职场词汇',
        price: 180,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'business' }
    },

    // ===== Grade-Level Content =====
    {
        id: 'primary-1-3',
        name: '小学低年级',
        description: '1-3年级必备字词',
        price: 200,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'grade-1-3' }
    },
    {
        id: 'primary-4-6',
        name: '小学高年级',
        description: '4-6年级必备字词',
        price: 220,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'grade-4-6' }
    },
    {
        id: 'middle-school',
        name: '初中必备',
        description: '初中语文核心字词',
        price: 250,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'middle-school' }
    },
    {
        id: 'high-school',
        name: '高中必备',
        description: '高中语文核心字词',
        price: 280,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'high-school' }
    },

    // ===== Exam Preparation =====
    {
        id: 'hsk-1-3',
        name: 'HSK 1-3级',
        description: 'HSK初级词汇全集',
        price: 240,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'hsk-1-3' }
    },
    {
        id: 'hsk-4-6',
        name: 'HSK 4-6级',
        description: 'HSK高级词汇全集',
        price: 300,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'hsk-4-6' }
    },
    {
        id: 'gaokao-prep',
        name: '高考冲刺',
        description: '高考语文必备字词',
        price: 320,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'gaokao' }
    },
    {
        id: 'ap-chinese',
        name: 'AP中文',
        description: 'AP Chinese考试词汇',
        price: 280,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'ap-chinese' }
    },

    // ===== Special Collections =====
    {
        id: 'rare-characters',
        name: '生僻字集',
        description: '常见生僻字专项',
        price: 190,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'rare-chars' }
    },
    {
        id: 'similar-chars',
        name: '形近字辨析',
        description: '易混淆字词对比',
        price: 170,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'similar-chars' }
    },
    {
        id: 'homophone-pack',
        name: '同音字辨析',
        description: '同音异形字专项',
        price: 160,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'homophones' }
    },
    {
        id: 'proverbs-pack',
        name: '谚语俗语',
        description: '常用谚语俗语集',
        price: 150,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'proverbs' }
    },
    {
        id: 'seasonal-pack',
        name: '节气主题',
        description: '二十四节气相关词汇',
        price: 140,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'seasonal' }
    },
    {
        id: 'zodiac-pack',
        name: '生肖主题',
        description: '十二生肖文化词汇',
        price: 130,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'zodiac' }
    },
    {
        id: 'master-collection',
        name: '大师典藏',
        description: '名家名篇精选合集',
        price: 400,
        type: 'content',
        category: 'content',
        icon: '🎁',
        data: { contentType: 'master-works' }
    },
];
