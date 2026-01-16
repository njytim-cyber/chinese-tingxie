/**
 * Tabbed Navigation Component with Swipe Support
 * Creates a tab bar with touch/swipe gestures for navigation
 */

export interface Tab {
    id: string;
    label: string;
}

export interface TabbedNavOptions {
    tabs: Tab[];
    initialTab?: string;
    onTabChange: (tabId: string) => void;
}

export class TabbedNav {
    private container: HTMLElement;
    private tabsContainer: HTMLElement;
    private contentContainer: HTMLElement;
    private options: TabbedNavOptions;
    private activeTabId: string;

    // Swipe gesture tracking
    private touchStartX: number = 0;
    private touchStartY: number = 0;
    private isSwiping: boolean = false;

    constructor(options: TabbedNavOptions) {
        this.options = options;
        this.activeTabId = options.initialTab || options.tabs[0]?.id || '';

        this.container = document.createElement('div');
        this.container.className = 'tabbed-nav-container';

        this.tabsContainer = this.createTabsContainer();
        this.contentContainer = this.createContentContainer();

        this.container.appendChild(this.tabsContainer);
        this.container.appendChild(this.contentContainer);

        this.attachSwipeListeners();
    }

    /**
     * Create the tabs bar
     */
    private createTabsContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'tabs-container';

        const tabsWrapper = document.createElement('div');
        tabsWrapper.className = 'tabs-wrapper';

        this.options.tabs.forEach(tab => {
            const tabElement = document.createElement('button');
            tabElement.className = 'tab-item';
            tabElement.dataset.tabId = tab.id;
            tabElement.textContent = tab.label;

            if (tab.id === this.activeTabId) {
                tabElement.classList.add('active');
            }

            tabElement.addEventListener('click', () => this.switchTab(tab.id));
            tabsWrapper.appendChild(tabElement);
        });

        // Active indicator
        const indicator = document.createElement('div');
        indicator.className = 'tab-indicator';
        tabsWrapper.appendChild(indicator);

        container.appendChild(tabsWrapper);
        this.updateIndicator();

        return container;
    }

    /**
     * Create the content container
     */
    private createContentContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'tab-content-container';
        return container;
    }

    /**
     * Switch to a different tab
     */
    private switchTab(tabId: string): void {
        if (tabId === this.activeTabId) return;

        this.activeTabId = tabId;

        // Update active state
        this.tabsContainer.querySelectorAll('.tab-item').forEach(el => {
            el.classList.toggle('active', el.getAttribute('data-tab-id') === tabId);
        });

        this.updateIndicator();
        this.options.onTabChange(tabId);
    }

    /**
     * Update the active indicator position
     */
    private updateIndicator(): void {
        requestAnimationFrame(() => {
            const activeTab = this.tabsContainer.querySelector(`.tab-item[data-tab-id="${this.activeTabId}"]`) as HTMLElement;
            const indicator = this.tabsContainer.querySelector('.tab-indicator') as HTMLElement;

            if (activeTab && indicator) {
                const tabsWrapper = this.tabsContainer.querySelector('.tabs-wrapper') as HTMLElement;
                const offsetLeft = activeTab.offsetLeft - (tabsWrapper?.offsetLeft || 0);
                indicator.style.transform = `translateX(${offsetLeft}px)`;
                indicator.style.width = `${activeTab.offsetWidth}px`;
            }
        });
    }

    /**
     * Attach swipe gesture listeners
     */
    private attachSwipeListeners(): void {
        this.contentContainer.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        this.contentContainer.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.contentContainer.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }

    /**
     * Handle touch start event
     */
    private handleTouchStart(e: TouchEvent): void {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.isSwiping = false;
    }

    /**
     * Handle touch move event
     */
    private handleTouchMove(e: TouchEvent): void {
        if (!this.touchStartX) return;

        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;

        const deltaX = touchX - this.touchStartX;
        const deltaY = touchY - this.touchStartY;

        // Detect horizontal swipe (more horizontal than vertical movement)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            this.isSwiping = true;
            // Prevent vertical scrolling while swiping horizontally
            e.preventDefault();
        }
    }

    /**
     * Handle touch end event
     */
    private handleTouchEnd(e: TouchEvent): void {
        if (!this.isSwiping || !this.touchStartX) {
            this.touchStartX = 0;
            this.touchStartY = 0;
            return;
        }

        const touchEndX = e.changedTouches[0].clientX;
        const deltaX = touchEndX - this.touchStartX;

        const SWIPE_THRESHOLD = 50; // Minimum distance to trigger swipe

        if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
            const currentIndex = this.options.tabs.findIndex(tab => tab.id === this.activeTabId);

            if (deltaX > 0 && currentIndex > 0) {
                // Swipe right - go to previous tab
                this.switchTab(this.options.tabs[currentIndex - 1].id);
            } else if (deltaX < 0 && currentIndex < this.options.tabs.length - 1) {
                // Swipe left - go to next tab
                this.switchTab(this.options.tabs[currentIndex + 1].id);
            }
        }

        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isSwiping = false;
    }

    /**
     * Get the container element
     */
    getElement(): HTMLElement {
        return this.container;
    }

    /**
     * Get the content container where tab content should be rendered
     */
    getContentContainer(): HTMLElement {
        return this.contentContainer;
    }

    /**
     * Get the current active tab ID
     */
    getActiveTabId(): string {
        return this.activeTabId;
    }

    /**
     * Programmatically set the active tab
     */
    setActiveTab(tabId: string): void {
        this.switchTab(tabId);
    }

    /**
     * Clean up event listeners
     */
    destroy(): void {
        this.contentContainer.removeEventListener('touchstart', this.handleTouchStart);
        this.contentContainer.removeEventListener('touchmove', this.handleTouchMove);
        this.contentContainer.removeEventListener('touchend', this.handleTouchEnd);
    }
}
