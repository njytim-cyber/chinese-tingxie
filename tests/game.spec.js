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

    // Game stage should be visible
    await expect(page.locator('.game-stage')).toBeVisible();
});

test('gameplay flow', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '▶ 开始' }).click();

    // Wait for game stage
    await expect(page.locator('.game-stage')).toBeVisible();

    // Check audio button
    const audioBtn = page.locator('#btn-audio');
    await expect(audioBtn).toBeVisible();

    // Use hint
    await page.locator('#btn-hint').click();

    // Pinyin should appear after hint
    await expect(page.locator('#pinyin-display')).toBeVisible();
});
