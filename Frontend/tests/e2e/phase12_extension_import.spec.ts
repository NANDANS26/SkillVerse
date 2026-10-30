import { test, expect } from '@playwright/test';

test.describe('SkillVerse Phase 12: Companion Browser Extension & Evidence Import E2E Suite', () => {

  const sampleDraft = {
    platform: 'github',
    repo_url: 'https://github.com/skillverse-candidate/react-design-system',
    repo_name: 'react-design-system',
    repo_owner: 'skillverse-candidate',
    description: 'Accessible component library with Tailwind CSS and Framer Motion.',
    topics: ['react', 'typescript', 'tailwind', 'ui-components'],
    is_private: false,
    primary_language: 'TypeScript',
    contribution_summary: 'Authored core button, modal dialog, and data table components with WCAG AAA compliance.',
    proposed_skills: ['React', 'TypeScript'],
    captured_at: new Date().toISOString(),
    client_version: '1.0.0'
  };

  test('1. Student workflow: imports GitHub repository evidence via URL fragment handoff', async ({ page }) => {
    // 1. Authenticate as student
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student@skillverse.test');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/student/dashboard', { timeout: 10000 });

    // 2. Simulate extension handoff with encoded fragment
    const encoded = encodeURIComponent(JSON.stringify(sampleDraft));
    await page.goto(`/extension/import#draft=${encoded}`);

    // 3. Verify URL fragment is immediately purged from address bar for privacy
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('#draft=');

    // 4. Verify preview interface renders repository details
    await expect(page.locator('body')).toContainText(/skillverse-candidate \/ react-design-system/i);
    await expect(page.locator('body')).toContainText(/Accessible component library with Tailwind/i);
    await expect(page.locator('body')).toContainText(/#react/i);
    await expect(page.locator('body')).toContainText(/#typescript/i);

    // 5. Verify canonical skill selector is visible
    const skillSelect = page.locator('#skill-select');
    await expect(skillSelect).toBeVisible();

    // 6. Verify contribution summary is prefilled and editable
    const summaryInput = page.locator('#contribution-summary');
    await expect(summaryInput).toBeVisible();
    await summaryInput.fill('Authored core button, modal dialog, and data table components with WCAG AAA compliance and automated axe-core audits.');

    // 7. Verify transparency and lifecycle disclosure notices
    await expect(page.locator('body')).toContainText(/Evidence Lifecycle Policy/i);
    await expect(page.locator('body')).toContainText(/Pending Review/i);
    await expect(page.locator('body')).toContainText(/0.350/i);

    // 8. Submit the evidence
    const submitBtn = page.locator('button[type="submit"]:has-text("Confirm & Submit Evidence")');
    await submitBtn.click();

    // 9. Verify success confirmation screen
    await expect(page.locator('body')).toContainText(/Evidence Recorded!/i, { timeout: 10000 });
    await expect(page.locator('body')).toContainText(/Pending Faculty Review/i);
    await expect(page.locator('body')).toContainText(/View in Skill DNA/i);
  });

  test('2. Unauthenticated handoff: preserves draft and prompts for sign-in', async ({ page, context }) => {
    // Fresh context without session cookies
    await context.clearCookies();

    const encoded = encodeURIComponent(JSON.stringify(sampleDraft));
    await page.goto(`/extension/import#draft=${encoded}`);

    // Verify unauthenticated prompt is displayed
    await expect(page.locator('body')).toContainText(/Sign In to Import Evidence/i);
    await expect(page.locator('body')).toContainText(/Your repository draft is securely saved/i);
    await expect(page.locator('a:has-text("Sign In")')).toBeVisible();
  });

  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 800 },
    { name: 'Wide', width: 1440, height: 900 }
  ];

  for (const vp of viewports) {
    test(`3. Viewport responsiveness: verifies import portal layout at ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      const encoded = encodeURIComponent(JSON.stringify(sampleDraft));
      await page.goto(`/extension/import#draft=${encoded}`);

      // Basic visibility and absence of overflow horizontal scrollbars
      await expect(page.locator('body')).toBeVisible();
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalOverflow).toBe(false);
    });
  }

});
