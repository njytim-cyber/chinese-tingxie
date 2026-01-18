/**
 * Shop Items Database
 * Defines all purchasable items in the shop
 */

import type { ShopItem } from '../types';

// Re-export ShopItem type for convenience
export type { ShopItem } from '../types';

/**
 * All available shop items
 */
export const SHOP_ITEMS: ShopItem[] = [
    // ===== APPEARANCE - Stroke Effects =====
    {
        id: 'stroke-sparkle',
        name: '星光笔迹',
        description: '书写时留下闪烁的星光轨迹',
        price: 50,
        type: 'cosmetic',
        category: 'appearance',
        icon: '✨',
        data: { effect: 'sparkle' }
    },
    {
        id: 'stroke-rainbow',
        name: '彩虹笔迹',
        description: '书写时展现七彩渐变效果',
        price: 80,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🌈',
        data: { effect: 'rainbow' }
    },
    {
        id: 'stroke-brush',
        name: '毛笔效果',
        description: '传统毛笔书法质感',
        price: 60,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🖌️',
        data: { effect: 'brush' }
    },
    {
        id: 'stroke-neon',
        name: '霓虹笔迹',
        description: '现代霓虹灯光效果',
        price: 70,
        type: 'cosmetic',
        category: 'appearance',
        icon: '💫',
        data: { effect: 'neon' }
    },

    // ===== APPEARANCE - Ink Colors =====
    {
        id: 'ink-gold',
        name: '金墨',
        description: '使用金色墨水书写',
        price: 100,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🟡',
        data: { color: '#D4AF37' }
    },
    {
        id: 'ink-jade',
        name: '翡翠墨',
        description: '清雅的翡翠绿墨水',
        price: 90,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🟢',
        data: { color: '#48BB78' }
    },
    {
        id: 'ink-crimson',
        name: '朱砂墨',
        description: '传统朱砂红墨水',
        price: 90,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🔴',
        data: { color: '#DC143C' }
    },
    {
        id: 'ink-purple',
        name: '紫薇墨',
        description: '高贵的紫色墨水',
        price: 95,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🟣',
        data: { color: '#9333EA' }
    },

    // ===== APPEARANCE - Card Themes =====
    {
        id: 'theme-silk',
        name: '绸缎主题',
        description: '华丽的丝绸质感背景',
        price: 120,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🎀',
        data: { theme: 'silk' }
    },
    {
        id: 'theme-bamboo',
        name: '竹简主题',
        description: '古典竹简风格背景',
        price: 150,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🎋',
        data: { theme: 'bamboo' }
    },
    {
        id: 'theme-lotus',
        name: '莲花主题',
        description: '清雅莲花装饰背景',
        price: 130,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🪷',
        data: { theme: 'lotus' }
    },

    // ===== POWER-UPS - Consumables =====
    {
        id: 'hint-token',
        name: '提示符',
        description: '获得一次笔画提示（消耗品）',
        price: 10,
        type: 'consumable',
        category: 'powerup',
        icon: '💡',
        stackable: true,
        data: { uses: 1 }
    },
    {
        id: 'hint-pack-5',
        name: '提示包（5个）',
        description: '5个笔画提示符（优惠装）',
        price: 40,
        type: 'consumable',
        category: 'powerup',
        icon: '💡',
        stackable: true,
        data: { uses: 5 }
    },
    {
        id: 'xp-boost',
        name: '学习加速',
        description: '下一场练习获得双倍经验（消耗品）',
        price: 30,
        type: 'consumable',
        category: 'powerup',
        icon: '⚡',
        stackable: true,
        data: { multiplier: 2, duration: 1 }
    },
    {
        id: 'xp-boost-3',
        name: '学习加速（3场）',
        description: '3场练习获得双倍经验（优惠装）',
        price: 75,
        type: 'consumable',
        category: 'powerup',
        icon: '⚡',
        stackable: true,
        data: { multiplier: 2, duration: 3 }
    },
    {
        id: 'quality-shield',
        name: '品质护盾',
        description: '下一场练习错误不降低质量评分（消耗品）',
        price: 25,
        type: 'consumable',
        category: 'powerup',
        icon: '🛡️',
        stackable: true,
        data: { duration: 1 }
    },
    {
        id: 'perfect-insurance',
        name: '完美保险',
        description: '下一场练习自动修正第一个错误（消耗品）',
        price: 35,
        type: 'consumable',
        category: 'powerup',
        icon: '🌟',
        stackable: true,
        data: { duration: 1 }
    },

    // ===== TOOLS - Permanent Features =====
    {
        id: 'custom-wordlist',
        name: '自定义词单',
        description: '解锁自定义词单功能，创建专属练习内容',
        price: 200,
        type: 'permanent',
        category: 'tool',
        icon: '📝',
        data: { feature: 'custom-wordlist' }
    },
    {
        id: 'advanced-stats',
        name: '高级统计',
        description: '解锁详细数据分析和学习曲线图表',
        price: 150,
        type: 'permanent',
        category: 'tool',
        icon: '📊',
        data: { feature: 'advanced-stats' }
    },
    {
        id: 'simplified-toggle',
        name: '简繁切换',
        description: '自由切换简体/繁体字显示',
        price: 100,
        type: 'permanent',
        category: 'tool',
        icon: '🔄',
        data: { feature: 'simplified-toggle' }
    },
    {
        id: 'shuffle-mode',
        name: '随机模式',
        description: '解锁完全随机练习顺序',
        price: 80,
        type: 'permanent',
        category: 'tool',
        icon: '🔀',
        data: { feature: 'shuffle-mode' }
    },
    {
        id: 'night-mode',
        name: '夜间模式',
        description: '护眼深色主题（含时间自动切换）',
        price: 120,
        type: 'permanent',
        category: 'tool',
        icon: '🌙',
        data: { feature: 'night-mode' }
    },

    // ===== CONTENT - Unlockables =====
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
        icon: '📕',
        data: { setId: 'E' }
    },
    {
        id: 'idiom-pack',
        name: '成语专辑',
        description: '50个常用成语专项练习',
        price: 180,
        type: 'content',
        category: 'content',
        icon: '🎓',
        data: { contentType: 'idioms' }
    },
    {
        id: 'poetry-pack',
        name: '诗词专辑',
        description: '经典唐诗宋词默写集',
        price: 200,
        type: 'content',
        category: 'content',
        icon: '📜',
        data: { contentType: 'poetry' }
    },
];

