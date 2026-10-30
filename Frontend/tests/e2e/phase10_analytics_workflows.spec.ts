import { test, expect } from '@playwright/test';

test.describe('SkillVerse Phase 10: Skill Intelligence Analytics, Institutional Insights & Workforce Demand E2E', () => {

  test('1. Student Candidate Workflow: views skill intelligence and assessment trajectory', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student@skillverse.test');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/student/dashboard', { timeout: 15000 });
    await expect(page.locator('body')).toContainText(/Skill Intelligence & Progress Analytics/i);
    await expect(page.locator('body')).toContainText(/Target Role Requirement Coverage|Standardized Assessment Attempt History|Assessed Skills/i);
  });

  test('2. Recruiter Workflow: views workforce demand vs candidate supply analytics', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'recruiter@skillverse.test');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/recruiter/dashboard', { timeout: 15000 });
    await page.goto('/recruiter/analytics');
    await expect(page.locator('body')).toContainText(/Workforce Skill Demand & Supply/i);
    await expect(page.locator('body')).toContainText(/Canonical Skill Demand vs Observable Supply|Live PostgreSQL Telemetry/i);
  });

  test('3. College Admin Workflow: views institutional skill distribution and faculty coverage', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'college@skillverse.test');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/college/dashboard', { timeout: 15000 });
    await expect(page.locator('body')).toContainText(/Canonical Skill Competency & Evidence Tiers/i);
    await expect(page.locator('body')).toContainText(/Faculty Mentoring Coverage|Enrolled Students/i);
  });

  test('4. Faculty Advisor Workflow: views mentee evidence competence and review pipeline', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'faculty@skillverse.test');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/faculty/dashboard', { timeout: 15000 });
    await expect(page.locator('body')).toContainText(/Mentee Evidence & Assessment Competency/i);
    await expect(page.locator('body')).toContainText(/Assigned Mentee Student Submissions|Verified Evidence/i);
  });

  test('5. Company Admin Workflow: views application pipeline stages and requisition status', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'company@skillverse.test');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/company/dashboard', { timeout: 15000 });
    await expect(page.locator('body')).toContainText(/Application Pipeline Stages & Requisition Status Breakdown/i);
    await expect(page.locator('body')).toContainText(/Candidate Application Funnel|Company Scoped Requisitions/i);
  });

  test('6. Super Admin Workflow: inspects platform-wide operational intelligence and audit events', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@skillverse.test');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/admin', { timeout: 15000 });
    // Switch to Operational Intelligence tab
    await page.click('button:has-text("Operational Intelligence & Audit")');
    await expect(page.locator('body')).toContainText(/Platform-Wide Governance & Audit Telemetry/i);
    await expect(page.locator('body')).toContainText(/Platform Users by Canonical Role|Sanitized Audit Events Log/i);
  });

  test('7. Multi-Viewport Layout Integrity across Mobile, Tablet, Desktop, Wide', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1280, height: 800, name: 'Desktop' },
      { width: 1440, height: 900, name: 'Wide' }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/login');
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    }
  });

});
