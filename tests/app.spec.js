/**
 * E2E Tests for Chinese Tingxie Application
 * Comprehensive test coverage for CI
 */
import { test, expect } from '@playwright/test';

test.setTimeout(30000);

test.describe('Application Launch', () => {
    test('displays correct title', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/星空听写/);
    });

    test('shows start overlay', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#start-overlay')).toBeVisible();
        await expect(page.locator('.start-btn')).toBeVisible();
    });

    test('HUD is hidden initially', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.hud')).toBeHidden();
    });
});

test.describe('Navigation', () => {
    test('start button leads to lesson selection', async ({ page }) => {
        await page.goto('/');
        await page.locator('.start-btn').click();

        await expect(page.locator('.hud')).toBeVisible();
        await expect(page.locator('.lesson-select')).toBeVisible();
        await expect(page.locator('.lesson-card').first()).toBeVisible();
    });

    test('clicking lesson starts game view', async ({ page }) => {
        await page.goto('/');
        await page.locator('.start-btn').click();
        await page.locator('.lesson-card').first().click();

        await expect(page.locator('.hud')).toBeVisible();
        await page.waitForFunction(() => {
            const area = document.getElementById('writing-area');
            return area && area.children.length > 0;
        }, { timeout: 10000 });
    });

    test('dictation button leads to dictation select', async ({ page }) => {
        await page.goto('/');
        await page.locator('.dictation-btn').click();

        // Wait for dictation passage list to load
        await expect(page.locator('.lesson-select-title')).toBeVisible({ timeout: 5000 });
    });

    test('review button shows progress view', async ({ page }) => {
        await page.goto('/');
        await page.locator('.review-btn').click();

        // Progress view should show
        await expect(page.locator('.progress-view')).toBeVisible({ timeout: 5000 });
    });
});

test.describe('Header', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('HUD becomes visible after starting', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.hud')).toBeHidden();
        await page.locator('.start-btn').click();
        await expect(page.locator('.hud')).toBeVisible();
    });
});

test.describe('Accessibility', () => {
    test('start overlay has dialog role', async ({ page }) => {
        await page.goto('/');
        const overlay = page.locator('#start-overlay');
        await expect(overlay).toHaveAttribute('role', 'dialog');
    });

    test('buttons have aria-labels', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.start-btn')).toHaveAttribute('aria-label', '开始听写练习');
        await expect(page.locator('.dictation-btn')).toHaveAttribute('aria-label', '开始默写练习');
    });

    test('HUD has banner role', async ({ page }) => {
        await page.goto('/');
        await page.locator('.start-btn').click();
        const hud = page.locator('.hud');
        await expect(hud).toHaveAttribute('role', 'banner');
    });
});
