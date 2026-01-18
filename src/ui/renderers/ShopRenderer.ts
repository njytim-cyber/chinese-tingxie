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
     * Show shop screen
     */
    show(): void {
        console.log('ShopRenderer.show started');
        try {
            this.manager.updateHeaderTitle('商店');
            this.manager.toggleMainHeader(true);
            this.manager.toggleBackBtn(false);
            this.manager.toggleHeaderStats(true); // Show yuanbao balance in header

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

        // Balance header
        const balanceHeader = this.createBalanceHeader();
        shopContainer.appendChild(balanceHeader);

        // Items grid
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
                <svg viewBox="0 0 24 24" width="24" height="24" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));">
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

        // Item icon
        const icon = document.createElement('div');
        icon.className = 'item-icon';
        icon.textContent = item.icon;
        card.appendChild(icon);

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

        // Price and buy button
        const footer = document.createElement('div');
        footer.className = 'item-footer';

        const price = document.createElement('div');
        price.className = 'item-price';
        price.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.2));">
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
        footer.appendChild(price);

        const buyBtn = document.createElement('button');
        buyBtn.className = 'item-buy-btn';

        if (owned && !item.stackable) {
            buyBtn.textContent = '已拥有';
            buyBtn.disabled = true;
        } else {
            buyBtn.textContent = '购买';
            buyBtn.onclick = () => this.showPurchaseConfirmation(item);
        }

        footer.appendChild(buyBtn);
        card.appendChild(footer);

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
            this.manager.updateDashboardStats(); // Update header balance
        } else {
            this.manager.showFeedback(result.message, '#ef4444');
        }
    }
}
