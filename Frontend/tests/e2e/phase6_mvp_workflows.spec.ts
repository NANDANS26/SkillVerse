import { test, expect } from '@playwright/test';

test.describe('SkillVerse Phase 6 Browser E2E Workflows', () => {

  test.describe('Scenario A: Student Lifecycle', () => {
    test('authenticates student, views dashboard, and verifies profile persistence', async ({ page }) => {
      // 1. Visit Login
      await page.goto('/login');
      await expect(page.locator('h1, h2')).toContainText(/Welcome|Sign in/i);

      // 2. Sign in with seeded student credentials
      await page.fill('input[type="email"]', 'student@skillverse.test');
      await page.fill('input[type="password"]', 'TestPass123!');
      await page.click('button[type="submit"]');

      // 3. Verify redirected to candidate dashboard
      await page.waitForURL('**/student/dashboard', { timeout: 10000 });
      await expect(page.locator('h1')).toContainText(/Alice Student|Welcome/i);

      // 4. Verify candidate profile page
      await page.goto('/student/profile');
      await expect(page.locator('body')).toContainText(/Alice Student/i);

      // 5. Reload and ensure session cookie persists without redirecting to login
      await page.reload();
      await expect(page.locator('body')).toContainText(/Alice Student/i);
    });
  });

  test.describe('Scenario B: Recruiter Lifecycle', () => {
    test('authenticates recruiter, verifies jobs, and opens candidate matches', async ({ page }) => {
      // 1. Sign in as recruiter
      await page.goto('/login');
      await page.fill('input[type="email"]', 'recruiter@skillverse.test');
      await page.fill('input[type="password"]', 'TestPass123!');
      await page.click('button[type="submit"]');

      // 2. Wait for recruiter dashboard
      await page.waitForURL('**/recruiter/dashboard', { timeout: 10000 });
      await expect(page.locator('body')).toContainText(/Recruiter|Talent/i);

      // 3. Navigate to job listings
      await page.goto('/recruiter/jobs');
      await expect(page.locator('body')).toContainText(/Senior Full-Stack Engineer|Job/i);

      // 4. Navigate to matches page
      await page.goto('/recruiter/matches');
      await expect(page.locator('body')).toContainText(/Candidate Matches|Talent Pipeline|Matches/i);
    });
  });

  test.describe('Scenario C: Faculty & College Administration', () => {
    test('college admin verifies institutional center and faculty verifies mentee roster', async ({ page }) => {
      // 1. Sign in as college admin
      await page.goto('/login');
      await page.fill('input[type="email"]', 'college@skillverse.test');
      await page.fill('input[type="password"]', 'TestPass123!');
      await page.click('button[type="submit"]');

      await page.waitForURL('**/college/dashboard', { timeout: 10000 });
      await expect(page.locator('body')).toContainText(/Apex Institute of Technology/i);

      // 2. Sign out
      await page.goto('/login');

      // 3. Sign in as faculty
      await page.fill('input[type="email"]', 'faculty@skillverse.test');
      await page.fill('input[type="password"]', 'TestPass123!');
      await page.click('button[type="submit"]');

      await page.waitForURL('**/faculty/dashboard', { timeout: 10000 });
      await expect(page.locator('body')).toContainText(/Mentorship|Faculty|Advisor/i);
    });
  });

  test.describe('Scenario D: Company Administration', () => {
    test('company admin verifies enterprise talent command and corporate requisitions', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'company@skillverse.test');
      await page.fill('input[type="password"]', 'TestPass123!');
      await page.click('button[type="submit"]');

      await page.waitForURL('**/company/dashboard', { timeout: 10000 });
      await expect(page.locator('body')).toContainText(/Nexus Innovations|Enterprise Talent Command/i);
    });
  });

  test.describe('Scenario E: Access Control & Route Guarding', () => {
    test('blocks unauthenticated access to protected routes and enforces role boundaries', async ({ page }) => {
      // 1. Unauthenticated visit to admin dashboard must redirect to login
      await page.goto('/admin');
      await page.waitForURL('**/login**', { timeout: 10000 });
      expect(page.url()).toContain('/login');

      // 2. Clean sign in as student
      await page.goto('/login');
      await page.fill('input[type="email"]', 'student@skillverse.test');
      await page.fill('input[type="password"]', 'TestPass123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/student/dashboard', { timeout: 10000 });
      expect(page.url()).toContain('/student/dashboard');

      // 3. Attempt direct URL navigation to recruiter dashboard
      await page.goto('/recruiter/dashboard');
      // Should redirect to unauthorized or back to student dashboard
      await page.waitForURL(/(unauthorized|student\/dashboard)/, { timeout: 10000 });
      expect(page.url()).not.toContain('/recruiter/dashboard');
    });
  });

  test.describe('Scenario G: Viewport Responsive Layouts', () => {
    const viewports = [
      { name: 'Mobile (375px)', width: 375, height: 667 },
      { name: 'Tablet (768px)', width: 768, height: 1024 },
      { name: 'Desktop (1280px)', width: 1280, height: 800 },
      { name: 'Wide (1440px)', width: 1440, height: 900 }
    ];

    for (const vp of viewports) {
      test(`verifies responsive layout integrity at ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/');
        await expect(page.locator('body')).toBeVisible();

        // Check for absence of unexpected horizontal body scroll
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // Allow tiny sub-pixel rounding
      });
    }
  });
});
