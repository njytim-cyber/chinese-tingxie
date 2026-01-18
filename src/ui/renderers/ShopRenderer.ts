/**
 * Shop Renderer
 * Renders the shop screen with categories and purchasable items
 */

import type { IUIManager } from '../../types';
import { getYuanbaoBalance, purchaseItem, ownsItem, getItemCount } from '../../data/manager';
import { getCategories, getItemsByCategory, type ShopItem } from '../../data/shopItems';
import { TabbedNav } from '../components/TabbedNav';

export class ShopRenderer {
    private manager: IUIManager;
    private tabbedNav: TabbedNav | null = null;
    private currentCategory: string = 'all';

    constructor(manager: IUIManager) {
        this.manager = manager;
    }

    /**
     * Update header to show only yuanbao
     */
    private updateShopHeaderStats(): void {
        const yuanbao = getYuanbaoBalance();
        const headerStats = document.getElementById('header-stats');
        if (headerStats) {
            headerStats.innerHTML = `
                <span class="stat-pill">
                    <svg viewBox="0 0 24 24" width="22" height="22" style="vertical-align: middle; margin-right: 2px; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.2));">
                        <defs>
                            <linearGradient id="y-body-shop" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#B45309"/>
                                <stop offset="50%" stop-color="#fbbf24"/>
                                <stop offset="100%" stop-color="#B45309"/>
                            </linearGradient>
                            <linearGradient id="y-top-shop" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stop-color="#FEF3C7"/>
                                <stop offset="100%" stop-color="#F59E0B"/>
                            </linearGradient>
                        </defs>
                        <path d="M7,11.5 A5,4 0 0,1 17,11.5" fill="url(#y-top-shop)"/>
                        <path d="M2,11.5 Q12,14.5 22,11.5 Q21,19.5 12,19.5 Q3,19.5 2,11.5 Z" fill="url(#y-body-shop)"/>
                    </svg>
                    ${yuanbao}
                </span>
            `;
        }
    }

    /**
     * Show shop screen
     */
    show(): void {
        console.log('ShopRenderer.show started');
        try {
            this.manager.updateHeaderTitle('商店');
            this.manager.toggleMainHeader(true);
            this.manager.toggleBackBtn(false);
            this.manager.toggleHeaderStats(true);

            // Show only yuanbao in header
            this.updateShopHeaderStats();

            // Create tabbed navigation for categories
            const categories = getCategories();
            this.tabbedNav = new TabbedNav({
                tabs: categories.map(cat => ({
                    id: cat.id,
                    label: `${cat.name} (${cat.count})`
                })),
                initialTab: 'all',
                onTabChange: (categoryId) => this.renderItemsForCategory(categoryId)
            });

            this.manager.transitionView(() => {
                try {
                    const app = document.querySelector('.game-stage') as HTMLElement;
                    if (app) {
                        app.innerHTML = '';
                        app.classList.remove('hidden');
                        app.style.display = 'flex';

                        this.manager.toggleActiveGameUI(false);

                        if (this.tabbedNav) {
                            app.appendChild(this.tabbedNav.getElement());
                            // Render initial category
                            this.renderItemsForCategory('all');
                        }
                    } else {
                        console.error('Game stage not found!');
                    }

                    // Update header to show yuanbao
                    this.manager.updateDashboardStats();

                    // Highlight shop tab
                    document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
                    document.getElementById('shop-btn')?.classList.add('active');
                } catch (e) {
                    console.error('Error inside transition callback:', e);
                }
            });
        } catch (e) {
            console.error('Error in ShopRenderer.show:', e);
        }
    }

    /**
     * Render items for a specific category
     */
    private renderItemsForCategory(categoryId: string): void {
        if (!this.tabbedNav) return;

        this.currentCategory = categoryId;
        const contentContainer = this.tabbedNav.getContentContainer();
        contentContainer.innerHTML = '';

        const shopContainer = document.createElement('div');
        shopContainer.className = 'shop-container';

        // Items grid (no balance header)
        const itemsGrid = document.createElement('div');
        itemsGrid.className = 'shop-items-grid';

        const items = getItemsByCategory(categoryId);

        if (items.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'shop-empty-state';
            emptyState.textContent = '暂无商品';
            itemsGrid.appendChild(emptyState);
        } else {
            items.forEach(item => {
                const itemCard = this.createItemCard(item);
                itemsGrid.appendChild(itemCard);
            });
        }

        shopContainer.appendChild(itemsGrid);
        contentContainer.appendChild(shopContainer);
    }

