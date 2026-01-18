/**
 * Tool Shop Items
 * Permanent features: custom wordlists, stats, modes, settings
 */

import type { ShopItem } from '../../types';

export const toolItems: ShopItem[] = [
    // ===== Core Tools =====
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
        id: 'night-mode',
        name: '夜间模式',
        description: '护眼深色主题（含时间自动切换）',
        price: 120,
        type: 'permanent',
        category: 'tool',
        icon: '🌓',
        data: { feature: 'night-mode' }
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
        id: 'simplified-toggle',
        name: '简繁切换',
        description: '自由切换简体/繁体字显示',
        price: 100,
        type: 'permanent',
        category: 'tool',
        icon: '🔄',
        data: { feature: 'simplified-toggle' }
    },

    // ===== Advanced Features =====
    {
        id: 'export-data',
        name: '数据导出',
        description: '导出学习记录和统计数据',
        price: 180,
        type: 'permanent',
        category: 'tool',
        icon: '💾',
        data: { feature: 'export-data' }
    },
    {
        id: 'import-data',
        name: '数据导入',
        description: '导入备份数据或词单',
        price: 180,
        type: 'permanent',
        category: 'tool',
        icon: '📥',
        data: { feature: 'import-data' }
    },
    {
        id: 'cloud-sync',
        name: '云端同步',
        description: '多设备数据自动同步',
        price: 300,
        type: 'permanent',
        category: 'tool',
        icon: '☁️',
        data: { feature: 'cloud-sync' }
    },
    {
        id: 'offline-mode',
        name: '离线模式',
        description: '完整离线练习功能',
        price: 150,
        type: 'permanent',
        category: 'tool',
        icon: '📱',
        data: { feature: 'offline-mode' }
    },

    // ===== Learning Customization =====
    {
        id: 'speed-control',
        name: '速度控制',
        description: '自定义笔画演示速度',
        price: 90,
        type: 'permanent',
        category: 'tool',
        icon: '⏩',
        data: { feature: 'speed-control' }
    },
    {
        id: 'difficulty-adjust',
        name: '难度调节',
        description: '个性化难度设置',
        price: 110,
        type: 'permanent',
        category: 'tool',
        icon: '🎚️',
        data: { feature: 'difficulty-adjust' }
    },
    {
        id: 'font-selector',
        name: '字体选择',
        description: '多种书法字体可选',
        price: 140,
        type: 'permanent',
        category: 'tool',
        icon: '🖋️',
        data: { feature: 'font-selector' }
    },
    {
        id: 'audio-control',
        name: '音频控制',
        description: '自定义发音、音效设置',
        price: 70,
        type: 'permanent',
        category: 'tool',
        icon: '🔊',
        data: { feature: 'audio-control' }
    },
    {
        id: 'voice-input',
        name: '语音输入',
        description: '语音朗读字词功能',
        price: 160,
        type: 'permanent',
        category: 'tool',
        icon: '🎤',
        data: { feature: 'voice-input' }
    },

    // ===== Practice Modes =====
    {
        id: 'timed-challenge',
        name: '限时挑战',
        description: '解锁计时竞速模式',
        price: 130,
        type: 'permanent',
        category: 'tool',
        icon: '⏱️',
        data: { feature: 'timed-challenge' }
    },
    {
        id: 'zen-mode',
        name: '禅修模式',
        description: '无压力纯练习模式',
        price: 100,
        type: 'permanent',
        category: 'tool',
        icon: '🧘',
        data: { feature: 'zen-mode' }
    },
    {
        id: 'competition-mode',
        name: '竞技模式',
        description: '排行榜和竞赛功能',
        price: 200,
        type: 'permanent',
        category: 'tool',
        icon: '🏆',
        data: { feature: 'competition-mode' }
    },
    {
        id: 'review-mode',
        name: '复习模式',
        description: '智能错题复习系统',
        price: 170,
        type: 'permanent',
        category: 'tool',
        icon: '♻️',
        data: { feature: 'review-mode' }
    },
    {
        id: 'adaptive-learning',
        name: '自适应学习',
        description: '根据进度自动调整内容',
        price: 250,
        type: 'permanent',
        category: 'tool',
        icon: '🤖',
        data: { feature: 'adaptive-learning' }
    },

    // ===== Analytics & Insights =====
    {
        id: 'progress-reports',
        name: '进度报告',
        description: '每周/月度学习总结',
        price: 120,
        type: 'permanent',
        category: 'tool',
        icon: '📈',
        data: { feature: 'progress-reports' }
    },
    {
        id: 'heatmap-view',
        name: '热力图视图',
        description: '学习活动热力图',
        price: 100,
        type: 'permanent',
        category: 'tool',
        icon: '🔥',
        data: { feature: 'heatmap-view' }
    },
    {
        id: 'comparison-tools',
        name: '对比工具',
        description: '与标准笔画对比分析',
        price: 140,
        type: 'permanent',
        category: 'tool',
        icon: '⚖️',
        data: { feature: 'comparison-tools' }
    },
    {
        id: 'mastery-tracker',
        name: '精通追踪',
        description: '详细熟练度追踪系统',
        price: 160,
        type: 'permanent',
        category: 'tool',
        icon: '📍',
        data: { feature: 'mastery-tracker' }
    },

    // ===== Social & Sharing =====
    {
        id: 'achievement-share',
        name: '成就分享',
        description: '分享学习成就到社交媒体',
        price: 80,
        type: 'permanent',
        category: 'tool',
        icon: '📤',
        data: { feature: 'achievement-share' }
    },
    {
        id: 'study-groups',
        name: '学习小组',
        description: '创建和加入学习小组',
        price: 220,
        type: 'permanent',
        category: 'tool',
        icon: '👥',
        data: { feature: 'study-groups' }
    },
    {
        id: 'friend-challenge',
        name: '好友挑战',
        description: '向好友发起学习挑战',
        price: 150,
        type: 'permanent',
        category: 'tool',
        icon: '🤝',
        data: { feature: 'friend-challenge' }
    },

    // ===== Premium Features =====
    {
        id: 'annotation-tool',
        name: '标注工具',
        description: '为字词添加个人笔记',
        price: 110,
        type: 'permanent',
        category: 'tool',
        icon: '✏️',
        data: { feature: 'annotation-tool' }
    },
    {
        id: 'bookmark-system',
        name: '书签系统',
        description: '收藏和管理重点字词',
        price: 90,
        type: 'permanent',
        category: 'tool',
        icon: '🔖',
        data: { feature: 'bookmark-system' }
    },
    {
        id: 'learning-path',
        name: '学习路径',
        description: '个性化学习计划制定',
        price: 280,
        type: 'permanent',
        category: 'tool',
        icon: '🗺️',
        data: { feature: 'learning-path' }
    },
    {
        id: 'ai-tutor',
        name: 'AI导师',
        description: '智能学习建议和指导',
        price: 350,
        type: 'permanent',
        category: 'tool',
        icon: '🎓',
        data: { feature: 'ai-tutor' }
    },
];
