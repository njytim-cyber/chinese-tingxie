/**
 * Shop Renderer
 * Renders the shop screen with categories and purchasable items
 */

import type { IUIManager } from '../../types';
import { getYuanbaoBalance, purchaseItem, ownsItem, getItemCount } from '../../data/manager';
import { getCategories, getItemsByCategory, type ShopItem } from '../../data/shopItems';
import { shopIcons } from '../../data/shopIcons';
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
            // Use DocumentFragment for efficient batch insertion
            const fragment = document.createDocumentFragment();
            items.forEach(item => {
                const itemCard = this.createItemCard(item);
                fragment.appendChild(itemCard);
            });
            itemsGrid.appendChild(fragment);
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
        const iconFn = shopIcons[item.icon];
        return iconFn ? iconFn(item.id) : '';
    }

    /**
     * Create item card
     */
    private createItemCard(item: ShopItem): HTMLElement {
        const card = document.createElement('div');
        card.className = 'shop-item-card';
        card.dataset.itemId = item.id; // For targeted updates

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
     * Update a single item card (faster than full re-render)
     */
    private updateSingleCard(itemId: string): void {
        const card = document.querySelector(`[data-item-id="${itemId}"]`) as HTMLElement;
        if (!card) return;

        // Find the item data
        const items = getItemsByCategory(this.currentCategory);
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        // Create new card and replace
        const newCard = this.createItemCard(item);
        card.replaceWith(newCard);
    }

    /**
     * Execute the purchase
     */
    private executePurchase(item: ShopItem): void {
        const result = purchaseItem(item.id);

        if (result.success) {
            this.manager.showFeedback(result.message, '#4ade80');
            // Only update the single changed card (faster)
            this.updateSingleCard(item.id);
            // Update shop header to show new balance
            this.updateShopHeaderStats();
        } else {
            this.manager.showFeedback(result.message, '#ef4444');
        }
    }
}