    /**
     * Create balance header showing current yuanbao
     */
    private createBalanceHeader(): HTMLElement {
        const header = document.createElement('div');
        header.className = 'shop-balance-header';

        const balance = getYuanbaoBalance();

        header.innerHTML = `
            <div class="balance-display">
                <svg viewBox="0 0 24 24" width="20" height="20" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.15));">
                    <defs>
                        <linearGradient id="shop-ingot-body" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stop-color="#B45309"/>
                            <stop offset="50%" stop-color="#fbbf24"/>
                            <stop offset="100%" stop-color="#B45309"/>
                        </linearGradient>
                        <linearGradient id="shop-ingot-top" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stop-color="#FEF3C7"/>
                            <stop offset="100%" stop-color="#F59E0B"/>
                        </linearGradient>
                    </defs>
                    <path d="M7,11.5 A5,4 0 0,1 17,11.5" fill="url(#shop-ingot-top)"/>
                    <path d="M2,11.5 Q12,14.5 22,11.5 Q21,19.5 12,19.5 Q3,19.5 2,11.5 Z" fill="url(#shop-ingot-body)"/>
                </svg>
                <span class="balance-amount">${balance}</span>
                <span class="balance-label">元宝余额</span>
            </div>
        `;

        return header;
    }

    /**
     * Get SVG icon for item
     */
    private getItemIcon(item: ShopItem): string {
        // Map emoji icons to SVG equivalents
        const iconMap: Record<string, string> = {
            // Stroke effects
            '✨': `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2l2 7h7l-6 5 2 7-5-4-5 4 2-7-6-5h7z" fill="url(#sparkle-${item.id})"/><defs><linearGradient id="sparkle-${item.id}"><stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#f59e0b"/></linearGradient></defs></svg>`,
            '🌈': `<svg viewBox="0 0 24 24" fill="none"><path d="M3 17c0-7 6-13 9-13s9 6 9 13" stroke="url(#rainbow-${item.id})" stroke-width="3" stroke-linecap="round"/><defs><linearGradient id="rainbow-${item.id}"><stop offset="0%" stop-color="#ef4444"/><stop offset="25%" stop-color="#f59e0b"/><stop offset="50%" stop-color="#10b981"/><stop offset="75%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#8b5cf6"/></linearGradient></defs></svg>`,
            '🖌️': `<svg viewBox="0 0 24 24" fill="none" stroke="#78350f" stroke-width="1.5"><path d="M3 20l5-5m0 0l7-7 4 4-7 7m-4-4L4 19l1-4zm10-10l4-4m0 0l1 1-1 1-1-1z"/><path d="M19 4l-1 1 1 1 1-1-1-1z" fill="#78350f"/></svg>`,
            '⚡': `<svg viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="url(#lightning-${item.id})"/><defs><linearGradient id="lightning-${item.id}"><stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#f59e0b"/></linearGradient></defs></svg>`,
            // Ink colors
            '🟡': `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill="url(#gold-${item.id})" stroke="#ca8a04" stroke-width="1.5"/><defs><linearGradient id="gold-${item.id}"><stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#fbbf24"/></linearGradient></defs></svg>`,
            '🟢': `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill="url(#jade-${item.id})" stroke="#059669" stroke-width="1.5"/><defs><linearGradient id="jade-${item.id}"><stop offset="0%" stop-color="#d1fae5"/><stop offset="100%" stop-color="#10b981"/></linearGradient></defs></svg>`,
            '🔴': `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill="url(#crimson-${item.id})" stroke="#991b1b" stroke-width="1.5"/><defs><linearGradient id="crimson-${item.id}"><stop offset="0%" stop-color="#fecaca"/><stop offset="100%" stop-color="#dc2626"/></linearGradient></defs></svg>`,
            '🟣': `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill="url(#purple-${item.id})" stroke="#6b21a8" stroke-width="1.5"/><defs><linearGradient id="purple-${item.id}"><stop offset="0%" stop-color="#e9d5ff"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs></svg>`,
            // Themes
            '🎨': `<svg viewBox="0 0 24 24" fill="none" stroke="#57534e" stroke-width="1.5"><circle cx="12" cy="12" r="10" fill="none"/><circle cx="8" cy="10" r="1.5" fill="#ef4444"/><circle cx="12" cy="8" r="1.5" fill="#10b981"/><circle cx="16" cy="10" r="1.5" fill="#3b82f6"/><path d="M12 12c-2 3-4 4-7 2" stroke-linecap="round"/></svg>`,
            '🎋': `<svg viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="1.5"><path d="M12 2v20M8 4c2 1 4 1 8 0M7 8c2.5 1 5.5 1 10 0M6 12c3 1 6 1 12 0" stroke-linecap="round"/></svg>`,
            '🪷': `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2c-3 4-2 8 0 10 2-2 3-6 0-10z" fill="#fda4af"/><path d="M7 8c1 3 3 5 5 6-2-2-2-5-5-6z" fill="#fb7185"/><path d="M17 8c-1 3-3 5-5 6 2-2 2-5 5-6z" fill="#fb7185"/><circle cx="12" cy="14" r="2" fill="#fbbf24"/></svg>`,
            // Power-ups
            '💡': `<svg viewBox="0 0 24 24" fill="none"><path d="M9 18h6v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2zm3-16a7 7 0 015 11.9V16H7v-2.1A7 7 0 0112 2z" fill="url(#bulb-${item.id})" stroke="#78350f" stroke-width="1"/><defs><linearGradient id="bulb-${item.id}"><stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#fbbf24"/></linearGradient></defs></svg>`,
            '📦': `<svg viewBox="0 0 24 24" fill="none"><path d="M21 8v13H3V8l9-6 9 6z" fill="#d6d3d1" stroke="#57534e" stroke-width="1.5"/><path d="M3 8l9 6 9-6M12 22V14" stroke="#57534e" stroke-width="1.5"/></svg>`,
            '⏫': `<svg viewBox="0 0 24 24" fill="none"><path d="M12 4l8 8h-5v8h-6v-8H4l8-8z" fill="url(#up-${item.id})"/><defs><linearGradient id="up-${item.id}"><stop offset="0%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient></defs></svg>`,
            '🛡️': `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5 3 9 8 10 5-1 8-5 8-10V6l-8-4z" fill="url(#shield-${item.id})" stroke="#0369a1" stroke-width="1.5"/><defs><linearGradient id="shield-${item.id}"><stop offset="0%" stop-color="#bae6fd"/><stop offset="100%" stop-color="#38bdf8"/></linearGradient></defs></svg>`,
            '✅': `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#10b981"/><path d="M8 12l3 3 5-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
            // Tools & Content
            '📝': `<svg viewBox="0 0 24 24" fill="none" stroke="#78350f" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/><path d="M9 12h6M9 16h6" stroke-linecap="round"/></svg>`,
            '📊': `<svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.5"><path d="M9 3v18M15 8v13M3 17v4M21 12v9" stroke-linecap="round"/></svg>`,
            '🌓': `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#1e293b"/><path d="M12 2a10 10 0 000 20V2z" fill="#f1f5f9"/></svg>`,
            '🔀': `<svg viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="1.5"><path d="M3 7h2a2 2 0 012 2v6a2 2 0 002 2h10M17 3l4 4-4 4M21 17h-2a2 2 0 01-2-2V9a2 2 0 00-2-2H5M7 21l-4-4 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
            '🔄': `<svg viewBox="0 0 24 24" fill="none" stroke="#0e7490" stroke-width="1.5"><path d="M4 4v5h5M20 20v-5h-5M2 12a10 10 0 0118-6M22 12a10 10 0 01-18 6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
            '📚': `<svg viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="#78350f" stroke-width="1.5"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" fill="#e7e5e4" stroke="#78350f" stroke-width="1.5"/><path d="M8 6h8M8 10h6" stroke="#78350f" stroke-width="1.5" stroke-linecap="round"/></svg>`,
            '🎁': `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="11" width="16" height="11" fill="#fca5a5" stroke="#991b1b" stroke-width="1.5"/><rect x="3" y="7" width="18" height="4" fill="#dc2626" stroke="#991b1b" stroke-width="1.5"/><path d="M12 7V22M8 7c0-1 1-3 2-3s2 1 2 3M16 7c0-1-1-3-2-3s-2 1-2 3" stroke="#991b1b" stroke-width="1.5"/></svg>`,
        };

        return iconMap[item.icon] || '';
    }

