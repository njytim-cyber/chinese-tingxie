/**
 * E2E Tests for Chinese Tingxie Application
 * Focused on reliable, fast tests for CI
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
        // Use the actual ID from index.html
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

        // Game should start - HUD should remain visible
        await expect(page.locator('.hud')).toBeVisible();

        // Wait for the writing area to have content
        await page.waitForFunction(() => {
            const area = document.getElementById('writing-area');
            return area && area.children.length > 0;
        }, { timeout: 10000 });
    });
});

test.describe('Header', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('HUD becomes visible after starting', async ({ page }) => {
        await page.goto('/');

        // Initially hidden
        await expect(page.locator('.hud')).toBeHidden();

        // Click start
        await page.locator('.start-btn').click();

        // Now visible
        await expect(page.locator('.hud')).toBeVisible();
    });
});
