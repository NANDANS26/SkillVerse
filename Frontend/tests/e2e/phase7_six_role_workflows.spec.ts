import { test, expect } from '@playwright/test';

test.describe('SkillVerse Phase 7: Six-Role Product Workflows Browser E2E Suite', () => {

  test('1. Student workflow: navigates to applications and open job listings', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student@skillverse.test');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/student/dashboard', { timeout: 10000 });
    await expect(page.locator('body')).toContainText(/Welcome|Student Candidate|Profile/i);

    // Navigate to student jobs
    await page.goto('/student/jobs');
    await expect(page.locator('body')).toContainText(/Explore Job Opportunities|Open Technical Positions|Jobs/i);

    // Navigate to student applications
    await page.goto('/student/applications');
    await expect(page.locator('body')).toContainText(/Job Applications|Submitted Applications/i);
  });

  test('2. Recruiter workflow: manages requisitions and inspects pipeline', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'recruiter@skillverse.test');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/recruiter/dashboard', { timeout: 10000 });
    await page.goto('/recruiter/jobs');
    await expect(page.locator('body')).toContainText(/Job|Requisitions|Postings/i);
  });

  test('3. College Admin workflow: accesses enrolled students directory and faculty advisor roster', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'college@skillverse.test');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/college/dashboard', { timeout: 10000 });

    // Navigate to college students directory
    await page.goto('/college/students');
    await expect(page.locator('body')).toContainText(/Enrolled Students|Institutional Student Directory/i);

    // Navigate to college faculty directory
    await page.goto('/college/faculty');
    await expect(page.locator('body')).toContainText(/Faculty & Advisor Directory|Faculty Directory/i);
  });

  test('4. Faculty workflow: inspects assigned mentees and evaluations', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'faculty@skillverse.test');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/faculty/dashboard', { timeout: 10000 });

    // Navigate to assigned mentees view
    await page.goto('/faculty/students');
    await expect(page.locator('body')).toContainText(/Assigned Mentee Students|Mentee Students/i);
  });

  test('5. Company Admin workflow: manages recruiters and reviews corporate job requisitions', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'company@skillverse.test');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/company/dashboard', { timeout: 10000 });

    // Navigate to company recruiters
    await page.goto('/company/recruiters');
    await expect(page.locator('body')).toContainText(/Recruiters & Talent Partners|Add Recruiter/i);

    // Navigate to company jobs
    await page.goto('/company/jobs');
    await expect(page.locator('body')).toContainText(/Corporate Job Requisitions|Requisitions Management/i);
  });

  test('6. Super Admin workflow: inspects platform telemetry and users directory', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@skillverse.test');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/admin', { timeout: 10000 });
    await expect(page.locator('body')).toContainText(/Super Administrator Dashboard|Infrastructure & Telemetry/i);

    // Switch to Users tab
    await page.click('button:has-text("Users Directory")');
    await expect(page.locator('body')).toContainText(/User ID|Canonical Role|Credentials Audit/i);

    // Switch to Tenants tab
    await page.click('button:has-text("Multi-Tenant Organizations")');
    await expect(page.locator('body')).toContainText(/Higher Education Institutions|Corporate Employer Tenants/i);
  });
});
