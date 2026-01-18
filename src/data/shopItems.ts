/**
 * Shop Items Database
 * Aggregates all purchasable items from category modules
 */

import type { ShopItem } from '../types';
import { appearanceItems } from './shop/appearance';
import { powerupItems } from './shop/powerups';
import { toolItems } from './shop/tools';
import { contentItems } from './shop/content';

// Re-export ShopItem type for convenience
export type { ShopItem } from '../types';

/**
 * All available shop items (150 total)
 * - Appearance: 60 items (stroke effects, ink colors, themes, styles, textures, borders, animations)
 * - Power-ups: 30 items (consumables: hints, XP boosts, shields, time extensions, bundles)
 * - Tools: 30 items (permanent features: stats, modes, customization, social)
 * - Content: 30 items (unlockable sets, packs, collections)
 */
export const SHOP_ITEMS: ShopItem[] = [
    ...appearanceItems,
    ...powerupItems,
    ...toolItems,
    ...contentItems,
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
