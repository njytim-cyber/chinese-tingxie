/**
 * Version checker to detect app updates and notify users
 * This preserves localStorage while ensuring users see the latest version
 */

const APP_VERSION = '2.0.2'; // Synced by scripts/sync-version.js
const VERSION_KEY = 'app_version';

// Release notes for current version
const RELEASE_NOTES = {
    '2.0.2': {
        title: '体验优化: 多项改进',
        features: [
            '新增丙 (Set C) 默写内容',
            '习字模式进度显示优化（用点替代文字）',
            '修复触控滑动手势冲突',
            '修复平板/手机无法垂直滚动问题',
            '修复默写轮播动画垂直抖动',
            '活动记录现在正确显示"默写"标签'
        ]
    },
    '2.0.1': {
        title: 'UX改进: 统一操作体验',
        features: [
            '习字模式新增手动"继续"按钮',
            '三种模式统一使用手动进度控制',
            '默写模式新增"继续"按钮和进度条',
            '改善移动端布局和按钮间距'
        ]
    },
    '2.0.0': {
        title: '重大更新: 习字模式增强',
        features: [
            '新增词组进度显示（例：词组 3/10）',
            '可选练习数量（5词/10词/全部）',
            '移除错误笔画音效，专注学习',
            '修复"继续"按钮无法点击的问题'
        ]
    }
};

export function checkVersion(): void {
    const storedVersion = localStorage.getItem(VERSION_KEY);

    if (storedVersion && storedVersion !== APP_VERSION) {
        // Version changed - show update notification
        showUpdateNotification(storedVersion, APP_VERSION);
    }

    // Always update the stored version
    localStorage.setItem(VERSION_KEY, APP_VERSION);
}

function showUpdateNotification(oldVersion: string, newVersion: string): void {
    const releaseNotes = RELEASE_NOTES[newVersion as keyof typeof RELEASE_NOTES];

    const notification = document.createElement('div');
    notification.className = 'update-notification';

    const featuresHTML = releaseNotes?.features
        ? `<ul class="update-features">
            ${releaseNotes.features.map(f => `<li>✓ ${f}</li>`).join('')}
           </ul>`
        : '';

    notification.innerHTML = `
        <div class="update-content">
            <div class="update-header">
                <div class="update-icon">🎉</div>
                <div class="update-text">
                    <strong>${releaseNotes?.title || '新版本可用'}</strong>
                    <p class="update-version">v${oldVersion} → v${newVersion}</p>
                </div>
                <button class="update-dismiss" id="dismiss-btn">×</button>
            </div>
            ${featuresHTML}
            <div class="update-actions">
                <button class="update-btn" id="refresh-btn">立即更新</button>
                <button class="update-later" id="later-btn">稍后</button>
            </div>
        </div>
    `;

    document.body.appendChild(notification);

    // Show notification with animation
    setTimeout(() => notification.classList.add('show'), 10);

    // Auto-dismiss after 30 seconds
    const autoDismiss = setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 30000);

    // Bind events
    const dismiss = () => {
        clearTimeout(autoDismiss);
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    };

    document.getElementById('refresh-btn')?.addEventListener('click', async () => {
        // Clear all caches to ensure fresh content
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        // Hard reload with cache bypass
        window.location.reload();
    });

    document.getElementById('later-btn')?.addEventListener('click', dismiss);
    document.getElementById('dismiss-btn')?.addEventListener('click', dismiss);
}
