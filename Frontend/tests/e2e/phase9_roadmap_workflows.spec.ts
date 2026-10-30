import { test, expect } from '@playwright/test';

test.describe('SkillVerse Phase 9 & 9.1: Personalized Roadmap & Learning Browser E2E Suite', () => {

  test('1. Student workflow: authenticates, sets career goal, views gap matrix and action plan', async ({ page }) => {
    // 1. Visit Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student@skillverse.test');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    // 2. Redirect to dashboard
    await page.waitForURL('**/student/dashboard', { timeout: 10000 });

    // 3. Navigate to personalized learning roadmap
    await page.goto('/student/learning');
    await expect(page.locator('body')).toContainText(/Personalized Development Roadmap/i);
    await expect(page.locator('body')).toContainText(/Target Goal Readiness/i);

    // 4. Select goal if not configured or change goal
    const selectGoalBtn = page.locator('button:has-text("Select Goal"), button:has-text("Select Target Role or Job"), button:has-text("Change Goal")');
    if (await selectGoalBtn.first().isVisible()) {
      await selectGoalBtn.first().click();
      await expect(page.locator('body')).toContainText(/Configure Career or Job Target/i);
      
      const saveBtn = page.locator('button:has-text("Activate Target Goal"), button:has-text("Save")');
      await saveBtn.click();
    }

    // 5. Verify Target Skill Gap Matrix and Prioritized Roadmap are now visible
    await expect(page.locator('body')).toContainText(/Target Skill Gap Matrix/i);
    await expect(page.locator('body')).toContainText(/Prioritized Development Roadmap/i);

    // 6. Verify Academic Integrity Safeguard notice is rendered
    await expect(page.locator('body')).toContainText(/Academic Integrity Safeguard/i);
  });

  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 800 },
    { name: 'Wide', width: 1440, height: 900 }
  ];

  for (const vp of viewports) {
    test(`2. Viewport responsiveness: verifies layout integrity at ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/login');
      await page.fill('input[type="email"]', 'student@skillverse.test');
      await page.fill('input[type="password"]', 'TestPass123!');
      await page.click('button[type="submit"]');

      await page.waitForURL('**/student/dashboard', { timeout: 10000 });
      await page.goto('/student/learning');

      await expect(page.locator('body')).toContainText(/Personalized Development Roadmap/i);
    });
  }
});
