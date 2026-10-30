import { test, expect } from '@playwright/test';

test.describe('SkillVerse Phase 14: Recommendation Feedback and Interaction Outcomes E2E Suite', () => {

  test('1. Student workflow: loads roadmap, expands relevance feedback form, submits rating and reason', async ({ page }) => {
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

    // 4. Verify feedback trigger or existing rating is visible on recommendation cards
    const feedbackTrigger = page.locator('button:has-text("Rate Relevance"), button:has-text("Edit Feedback")').first();
    await expect(feedbackTrigger).toBeVisible({ timeout: 10000 });
    await feedbackTrigger.click();

    // 5. Verify feedback form components: 5 rating buttons, reason categories, transparency note
    await expect(page.locator('text=Relevance Feedback for This Activity')).toBeVisible();
    await expect(page.locator('text=How relevant is this activity to your current target goal?')).toBeVisible();
    await expect(page.locator('text=This feedback is completely optional and private')).toBeVisible();

    // 6. Select 5 stars
    const star5Btn = page.locator('button:has-text("5")').first();
    await star5Btn.click();

    // 7. Click a reason category chip
    const reasonChip = page.locator('button:has-text("Directly aligns with my target goal")').first();
    if (await reasonChip.isVisible()) {
      await reasonChip.click();
    }

    // 8. Submit feedback
    const submitBtn = page.locator('button:has-text("Submit Feedback")');
    await submitBtn.click();

    // 9. Verify success toast or confirmation text appears
    await expect(page.locator('body')).toContainText(/Your feedback has been recorded|Thank you/i);
  });

  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Desktop', width: 1280, height: 800 }
  ];

  for (const vp of viewports) {
    test(`2. Viewport responsiveness: verifies feedback UI layout at ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/login');
      await page.fill('input[type="email"]', 'student@skillverse.test');
      await page.fill('input[type="password"]', 'TestPass123!');
      await page.click('button[type="submit"]');

      await page.waitForURL('**/student/dashboard', { timeout: 10000 });
      await page.goto('/student/learning');

      await expect(page.locator('body')).toContainText(/Personalized Development Roadmap/i);
      const feedbackTrigger = page.locator('button:has-text("Rate Relevance"), button:has-text("Edit Feedback")').first();
      await expect(feedbackTrigger).toBeVisible();
    });
  }
});
