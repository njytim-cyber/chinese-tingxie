import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/星空听写/);
});

test('can start game', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('你的名字').fill('Tester');
    await page.getByRole('button', { name: '▶ 开始' }).click();

    // HUD should appear
    await expect(page.locator('.hud')).toBeVisible();

    // Lesson selection should appear
    await expect(page.locator('.lesson-select')).toBeVisible();
});

test('lesson selection and gameplay', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '▶ 开始' }).click();

    // Wait for lesson selection
    await expect(page.locator('.lesson-select')).toBeVisible();

    // Verify we have 9 lessons
    await expect(page.locator('.lesson-card')).toHaveCount(9);

    // Click on the first lesson
    await page.locator('.lesson-card').first().click();

    // Wait for game to load by checking for character slots
    await expect(page.locator('.char-slot').first()).toBeVisible();

    // Verify controls are visible
    await expect(page.locator('#btn-audio')).toBeVisible();
    await expect(page.locator('#btn-hint')).toBeVisible();
});
