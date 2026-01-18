/**
 * Appearance Shop Items
 * Cosmetic items: stroke effects, ink colors, themes
 */

import type { ShopItem } from '../../types';

export const appearanceItems: ShopItem[] = [
    // ===== Stroke Effects =====
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
        icon: '⚡',
        data: { effect: 'neon' }
    },

    // ===== Ink Colors =====
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

    // ===== Card Themes =====
    {
        id: 'theme-silk',
        name: '绸缎主题',
        description: '华丽的丝绸质感背景',
        price: 120,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🎨',
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

    // ===== More Stroke Effects =====
    {
        id: 'stroke-glow',
        name: '光晕笔迹',
        description: '书写时散发柔和光晕',
        price: 65,
        type: 'cosmetic',
        category: 'appearance',
        icon: '✨',
        data: { effect: 'glow' }
    },
    {
        id: 'stroke-watercolor',
        name: '水彩笔迹',
        description: '水彩晕染效果',
        price: 75,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🎨',
        data: { effect: 'watercolor' }
    },
    {
        id: 'stroke-calligraphy',
        name: '书法笔迹',
        description: '传统书法飞白效果',
        price: 85,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🖌️',
        data: { effect: 'calligraphy' }
    },
    {
        id: 'stroke-shadow',
        name: '阴影笔迹',
        description: '3D立体阴影效果',
        price: 70,
        type: 'cosmetic',
        category: 'appearance',
        icon: '✨',
        data: { effect: 'shadow' }
    },
    {
        id: 'stroke-fire',
        name: '火焰笔迹',
        description: '燃烧火焰动态效果',
        price: 90,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🔥',
        data: { effect: 'fire' }
    },
    {
        id: 'stroke-ice',
        name: '冰霜笔迹',
        description: '冰晶闪烁效果',
        price: 85,
        type: 'cosmetic',
        category: 'appearance',
        icon: '❄️',
        data: { effect: 'ice' }
    },
    {
        id: 'stroke-laser',
        name: '激光笔迹',
        description: '科幻激光轨迹',
        price: 95,
        type: 'cosmetic',
        category: 'appearance',
        icon: '⚡',
        data: { effect: 'laser' }
    },
    {
        id: 'stroke-smoke',
        name: '烟雾笔迹',
        description: '烟雾缭绕效果',
        price: 80,
        type: 'cosmetic',
        category: 'appearance',
        icon: '💨',
        data: { effect: 'smoke' }
    },
    {
        id: 'stroke-lightning',
        name: '闪电笔迹',
        description: '电光火石效果',
        price: 100,
        type: 'cosmetic',
        category: 'appearance',
        icon: '⚡',
        data: { effect: 'lightning' }
    },
    {
        id: 'stroke-galaxy',
        name: '星河笔迹',
        description: '星空银河效果',
        price: 110,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🌌',
        data: { effect: 'galaxy' }
    },

    // ===== More Ink Colors =====
    {
        id: 'ink-silver',
        name: '银墨',
        description: '闪耀银色墨水',
        price: 100,
        type: 'cosmetic',
        category: 'appearance',
        icon: '⚪',
        data: { color: '#C0C0C0' }
    },
    {
        id: 'ink-bronze',
        name: '青铜墨',
        description: '古朴青铜色墨水',
        price: 95,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🟤',
        data: { color: '#CD7F32' }
    },
    {
        id: 'ink-sapphire',
        name: '蓝宝石墨',
        description: '深邃蓝宝石色',
        price: 110,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🔵',
        data: { color: '#0F52BA' }
    },
    {
        id: 'ink-emerald',
        name: '祖母绿墨',
        description: '华贵祖母绿色',
        price: 105,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🟢',
        data: { color: '#50C878' }
    },
    {
        id: 'ink-coral',
        name: '珊瑚墨',
        description: '温暖珊瑚粉色',
        price: 90,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🔴',
        data: { color: '#FF7F50' }
    },
    {
        id: 'ink-amber',
        name: '琥珀墨',
        description: '温润琥珀金色',
        price: 95,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🟠',
        data: { color: '#FFBF00' }
    },
    {
        id: 'ink-rose',
        name: '玫瑰墨',
        description: '浪漫玫瑰红色',
        price: 85,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🌹',
        data: { color: '#FF007F' }
    },
    {
        id: 'ink-indigo',
        name: '靛青墨',
        description: '传统靛青色',
        price: 90,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🔵',
        data: { color: '#4B0082' }
    },
    {
        id: 'ink-turquoise',
        name: '松石墨',
        description: '清新松石绿色',
        price: 85,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🟢',
        data: { color: '#40E0D0' }
    },
    {
        id: 'ink-peach',
        name: '桃花墨',
        description: '娇嫩桃花粉色',
        price: 80,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🌸',
        data: { color: '#FFB6C1' }
    },

    // ===== More Themes =====
    {
        id: 'theme-mountain',
        name: '山水主题',
        description: '水墨山水意境背景',
        price: 140,
        type: 'cosmetic',
        category: 'appearance',
        icon: '⛰️',
        data: { theme: 'mountain' }
    },
    {
        id: 'theme-ocean',
        name: '海洋主题',
        description: '蔚蓝海洋波纹背景',
        price: 135,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🌊',
        data: { theme: 'ocean' }
    },
    {
        id: 'theme-cloud',
        name: '云纹主题',
        description: '祥云瑞气装饰背景',
        price: 125,
        type: 'cosmetic',
        category: 'appearance',
        icon: '☁️',
        data: { theme: 'cloud' }
    },
    {
        id: 'theme-moon',
        name: '月夜主题',
        description: '月光如水夜色背景',
        price: 145,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🌙',
        data: { theme: 'moon' }
    },
    {
        id: 'theme-plum',
        name: '梅花主题',
        description: '傲雪梅花装饰背景',
        price: 130,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🌺',
        data: { theme: 'plum' }
    },
    {
        id: 'theme-orchid',
        name: '兰花主题',
        description: '幽兰清香装饰背景',
        price: 130,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🌸',
        data: { theme: 'orchid' }
    },
    {
        id: 'theme-chrysanthemum',
        name: '菊花主题',
        description: '高洁菊花装饰背景',
        price: 130,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🌼',
        data: { theme: 'chrysanthemum' }
    },
    {
        id: 'theme-peony',
        name: '牡丹主题',
        description: '国色天香牡丹背景',
        price: 150,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🌺',
        data: { theme: 'peony' }
    },
    {
        id: 'theme-imperial',
        name: '皇家主题',
        description: '金碧辉煌宫廷背景',
        price: 180,
        type: 'cosmetic',
        category: 'appearance',
        icon: '👑',
        data: { theme: 'imperial' }
    },
    {
        id: 'theme-scholarly',
        name: '书香主题',
        description: '古典书房意境背景',
        price: 160,
        type: 'cosmetic',
        category: 'appearance',
        icon: '📚',
        data: { theme: 'scholarly' }
    },

    // ===== Writing Styles =====
    {
        id: 'style-kaishu',
        name: '楷书风格',
        description: '规范楷书字体风格',
        price: 100,
        type: 'cosmetic',
        category: 'appearance',
        icon: '📝',
        data: { style: 'kaishu' }
    },
    {
        id: 'style-xingshu',
        name: '行书风格',
        description: '流畅行书字体风格',
        price: 120,
        type: 'cosmetic',
        category: 'appearance',
        icon: '✍️',
        data: { style: 'xingshu' }
    },
    {
        id: 'style-caoshu',
        name: '草书风格',
        description: '潇洒草书字体风格',
        price: 140,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🖊️',
        data: { style: 'caoshu' }
    },
    {
        id: 'style-lishu',
        name: '隶书风格',
        description: '古朴隶书字体风格',
        price: 130,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🖋️',
        data: { style: 'lishu' }
    },
    {
        id: 'style-zhuanshu',
        name: '篆书风格',
        description: '古雅篆书字体风格',
        price: 150,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🖌️',
        data: { style: 'zhuanshu' }
    },

    // ===== Paper Textures =====
    {
        id: 'paper-rice',
        name: '宣纸质感',
        description: '传统宣纸纹理',
        price: 80,
        type: 'cosmetic',
        category: 'appearance',
        icon: '📄',
        data: { texture: 'rice' }
    },
    {
        id: 'paper-parchment',
        name: '羊皮纸质感',
        description: '古典羊皮纸纹理',
        price: 85,
        type: 'cosmetic',
        category: 'appearance',
        icon: '📜',
        data: { texture: 'parchment' }
    },
    {
        id: 'paper-silk',
        name: '绢本质感',
        description: '丝绸绢本纹理',
        price: 90,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🎀',
        data: { texture: 'silk' }
    },
    {
        id: 'paper-aged',
        name: '古籍质感',
        description: '泛黄古书纹理',
        price: 75,
        type: 'cosmetic',
        category: 'appearance',
        icon: '📖',
        data: { texture: 'aged' }
    },

    // ===== Border Decorations =====
    {
        id: 'border-classic',
        name: '古典边框',
        description: '传统纹样装饰边框',
        price: 70,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🖼️',
        data: { border: 'classic' }
    },
    {
        id: 'border-floral',
        name: '花卉边框',
        description: '花草图案装饰边框',
        price: 65,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🌿',
        data: { border: 'floral' }
    },
    {
        id: 'border-geometric',
        name: '几何边框',
        description: '几何图案装饰边框',
        price: 60,
        type: 'cosmetic',
        category: 'appearance',
        icon: '⬜',
        data: { border: 'geometric' }
    },
    {
        id: 'border-dragon',
        name: '龙纹边框',
        description: '龙纹图案装饰边框',
        price: 90,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🐉',
        data: { border: 'dragon' }
    },
    {
        id: 'border-phoenix',
        name: '凤纹边框',
        description: '凤凰图案装饰边框',
        price: 90,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🦅',
        data: { border: 'phoenix' }
    },

    // ===== Animation Effects =====
    {
        id: 'anim-fade',
        name: '渐显动画',
        description: '字符渐显出现效果',
        price: 55,
        type: 'cosmetic',
        category: 'appearance',
        icon: '✨',
        data: { animation: 'fade' }
    },
    {
        id: 'anim-bounce',
        name: '弹跳动画',
        description: '字符弹跳出现效果',
        price: 60,
        type: 'cosmetic',
        category: 'appearance',
        icon: '⬆️',
        data: { animation: 'bounce' }
    },
    {
        id: 'anim-slide',
        name: '滑入动画',
        description: '字符滑动进入效果',
        price: 55,
        type: 'cosmetic',
        category: 'appearance',
        icon: '➡️',
        data: { animation: 'slide' }
    },
    {
        id: 'anim-rotate',
        name: '旋转动画',
        description: '字符旋转出现效果',
        price: 65,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🔄',
        data: { animation: 'rotate' }
    },
    {
        id: 'anim-scale',
        name: '缩放动画',
        description: '字符放大出现效果',
        price: 60,
        type: 'cosmetic',
        category: 'appearance',
        icon: '🔍',
        data: { animation: 'scale' }
    },
];
