/**
 * E2E Tests for Chinese Tingxie Application
 * Fresh tests designed for the current UI structure
 */
import { test, expect } from '@playwright/test';

// Configure default timeout for async operations
test.setTimeout(30000);

test.describe('Application Launch', () => {
    test('displays the correct title', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/星空听写/);
    });

    test('shows start screen with name input', async ({ page }) => {
        await page.goto('/');

        // Start screen should be visible
        await expect(page.locator('.start-screen')).toBeVisible();

        // Name input should be present
        await expect(page.getByPlaceholder('你的名字')).toBeVisible();

        // Start button should be present
        await expect(page.locator('.start-btn')).toBeVisible();
    });

    test('HUD is initially hidden', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.hud')).toBeHidden();
    });
});

test.describe('Navigation Flow', () => {
    test('can navigate to lesson selection', async ({ page }) => {
        await page.goto('/');

        // Enter name and start
        await page.getByPlaceholder('你的名字').fill('TestUser');
        await page.locator('.start-btn').click();

        // HUD should now be visible
        await expect(page.locator('.hud')).toBeVisible();

        // Lesson selection should appear
        await expect(page.locator('.lesson-select')).toBeVisible();

        // Should have lesson cards
        const lessonCards = page.locator('.lesson-card');
        await expect(lessonCards.first()).toBeVisible();
    });

    test('can start a spelling practice session', async ({ page }) => {
        await page.goto('/');

        // Quick start
        await page.locator('.start-btn').click();
        await expect(page.locator('.lesson-select')).toBeVisible();

        // Click first lesson
        await page.locator('.lesson-card').first().click();

        // Wait for the spelling input area to appear
        // The carousel is created asynchronously, so we use a generous timeout
        await expect(page.locator('.spelling-carousel')).toBeVisible({ timeout: 10000 });

        // HUD controls should be visible during game
        await expect(page.locator('.hud-controls')).toBeVisible();
    });
});

test.describe('Game UI Elements', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to an active game session
        await page.goto('/');
        await page.locator('.start-btn').click();
        await page.locator('.lesson-card').first().click();
        await expect(page.locator('.spelling-carousel')).toBeVisible({ timeout: 10000 });
    });

    test('audio button is visible and clickable', async ({ page }) => {
        const audioBtn = page.locator('#btn-audio');
        await expect(audioBtn).toBeVisible();
    });

    test('hint button is visible', async ({ page }) => {
        const hintBtn = page.locator('#btn-hint');
        await expect(hintBtn).toBeVisible();
    });

    test('HUD is not transparent during gameplay', async ({ page }) => {
        const hud = page.locator('.hud');
        const classList = await hud.getAttribute('class');
        expect(classList).not.toContain('transparent');
    });
});

test.describe('Header Behavior', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('header stays fixed when scrolling', async ({ page }) => {
        await page.goto('/');
        await page.locator('.start-btn').click();
        await page.locator('.lesson-card').first().click();
        await expect(page.locator('.spelling-carousel')).toBeVisible({ timeout: 10000 });

        // Force scrollable content
        await page.evaluate(() => {
            document.body.style.height = '3000px';
        });

        // Scroll down
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(200);

        // Header should still be at y=0
        const hud = page.locator('.hud');
        const box = await hud.boundingBox();
        expect(box).not.toBeNull();
        if (box) {
            expect(box.y).toBe(0);
        }
    });
});
