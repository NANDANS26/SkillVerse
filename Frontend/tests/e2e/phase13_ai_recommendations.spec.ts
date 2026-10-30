import { test, expect } from '@playwright/test';

test.describe('SkillVerse Phase 13: Evidence-Aware AI Learning Recommendations E2E Suite', () => {

  test('1. Student workflow: loads roadmap, verifies evidence-aware AI recommendations banner and metadata', async ({ page }) => {
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

    // 4. Verify AI recommendations banner is visible
    await expect(page.locator('body')).toContainText(/Evidence-Aware AI Recommendations/i);
    await expect(page.locator('body')).toContainText(/all-MiniLM-L6-v2/i);

    // 5. Verify Academic Integrity Safeguard notice is rendered
    await expect(page.locator('body')).toContainText(/Academic Integrity Safeguard/i);
  });

  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Desktop', width: 1280, height: 800 }
  ];

  for (const vp of viewports) {
    test(`2. Viewport responsiveness: verifies AI recommendations layout at ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/login');
      await page.fill('input[type="email"]', 'student@skillverse.test');
      await page.fill('input[type="password"]', 'TestPass123!');
      await page.click('button[type="submit"]');

      await page.waitForURL('**/student/dashboard', { timeout: 10000 });
      await page.goto('/student/learning');

      await expect(page.locator('body')).toContainText(/Personalized Development Roadmap/i);
      await expect(page.locator('body')).toContainText(/Evidence-Aware AI Recommendations/i);
    });
  }
});