    /**
     * Create item card
     */
    private createItemCard(item: ShopItem): HTMLElement {
        const card = document.createElement('div');
        card.className = 'shop-item-card';

        const owned = ownsItem(item.id);
        const count = item.stackable ? getItemCount(item.id) : 0;

        // Add owned/equipped class
        if (owned && !item.stackable) {
            card.classList.add('owned');
        }

        // Owned badge (for non-stackable items)
        if (owned && !item.stackable) {
            const ownedBadge = document.createElement('div');
            ownedBadge.className = 'owned-badge';
            ownedBadge.textContent = '已拥有';
            card.appendChild(ownedBadge);
        }

        // Count badge (for stackable items)
        if (item.stackable && count > 0) {
            const countBadge = document.createElement('div');
            countBadge.className = 'count-badge';
            countBadge.textContent = `x${count}`;
            card.appendChild(countBadge);
        }

        // Item icon
        const icon = document.createElement('div');
        icon.className = 'item-icon';
        const svgIcon = this.getItemIcon(item);
        if (svgIcon) {
            icon.innerHTML = svgIcon;
        } else {
            icon.classList.add('emoji-icon');
            icon.textContent = item.icon;
        }
        card.appendChild(icon);

        // Item info
        const info = document.createElement('div');
        info.className = 'item-info';

        const name = document.createElement('div');
        name.className = 'item-name';
        name.textContent = item.name;
        info.appendChild(name);

        const desc = document.createElement('div');
        desc.className = 'item-description';
        desc.textContent = item.description;
        info.appendChild(desc);

        card.appendChild(info);

        // Price (inline on right)
        const price = document.createElement('div');
        price.className = 'item-price';
        price.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.15));">
                <defs>
                    <linearGradient id="price-ingot-body-${item.id}" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#B45309"/>
                        <stop offset="50%" stop-color="#fbbf24"/>
                        <stop offset="100%" stop-color="#B45309"/>
                    </linearGradient>
                    <linearGradient id="price-ingot-top-${item.id}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#FEF3C7"/>
                        <stop offset="100%" stop-color="#F59E0B"/>
                    </linearGradient>
                </defs>
                <path d="M7,11.5 A5,4 0 0,1 17,11.5" fill="url(#price-ingot-top-${item.id})"/>
                <path d="M2,11.5 Q12,14.5 22,11.5 Q21,19.5 12,19.5 Q3,19.5 2,11.5 Z" fill="url(#price-ingot-body-${item.id})"/>
            </svg>
            <span>${item.price}</span>
        `;
        card.appendChild(price);

        // Make whole card clickable (unless owned)
        if (!owned || item.stackable) {
            card.onclick = () => this.showPurchaseConfirmation(item);
        }

        return card;
    }

    /**
     * Show purchase confirmation modal
     */
    private showPurchaseConfirmation(item: ShopItem): void {
        const balance = getYuanbaoBalance();

        if (balance < item.price) {
            this.manager.showFeedback('元宝不足！', '#ef4444');
            return;
        }

        const message = `
            <div class="purchase-modal-content">
                <div class="purchase-item-icon">${item.icon}</div>
                <div class="purchase-item-name">${item.name}</div>
                <div class="purchase-item-desc">${item.description}</div>
                <div class="purchase-price">
                    <svg viewBox="0 0 24 24" width="20" height="20" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));">
                        <defs>
                            <linearGradient id="modal-ingot-body" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#B45309"/>
                                <stop offset="50%" stop-color="#fbbf24"/>
                                <stop offset="100%" stop-color="#B45309"/>
                            </linearGradient>
                            <linearGradient id="modal-ingot-top" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stop-color="#FEF3C7"/>
                                <stop offset="100%" stop-color="#F59E0B"/>
                            </linearGradient>
                        </defs>
                        <path d="M7,11.5 A5,4 0 0,1 17,11.5" fill="url(#modal-ingot-top)"/>
                        <path d="M2,11.5 Q12,14.5 22,11.5 Q21,19.5 12,19.5 Q3,19.5 2,11.5 Z" fill="url(#modal-ingot-body)"/>
                    </svg>
                    ${item.price} 元宝
                </div>
                <div class="purchase-balance">余额: ${balance} 元宝</div>
            </div>
        `;

        this.manager.showConfirm(
            '确认购买',
            message,
            () => this.executePurchase(item)
        );
    }

    /**
     * Execute the purchase
     */
    private executePurchase(item: ShopItem): void {
        const result = purchaseItem(item.id);

        if (result.success) {
            this.manager.showFeedback(result.message, '#4ade80');
            // Refresh the current category to update UI
            this.renderItemsForCategory(this.currentCategory);
            // Update shop header to show new balance
            this.updateShopHeaderStats();
        } else {
            this.manager.showFeedback(result.message, '#ef4444');
        }
    }
}
