/**
 * Avatar Selector Component
 * Handles the display and selection of user avatars
 */

export class AvatarSelector {
    /**
     * Set a random avatar on the target element
     */
    static setRandomAvatar(avatarEl: HTMLElement | null): void {
        if (!avatarEl) return;

        const index = Math.floor(Math.random() * 64);
        const row = Math.floor(index / 8);
        const col = index % 8;

        const posX = (col * 100) / 7;
        const posY = (row * 100) / 7;

        avatarEl.style.backgroundPosition = `${posX}% ${posY}%`;
    }

    /**
     * Show Avatar Selection Modal
     */
    static show(onSelect: (posX: number, posY: number) => void): void {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';

        const content = document.createElement('div');
        content.className = 'modal-content avatar-selector-card';
        content.style.maxWidth = '400px';
        content.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; margin-bottom: 20px; position: relative;">
                <!-- Standardized Back Button -->
                <button id="close-avatar-btn" class="header-back-btn" style="opacity: 1; pointer-events: auto; position: static;">❮</button>
                
                <!-- Centered Title -->
                <h2 style="margin: 0; font-size: 1.5rem; color: var(--tang-ink); font-weight: bold;">选择头像</h2>
                
                <!-- Spacer for Balance -->
                <div style="width: 40px;"></div>
            </div>
            <div class="avatar-grid" style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 5px; max-height: 400px; overflow-y: auto; padding-bottom: 10px;">
                <!-- Avatars will be injected here -->
            </div>
        `;

        const grid = content.querySelector('.avatar-grid');
        if (grid) {
            for (let i = 0; i < 64; i++) {
                const avatar = document.createElement('div');
                avatar.className = 'avatar-option';
                const row = Math.floor(i / 8);
                const col = i % 8;
                const posX = (col * 100) / 7;
                const posY = (row * 100) / 7;

                avatar.style.cssText = `
                    width: 40px; 
                    height: 40px; 
                    border-radius: 50%; 
                    background-image: url('/avatars.webp');
                    background-size: 800% 800%;
                    background-position: ${posX}% ${posY}%;
                    cursor: pointer;
                    border: 2px solid transparent;
                    transition: transform 0.2s;
                `;

                avatar.onmouseover = () => avatar.style.transform = 'scale(1.1)';
                avatar.onmouseout = () => avatar.style.transform = 'scale(1)';

                avatar.onclick = () => {
                    onSelect(posX, posY);
                    modal.remove();
                };

                grid.appendChild(avatar);
            }
        }

        modal.appendChild(content);
        document.body.appendChild(modal);

        document.getElementById('close-avatar-btn')?.addEventListener('click', () => {
            modal.remove();
        });

        // Close on background click
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }
}
