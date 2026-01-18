/**
 * Power-up Shop Items
 * Consumable items: hints, XP boosts, shields, time extensions
 */

import type { ShopItem } from '../../types';

export const powerupItems: ShopItem[] = [
    // ===== Hint Tokens =====
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
        icon: '📦',
        stackable: true,
        data: { uses: 5 }
    },
    {
        id: 'hint-pack-10',
        name: '提示包（10个）',
        description: '10个笔画提示符（超值装）',
        price: 70,
        type: 'consumable',
        category: 'powerup',
        icon: '📦',
        stackable: true,
        data: { uses: 10 }
    },

    // ===== XP Boosts =====
    {
        id: 'xp-boost',
        name: '学习加速',
        description: '下一场练习获得双倍经验（消耗品）',
        price: 30,
        type: 'consumable',
        category: 'powerup',
        icon: '⏫',
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
        icon: '⏫',
        stackable: true,
        data: { multiplier: 2, duration: 3 }
    },
    {
        id: 'xp-boost-5',
        name: '学习加速（5场）',
        description: '5场练习获得双倍经验（超值装）',
        price: 120,
        type: 'consumable',
        category: 'powerup',
        icon: '⏫',
        stackable: true,
        data: { multiplier: 2, duration: 5 }
    },
    {
        id: 'xp-boost-triple',
        name: '学习冲刺',
        description: '下一场练习获得三倍经验（消耗品）',
        price: 50,
        type: 'consumable',
        category: 'powerup',
        icon: '⏫',
        stackable: true,
        data: { multiplier: 3, duration: 1 }
    },

    // ===== Shields and Protection =====
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
        id: 'quality-shield-3',
        name: '品质护盾（3场）',
        description: '3场练习保护品质评分（优惠装）',
        price: 60,
        type: 'consumable',
        category: 'powerup',
        icon: '🛡️',
        stackable: true,
        data: { duration: 3 }
    },
    {
        id: 'perfect-insurance',
        name: '完美保险',
        description: '下一场练习自动修正第一个错误（消耗品）',
        price: 35,
        type: 'consumable',
        category: 'powerup',
        icon: '✅',
        stackable: true,
        data: { duration: 1 }
    },
    {
        id: 'perfect-insurance-3',
        name: '完美保险（3场）',
        description: '3场练习自动修正第一个错误（优惠装）',
        price: 90,
        type: 'consumable',
        category: 'powerup',
        icon: '✅',
        stackable: true,
        data: { duration: 3 }
    },
    {
        id: 'streak-saver',
        name: '连击守护',
        description: '保护一次连击不中断（消耗品）',
        price: 40,
        type: 'consumable',
        category: 'powerup',
        icon: '🛡️',
        stackable: true,
        data: { duration: 1 }
    },

    // ===== Time and Convenience =====
    {
        id: 'time-extension',
        name: '时间延长',
        description: '下一场练习额外30秒时间（消耗品）',
        price: 20,
        type: 'consumable',
        category: 'powerup',
        icon: '⏱️',
        stackable: true,
        data: { extraTime: 30 }
    },
    {
        id: 'time-extension-60',
        name: '时间延长（60秒）',
        description: '下一场练习额外60秒时间（消耗品）',
        price: 35,
        type: 'consumable',
        category: 'powerup',
        icon: '⏱️',
        stackable: true,
        data: { extraTime: 60 }
    },
    {
        id: 'skip-token',
        name: '跳过符',
        description: '跳过一个难字（消耗品）',
        price: 15,
        type: 'consumable',
        category: 'powerup',
        icon: '⏭️',
        stackable: true,
        data: { uses: 1 }
    },
    {
        id: 'undo-token',
        name: '撤销符',
        description: '撤销上一个错误笔画（消耗品）',
        price: 12,
        type: 'consumable',
        category: 'powerup',
        icon: '↩️',
        stackable: true,
        data: { uses: 1 }
    },

    // ===== Advanced Boosts =====
    {
        id: 'combo-booster',
        name: '连击加速',
        description: '下一场练习连击奖励翻倍（消耗品）',
        price: 45,
        type: 'consumable',
        category: 'powerup',
        icon: '🔥',
        stackable: true,
        data: { duration: 1 }
    },
    {
        id: 'auto-complete',
        name: '自动完成',
        description: '自动完成一个字（消耗品）',
        price: 25,
        type: 'consumable',
        category: 'powerup',
        icon: '🎯',
        stackable: true,
        data: { uses: 1 }
    },
    {
        id: 'reveal-pinyin',
        name: '拼音显示',
        description: '下一场练习显示拼音提示（消耗品）',
        price: 18,
        type: 'consumable',
        category: 'powerup',
        icon: '🔤',
        stackable: true,
        data: { duration: 1 }
    },
    {
        id: 'slow-motion',
        name: '慢动作演示',
        description: '笔画演示速度减半（消耗品）',
        price: 22,
        type: 'consumable',
        category: 'powerup',
        icon: '🐌',
        stackable: true,
        data: { duration: 1 }
    },

    // ===== Mega Packs =====
    {
        id: 'starter-pack',
        name: '新手礼包',
        description: '5提示+3加速+2护盾（超值组合）',
        price: 100,
        type: 'consumable',
        category: 'powerup',
        icon: '🎁',
        stackable: true,
        data: { bundle: true }
    },
    {
        id: 'power-pack',
        name: '能量礼包',
        description: '10提示+5加速+5护盾（豪华组合）',
        price: 180,
        type: 'consumable',
        category: 'powerup',
        icon: '🎁',
        stackable: true,
        data: { bundle: true }
    },
    {
        id: 'ultimate-pack',
        name: '至尊礼包',
        description: '20提示+10加速+10护盾（终极组合）',
        price: 320,
        type: 'consumable',
        category: 'powerup',
        icon: '🎁',
        stackable: true,
        data: { bundle: true }
    },
    {
        id: 'lucky-box',
        name: '幸运宝箱',
        description: '随机获得3-5个道具（惊喜盲盒）',
        price: 50,
        type: 'consumable',
        category: 'powerup',
        icon: '🎁',
        stackable: true,
        data: { random: true }
    },

    // ===== Special Boosters =====
    {
        id: 'mastery-boost',
        name: '精通加速',
        description: '下一场练习字符熟练度提升翻倍（消耗品）',
        price: 55,
        type: 'consumable',
        category: 'powerup',
        icon: '📈',
        stackable: true,
        data: { duration: 1 }
    },
    {
        id: 'yuanbao-boost',
        name: '元宝加成',
        description: '下一场练习元宝奖励翻倍（消耗品）',
        price: 40,
        type: 'consumable',
        category: 'powerup',
        icon: '💰',
        stackable: true,
        data: { duration: 1 }
    },
    {
        id: 'double-reward',
        name: '双倍奖励',
        description: '下一场练习所有奖励翻倍（消耗品）',
        price: 80,
        type: 'consumable',
        category: 'powerup',
        icon: '💎',
        stackable: true,
        data: { duration: 1 }
    },
    {
        id: 'fortune-charm',
        name: '幸运符',
        description: '下一场练习提升掉落概率（消耗品）',
        price: 30,
        type: 'consumable',
        category: 'powerup',
        icon: '🍀',
        stackable: true,
        data: { duration: 1 }
    },
    {
        id: 'practice-marathon',
        name: '练习马拉松',
        description: '连续5场练习小幅XP加成（消耗品）',
        price: 90,
        type: 'consumable',
        category: 'powerup',
        icon: '🏃',
        stackable: true,
        data: { duration: 5, multiplier: 1.2 }
    },
    {
        id: 'perfectionist',
        name: '完美主义者',
        description: '下一场练习达到完美评分获得额外奖励（消耗品）',
        price: 60,
        type: 'consumable',
        category: 'powerup',
        icon: '⭐',
        stackable: true,
        data: { duration: 1 }
    },
];
