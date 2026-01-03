
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 375, height: 667 } });

test('header should remain fixed at the top when scrolling', async ({ page }) => {
    // 1. Start the game
    await page.goto('/');
    await page.getByPlaceholder('你的名字').fill('Tester');
    // The button class is .start-btn, check text
    await page.locator('.start-btn').click();

    // 2. Select a lesson to get content
    await page.locator('.lesson-card').first().click();

    // 3. Wait for game area
    const charSlot = page.locator('.char-slot').first();
    await expect(charSlot).toBeVisible();

    // 4. Force some scrolling
    // We can add some height to body to ensure scrolling if content isn't enough
    await page.evaluate(() => {
        document.body.style.height = '3000px';
        document.querySelector('.game-stage').style.height = '2000px';
    });

    // 5. Scroll down
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(500); // Wait for scroll/render

    // 6. Check header position
    const hud = page.locator('.hud');
    const box = await hud.boundingBox();
    console.log('HUD box at scroll 500:', box);

    // It should be at y=0 relative to viewport
    expect(box.y).toBe(0);

    // 7. Check if header is still on top (z-index check effectively)
    // We can check if it covers the element that would be under it.
    // At scroll 500, the top 80px of viewport is the header.
    // The point (100, 40) should be the header.
    const elementAtTop = await page.evaluate(() => {
        const el = document.elementFromPoint(100, 40);
        return el ? el.className : null;
    });
    console.log('Element at (100, 40):', elementAtTop);

    // It should be part of the HUD or the HUD itself
    // Note: elementFromPoint returns the top-most element.
    // If HUD is fixed and z-index 9999, it should be returned unless covered.

    // 8. Check transparency class
    const classAttribute = await hud.getAttribute('class');
    console.log('HUD classes:', classAttribute);
    expect(classAttribute).not.toContain('transparent');

    // 9. Check computed background color
    const bg = await hud.evaluate((el) => window.getComputedStyle(el).backgroundColor);

    console.log('HUD background color:', bg);
    // Should be rgba(30, 41, 59, 1) -> "rgb(30, 41, 59)"
    expect(bg).toBe('rgb(30, 41, 59)');
});
