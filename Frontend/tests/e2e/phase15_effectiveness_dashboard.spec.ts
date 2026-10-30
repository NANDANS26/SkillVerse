// Frontend/tests/e2e/phase15_effectiveness_dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('SkillVerse Phase 15: Recommendation Effectiveness Dashboard & Pilot Readiness E2E Suite', () => {
  test('1. Super Administrator Workflow: inspects recommendation effectiveness, funnel metrics & pilot readiness', async ({ page }) => {
    // 1. Authenticate as Super Admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@skillverse.test');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    // 2. Wait for redirect to /admin
    await page.waitForURL('**/admin', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText(/Super Administrator Dashboard/i);

    // 3. Switch to Recommendations & Pilot Readiness Tab
    const recTab = page.locator('button', { hasText: /Recommendations & Pilot Readiness/i });
    await expect(recTab).toBeVisible();
    await recTab.click();

    // 4. Verify Dashboard Header & Data Sufficiency Badge
    await expect(page.locator('h1', { hasText: /Recommendation Effectiveness/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=v2.0.0-ai-semantic-recommendation').first()).toBeVisible();
    await expect(page.locator('strong', { hasText: 'all-MiniLM-L6-v2' }).first()).toBeVisible();

    // 5. Verify KPI Metric Cards
    await expect(page.locator('text=Unique Presentations')).toBeVisible();
    await expect(page.locator('text=Total Impressions')).toBeVisible();
    await expect(page.locator('text=Feedback Coverage')).toBeVisible();

    // 6. Verify Funnel Stages
    await expect(page.locator('text=Learning Activity Lifecycle Funnel')).toBeVisible();
    await expect(page.locator('text=Presented Recommendations')).toBeVisible();
    await expect(page.locator('text=Opened / Inspected')).toBeVisible();
    await expect(page.locator('text=Marked In Progress')).toBeVisible();
    await expect(page.locator('text=Self-Reported Completed')).toBeVisible();

    // 7. Verify Partition A and Partition C Isolation
    await expect(page.locator('text=Partition A: Explicit Relevance Ratings')).toBeVisible();
    await expect(page.locator('text=Partition C: Synthetic Benchmark')).toBeVisible();

    // 8. Verify Pilot Readiness Checklist
    await expect(page.locator('text=Recommendation Pilot Readiness Checklist')).toBeVisible();
    await expect(page.locator('text=Relational Invariant Verification')).toBeVisible();
    await expect(page.locator('text=Multi-Tenant Role Isolation')).toBeVisible();
    await expect(page.locator('text=Model Weight Freezing & Zero Retraining')).toBeVisible();
  });

  test('2. College Administrator Workflow: views institution-scoped recommendation metrics', async ({ page }) => {
    // 1. Authenticate as College Admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'college@skillverse.test');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    // 2. Wait for redirect to /college/dashboard
    await page.waitForURL('**/college/dashboard', { timeout: 15000 });
    await expect(page.locator('text=Institutional Intelligence Center')).toBeVisible();

    // 3. Scroll to Recommendation Effectiveness Section
    const recSection = page.locator('text=Recommendation Effectiveness & Pilot Readiness');
    await expect(recSection).toBeVisible({ timeout: 10000 });

    // 4. Verify Engine & Model Metadata
    await expect(page.locator('strong', { hasText: 'all-MiniLM-L6-v2' }).first()).toBeVisible();
    await expect(page.locator('text=Learning Activity Lifecycle Funnel')).toBeVisible();
  });

  test('3. Viewport Responsiveness: verifies dashboard layout across Mobile (375px) and Desktop (1280px)', async ({ page }) => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Desktop', width: 1280, height: 800 }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/login');

      await page.fill('input[type="email"]', 'admin@skillverse.test');
      await page.fill('input[type="password"]', 'TestPass123!');
      await page.click('button[type="submit"]');

      await page.waitForURL('**/admin', { timeout: 15000 });
      const recTab = page.locator('button', { hasText: /Recommendations & Pilot Readiness/i });
      await expect(recTab).toBeVisible();
      await recTab.click();

      await expect(page.locator('h1', { hasText: /Recommendation Effectiveness/i })).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Learning Activity Lifecycle Funnel')).toBeVisible();

      // Clear session / navigate back
      await page.goto('/login');
    }
  });
});