/**
 * Get items by category
 */
export function getItemsByCategory(category: string): ShopItem[] {
    if (category === 'all') return SHOP_ITEMS;
    return SHOP_ITEMS.filter(item => item.category === category);
}

/**
 * Get item by ID
 */
export function getItemById(id: string): ShopItem | undefined {
    return SHOP_ITEMS.find(item => item.id === id);
}

/**
 * Get all categories with item counts
 */
export function getCategories(): { id: string; name: string; count: number }[] {
    return [
        {
            id: 'all',
            name: '全部',
            count: SHOP_ITEMS.length
        },
        {
            id: 'appearance',
            name: '外观',
            count: SHOP_ITEMS.filter(i => i.category === 'appearance').length
        },
        {
            id: 'powerup',
            name: '道具',
            count: SHOP_ITEMS.filter(i => i.category === 'powerup').length
        },
        {
            id: 'tool',
            name: '工具',
            count: SHOP_ITEMS.filter(i => i.category === 'tool').length
        },
        {
            id: 'content',
            name: '内容',
            count: SHOP_ITEMS.filter(i => i.category === 'content').length
        }
    ];
}

/**
 * Check if player owns an item
 */
export function ownsItem(purchasedItems: string[], itemId: string): boolean {
    return purchasedItems.includes(itemId);
}

/**
 * Get item count for stackable items
 */
export function getItemCount(purchasedItems: string[], itemId: string): number {
    const item = getItemById(itemId);
    if (!item?.stackable) {
        return ownsItem(purchasedItems, itemId) ? 1 : 0;
    }
    // Count occurrences for stackable items
    return purchasedItems.filter(id => id === itemId).length;
}
