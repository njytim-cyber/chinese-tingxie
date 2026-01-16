/**
 * Version checker to detect app updates and notify users
 * This preserves localStorage while ensuring users see the latest version
 */

const APP_VERSION = '1.21.21'; // Should match package.json version
const VERSION_KEY = 'app_version';

export function checkVersion(): void {
    const storedVersion = localStorage.getItem(VERSION_KEY);

    if (storedVersion && storedVersion !== APP_VERSION) {
        // Version changed - show update notification
        showUpdateNotification();
    }

    // Always update the stored version
    localStorage.setItem(VERSION_KEY, APP_VERSION);
}

function showUpdateNotification(): void {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
        <div class="update-content">
            <div class="update-icon">✨</div>
            <div class="update-text">
                <strong>新版本可用!</strong>
                <p>请刷新页面以获取最新功能</p>
            </div>
            <button class="update-btn" id="refresh-btn">刷新</button>
            <button class="update-dismiss" id="dismiss-btn">×</button>
        </div>
    `;

    document.body.appendChild(notification);

    // Show notification with animation
    setTimeout(() => notification.classList.add('show'), 10);

    // Bind events
    document.getElementById('refresh-btn')?.addEventListener('click', () => {
        window.location.reload();
    });

    document.getElementById('dismiss-btn')?.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
}
